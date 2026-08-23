from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

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
