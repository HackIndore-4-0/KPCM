from typing import Optional, List
from uuid import uuid4
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from core.config import settings
from core.telemetry import get_current_context, get_in_memory_spans
from graph.workflow import AGENT_NODES, run_agent_workflow
from llm.client import llm_call
from mocks.merchant_pg import query_merchant_pg
from safety.circuit_breaker import CircuitBreaker

_runs: dict[str, dict] = {}


class AgentRunRequest(BaseModel):
    complaint: str = Field(min_length=1, max_length=8000)
    max_consecutive_tool_failures: Optional[int] = Field(default=None, ge=1)
    max_token_budget: Optional[int] = Field(default=None, ge=1)
    max_iterations: Optional[int] = Field(default=None, ge=1)
    demo_scenario: Optional[str] = None


def _run_demo(case_id: str, run_id: str, request: AgentRunRequest) -> dict:
    breaker = CircuitBreaker(
        max_consecutive_tool_failures=request.max_consecutive_tool_failures,
        max_token_budget=request.max_token_budget,
        max_iterations=request.max_iterations,
    )
    handlers = {}
    tool_events: List[dict] = []

    if request.demo_scenario == "consecutive_tool_failures":
        def fail_tools(state):
            for attempt in range(10):
                res = query_merchant_pg(f"demo-{attempt}", force_fail=True, node="merchant_verification")
                tool_events.append({
                    "node": "merchant_verification",
                    "step": f"Merchant PG (Attempt {attempt+1})",
                    "status": "FAILURE",
                    "error": res.error_message,
                })
            return {}
        handlers["execute"] = fail_tools

    elif request.demo_scenario == "token_budget":
        def exceed_tokens(state):
            llm_call("demo budget check", node="planner", simulated_tokens={
                "input_tokens": 7500, "output_tokens": 3000, "total_tokens": 10500,
            })
            return {}
        handlers["planner"] = exceed_tokens

    elif request.demo_scenario == "max_iterations":
        # Force breaker iteration to hit threshold
        breaker.iteration = (request.max_iterations or breaker.max_iterations)

    result = run_agent_workflow(case_id, run_id=run_id, handlers=handlers, breaker=breaker)
    halt = result.get("halt")

    # Build detailed visual timeline
    timeline = []
    for h in result.get("history", []):
        timeline.append({
            "name": h.get("node", "").replace("_", " ").title(),
            "node": h.get("node"),
            "status": h.get("status"),
            "icon": "✓" if h.get("status") == "SUCCESS" else "✕",
        })

    if tool_events:
        for te in tool_events:
            timeline.append({
                "name": te["step"],
                "node": te["node"],
                "status": te["status"],
                "icon": "✕" if te["status"] == "FAILURE" else "✓",
                "error": te.get("error"),
            })

    if halt:
        timeline.append({
            "name": f"BREAKER TRIPPED: {halt.get('trigger')}",
            "node": halt.get("node"),
            "status": "TRIPPED",
            "icon": "🛑",
            "reason": halt.get("reason"),
        })

    return {
        "case_id": case_id,
        "run_id": run_id,
        "status": result.get("status", "resolved"),
        "current_node": halt.get("node") if halt else "resolve",
        "iteration": breaker.iteration,
        "max_iterations": breaker.max_iterations,
        "token_usage": breaker.total_tokens,
        "token_budget": breaker.max_token_budget,
        "tool_failure_count": breaker.consecutive_failures,
        "tool_failure_threshold": breaker.max_consecutive_tool_failures,
        "breaker_status": "TRIPPED" if halt else "ALLOW",
        "trigger": halt.get("trigger") if halt else None,
        "safe_degradation_action": "HALT_AND_ESCALATE" if halt else None,
        "halt_event": ({
            "event": "CIRCUIT_BREAKER_TRIPPED",
            "case_id": case_id,
            "run_id": run_id,
            "trigger": halt.get("trigger"),
            "threshold": halt.get("threshold"),
            "observed": halt.get("observed"),
            "node": halt.get("node"),
            "tool": breaker.last_tool or "merchant_api",
            "iteration": halt.get("iteration"),
            "total_tokens": halt.get("total_tokens"),
            "reason": halt.get("reason"),
            "action": "HALT_AND_ESCALATE",
            "timestamp": halt.get("timestamp"),
        } if halt else None),
        "timeline": timeline,
        "needs_human_review": result.get("needs_human_review", False),
    }


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="FinResolve Agentic Decision-Support & Execution Safety Engine",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "environment": settings.environment,
        "telemetry_service": settings.otel_service_name,
        "active_spans_count": len(get_in_memory_spans()),
    }


@app.post("/agent/run/{case_id}")
def run_agent(case_id: str, request: AgentRunRequest):
    """Run the workflow and return its safety status plus an execution timeline."""
    run_id = str(uuid4())
    try:
        run = _run_demo(case_id, run_id, request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Workflow failed safely ({type(exc).__name__}).") from None
    _runs[case_id] = run
    return run


@app.get("/agent/run/{case_id}")
def get_agent_run(case_id: str):
    run = _runs.get(case_id)
    if run is None:
        raise HTTPException(status_code=404, detail="No run found for this case.")
    return run


@app.get("/agent/runs/{run_id}/timeline")
def get_run_timeline(run_id: str):
    run = next((item for item in _runs.values() if item["run_id"] == run_id), None)
    if run is None:
        raise HTTPException(status_code=404, detail="No run found.")
    return {
        "case_id": run["case_id"],
        "run_id": run_id,
        "timeline": run["timeline"],
        "breaker_status": run["breaker_status"],
        "trigger": run["trigger"],
        "token_usage": run["token_usage"],
        "token_budget": run["token_budget"],
        "tool_failure_count": run["tool_failure_count"],
        "tool_failure_threshold": run["tool_failure_threshold"],
        "halt_event": run["halt_event"],
    }


@app.get("/dashboard", response_class=HTMLResponse)
def get_observability_dashboard():
    """Serves the FinResolve Real-Time Circuit Breaker Observability Dashboard."""
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FinResolve — Execution Circuit Breaker Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px; }
    .badge { padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; text-transform: uppercase; }
    .badge-ok { background: #166534; color: #4ade80; }
    .badge-trip { background: #991b1b; color: #fca5a5; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; }
    .card h3 { margin: 0 0 8px 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; }
    .card .val { font-size: 24px; font-weight: 700; color: #f1f5f9; }
    .timeline { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .timeline-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #334155; }
    .timeline-item:last-child { border-bottom: none; }
    .icon-ok { color: #4ade80; font-weight: bold; }
    .icon-fail { color: #f87171; font-weight: bold; }
    .icon-trip { color: #ef4444; font-weight: bold; }
    .btn-group { display: flex; gap: 12px; margin-bottom: 24px; }
    button { background: #2563eb; color: #ffffff; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    button.danger { background: #dc2626; }
    button.danger:hover { background: #b91c1c; }
    pre { background: #020617; padding: 16px; border-radius: 6px; overflow-x: auto; color: #cbd5e1; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 style="margin:0 0 4px 0;">FinResolve Circuit Breaker</h1>
        <p style="margin:0; color:#94a3b8;">Real-Time Execution Safety & OpenTelemetry Dashboard</p>
      </div>
      <div id="statusBadge" class="badge badge-ok">STANDBY / READY</div>
    </div>

    <div class="btn-group">
      <button onclick="runScenario('normal')">▶ Run Normal Grievance</button>
      <button class="danger" onclick="runScenario('consecutive_tool_failures')">⚡ Trigger: 4 Tool Failures</button>
      <button class="danger" onclick="runScenario('token_budget')">⚡ Trigger: Token Budget Exceeded</button>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Consecutive Failures</h3>
        <div id="failuresVal" class="val">0 / 4</div>
      </div>
      <div class="card">
        <h3>Cumulative Tokens</h3>
        <div id="tokensVal" class="val">0 / 10,000</div>
      </div>
      <div class="card">
        <h3>Workflow Iteration</h3>
        <div id="iterationsVal" class="val">0 / 10</div>
      </div>
    </div>

    <div class="timeline">
      <h3 style="margin-top:0; color:#94a3b8;">Execution Trace Timeline</h3>
      <div id="timelineContainer">
        <p style="color:#64748b;">No run executed yet. Click one of the buttons above to test.</p>
      </div>
    </div>

    <div class="card">
      <h3>Structured Halt Event (OpenTelemetry Emitted)</h3>
      <pre id="haltEventOutput">No halt event recorded.</pre>
    </div>
  </div>

  <script>
    async function runScenario(scenario) {
      const caseId = "CASE-" + Math.floor(Math.random() * 10000);
      const payload = {
        complaint: "Transaction debited but merchant says payment pending. UTR 9876543210",
        demo_scenario: scenario === 'normal' ? null : scenario,
        max_consecutive_tool_failures: 4,
        max_token_budget: 10000,
        max_iterations: 10
      };

      const res = await fetch('/agent/run/' + caseId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      render(data);
    }

    function render(data) {
      const badge = document.getElementById('statusBadge');
      if (data.breaker_status === 'TRIPPED') {
        badge.className = 'badge badge-trip';
        badge.innerText = 'CIRCUIT BREAKER TRIPPED (' + data.trigger + ')';
      } else {
        badge.className = 'badge badge-ok';
        badge.innerText = 'STATUS: ' + data.status.toUpperCase();
      }

      document.getElementById('failuresVal').innerText = data.tool_failure_count + ' / ' + data.tool_failure_threshold;
      document.getElementById('tokensVal').innerText = data.token_usage + ' / ' + data.token_budget;
      document.getElementById('iterationsVal').innerText = data.iteration + ' / ' + data.max_iterations;

      const container = document.getElementById('timelineContainer');
      container.innerHTML = '';
      data.timeline.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        const isOk = item.status === 'SUCCESS';
        const isTrip = item.status === 'TRIPPED';
        const iconClass = isTrip ? 'icon-trip' : (isOk ? 'icon-ok' : 'icon-fail');
        div.innerHTML = '<span>' + item.name + (item.reason ? ' <span style="color:#f87171;font-size:12px">(' + item.reason + ')</span>' : '') + '</span><span class="' + iconClass + '">' + item.icon + ' ' + item.status + '</span>';
        container.appendChild(div);
      });

      const haltPre = document.getElementById('haltEventOutput');
      haltPre.innerText = data.halt_event ? JSON.stringify(data.halt_event, null, 2) : 'No halt event recorded (Run completed normally).';
    }
  </script>
</body>
</html>
"""
