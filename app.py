import json
import random
from pydantic import BaseModel
from llm_engine import get_response
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from nodes import graph




app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

class VoiceInput(BaseModel):
    text: str

class CandidateInfo(BaseModel):
    name: str
    role: str

candidate_data = []
answers = []
main_state = None


def get_questions():
    with open("question_bank/python_developer.json", "r") as f:
        questions = json.load(f)
    return questions

def InitGraph(name, role):
    global main_state
    state = {
        "candidate_name": name,
        "candidate_role": role,
        "question_bank": [], # Nodes will load this
        "asked_questions": [],
        "question": None,
        "answer": None,
        "is_follow_up" : False,
        "follow_upQ": None,
        "review": None
    }
    main_state = graph.invoke(state)
    return main_state.get("question")



@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/voice")
def voice(data: VoiceInput):
    text = data.text.strip()
    if text:
        answers.append(text)
        print(f"Stored answer: {text}")
        return {"response": "Answer received and stored."}
    return {"response": "No speech detected."}

@app.post("/api/candidate")
def save_candidate(details: CandidateInfo):
    initial_question = InitGraph(details.name, details.role)
    return {
        "status": "success", 
        "message": "Candidate details stored.",
        "question": initial_question
    }


@app.post("/api/review")
def review(data: dict):
    question = data.get("question")
    answer = data.get("answer")
    if not question or not answer:
        return {"error": "Missing question or answer"}
    
    try:
        review_text = get_response(question, answer)
        return {"review": review_text}
    except Exception as e:
        print(f"Error getting LLM review: {e}")
        return {"error": "Failed to get review from AI."}


