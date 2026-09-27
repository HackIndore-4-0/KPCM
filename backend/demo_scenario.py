"""
FinResolve — Challenge 1 Demo Runner
Demonstrates OpenTelemetry Observability and Circuit Breaker Execution Safety.
"""
import json
from fastapi.testclient import TestClient
from main import app
from core.telemetry import get_in_memory_spans, clear_in_memory_telemetry

client = TestClient(app)


def print_banner(title: str):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)


def run_demo():
    print_banner("FINRESOLVE: CHALLENGE 1 CIRCUIT BREAKER & OPENTELEMETRY DEMO")

    # 1. Normal Run
    print_banner("SCENARIO A: Normal Grievance Run (Clean Match / Auto-Reversal)")
    clear_in_memory_telemetry()
    res_norm = client.post(
        "/agent/run/CASE-DEMO-NORM",
        json={
            "complaint": "Money debited from SBI account via UPI UTR 9876543210, merchant Flipkart reports payment failed.",
            "max_consecutive_tool_failures": 4,
            "max_token_budget": 10000,
            "max_iterations": 10,
        },
    )
    data = res_norm.json()
    print(f"Case ID:        {data['case_id']}")
    print(f"Status:         {data['status'].upper()}")
    print(f"Breaker Status: {data['breaker_status']}")
    print(f"Token Usage:    {data['token_usage']} / {data['token_budget']}")
    print(f"Tool Failures:  {data['tool_failure_count']} / {data['tool_failure_threshold']}")
    print("Timeline:")
    for step in data["timeline"]:
        print(f"  {step['icon']} {step['name']:<25} [{step['status']}]")

    # 2. 4 Consecutive Tool Failures Breaker Trip
    print_banner("SCENARIO B: Runaway Tool Failures Intercepted (4 Consecutive Failures)")
    clear_in_memory_telemetry()
    res_fail = client.post(
        "/agent/run/CASE-DEMO-TRIP",
        json={
            "complaint": "Merchant payment disputed. Retrying verification.",
            "max_consecutive_tool_failures": 4,
            "demo_scenario": "consecutive_tool_failures",
        },
    )
    data_fail = res_fail.json()
    print(f"Case ID:        {data_fail['case_id']}")
    print(f"Status:         {data_fail['status'].upper()} (Degraded Gracefully to Human Review)")
    print(f"Breaker Status: {data_fail['breaker_status']}")
    print(f"Trigger:        {data_fail['trigger']}")
    print(f"Failed Node:    {data_fail['current_node']}")
    print("\nVisual Timeline (as seen on UI):")
    for step in data_fail["timeline"]:
        print(f"  {step['icon']} {step['name']:<35} [{step['status']}]")

    print("\nStructured Halt Event (Emitted to OpenTelemetry Trace):")
    print(json.dumps(data_fail["halt_event"], indent=2))

    # 3. Token Budget Breach
    print_banner("SCENARIO C: Token Budget Limit Breached (Safety Circuit Breaker Trips)")
    res_token = client.post(
        "/agent/run/CASE-DEMO-TOKEN",
        json={
            "complaint": "Massive document parsing requested.",
            "max_token_budget": 5000,
            "demo_scenario": "token_budget",
        },
    )
    data_token = res_token.json()
    print(f"Case ID:        {data_token['case_id']}")
    print(f"Status:         {data_token['status'].upper()}")
    print(f"Breaker Status: {data_token['breaker_status']}")
    print(f"Trigger:        {data_token['trigger']}")
    print(f"Tokens Used:    {data_token['token_usage']} (Budget: {data_token['token_budget']})")
    print("\nStructured Halt Event:")
    print(json.dumps(data_token["halt_event"], indent=2))

    # 4. Host Health Verification
    print_banner("HOST HEALTH VERIFICATION")
    health = client.get("/health").json()
    print(f"FastAPI Status: {health['status'].upper()} (Host stayed healthy across all circuit trips)")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_demo()
