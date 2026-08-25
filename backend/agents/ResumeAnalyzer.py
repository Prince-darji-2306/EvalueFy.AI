import cmarkgfm as cgfm
from core.llm import get_llm
from services.pdf_service import extract_text_from_pdf
from schemas import ResumeQuestionBank, ResumeATSReport

def analyze_resume(path: str) -> dict:
    """
    Extracts resume text and generates structured ATS analysis using LLM function calling.
    """
    text = extract_text_from_pdf(path)
    if not text:
        return {"error": "Failed to extract text from the provided PDF."}

    prompt = f"""
    You are a pragmatic, senior technical recruiter and ATS (Applicant Tracking System) auditing specialist.
    Evaluate the candidate's resume below and produce a structured ATS evaluation.

    === CORE EVALUATION PRINCIPLES ===
    1. EVALUATE WHAT IS ACTUALLY PRESENT:
    - Judge the resume strictly on the candidate's actual projects, domain, and chosen tech stack.
    - DO NOT penalize the candidate for not listing technologies they do not claim to know (e.g., do NOT demand they add Spark, Kubernetes, or AWS if their focus is Python/FastAPI/AI).
    - DO NOT demand irrelevant personal details like visa status, nationality, or unlisted paid certifications.

    2. REALISTIC ATS & PARSING CRITERIA:
    - Focus on REAL ATS extraction risks: Is the section hierarchy clean? Are bullet points easy for parsers to associate with roles/projects?
    - DO NOT nitpick trivial punctuation (e.g., missing colons after Email/Phone, date formatting hyphens). Modern ATS parsers extract contacts via regex.
    - DO NOT speculate or complain about dates/years (the current year is 2026; accept all listed dates as legitimate).

    3. KEY IMPACT AREAS TO ASSESS: Check this with Moderate complexity. 
    - Quantified Results: Did the candidate mention measurable metrics (e.g., latency reduction, API load, accuracy, dataset size, active users)?
    - Action Verbs & Technical Depth: Are project descriptions action-oriented (Engineered, Architected, Deployed, Optimized) vs passive task lists?
    - Skill Contextualization: Are listed skills (e.g. LangGraph, FastAPI, Docker) demonstrated within the project bullet points rather than isolated in a skill list?

    Candidate Resume:
    {text}
    """
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(ResumeATSReport, method="function_calling")
    result: ResumeATSReport = structured_llm.invoke(prompt)

    return {
        "name": getattr(result, "name", "Candidate"),
        "role": getattr(result, "role", "Software Engineer"),
        "ats_score": getattr(result, "ats_score", 85),
        "analysis": cgfm.markdown_to_html(getattr(result, "report", "No report generated.")),
        "resume_text": text
    }

def generate_resume_questions(text: str) -> list:
    """
    Generates 12 tailored interview questions (9 technical + 3 general) derived from the resume using structured output.
    """
    prompt = f"""
    Generate exactly 12 interview questions tailored directly to the candidate's actual projects, libraries, and frameworks listed in their resume below.
    - Exactly 9 questions must focus on technical architecture, design trade-offs, and implementation details of the technologies they actually used.
    - Exactly 3 questions must focus on real-world engineering problem solving, debugging, and collaboration based on their background.
    
    Resume:
    {text}
    """
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(ResumeQuestionBank, method="function_calling")
    result: ResumeQuestionBank = structured_llm.invoke(prompt)
    print(result)
    if isinstance(result, ResumeQuestionBank):
        return [q.model_dump() for q in result.questions]
    if isinstance(result, dict) and "questions" in result:
        return result["questions"]
    return []
