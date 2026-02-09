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
    answered_questions: List[Dict[str, any]]
    question: Optional[str]
    answer: Optional[str]
    is_follow_up: bool
    review: Optional[dict] # Changed to dict to store score/reason/etc
    total_score: int
    interview_complete: bool
    final_report: Optional[dict]

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
        "is_follow_up": False
    }

def evaluator_node(state: InterviewState):
    """Evaluates the candidate's answer and decides next steps."""
    question = state.get("question")
    answer = state.get("answer")
    is_follow_up = state.get("is_follow_up", False)
    asked_questions = state.get("asked_questions", [])
    answered_questions = state.get("answered_questions", [])
    
    if not question or not answer:
        return {"review": {"score": 0, "reason": "Missing Q or A"}}

    evaluation = evaluate_response(question, answer)
    
    # Store the answered question
    
    # Store the answered question
    answered_questions.append({"question": question, "answer": answer, "review": evaluation})
    
    new_total_score = state.get("total_score", 0) + evaluation.get("score", 0)
    
    update = {
        "review": evaluation,
        "total_score": new_total_score,
        "answered_questions": answered_questions
    }
    
    # Decide if we need a follow-up
    # If we are currently in a follow-up, we don't trigger another one (business rule choice or simplified flow)
    # OR if score < 6 and a follow-up is provided
    if not is_follow_up and evaluation.get("score", 0) < 6 and evaluation.get("follow_up"):
        update["question"] = evaluation["follow_up"]
        update["is_follow_up"] = True
        # Add follow-up to asked_questions to be safe (though it's generated, not from bank)
        asked_questions.append(evaluation["follow_up"])
        update["asked_questions"] = asked_questions
    else:
        # If we just finished a follow-up or score is high, next step is question_node (next_question)
        update["is_follow_up"] = False
        
    return update

def report_node(state: InterviewState):
    """Generates the final report."""
    total = state.get("total_score", 0)
    answered = state.get("answered_questions", [])
    count = len(answered)
    avg_score = total / count if count > 0 else 0
    
    feedback_summary = []
    
    for entry in answered:
        rev = entry.get("review", {})
        q_text = entry.get("question", "Unknown Question")
        score = rev.get("score", 0)
        improvements = rev.get("improvements", "No specific improvements noted.")
        
        feedback_summary.append({
            "question": q_text,
            "score": score,
            "improvements": improvements
        })

    report = {
        "candidate_name": state["candidate_name"],
        "role": state["candidate_role"],
        "average_score": round(avg_score, 2),
        "total_questions": count,
        "summary": f"Interview completed. Final score: {avg_score}/10.",
        "feedback": feedback_summary
    }
    
    
    return {"final_report": report, "interview_complete": True}

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
