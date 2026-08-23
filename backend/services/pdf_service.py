import fitz

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts ordered text blocks from a PDF document.
    """
    text = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                blocks = page.get_text("blocks")
                # Sort blocks top to bottom, left to right
                blocks.sort(key=lambda b: (b[1], b[0]))
                for b in blocks:
                    text += b[4] + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text.strip()
