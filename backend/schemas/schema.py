from typing import List, TypedDict, Optional, Dict, Any
from pydantic import BaseModel, Field

# ==========================================
# Graph State Schema
# ==========================================
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

# ==========================================
# Candidate & Voice Schemas
# ==========================================
class CandidateInfo(BaseModel):
    name: str = Field(..., description="Candidate full name")
    role: str = Field(..., description="Target role or domain")

class VoiceInput(BaseModel):
    text: str = Field(..., description="Transcribed audio snippet")

# ==========================================
# Review & Evaluation Schemas
# ==========================================
class EvaluationReview(BaseModel):
    """Structured output schema for LLM response evaluation."""
    score: int = Field(
        ...,
        ge=0,
        le=10,
        description="Score between 0 and 10 evaluating the technical correctness and depth of the answer."
    )
    reason: str = Field(
        ...,
        description="Clear explanation of the awarded score, highlighting strengths and missing details."
    )
    improvements: str = Field(
        ...,
        description="Constructive and actionable advice on how the candidate can refine their answer."
    )
    follow_up: Optional[str] = Field(
        default=None,
        description="If score is below 6, provide a targeted drill-down question to clarify. Otherwise set to null."
    )

class ReviewRequest(BaseModel):
    question: str
    answer: str
    session_id: Optional[str] = None

class FeedbackItem(BaseModel):
    question: str
    score: int
    improvements: str

class FinalReport(BaseModel):
    candidate_name: str
    role: str
    average_score: float
    total_questions: int
    summary: str
    feedback: List[FeedbackItem]

class ReviewResponse(BaseModel):
    review: Optional[EvaluationReview] = None
    next_question: Optional[str] = None
    is_follow_up: bool = False
    interview_complete: bool = False
    report: Optional[FinalReport] = None

# ==========================================
# Resume & ATS Schemas
# ==========================================
class ResumeQuestionItem(BaseModel):
    question: str = Field(..., description="Technical or architectural interview question tailored to the resume")
    difficulty: str = Field(default="medium", description="Difficulty level (easy, medium, hard)")
    expected_concepts: List[str] = Field(default_factory=list, description="Key concepts expected in candidate answer")

class ResumeQuestionBank(BaseModel):
    questions: List[ResumeQuestionItem] = Field(
        ...,
        description="Array of 12 interview questions (9 technical + 3 general) derived from the resume"
    )

class ResumeAnalysis(BaseModel):
    ats_score: Any = Field(..., description="ATS score 0-100 or rating")
    analysis: str = Field(..., description="HTML or markdown report highlighting strengths and deductions")
    resume_text: str = Field(..., description="Extracted raw text from resume")

class GenerateResumeQuestionsRequest(BaseModel):
    resume_text: str
    name: Optional[str] = "Candidate"
    role: Optional[str] = "Developer"
