from pydantic import BaseModel, Field
from typing import List, Optional, Any

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
