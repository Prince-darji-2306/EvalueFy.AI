import json
import os
import shutil
from nodes import graph
from pydantic import BaseModel
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from agents.ResumeAnalyzer import analyze_resume, generate_resume_questions

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

def InitGraph(name, role, custom_bank=None, resume_q=False):
    global main_state
    state = {
        "candidate_name": name,
        "candidate_role": role,
        "question_bank": custom_bank if custom_bank else get_questions(),
        "asked_questions": [],
        "answered_questions": [],
        "question": None,
        "answer": None,
        "is_follow_up" : False,
        "total_score": 0,
        "interview_complete": False,
        "final_report": None,
        "resume_q": resume_q,
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
        return {"response": "Answer received and stored."}
    return {"response": "No speech detected."}

@app.post("/api/candidate")
def save_candidate(details: CandidateInfo):
    initial_question = InitGraph(details.name, details.role)
    return {"status": "success", "question": initial_question}

@app.post("/api/generate-resume-questions")
async def resume_questions(data: dict):
    text = data.get("resume_text")
    name = data.get("name", "Candidate")
    role = data.get("role", "Developer")
    if not text: return {"error": "No resume text provided."}
    questions = generate_resume_questions(text)
    if not questions: return {"error": "Failed to generate questions."}
    initial_question = InitGraph(name, role, custom_bank=questions, resume_q=True)
    return {"status": "success", "question": initial_question}

@app.post("/api/review")
def review(data: dict):
    global main_state
    question, answer = data.get("question"), data.get("answer")
    if not question or not answer: return {"error": "Missing Q or A"}
    if not main_state: return {"error": "State error"}
    try:
        main_state.update({"question": question, "answer": answer})
        result = graph.invoke(main_state)
        main_state = result
        return {
            "review": result.get("review"),
            "next_question": result.get("question"),
            "is_follow_up": result.get("is_follow_up"),
            "interview_complete": result.get("interview_complete"),
            "report": result.get("final_report")
        }
    except Exception as e: return {"error": str(e)}

@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"): return {"error": "Only PDF supported."}
    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{file.filename}"
    try:
        with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        analysis = analyze_resume(file_path)
        os.remove(file_path)
        return {"status": "success", "analysis": analysis}
    except Exception as e: return {"error": str(e)}
