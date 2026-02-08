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
  recognition.continuous = true;

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
    } else {
      reviewContent.innerText = "Failed to get review: " + (data.error || "Unknown error");
    }
  } catch (error) {
    reviewContent.innerText = "Error: " + error.message;
  }
};

function formatReview(text) {
  // Basic formatting for the LLM response
  return text.split('\n').map(line => `<p>${line}</p>`).join('');
}


