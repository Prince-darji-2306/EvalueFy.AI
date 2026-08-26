import os
import json
import random
from typing import List
from langgraph.graph import StateGraph, START, END

from schemas import InterviewState

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ROLE_BANK_MAP = {
    "python": "python_developer.json",
    "backend": "python_developer.json",
    "django": "python_developer.json",
    "fastapi": "python_developer.json",
    "flask": "python_developer.json",

    "frontend": "frontend_developer.json",
    "react": "frontend_developer.json",
    "vue": "frontend_developer.json",
    "javascript": "frontend_developer.json",
    "typescript": "frontend_developer.json",
    "ui": "frontend_developer.json",
    "web": "frontend_developer.json",

    "full stack": "fullstack_developer.json",
    "fullstack": "fullstack_developer.json",
    "software engineer": "fullstack_developer.json",
    "sde": "fullstack_developer.json",

    "ai": "ai_ml_engineer.json",
    "ml": "ai_ml_engineer.json",
    "machine learning": "ai_ml_engineer.json",
    "data science": "ai_ml_engineer.json",
    "data scientist": "ai_ml_engineer.json",
    "deep learning": "ai_ml_engineer.json",
    "nlp": "ai_ml_engineer.json",
    "genai": "ai_ml_engineer.json",

    "devops": "devops_engineer.json",
    "cloud": "devops_engineer.json",
    "sre": "devops_engineer.json",
    "infrastructure": "devops_engineer.json",
    "kubernetes": "devops_engineer.json",
    "aws": "devops_engineer.json",
}

def get_questions_for_role(role: str = "") -> List[dict]:
    """Selects and loads the 20-question bank matching the role."""
    role_lower = (role or "").lower()
    selected_file = next((f for kw, f in ROLE_BANK_MAP.items() if kw in role_lower), "python_developer.json")
    with open(os.path.join(BACKEND_DIR, "question_bank", selected_file), "r", encoding="utf-8") as f:
        return json.load(f)

def question_node(state: InterviewState):
    """Selects next question adaptively based on candidate's previous performance."""
    bank = state.get("question_bank", [])
    asked = state.get("asked_questions", [])
    answered = state.get("answered_questions", [])

    # Limit: 12 primary questions for resume mode, 5 for standard role mode
    if len([a for a in answered if not a.get("is_follow_up")]) >= (12 if state.get("resume_q") else 5):
        return {"interview_complete": True, "question": None}

    available = [q for q in bank if q.get("question") not in asked]
    if not available:
        return {"interview_complete": True, "question": None}

    # Adaptive complexity: <=6 -> easy, 7 -> easy/medium, >7 -> medium/hard
    last_score = state.get("review", {}).get("score") if state.get("review") else None
    if last_score is not None:
        target = ["easy"] if last_score <= 6 else ["easy", "medium"] if last_score == 7 else ["medium", "hard"]
        available = [q for q in available if q.get("difficulty") in target] or available

    selected_q = random.choice(available).get("question")
    asked.append(selected_q)
    return {"question": selected_q, "asked_questions": asked, "is_follow_up": False}

def evaluator_node(state: InterviewState):
    """Evaluates candidate response and triggers follow-up if score < 6."""
    from agents.Evaluator import evaluate_response

    q, ans = state.get("question"), state.get("answer")
    if not q or not ans:
        return {"review": {"score": 0, "reason": "Missing question or answer."}}

    eval_result = evaluate_response(q, ans)
    is_fu = state.get("is_follow_up", False)
    
    answered = state.get("answered_questions", [])
    answered.append({"question": q, "answer": ans, "review": eval_result, "is_follow_up": is_fu})

    has_fu = not is_fu and eval_result.get("score", 0) < 6 and bool(eval_result.get("follow_up"))
    asked = state.get("asked_questions", [])
    if has_fu:
        asked.append(eval_result["follow_up"])

    return {
        "review": eval_result,
        "total_score": state.get("total_score", 0) + eval_result.get("score", 0),
        "answered_questions": answered,
        "question": eval_result.get("follow_up") if has_fu else state.get("question"),
        "asked_questions": asked,
        "is_follow_up": has_fu
    }

def report_node(state: InterviewState):
    """Generates the final comprehensive scorecard report."""
    answered = state.get("answered_questions", [])
    count = len(answered)
    avg_score = round(state.get("total_score", 0) / count, 2) if count else 0

    return {
        "final_report": {
            "candidate_name": state.get("candidate_name", "Candidate"),
            "role": state.get("candidate_role", "Software Engineer"),
            "average_score": avg_score,
            "total_questions": count,
            "summary": f"Interview session completed across {count} rounds with an average diagnostic score of {avg_score}/10.",
            "feedback": [
                {
                    "question": item.get("question", ""),
                    "score": item.get("review", {}).get("score", 0),
                    "improvements": item.get("review", {}).get("improvements", "")
                }
                for item in answered
            ]
        },
        "interview_complete": True
    }

def should_continue(state: InterviewState):
    if state.get("is_follow_up"):
        return "end_turn"
    if state.get("interview_complete"):
        return "report"
    return "next_question"

builder = StateGraph(InterviewState)
builder.add_node("question_node", question_node)
builder.add_node("evaluator_node", evaluator_node)
builder.add_node("report_node", report_node)

builder.add_conditional_edges(
    START,
    lambda state: "evaluator_node" if state.get("answer") else "question_node",
    {"evaluator_node": "evaluator_node", "question_node": "question_node"}
)

builder.add_conditional_edges(
    "evaluator_node",
    should_continue,
    {"next_question": "question_node", "end_turn": END, "report": "report_node"}
)

builder.add_conditional_edges(
    "question_node",
    lambda state: "report_node" if state.get("interview_complete") else END,
    {"report_node": "report_node", END: END}
)
builder.add_edge("report_node", END)

graph = builder.compile()

def init_interview_state(name: str, role: str, custom_bank=None, resume_q=False) -> dict:
    """Initializes a new interview session graph."""
    state: InterviewState = {
        "session_id": None,
        "candidate_name": name,
        "candidate_role": role,
        "question_bank": custom_bank if custom_bank else get_questions_for_role(role),
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