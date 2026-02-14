import fitz
import json
from llm_engine import get_llm

def extract_text_from_pdf(path):
    text = ""
    try:
        with fitz.open(path) as doc:
            for page in doc: text += page.get_text()
    except Exception as e: print(f"Error: {e}")
    print(text)
    return text

def analyze_resume(path):
    text = extract_text_from_pdf(path)
    if not text: return {"error": "Failed to extract text."}

    prompt = f"""
    Advanced Resume Analysis:
    Generate a detailed ATS score (0-100) and report. 
    Focus on WHY marks are deducted. Provide detailed insights.
    IGNORE text organization artifacts. Resume: {text}

    Format:
    SCORE: [number]
    REPORT: [Analysis]
    """
    res = get_llm().invoke(prompt).content
    try:
        score_part = res.split("SCORE:")[1].split("REPORT:")[0].strip()
        score = int(''.join(filter(str.isdigit, score_part)))
        report = res.split("REPORT:")[1].strip()
        return {"ats_score": score, "analysis": report, "resume_text": text}
    except: return {"ats_score": "N/A", "analysis": res, "resume_text": text}

def generate_resume_questions(text):
    prompt = f"""
    Generate exactly 12 interview questions based on this resume.
    Format your response as a JSON array of objects with keys: "question", "difficulty", "expected_concepts".
    Resume: {text}
    """
    res = get_llm().invoke(prompt).content
    try:
        # Extract JSON from potential markdown
        json_str = res.strip()
        if "```json" in json_str: json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str: json_str = json_str.split("```")[1].split("```")[0].strip()
        return json.loads(json_str)
    except: return []
