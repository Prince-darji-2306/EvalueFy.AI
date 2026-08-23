from pydantic import BaseModel, Field
from typing import Optional

class CandidateInfo(BaseModel):
    name: str = Field(..., description="Candidate full name")
    role: str = Field(..., description="Target role or domain")

class VoiceInput(BaseModel):
    text: str = Field(..., description="Transcribed audio snippet")
