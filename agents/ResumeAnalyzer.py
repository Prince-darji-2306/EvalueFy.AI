import fitz
import json
from llm_engine import get_llm

def extract_text_from_pdf(path):
    text = ""
    try:
        with fitz.open(path) as doc:
            for page in doc:
                blocks = page.get_text("blocks")
                blocks.sort(key=lambda b: (b[1], b[0]))  # sort top to bottom, left to right
                for b in blocks:
                    text += b[4] + "\n"
    except Exception as e:
        print(f"Error: {e}")
    return text

def analyze_resume(path):
    text = extract_text_from_pdf(path)
    if not text: return {"error": "Failed to extract text."}

    prompt = f"""
    Advanced Resume Analysis:
    First Format the Resume content Properly, If Content is misaligned or jumbled.
    Then Generate a detailed ATS score (0-100) and report based on the formatting. 
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
    The Questions should be slightly more specific. If asking general question provide what to explain exactly.
    And exactly 9 question should be Technical side.

    Format your response as a JSON array of objects with keys: "question", "difficulty", "expected_concepts".
    Resume: {text}
    """
    res = get_llm().invoke(prompt).content
    try:
        # Extract JSON from potential markdown
        json_str = res.strip()
        if "```json" in json_str: json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str: json_str = json_str.split("```")[1].split("```")[0].strip()

        print(json.loads(json_str))
        return json.loads(json_str)
    except: return []
