import fitz
from llm_engine import get_llm

def extract_text_from_pdf(path):
    text = ""
    try:
        with fitz.open(path) as doc:
            for page in doc: text += page.get_text()
    except Exception as e: print(f"Error: {e}")
    return text

def analyze_resume(path):
    text = extract_text_from_pdf(path)
    if not text: return {"error": "Failed to extract text."}

    prompt = f"""
    Advanced Resume Analysis:
    Generate a detailed ATS score (between 0 to 100) and report. 
    Focus on WHY marks are deducted (where it fails). 
    Provide all sligtly detailed insights which are needed to know.
    IGNORE any text organization or formatting artifacts from PDF extraction. Don't be too much strict.
    
    Resume: {text}

    Format:
    SCORE: [number]
    REPORT: [Detailed advanced analysis of deductions and improvements]
    """
    
    res = get_llm().invoke(prompt).content
    try:
        score_part = res.split("SCORE:")[1].split("REPORT:")[0].strip()
        score = int(''.join(filter(str.isdigit, score_part)))
        report = res.split("REPORT:")[1].strip()
        return {"ats_score": score, "analysis": report}
    except:
        return {"ats_score": "N/A", "analysis": res}
