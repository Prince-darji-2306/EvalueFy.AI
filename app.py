import json
from nodes import graph
from pydantic import BaseModel
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


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
        "question_bank": get_questions(), # Load bank here
        "asked_questions": [],
        "answered_questions": [],
        "question": None,
        "answer": None,
        "is_follow_up" : False,
        "review": None,
        "total_score": 0,
        "review": None,
        "total_score": 0,
        "interview_complete": False,
        "final_report": None    
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
    global main_state
    question = data.get("question")
    answer = data.get("answer")
    
    if not question or not answer:
        return {"error": "Missing question or answer"}
    
    if not main_state:
        return {"error": "Interview state not initialized"}

    try:
        # Update state with answer and current question
        main_state["question"] = question
        main_state["answer"] = answer
        
        result = graph.invoke(main_state)
        main_state = result
        return {
            "review": result.get("review"),
            "next_question": result.get("question"),
            "is_follow_up": result.get("is_follow_up"),
            "next_question": result.get("question"),
            "is_follow_up": result.get("is_follow_up"),
            "interview_complete": result.get("interview_complete"),
            "report": result.get("final_report")
        }
        
    except Exception as e:
        print(f"Error in review process: {e}")
        return {"error": "Failed to process review."}


