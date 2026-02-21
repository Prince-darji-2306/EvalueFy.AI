// Navigation & UI Modes
window.showSection = (sectionId, btn) => {
  const container = document.querySelector(".container");
  container.classList.toggle("analyzer-mode", sectionId === "upload-section");
  container.classList.toggle("interview-mode", sectionId === "interview-section");

  ["details-section", "upload-section", "interview-section", "report-section"].forEach(id => {
    document.getElementById(id).style.display = "none";
  });

  const section = document.getElementById(sectionId);
  section.style.display = "block";
  section.classList.add("fade-in");

  document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  if (btn) btn.classList.add("active");
};

// Handle File Name Display
const fileInputEl = document.getElementById("resume-file");
if (fileInputEl) {
  fileInputEl.addEventListener("change", (e) => {
    document.getElementById("file-name").innerText = e.target.files[0]?.name || "Choose a PDF file...";
  });
}

// Resume Analysis Logic
let currentResumeText = "";

window.analyzeResume = async () => {
  const fileInput = document.getElementById("resume-file");
  const analyzeBtn = document.getElementById("analyze-btn");
  const spinner = document.getElementById("upload-spinner");
  const reportBox = document.getElementById("resume-report");

  if (!fileInput.files[0]) return alert("Please select a PDF file.");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  analyzeBtn.disabled = true;
  spinner.style.display = "block";
  reportBox.style.display = "none";

  try {
    const res = await fetch("/api/upload-resume", { method: "POST", body: formData });
    const data = await res.json();
    if (data.status === "success") {
      currentResumeText = data.analysis.resume_text;
      showResumeReport(data.analysis);
    } else alert("Error: " + (data.error || "Failed."));
  } catch (e) { alert("An error occurred."); }
  finally { analyzeBtn.disabled = false; spinner.style.display = "none"; }
};

function showResumeReport(analysis) {
  const reportBox = document.getElementById("resume-report");
  reportBox.style.display = "block";
  reportBox.classList.add("fade-in");

  reportBox.innerHTML = `
    <div class="report-card">
      <div class="score-circle-container">
        <div class="score-circle">
          <span class="score-value">${analysis.ats_score}</span>
          <span class="score-label">ATS Score</span>
        </div>
      </div>
      <div class="analysis-section">
        <h3>🔍 Advanced Analysis</h3>
        <div class="analysis-content">${analysis.analysis}</div>
      </div>
      <button onclick="startInterviewFromResume()" class="btn-primary" style="margin-top: 20px;">Take Interview from Resume</button>
    </div>
  `;
}

window.startInterviewFromResume = async () => {
  const name = document.getElementById("candidate-name").value.trim() || "Candidate";
  const role = document.getElementById("candidate-role").value.trim() || "Developer";

  if (!currentResumeText) return alert("No resume data found.");

  // Show loading state
  const reportBox = document.getElementById("resume-report");
  reportBox.innerHTML = '<div class="loading-spinner">Generating custom interview questions...</div>';

  try {
    const res = await fetch("/api/generate-resume-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_text: currentResumeText, name, role })
    });
    const data = await res.json();

    if (data.status === "success") {
      const interviewBtn = Array.from(document.querySelectorAll(".nav-link")).find(btn => btn.innerText === "Interview");
      showSection('interview-section', interviewBtn);
      document.getElementById("interview-header").innerText = `Ready, ${name}?`;
      document.getElementById("question").innerText = data.question;
    } else {
      alert("Error: " + data.error);
    }
  } catch (e) {
    alert("Failed to start interview.");
  }
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const result = document.getElementById("result");
const micBtn = document.getElementById("mic-btn");

// Handle Candidate Detail Submission
window.submitDetails = async () => {
  const name = document.getElementById("candidate-name").value.trim();
  const role = document.getElementById("candidate-role").value.trim();

  if (!name || !role) {
    alert("Please fill in both name and role.");
    return;
  }

  const res = await fetch("/api/candidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, role })
  });

  const data = await res.json();
  if (data.status === "success") {
    // Transition UI
    document.querySelector(".container").classList.add("interview-mode");
    document.getElementById("details-section").style.display = "none";
    const interviewSection = document.getElementById("interview-section");
    interviewSection.style.display = "block";
    interviewSection.classList.add("fade-in");


    // Update header with name
    document.getElementById("interview-header").innerText = `Ready, ${name}? Speak now.`;

    // Show first question directly
    if (data.question) {
      document.getElementById("question").innerText = data.question;
    }
  }
};

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;

  window.startListening = () => {
    recognition.start();
    micBtn.classList.add("active");
    result.innerText = "Listening...";
  };

  recognition.onresult = async (event) => {
    let fullTranscript = "";
    let finalChunk = "";

    for (let i = 0; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      fullTranscript += transcript + " ";
      if (event.results[i].isFinal && i === event.resultIndex) {
        finalChunk = transcript;
      }
    }

    // Show live history
    result.innerText = fullTranscript.trim();

    // If we have a new final chunk, send it to the backend
    if (finalChunk) {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalChunk.trim() })
      });
      const data = await res.json();
      console.log("Backend response:", data.response);
    }
  };

  recognition.onerror = () => {
    micBtn.classList.remove("active");
    result.innerText = "Error occurred. Try again.";
  }

  recognition.onend = () => {
    micBtn.classList.remove("active");
  }
} else {
  result.innerText = "Speech recognition not supported in this browser.";
}

window.submitAnswer = async () => {
  const answerText = result.innerText.trim();
  const questionText = document.getElementById("question").innerText;

  if (!answerText || answerText === "Your speech will appear here..." || answerText === "Listening...") {
    alert("Please provide an answer first.");
    return;
  }

  // Show review container and loading state
  const reviewContainer = document.getElementById("review-container");
  const reviewContent = document.getElementById("review-content");

  reviewContainer.style.display = "block";
  reviewContent.style.display = "block";
  reviewContent.innerHTML = '<div class="loading-spinner">Analyzing your response...</div>';

  // Scroll to review
  reviewContainer.scrollIntoView({ behavior: 'smooth' });

  try {
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questionText, answer: answerText })
    });
    const data = await res.json();

    if (data.review) {
      reviewContent.innerHTML = formatReview(data.review);

      // Update the question for next turn
      if (data.next_question) {
        document.getElementById("question").innerText = data.next_question;
        // Clear previous answer text
        result.innerText = "Your speech will appear here...";
        // If it's a follow-up, maybe show a hint or just let it be
        if (data.is_follow_up) {
          console.log("This is a follow-up question.");
        }
      } else if (data.interview_complete && data.report) {
        // Show the final report
        showReport(data.report);
      }

    } else {
      reviewContent.innerText = "Failed to get review: " + (data.error || "Unknown error");
    }
  } catch (error) {
    reviewContent.innerText = error;
  }
};

function formatReview(review) {
  if (!review || typeof review !== "object") return "";

  return `
    <div class="evaluation-result">
      <p><strong>Score:</strong> ${review.score ?? "N/A"}/10</p>
      <p><strong>Reason:</strong> ${review.reason ?? "N/A"}</p>
      <p><strong>Improvements:</strong> ${review.improvements ?? "N/A"}</p>
    </div>
  `;
}

function showReport(report) {
  if (!report) return;

  const interviewSection = document.getElementById("interview-section");
  const reportSection = document.getElementById("report-section");
  const reportContent = document.getElementById("report-content");
  const reviewContainer = document.getElementById("review-container");

  // Hide interview elements
  interviewSection.style.display = "none";
  reviewContainer.style.display = "none";

  // Show report section
  reportSection.style.display = "block";

  reportContent.innerHTML = `
    <div class="report-card">
      <h4>Overall Performance</h4>
      <p><strong>Candidate:</strong> ${report.candidate_name}</p>
      <p><strong>Role:</strong> ${report.role}</p>
      <p><strong>Total Questions:</strong> ${report.total_questions}</p>
      <p><strong>Average Score:</strong> ${report.average_score}/10</p>
      <p class="summary-text"><strong>Summary:</strong> ${report.summary}</p>
      
      <div class="feedback-section">
        <h3 style='margin-top:10px;'>Areas for Improvement 🚀</h3>
        ${report.feedback.map(item => `
          <div class="feedback-item">
            <p style='margin-top:10px;'><strong>Question:</strong> ${item.question}</p>
            <p style='margin-top:10px;'><strong>Score:</strong> ${item.score}/10</p>
            <p style='margin-top:10px;'><strong>Feedback:</strong> ${item.improvements}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}


