import random
# import json

from typing import List, TypedDict, Optional, Dict
from langgraph.graph import StateGraph, START, END
from agents.Evaluator import evaluate_response

class InterviewState(TypedDict):
    candidate_name: str
    candidate_role: str
    question_bank: List[dict]
    asked_questions: List[str]
    question: Optional[str]
    answer: Optional[str]
    is_follow_up: bool
    follow_upQ: Optional[str]
    review: Optional[dict] # Changed to dict to store score/reason/etc
    total_score: int
    num_answered: int
    interview_complete: bool

def question_node(state: InterviewState):
    """Selects a random question from the bank that hasn't been asked yet."""
    bank = state.get("question_bank", [])
    asked = state.get("asked_questions", [])
    
    available_questions = [q for q in bank if q["question"] not in asked]
    
    if not available_questions:
        return {"interview_complete": True, "question": None}
    
    selected_q = random.choice(available_questions)["question"]
    asked.append(selected_q)
    
    return {
        "question": selected_q,
        "asked_questions": asked,
        "is_follow_up": False,
        "follow_upQ": None
    }

def evaluator_node(state: InterviewState):
    """Evaluates the candidate's answer and decides next steps."""
    question = state.get("question")
    answer = state.get("answer")
    
    if not question or not answer:
        return {"review": {"score": 0, "reason": "Missing Q or A"}}

    evaluation = evaluate_response(question, answer)
    
    new_total_score = state.get("total_score", 0) + evaluation.get("score", 0)
    new_num_answered = state.get("num_answered", 0) + 1
    
    update = {
        "review": evaluation,
        "total_score": new_total_score,
        "num_answered": new_num_answered
    }
    
    # If score < 6 and a follow-up is provided
    if evaluation.get("score", 0) < 6 and evaluation.get("follow_up"):
        update["question"] = evaluation["follow_up"]
        update["is_follow_up"] = True
        update["follow_upQ"] = evaluation["follow_up"]
    else:
        update["is_follow_up"] = False
        update["follow_upQ"] = None
        
    return update

def report_node(state: InterviewState):
    """Generates the final report."""
    total = state.get("total_score", 0)
    count = state.get("num_answered", 0)
    avg_score = total / count if count > 0 else 0
    
    report = {
        "candidate_name": state["candidate_name"],
        "role": state["candidate_role"],
        "average_score": round(avg_score, 2),
        "total_questions": count,
        "summary": f"Interview completed. Final score: {avg_score}/10."
    }
    
    return {"review": report, "interview_complete": True}

def should_continue(state: InterviewState):
    """Conditional edge logic."""
    if state.get("is_follow_up"):
        return "end_turn" # Keep the follow-up as the current question
    
    if state.get("interview_complete"):
        return "report"
        
    return "next_question"

# Build the Graph
builder = StateGraph(InterviewState)
builder.add_node("question_node", question_node)
builder.add_node("evaluator_node", evaluator_node)
builder.add_node("report_node", report_node)

# Entry logic: If we have an answer, go to evaluator. Otherwise, go to question.
def route_start(state: InterviewState):
    if state.get("answer"):
        return "evaluator_node"
    return "question_node"

builder.add_conditional_edges(
    START,
    route_start,
    {
        "evaluator_node": "evaluator_node",
        "question_node": "question_node"
    }
)

# After evaluation, decide where to go
builder.add_conditional_edges(
    "evaluator_node",
    should_continue,
    {
        "next_question": "question_node",
        "end_turn": END,
        "report": "report_node"
    }
)

builder.add_edge("question_node", END)
builder.add_edge("report_node", END)

graph = builder.compile()
