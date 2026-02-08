import random
# import json

from typing import List, TypedDict, Optional
from langgraph.graph import StateGraph, START, END

class InterviewState(TypedDict):
    candidate_name: str
    candidate_role: str
    question_bank: List[dict]
    asked_questions: List[str]
    question: Optional[str]
    answer: Optional[str]
    is_follow_up: bool
    follow_upQ: Optional[str]
    review: Optional[str]

def question_node(state: InterviewState):
    """Selects a random question from the bank that hasn't been asked yet."""
    bank = state.get("question_bank", [])
    
    # # Load bank if empty
    # if not bank:
    #     try:
    #         with open("question_bank/python_developer.json", "r") as f:
    #             bank = json.load(f)
    #     except Exception as e:
    #         print(f"Error loading bank in node: {e}")
    #         return {"question": "Error loading questions."}

    asked = state.get("asked_questions", [])
    available_questions = [q for q in bank if q["question"] not in asked]
    
    if not available_questions:
        return {"question": "No more questions available."}
    
    selected_q = random.choice(available_questions)["question"]
    asked.append(selected_q)
    
    return {
        "question": selected_q,
        # "asked_questions": asked,
        "question_bank": bank # Update bank in state
    }


# Build the Graph
builder = StateGraph(InterviewState)
builder.add_node("question_node", question_node)

builder.add_edge(START, "question_node")
builder.add_edge("question_node", END)

graph = builder.compile()
