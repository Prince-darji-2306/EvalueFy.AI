/**
 * API client connecting React Frontend to FastAPI Backend
 */

const API_BASE = ''; // Uses Vite proxy in development or direct host in production

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/upload-resume`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Upload failed');
    throw new Error(`Upload failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function startCandidateInterview(name, role) {
  const res = await fetch(`${API_BASE}/api/candidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ name, role }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Candidate setup failed');
    throw new Error(`Failed to start interview (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function startResumeInterview(resume_text, name = 'Candidate', role = 'Developer') {
  const res = await fetch(`${API_BASE}/api/generate-resume-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ resume_text, name, role }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Resume question generation failed');
    throw new Error(`Failed to generate resume interview (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function submitAnswerReview(question, answer) {
  const res = await fetch(`${API_BASE}/api/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ question, answer }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Answer evaluation failed');
    throw new Error(`Evaluation failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function sendVoiceSnippet(text) {
  try {
    const res = await fetch(`${API_BASE}/api/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    return await res.json();
  } catch (err) {
    // Non-critical background voice logging
    return null;
  }
}
