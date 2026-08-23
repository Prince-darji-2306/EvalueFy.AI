/**
 * Mock & Live API client for EvalueFy.AI frontend
 * Full in-browser simulation with authentic role questions, ATS analysis, and dynamic evaluation.
 */

// Delay helper to simulate realistic AI inference
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ROLE_QUESTION_BANKS = {
  python: [
    "Can you explain the difference between deep copy and shallow copy in Python, and how memory references behave under the hood?",
    "How does the Python Global Interpreter Lock (GIL) impact multi-threaded CPU-bound execution vs I/O-bound tasks?",
    "Walk me through how you design and optimize database indexes and query plans for high-concurrency API endpoints.",
    "What strategies do you employ for graceful error handling, retries, and distributed tracing in production services?",
    "Describe a complex performance bottleneck or memory leak you diagnosed and resolved recently."
  ],
  frontend: [
    "How does the React reconciliation algorithm and Fiber architecture work to optimize DOM updates?",
    "Can you explain how the browser rendering pipeline (layout, paint, composite) works and how to prevent layout thrashing?",
    "What is your approach to state management in large scale applications when balancing local state, global stores, and server caches?",
    "How do you ensure accessibility (a11y) standards and responsive performance across diverse devices and viewports?",
    "Describe how you handle network latency, optimistic UI updates, and offline resilience in modern web apps."
  ],
  default: [
    "Walk me through your engineering design approach when architecting a high-availability distributed system.",
    "Can you explain how you evaluate trade-offs between relational (SQL) and non-relational (NoSQL) databases for a new feature?",
    "How do you identify and mitigate security vulnerabilities such as SQL injection, XSS, and broken authentication?",
    "Describe how you design CI/CD pipelines and automated testing strategies to ensure zero-downtime deployments.",
    "Tell me about a challenging technical decision where you had to compromise on scope or tech debt, and how you managed it."
  ]
};

// In-memory mock session state
let mockSession = {
  candidateName: 'Alex Mercer',
  candidateRole: 'Python Developer',
  questions: [],
  currentIndex: 0,
  isFollowUpActive: false,
  answered: [],
};

export async function uploadResume(file) {
  await delay(1200);

  const fileName = file?.name || 'Resume.pdf';
  const simulatedText = `Extracted text from ${fileName} with engineering experience in full-stack architecture, API optimization, data structures, cloud infrastructure, and distributed systems.`;

  const analysisHtml = `
    <div class="space-y-4">
      <div class="p-4 rounded-xl bg-surface-2 border border-border">
        <h2 class="text-base font-bold text-ink mb-1">ATS Semantic Screening Summary</h2>
        <p class="text-sm text-ink-muted">Document parsed successfully with <strong>84%</strong> compatibility match against Senior Software Engineering benchmarks.</p>
      </div>

      <h3 class="text-sm font-semibold text-ink uppercase tracking-wider mt-4">Section Breakdown & Keyword Density</h3>
      <ul class="list-disc pl-5 space-y-1.5 text-sm text-ink-muted">
        <li><strong>Core Technical Skills:</strong> Strong match on Python, FastAPI, Docker, PostgreSQL, React, and Redis.</li>
        <li><strong>Work Experience:</strong> Well-structured chronology; roles and achievements are clearly demarcated.</li>
        <li><strong>Impact Metrics:</strong> Included quantifiable metrics on latency reduction (-35%) and throughput scaling (+200%).</li>
      </ul>

      <h3 class="text-sm font-semibold text-coral-low uppercase tracking-wider mt-4">Why Marks Were Deducted (-16 Points)</h3>
      <ul class="list-disc pl-5 space-y-1.5 text-sm text-ink-muted">
        <li><strong>Missing Cloud Orchestration Keywords (-6 pts):</strong> Lacks explicit mentions of Kubernetes cluster configuration and Terraform IAC.</li>
        <li><strong>Non-Standard Header Formatting (-5 pts):</strong> Two-column visual layout can introduce text ordering ambiguity in legacy ATS parsers.</li>
        <li><strong>Security & Testing Depth (-5 pts):</strong> Limited mention of automated test coverage (e.g. pytest, unit test percentages, SAST scanning).</li>
      </ul>

      <h3 class="text-sm font-semibold text-verified-teal uppercase tracking-wider mt-4">Recommendations for 95%+ Pass Rate</h3>
      <p class="text-sm text-ink-muted">Switch to single-column ATS format, include a dedicated "DevOps & Cloud" keyword block, and append test coverage benchmarks to each project role.</p>
    </div>
  `;

  return {
    status: 'success',
    analysis: {
      ats_score: 84,
      analysis: analysisHtml,
      resume_text: simulatedText,
    }
  };
}

export async function startCandidateInterview(name = 'Alex Mercer', role = 'Python Developer') {
  await delay(600);

  const roleKey = role.toLowerCase().includes('python')
    ? 'python'
    : role.toLowerCase().includes('frontend') || role.toLowerCase().includes('react')
    ? 'frontend'
    : 'default';

  const bank = ROLE_QUESTION_BANKS[roleKey];

  mockSession = {
    candidateName: name,
    candidateRole: role,
    questions: [...bank],
    currentIndex: 0,
    isFollowUpActive: false,
    answered: [],
  };

  return {
    status: 'success',
    question: mockSession.questions[0]
  };
}

export async function startResumeInterview(resume_text, name = 'Candidate', role = 'Full Stack Engineer') {
  await delay(900);

  const customQuestions = [
    "Based on your resume, could you detail how you designed the asynchronous microservices pipeline and managed state consistency?",
    "You mentioned optimizing database latency on your recent projects. What specific indexing and caching strategies did you deploy?",
    "How did you establish fault-tolerant CI/CD workflows and monitor production container health in your previous role?",
    "Can you walk through a scenario where you architected a REST/GraphQL API to handle spike loads?",
    "Tell me about how you handled cross-team code reviews and technical debt prioritization in your work."
  ];

  mockSession = {
    candidateName: name,
    candidateRole: role,
    questions: customQuestions,
    currentIndex: 0,
    isFollowUpActive: false,
    answered: [],
  };

  return {
    status: 'success',
    question: mockSession.questions[0]
  };
}

export async function submitAnswerReview(question, answer) {
  await delay(900);

  const wordCount = answer.trim().split(/\s+/).length;
  
  // Intelligent mock scoring based on answer depth
  let score;
  let reason;
  let improvements;
  let isFollowUp = false;
  let followUpQuestion = null;

  if (wordCount < 18) {
    score = 4.5;
    reason = "Answer was overly brief and omitted concrete technical mechanisms, trade-offs, and implementation nuances.";
    improvements = "Elaborate with practical examples, mention internal architecture (e.g. memory management, concurrency models), and explain why specific trade-offs were made.";
    if (!mockSession.isFollowUpActive) {
      isFollowUp = true;
      followUpQuestion = `Could you drill down deeper: what concrete mechanisms or syntax would you use to resolve this in a real-world production incident?`;
    }
  } else if (wordCount < 35) {
    score = 7.0;
    reason = "Good high-level understanding demonstrated with accurate foundational concepts.";
    improvements = "To achieve top-tier marks, highlight edge cases, performance benchmarks, and recovery strategies under load.";
  } else {
    score = 9.0;
    reason = "Exceptional and thorough response. Demonstrated strong architectural command, clear rationale, and practical edge-case handling.";
    improvements = "Consider concisely summarizing the executive conclusion at the end of technical explanations.";
  }

  const review = {
    score,
    reason,
    improvements,
    follow_up: followUpQuestion,
  };

  mockSession.answered.push({
    question,
    answer,
    review,
    isFollowUp: mockSession.isFollowUpActive,
  });

  if (isFollowUp) {
    mockSession.isFollowUpActive = true;
    return {
      review,
      next_question: followUpQuestion,
      is_follow_up: true,
      interview_complete: false,
      report: null
    };
  }

  mockSession.isFollowUpActive = false;
  mockSession.currentIndex += 1;

  const isComplete = mockSession.currentIndex >= mockSession.questions.length;

  if (isComplete) {
    const scores = mockSession.answered.map((a) => a.review.score);
    const avgScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));

    const finalReport = {
      candidate_name: mockSession.candidateName,
      role: mockSession.candidateRole,
      average_score: avgScore,
      total_questions: mockSession.answered.length,
      summary: `Candidate completed ${mockSession.answered.length} diagnostic rounds. Demonstrated strong problem decomposition and technical communication, averaging ${avgScore}/10 across all technical benchmarks.`,
      feedback: mockSession.answered.map((a) => ({
        question: a.question,
        score: a.review.score,
        improvements: a.review.improvements,
      }))
    };

    return {
      review,
      next_question: null,
      is_follow_up: false,
      interview_complete: true,
      report: finalReport
    };
  }

  const nextQuestion = mockSession.questions[mockSession.currentIndex];

  return {
    review,
    next_question: nextQuestion,
    is_follow_up: false,
    interview_complete: false,
    report: null
  };
}

export async function sendVoiceSnippet(text) {
  return { response: "Voice snippet recorded." };
}
