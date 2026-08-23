import os
import json
import random
from typing import List, TypedDict, Optional, Dict, Any
from langgraph.graph import StateGraph, START, END
from agents.Evaluator import evaluate_response

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

class InterviewState(TypedDict):
    session_id: Optional[str]
    candidate_name: str
    candidate_role: str
    question_bank: List[dict]
    asked_questions: List[str]
    answered_questions: List[Dict[str, Any]]
    question: Optional[str]
    answer: Optional[str]
    is_follow_up: bool
    review: Optional[dict]
    total_score: int
    interview_complete: bool
    final_report: Optional[dict]
    resume_q: bool

def get_default_questions() -> List[dict]:
    bank_path = os.path.join(BACKEND_DIR, "question_bank", "python_developer.json")
    if os.path.exists(bank_path):
        with open(bank_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return [
        {
            "question": "Explain the difference between a list and a tuple in Python. When would you use one over the other?",
            "difficulty": "easy",
            "expected_concepts": ["mutability", "performance", "syntax", "hashability"]
        },
        {
            "question": "How does memory management and garbage collection work in Python?",
            "difficulty": "medium",
            "expected_concepts": ["reference counting", "cyclic garbage collector", "generation"]
        }
    ]

def question_node(state: InterviewState):
    """Selects a random question from the bank that hasn't been asked yet."""
    bank = state.get("question_bank", [])
    asked = state.get("asked_questions", [])
    
    available_questions = [q for q in bank if q.get("question") not in asked]
    
    if not available_questions:
        return {"interview_complete": True, "question": None}
    
    selected_q = random.choice(available_questions).get("question")
    asked.append(selected_q)
    
    return {
        "question": selected_q,
        "asked_questions": asked,
        "is_follow_up": False
    }

def evaluator_node(state: InterviewState):
    """Evaluates the candidate's answer and determines next step or follow-up."""
    question = state.get("question")
    answer = state.get("answer")
    is_follow_up = state.get("is_follow_up", False)
    asked_questions = state.get("asked_questions", [])
    answered_questions = state.get("answered_questions", [])
    
    if not question or not answer:
        return {"review": {"score": 0, "reason": "Missing question or answer text."}}

    evaluation = evaluate_response(question, answer)
    
    answered_questions.append({
        "question": question,
        "answer": answer,
        "review": evaluation
    })
    
    new_total_score = state.get("total_score", 0) + evaluation.get("score", 0)
    
    update = {
        "review": evaluation,
        "total_score": new_total_score,
        "answered_questions": answered_questions
    }
    
    # Trigger dynamic follow-up if score < 6 and a follow-up is provided
    if not is_follow_up and evaluation.get("score", 0) < 6 and evaluation.get("follow_up"):
        follow_up_q = evaluation["follow_up"]
        update["question"] = follow_up_q
        update["is_follow_up"] = True
        asked_questions.append(follow_up_q)
        update["asked_questions"] = asked_questions
    else:
        update["is_follow_up"] = False
        
    return update

def report_node(state: InterviewState):
    """Generates the final comprehensive scorecard report."""
    total = state.get("total_score", 0)
    answered = state.get("answered_questions", [])
    count = len(answered)
    avg_score = total / count if count > 0 else 0
    
    feedback_summary = []
    for entry in answered:
        rev = entry.get("review", {})
        feedback_summary.append({
            "question": entry.get("question", "Unknown Question"),
            "score": rev.get("score", 0),
            "improvements": rev.get("improvements", "No specific improvements noted.")
        })

    report = {
        "candidate_name": state.get("candidate_name", "Candidate"),
        "role": state.get("candidate_role", "Software Engineer"),
        "average_score": round(avg_score, 2),
        "total_questions": count,
        "summary": f"Interview session completed across {count} rounds with an average diagnostic score of {round(avg_score, 1)}/10.",
        "feedback": feedback_summary
    }
    
    return {"final_report": report, "interview_complete": True}

def should_continue(state: InterviewState):
    """Routing condition after answer evaluation."""
    if state.get("is_follow_up"):
        return "end_turn"
    if state.get("interview_complete"):
        return "report"
    return "next_question"

# Build LangGraph
builder = StateGraph(InterviewState)
builder.add_node("question_node", question_node)
builder.add_node("evaluator_node", evaluator_node)
builder.add_node("report_node", report_node)

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

builder.add_conditional_edges(
    "evaluator_node",
    should_continue,
    {
        "next_question": "question_node",
        "end_turn": END,
        "report": "report_node"
    }
)

builder.add_conditional_edges(
    "question_node",
    lambda state: "report_node" if state.get("interview_complete") else END,
    {
        "report_node": "report_node",
        END: END
    }
)
builder.add_edge("report_node", END)

graph = builder.compile()

def init_interview_state(name: str, role: str, custom_bank=None, resume_q=False) -> dict:
    """Initializes a new interview session graph."""
    state: InterviewState = {
        "session_id": None,
        "candidate_name": name,
        "candidate_role": role,
        "question_bank": custom_bank if custom_bank else get_default_questions(),
        "asked_questions": [],
        "answered_questions": [],
        "question": None,
        "answer": None,
        "is_follow_up": False,
        "total_score": 0,
        "interview_complete": False,
        "final_report": None,
        "resume_q": resume_q,
        "review": None
    }
    return graph.invoke(state)
