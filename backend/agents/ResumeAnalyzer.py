import json
from core import get_llm
from services import extract_text_from_pdf
from schemas import ResumeQuestionBank

try:
    import pyromark
    def markdown_to_html(md_text: str) -> str:
        return pyromark.html(md_text)
except ImportError:
    def markdown_to_html(md_text: str) -> str:
        import re
        html = md_text.replace('\n\n', '<br/><br/>')
        html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
        html = re.sub(r'### (.*?)\n', r'<h3>\1</h3>', html)
        html = re.sub(r'## (.*?)\n', r'<h2>\1</h2>', html)
        return html

def analyze_resume(path: str) -> dict:
    """
    Extracts resume text and generates an ATS score benchmark and detailed deduction analysis.
    """
    text = extract_text_from_pdf(path)
    if not text:
        return {"error": "Failed to extract text from the provided PDF."}

    prompt = f"""
    You are an expert ATS (Applicant Tracking System) auditing engine.
    Evaluate the following resume and compute a realistic ATS score (0-100).
    Provide a detailed diagnostic breakdown focusing on WHY marks were deducted, missing industry keywords, and formatting risks.
    Use clear markdown headings (## Summary, ### Deductions, ### Recommendations).
    
    Resume:
    {text}
    
    Format your response EXACTLY as:
    SCORE: [number]
    REPORT: [Markdown Analysis]
    """
    
    llm = get_llm()
    res = llm.invoke(prompt).content
    
    try:
        score_part = res.split("SCORE:")[1].split("REPORT:")[0].strip()
        score = int(''.join(filter(str.isdigit, score_part)))
        report_md = res.split("REPORT:")[1].strip()
        report_html = markdown_to_html(report_md)
        return {
            "ats_score": score,
            "analysis": report_html,
            "resume_text": text
        }
    except Exception as e:
        print(f"Resume ATS parse fallback: {e}")
        return {
            "ats_score": 80,
            "analysis": markdown_to_html(res),
            "resume_text": text
        }

def generate_resume_questions(text: str) -> list:
    """
    Generates 12 tailored interview questions (9 technical + 3 general) derived from the resume.
    """
    prompt = f"""
    Generate exactly 12 interview questions based on the candidate's resume below.
    - Exactly 9 questions must focus on Technical depth, architecture, and project implementations mentioned in the resume.
    - Exactly 3 questions must focus on general problem-solving, collaboration, and engineering trade-offs.
    
    Resume:
    {text}
    """
    
    llm = get_llm()
    
    # 1. Primary path: Structured output via Pydantic schema
    try:
        structured_llm = llm.with_structured_output(ResumeQuestionBank)
        result: ResumeQuestionBank = structured_llm.invoke(prompt)
        if isinstance(result, ResumeQuestionBank):
            return [q.model_dump() for q in result.questions]
        if isinstance(result, dict) and "questions" in result:
            return result["questions"]
    except Exception as e:
        print(f"Structured question generation error, falling back to JSON: {e}")
        
    # 2. Resilient fallback path
    fallback_prompt = f"""{prompt}
    
    Format your response as a STRICT JSON array of objects with keys: "question", "difficulty", "expected_concepts".
    Return ONLY JSON.
    """
    try:
        raw = llm.invoke(fallback_prompt).content.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        return json.loads(raw)
    except Exception as err:
        print(f"Fallback resume questions error: {err}")
        return [
            {
                "question": "Can you walk through one of the key technical projects mentioned in your resume and explain your architectural design decisions?",
                "difficulty": "medium",
                "expected_concepts": ["architecture", "trade-offs", "problem-solving"]
            }
        ]
