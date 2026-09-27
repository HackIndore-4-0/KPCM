from langgraph.graph import StateGraph, END
from app.agents.state import FinResolveState
from app.agents.nodes.ingestion import ingestion_node
from app.agents.nodes.domain_router import domain_router_node
from app.agents.nodes.dependency_mapper import dependency_mapper_node
from app.agents.nodes.probing_agents import probing_agents_node
from app.agents.nodes.conflict_arbiter import conflict_arbiter_node
from app.agents.nodes.replanner import replanner_node
from app.agents.nodes.hitl_gate import hitl_gate_node
from app.agents.nodes.synthesizer import synthesizer_node
from app.agents.nodes.circuit_breaker_node import circuit_breaker_check_node
from app.agents.tools.bank_reversal_tool import execute_bank_reversal
from app.safety.hitl_store import hitl_store

def route_after_probing(state: FinResolveState) -> str:
    """Routes to hitl_gate if circuit breaker tripped or human escalation required."""
    if state.get("circuit_breaker_tripped") or state.get("requires_human_escalation"):
        return "hitl_gate"
    return "conflict_arbiter"

def route_after_arbitration(state: FinResolveState) -> str:
    """Evaluates whether to escalate to human, re-plan, or synthesize resolution."""
    if state.get("circuit_breaker_tripped") or state.get("requires_human_escalation"):
        return "hitl_gate"
    if state.get("proposed_action") and not state.get("resumed_from_hitl"):
        # Irreversible mutation must be approved by human gate
        return "hitl_gate"
    if state.get("confidence_score", 1.0) < 0.70 and state.get("iteration_count", 0) < 2:
        return "replanner"
    return "synthesizer"

def route_after_replanning(state: FinResolveState) -> str:
    """Routes after replanner cycle: checks circuit breaker before probing again."""
    if state.get("circuit_breaker_tripped") or state.get("requires_human_escalation"):
        return "hitl_gate"
    return "probing_agents"

def build_finresolve_graph():
    """Constructs and compiles the FinResolve LangGraph state machine with Safety Circuit Breaker and HITL Gates."""
    workflow = StateGraph(FinResolveState)
    
    # Register Nodes
    workflow.add_node("ingestion", ingestion_node)
    workflow.add_node("domain_router", domain_router_node)
    workflow.add_node("dependency_mapper", dependency_mapper_node)
    workflow.add_node("probing_agents", probing_agents_node)
    workflow.add_node("breaker_check", circuit_breaker_check_node)
    workflow.add_node("conflict_arbiter", conflict_arbiter_node)
    workflow.add_node("replanner", replanner_node)
    workflow.add_node("hitl_gate", hitl_gate_node)
    workflow.add_node("synthesizer", synthesizer_node)
    
    # Linear Forward Edges
    workflow.set_entry_point("ingestion")
    workflow.add_edge("ingestion", "domain_router")
    workflow.add_edge("domain_router", "dependency_mapper")
    workflow.add_edge("dependency_mapper", "probing_agents")
    workflow.add_edge("probing_agents", "breaker_check")
    
    # Conditional Edges after Breaker Check
    workflow.add_conditional_edges(
        "breaker_check",
        route_after_probing,
        {
            "hitl_gate": "hitl_gate",
            "conflict_arbiter": "conflict_arbiter"
        }
    )
    
    # Conditional Edges after Conflict Arbitration
    workflow.add_conditional_edges(
        "conflict_arbiter",
        route_after_arbitration,
        {
            "hitl_gate": "hitl_gate",
            "replanner": "replanner",
            "synthesizer": "synthesizer"
        }
    )
    
    # Cycle Edge from Replanner through Breaker Check back to Probing
    workflow.add_conditional_edges(
        "replanner",
        route_after_replanning,
        {
            "hitl_gate": "hitl_gate",
            "probing_agents": "probing_agents"
        }
    )
    
    # Termination Edges
    workflow.add_edge("hitl_gate", END)
    workflow.add_edge("synthesizer", END)
    
    return workflow.compile()

finresolve_app = build_finresolve_graph()

async def resume_agent_execution(state: FinResolveState, action_id: str) -> FinResolveState:
    """Challenge 2 Resumption Workflow:
    Resumes a paused agent chain after human operator approval, modification, or rejection.
    Demonstrates agent's ability to either execute the mutation or adapt behavior if rejected.
    """
    resume_payload = hitl_store.resume_action(action_id)
    traces = state.get("agent_traces", [])
    
    if resume_payload.should_execute:
        # Operator APPROVED or MODIFIED the parameters
        tool_res = None
        if resume_payload.tool_name == "execute_bank_reversal":
            params = resume_payload.execution_parameters
            dispute_id = params.get("dispute_id") or state.get("dispute_id", "UNKNOWN")
            account_no = params.get("account_no", "ACC_SBI_9981")
            amount = float(params.get("amount", 25000.0))
            utr = params.get("utr", "UTR9832482348")
            
            tool_res = await execute_bank_reversal(
                dispute_id=dispute_id,
                account_no=account_no,
                amount=amount,
                utr=utr
            )
            
        traces.append({
            "node_name": "hitl_resume",
            "action_type": "RESUME_EXECUTED",
            "content": f"Action '{resume_payload.tool_name}' authorized with verdict '{resume_payload.verdict}'. Executed with parameters: {resume_payload.execution_parameters}",
            "metadata": {
                "verdict": resume_payload.verdict,
                "tool_result": tool_res,
                "officer_notes": resume_payload.officer_notes
            }
        })
        
        state["agent_traces"] = traces
        state["resumed_from_hitl"] = True
        state["ombudsman_verdict"] = resume_payload.verdict
        state["requires_human_escalation"] = False
        
        # Advance to synthesizer
        synth_res = await synthesizer_node(state)
        state.update(synth_res)
        if state.get("final_resolution"):
            state["final_resolution"]["execution_receipt"] = tool_res
            state["final_resolution"]["ombudsman_notes"] = resume_payload.officer_notes
            state["final_resolution"]["verdict"] = f"FAVOR_CITIZEN_REVERSAL_{resume_payload.verdict}"
            
        return state
    else:
        # Operator REJECTED the action
        traces.append({
            "node_name": "hitl_resume",
            "action_type": "RESUME_REJECTED",
            "content": f"Action '{resume_payload.tool_name}' rejected by human reviewer. Adapted workflow path without financial mutation.",
            "metadata": {
                "verdict": "REJECT",
                "officer_notes": resume_payload.officer_notes,
                "reason": resume_payload.reason
            }
        })
        
        state["agent_traces"] = traces
        state["resumed_from_hitl"] = True
        state["ombudsman_verdict"] = "REJECT"
        state["requires_human_escalation"] = False
        state["final_resolution"] = {
            "verdict": "REVERSAL_REJECTED_BY_OMBUDSMAN",
            "actionable_order": "Grievance closed without financial mutation per Ombudsman review.",
            "regulatory_basis": "Ombudsman Discretionary Assessment under RBI Integrated Ombudsman Scheme 2021.",
            "officer_reason": resume_payload.reason,
            "ombudsman_notes": resume_payload.officer_notes,
            "citizen_summary": f"Your reversal request was reviewed by an Ombudsman officer and not approved. Reason: {resume_payload.officer_notes or 'Discrepancy verified as resolved or invalid.'}"
        }
        return state
