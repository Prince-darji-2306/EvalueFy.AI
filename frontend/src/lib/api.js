const API_BASE = import.meta.env.VITE_API_URL || '';

async function postJSON(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Request failed');
    throw new Error(`Request failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/upload-resume`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export const startCandidateInterview = (name, role) => postJSON('/api/candidate', { name, role });

export const startResumeInterview = (resume_text, name = 'Candidate', role = 'Developer') =>
  postJSON('/api/generate-resume-questions', { resume_text, name, role });

export const submitAnswerReview = (question, answer, session_id = null) =>
  postJSON('/api/review', { question, answer, session_id });

export async function sendVoiceSnippet(text) {
  try {
    return await postJSON('/api/voice', { text });
  } catch {
    return null;
  }
}
