import os
import shutil
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas.candidate import CandidateInfo, VoiceInput
from schemas.review import ReviewRequest
from schemas.resume import GenerateResumeQuestionsRequest
from services.session_service import session_service
from agents.ResumeAnalyzer import analyze_resume, generate_resume_questions
from core.workflow import graph, init_interview_state

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(
    title="EvalueFy.AI Backend",
    description="AI-Powered Mock Interview and Resume ATS Diagnostic Platform"
)

# Enable CORS for frontend connection (e.g. Vite on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "EvalueFy.AI Backend API is active and ready"}

@app.post("/api/candidate")
def start_candidate_interview(details: CandidateInfo):
    """
    Initializes a standard interview session for candidate name + target role.
    """
    try:
        initial_state = init_interview_state(details.name, details.role)
        session_id = session_service.create_session(initial_state)
        return {
            "status": "success",
            "session_id": session_id,
            "question": initial_state.get("question")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-resume-questions")
def start_resume_interview(data: GenerateResumeQuestionsRequest):
    """
    Generates 12 tailored questions from resume text and initializes the interview graph.
    """
    if not data.resume_text.strip():
        return {"error": "No resume text provided."}

    try:
        questions = generate_resume_questions(data.resume_text)
        if not questions:
            return {"error": "Failed to generate questions from resume."}
        
        initial_state = init_interview_state(
            name=data.name or "Candidate",
            role=data.role or "Developer",
            custom_bank=questions,
            resume_q=True
        )
        session_id = session_service.create_session(initial_state)
        return {
            "status": "success",
            "session_id": session_id,
            "question": initial_state.get("question")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/review")
def review_answer(data: ReviewRequest):
    """
    Evaluates candidate's answer and advances the state graph.
    """
    if not data.question or not data.answer:
        return {"error": "Missing question or answer."}

    current_state = session_service.get_session(data.session_id)
    if not current_state:
        # Auto-initialize fallback state if session was not found
        current_state = init_interview_state("Candidate", "Software Engineer")
        session_service.create_session(current_state)

    try:
        current_state.update({
            "question": data.question,
            "answer": data.answer
        })
        result = graph.invoke(current_state)
        
        session_id = current_state.get("session_id")
        if session_id:
            session_service.update_session(session_id, result)

        return {
            "review": result.get("review"),
            "next_question": result.get("question"),
            "is_follow_up": result.get("is_follow_up", False),
            "interview_complete": result.get("interview_complete", False),
            "report": result.get("final_report")
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/upload-resume")
async def upload_and_analyze_resume(file: UploadFile = File(...)):
    """
    Parses PDF resume, computes ATS score, and generates deduction report.
    """
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Only PDF files are supported."}

    temp_dir = os.path.join(CURRENT_DIR, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        analysis = analyze_resume(file_path)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {"status": "success", "analysis": analysis}
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        return {"error": str(e)}

@app.post("/api/voice")
def log_voice_snippet(data: VoiceInput):
    """
    Receives interim/final speech-to-text snippets.
    """
    text = data.text.strip()
    if text:
        return {"response": "Answer received and stored."}
    return {"response": "No speech detected."}
