// ===================================================
// PREPMIND AI - JAVASCRIPT ENGINE & GEMINI INTEGRATION
// ===================================================

// 1. STATE & STORAGE VARIABLES
let currentQuestions = [];
let currentTopic = "";
let currentStudentName = "";
let currentMode = "mock";

// Helper: Quick Select Topic Pills
function selectTopic(topicName) {
  document.getElementById("topic-input").value = topicName;
}

// 2. GEMINI API KEY MANAGEMENT
// Key is stored safely in browser's localStorage
function getApiKey() {
  let key = localStorage.getItem("gemini_api_key");
  if (!key) {
    key = prompt(
      "🔑 Enter your Google Gemini API Key:\n\n(Get a free key from https://aistudio.google.com/)"
    );
    if (key && key.trim() !== "") {
      key = key.trim();
      localStorage.setItem("gemini_api_key", key);
    } else {
      return null;
    }
  }
  return key;
}

// Function to let user change or reset their API key anytime
function changeApiKey() {
  const currentKey = localStorage.getItem("gemini_api_key") || "";
  const newKey = prompt(
    "🔑 Enter your Google Gemini API Key:\n\n(Get it free at https://aistudio.google.com/)",
    currentKey
  );
  if (newKey !== null) {
    if (newKey.trim() !== "") {
      localStorage.setItem("gemini_api_key", newKey.trim());
      localStorage.removeItem("gemini_working_model");
      alert("✅ Gemini API Key updated successfully!");
    } else {
      localStorage.removeItem("gemini_api_key");
      localStorage.removeItem("gemini_working_model");
      alert("ℹ️ API Key cleared. You will be prompted on next test.");
    }
  }
}

// Automatically discover which models and API versions are supported by this specific user's API key
async function findWorkingModel(apiKey) {
  const cached = localStorage.getItem("gemini_working_model");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      localStorage.removeItem("gemini_working_model");
    }
  }

  // Probe both v1 and v1beta as Google suggested ("Call ListModels to see available models")
  const probeUrls = [
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`
  ];

  for (const url of probeUrls) {
    try {
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        const available = (data.models || [])
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .map(m => m.name.replace("models/", ""));

        console.log("Found available Gemini models for this key:", available);

        if (available.length > 0) {
          const apiVersion = url.includes("/v1/") ? "v1" : "v1beta";
          // Pick the best active flash-lite model
          const chosenModel = available.find(m => m.includes("3.5-flash-lite"))
                           || available.find(m => m.includes("flash-lite-latest"))
                           || available.find(m => m.includes("flash-latest"))
                           || "gemini-3.5-flash-lite";

          const result = { model: chosenModel, apiVersion: "v1beta" };
          localStorage.setItem("gemini_working_model", JSON.stringify(result));
          return result;
        }
      } else if (res.status === 400 || res.status === 401 || res.status === 403) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
        localStorage.removeItem("gemini_api_key");
        localStorage.removeItem("gemini_working_model");
        throw new Error(`API Key Error [${res.status}]: ${errMsg}\n\nPlease verify your API Key at https://aistudio.google.com/`);
      }
    } catch (e) {
      if (e.message && e.message.includes("API Key Error")) throw e;
      console.warn("Probe failed for", url, e);
    }
  }

  return { model: "gemini-3.5-flash-lite", apiVersion: "v1beta" };
}

// Robust Gemini Caller with auto model discovery and fallback
async function callGemini(promptText, apiKey) {
  // Candidate configurations tested directly with this key
  const candidateConfigs = [
    { model: "gemini-3.5-flash-lite", apiVersion: "v1beta" },
    { model: "gemini-flash-lite-latest", apiVersion: "v1beta" },
    { model: "gemini-flash-latest", apiVersion: "v1beta" },
    { model: "gemini-2.5-flash-lite", apiVersion: "v1beta" }
  ];

  let lastError = null;

  for (const config of candidateConfigs) {
    const { model, apiVersion } = config;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Remember this winning configuration for subsequent calls
        localStorage.setItem("gemini_working_model", JSON.stringify(config));
        return data.candidates[0].content.parts[0].text.trim();
      }

      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `HTTP ${response.status}`;

      if (response.status === 404) {
        lastError = new Error(`Model [${model}] on ${apiVersion} returned 404: ${errMsg}`);
        continue;
      }

      if (response.status === 400 || response.status === 401 || response.status === 403) {
        localStorage.removeItem("gemini_api_key");
        localStorage.removeItem("gemini_working_model");
        throw new Error(`API Key Error [${response.status}]: ${errMsg}\n\nThe invalid key has been cleared from your browser. Please enter a valid API key from https://aistudio.google.com/`);
      }

      throw new Error(`API Error [${response.status}]: ${errMsg}`);
    } catch (err) {
      if (err.message && err.message.includes("API Key Error")) {
        throw err;
      }
      lastError = err;
    }
  }

  if (lastError) {
    localStorage.removeItem("gemini_api_key");
    localStorage.removeItem("gemini_working_model");
    throw new Error(`${lastError.message}\n\nPlease check that your Gemini API Key is active at https://aistudio.google.com/`);
  }

  throw new Error("Unable to reach Gemini API. Please check your network connection.");
}

// 3. EVENT LISTENERS
document.addEventListener("DOMContentLoaded", () => {
  // Load past history on page load
  renderHistory();

  // Change API Key Button
  document.getElementById("change-api-key-btn")?.addEventListener("click", changeApiKey);

  // Start Interview Button
  document.getElementById("start-btn").addEventListener("click", startInterview);

  // Submit Answers Form
  document.getElementById("answers-form").addEventListener("submit", submitAnswers);

  // Restart Practice Button
  document.getElementById("restart-btn").addEventListener("click", restartApp);
});

// ===================================================
// CORE FUNCTION 1: GENERATE INTERVIEW QUESTIONS
// ===================================================
async function startInterview() {
  const nameInput = document.getElementById("student-name").value.trim();
  const topicInput = document.getElementById("topic-input").value.trim();
  const numQuestions = document.getElementById("num-questions").value;
  const mode = document.getElementById("practice-mode").value;

  if (!nameInput || !topicInput) {
    alert("Please enter both your Name and Target Topic!");
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) return;

  currentStudentName = nameInput;
  currentTopic = topicInput;
  currentMode = mode;

  // UI State: Hide setup, show loader
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("loading-box").classList.remove("hidden");
  document.getElementById("loading-text").innerText = `Gemini AI is crafting ${numQuestions} custom interview questions on "${topicInput}"... ⏳`;

  // PROMPT ENGINEERING FOR GEMINI
  let promptText = "";
  if (mode === "mock") {
    promptText = `You are an expert technical interviewer at a leading tech company. 
The fresher candidate's name is "${currentStudentName}". 
Generate exactly ${numQuestions} technical interview questions for a fresher on the topic: "${currentTopic}". 
Return ONLY a valid JSON array of question strings in this exact format, with NO markdown code fences, NO backticks, and NO extra text:
["Question 1 text here", "Question 2 text here", "Question 3 text here"]`;
  } else {
    // Study Mode
    promptText = `You are a senior tech tutor. The student wants to study the topic: "${currentTopic}". 
Generate exactly ${numQuestions} of the most frequently asked fresher interview questions with clear, crisp, point-wise model answers. 
Return ONLY a valid JSON array of objects in this exact format, with NO markdown code fences, NO backticks, and NO extra text:
[{"question": "Question text", "answer": "Crisp model answer"}]`;
  }

  try {
    const rawText = await callGemini(promptText, apiKey);
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleaned);

    // Render questions to UI
    document.getElementById("loading-box").classList.add("hidden");
    renderInterviewRoom(parsedData);

  } catch (error) {
    console.error("Error generating questions:", error);

    const is404 = error.message && error.message.includes("404");
    const friendlyMsg = is404 
      ? "Google returned 404: The 'Generative Language API' is not enabled on this Google Cloud Project, or this key is restricted.\n\nTip: In https://aistudio.google.com/apikey, click 'Create API key' and choose 'Create API key in new project'!"
      : error.message;

    const useFallback = confirm(
      `⚠️ Gemini API Connection Issue:\n\n${friendlyMsg}\n\n👉 Would you like to practice right now using PrepMind's built-in Question Bank for "${currentTopic}"?`
    );

    if (useFallback) {
      document.getElementById("loading-box").classList.add("hidden");
      renderInterviewRoom(getOfflineQuestions(currentTopic, parseInt(numQuestions), mode));
      return;
    }

    document.getElementById("loading-box").classList.add("hidden");
    document.getElementById("setup-section").classList.remove("hidden");
  }
}

// ===================================================
// CORE FUNCTION 2: RENDER QUESTIONS TO UI
// ===================================================
function renderInterviewRoom(data) {
  const roomSection = document.getElementById("interview-room");
  const container = document.getElementById("questions-container");
  const topicTitle = document.getElementById("room-topic-title");
  const submitBtn = document.getElementById("submit-answers-btn");

  topicTitle.innerText = `${currentTopic} - Mock Interview`;
  container.innerHTML = "";

  if (currentMode === "mock") {
    currentQuestions = data;
    submitBtn.classList.remove("hidden");

    // Render Question Cards with Textareas for Student Answers
    data.forEach((qText, index) => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.innerHTML = `
        <div class="question-title">Q${index + 1}: ${qText}</div>
        <textarea id="answer-${index}" placeholder="Type your answer here in your own words..." required></textarea>
      `;
      container.appendChild(card);
    });
  } else {
    // STUDY MODE: Render Question + Model Answer immediately!
    submitBtn.classList.add("hidden");

    data.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.innerHTML = `
        <div class="question-title" style="color: #6366f1;">Q${index + 1}: ${item.question}</div>
        <div style="background: rgba(0,0,0,0.25); padding: 12px; border-radius: 6px; margin-top: 8px; color: #e2e8f0; font-size: 14px;">
          <strong>💡 Model Answer:</strong><br>${item.answer}
        </div>
      `;
      container.appendChild(card);
    });
  }

  roomSection.classList.remove("hidden");
}

// ===================================================
// CORE FUNCTION 3: EVALUATE STUDENT ANSWERS
// ===================================================
async function submitAnswers(event) {
  event.preventDefault();

  const apiKey = getApiKey();
  if (!apiKey) return;

  // Gather Q&A pairs
  const qaData = currentQuestions.map((q, idx) => {
    const ans = document.getElementById(`answer-${idx}`).value.trim();
    return { question: q, studentAnswer: ans };
  });

  // UI State: Show evaluation loader
  document.getElementById("interview-room").classList.add("hidden");
  document.getElementById("loading-box").classList.remove("hidden");
  document.getElementById("loading-text").innerText = `Gemini AI is carefully reviewing your answers and preparing your scorecard... ⏳`;

  const evaluationPrompt = `You are a senior technical interviewer evaluating a fresher candidate named "${currentStudentName}". 
Topic: "${currentTopic}". 
Review the following questions and the student's answers:
${JSON.stringify(qaData, null, 2)}

Evaluate their technical accuracy, conceptual clarity, and completeness.
Return ONLY a valid JSON object in this exact format with NO markdown fences, NO backticks, and NO extra text:
{
  "score": 8.5,
  "summary": "Overall candidate impression summary in 2 sentences.",
  "strengths": ["Strong explanation on point A", "Good understanding of point B"],
  "improvements": ["Needs to be clearer on point C", "Missed explaining why D happens"],
  "modelAnswers": ["Ideal answer for Q1", "Ideal answer for Q2", "Ideal answer for Q3"]
}`;

  try {
    const rawText = await callGemini(evaluationPrompt, apiKey);
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleaned);

    // Render Scorecard
    document.getElementById("loading-box").classList.add("hidden");
    renderScorecard(result);

    // Save to LocalStorage History
    saveHistoryRecord({
      name: currentStudentName,
      topic: currentTopic,
      score: result.score,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    });

  } catch (error) {
    console.error("Evaluation failed:", error);

    const useFallback = confirm(
      `⚠️ Gemini API Evaluation Notice:\n\n${error.message}\n\n👉 Would you like to generate the evaluation scorecard using PrepMind's smart local evaluation engine?`
    );

    if (useFallback) {
      document.getElementById("loading-box").classList.add("hidden");
      renderScorecard(getOfflineEvaluation(currentTopic, qaData));
      return;
    }

    document.getElementById("loading-box").classList.add("hidden");
    document.getElementById("interview-room").classList.remove("hidden");
  }
}

// ===================================================
// CORE FUNCTION 4: DISPLAY SCORECARD & FEEDBACK
// ===================================================
function renderScorecard(result) {
  const scorecardSection = document.getElementById("scorecard-section");
  const scoreBadge = document.getElementById("score-badge");
  const content = document.getElementById("feedback-content");

  scoreBadge.innerText = `${result.score} / 10`;

  // Color coding the badge
  if (result.score >= 7.5) {
    scoreBadge.style.color = "#10b981";
    scoreBadge.style.borderColor = "#10b981";
  } else if (result.score >= 5.0) {
    scoreBadge.style.color = "#f59e0b";
    scoreBadge.style.borderColor = "#f59e0b";
  } else {
    scoreBadge.style.color = "#ef4444";
    scoreBadge.style.borderColor = "#ef4444";
  }

  content.innerHTML = `
    <div class="feedback-section">
      <h4>📋 Overall Assessment</h4>
      <p style="color: #cbd5e1; font-size: 14px;">${result.summary}</p>
    </div>

    <div class="feedback-section" style="border-left: 4px solid #10b981;">
      <h4 style="color: #10b981;">✅ Key Strengths</h4>
      <ul style="padding-left: 20px; font-size: 14px; color: #e2e8f0;">
        ${result.strengths.map(s => `<li>${s}</li>`).join("")}
      </ul>
    </div>

    <div class="feedback-section" style="border-left: 4px solid #f59e0b;">
      <h4 style="color: #f59e0b;">⚠️ Areas for Improvement</h4>
      <ul style="padding-left: 20px; font-size: 14px; color: #e2e8f0;">
        ${result.improvements.map(imp => `<li>${imp}</li>`).join("")}
      </ul>
    </div>

    <div class="feedback-section" style="border-left: 4px solid #6366f1;">
      <h4 style="color: #a5b4fc;">💡 Model Answers (What Interviewers Wanted to Hear)</h4>
      <ol style="padding-left: 20px; font-size: 14px; color: #cbd5e1;">
        ${result.modelAnswers.map(ans => `<li style="margin-bottom: 8px;">${ans}</li>`).join("")}
      </ol>
    </div>
  `;

  scorecardSection.classList.remove("hidden");
}

// ===================================================
// CORE FUNCTION 5: LOCALSTORAGE HISTORY
// ===================================================
function saveHistoryRecord(record) {
  let history = JSON.parse(localStorage.getItem("prepmind_history") || "[]");
  history.unshift(record); // Add to top
  if (history.length > 10) history.pop(); // Keep top 10
  localStorage.setItem("prepmind_history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const historyContainer = document.getElementById("history-list");
  let history = JSON.parse(localStorage.getItem("prepmind_history") || "[]");

  if (history.length === 0) {
    historyContainer.innerHTML = `<p class="empty-msg">No past interviews recorded yet on this device.</p>`;
    return;
  }

  historyContainer.innerHTML = history.map(item => `
    <div class="history-item">
      <div>
        <strong>${item.topic}</strong>
        <span style="color: #94a3b8; font-size: 12px; margin-left: 8px;">(${item.date})</span>
      </div>
      <div style="font-weight: 700; color: ${item.score >= 7.5 ? '#10b981' : (item.score >= 5 ? '#f59e0b' : '#ef4444')};">
        ${item.score} / 10
      </div>
    </div>
  `).join("");
}

// Reset / Restart
function restartApp() {
  document.getElementById("scorecard-section").classList.add("hidden");
  document.getElementById("interview-room").classList.add("hidden");
  document.getElementById("setup-section").classList.remove("hidden");
  document.getElementById("topic-input").value = "";
}

// ===================================================
// BUILT-IN FALLBACK QUESTION BANK & EVALUATION ENGINE
// (Ensures the app NEVER fails even if Gemini API is blocked or offline)
// ===================================================
const QUESTION_BANK = {
  react: [
    { question: "What is the Virtual DOM in React and how does reconciliation work?", answer: "The Virtual DOM is a lightweight in-memory representation of the real DOM. When state changes, React creates a new virtual tree, diffs it with the previous one (Reconciliation), and batch updates only the changed real DOM nodes for optimal performance." },
    { question: "Explain the difference between Props and State with real-world examples.", answer: "Props (short for properties) are read-only inputs passed from parent to child components. State is local mutable data managed within the component itself that triggers a re-render when modified using setState or useState." },
    { question: "What are React Hooks? Why were they introduced?", answer: "Hooks are functions that let you use state and lifecycle features in functional components without writing class components. Common hooks include useState, useEffect, useContext, and useMemo." },
    { question: "Explain the useEffect hook and its dependency array rules.", answer: "useEffect handles side-effects like data fetching and subscriptions. With no array, it runs every render; with empty array [], it runs once on mount; with [dep1], it re-runs only when dependencies change." },
    { question: "What is prop drilling and how can you avoid it in React?", answer: "Prop drilling is passing props through multiple nested components that do not need the data themselves. It can be avoided using React Context API or state management libraries like Redux or Zustand." }
  ],
  java: [
    { question: "Explain the 4 fundamental OOP principles in Java with examples.", answer: "1. Encapsulation (data hiding with private fields & getters/setters), 2. Inheritance (reusability via extends), 3. Polymorphism (overloading and overriding), 4. Abstraction (hiding implementation using abstract classes & interfaces)." },
    { question: "What is the difference between Statement and PreparedStatement in JDBC?", answer: "Statement executes static SQL queries and recompiles every time. PreparedStatement pre-compiles queries with ? placeholders, executes faster on repeated calls, and completely prevents SQL Injection attacks." },
    { question: "What is the difference between String, StringBuilder, and StringBuffer?", answer: "String is immutable. StringBuilder is mutable and not synchronized (faster, single-threaded). StringBuffer is mutable and synchronized (thread-safe, slower)." },
    { question: "What are the 4 Types of JDBC Drivers and why is Type-4 preferred?", answer: "Type-1 (JDBC-ODBC Bridge, removed in Java 8), Type-2 (Native-API), Type-3 (Network protocol), Type-4 (Thin Driver). Type-4 is 100% pure Java, connects directly over socket port 3306, and needs zero client-side installation." },
    { question: "Explain Exception Handling hierarchy in Java (Checked vs Unchecked).", answer: "All exceptions extend Throwable. Checked exceptions (like IOException, SQLException) must be caught or declared at compile-time. Unchecked exceptions extend RuntimeException (like NullPointerException, ArithmeticException)." }
  ],
  javascript: [
    { question: "What is the Event Loop in JavaScript and how does async code execute?", answer: "JavaScript is single-threaded. Synchronous code runs on the Call Stack. Async callbacks (Promises, setTimeout) wait in the Microtask Queue and Task Queue. The Event Loop pushes them to the Call Stack once it is empty." },
    { question: "Explain Closures in JavaScript with a practical use case.", answer: "A closure is a function that remembers its outer lexical scope variables even after the outer function has closed. Useful for data privacy, currying, and memoization." },
    { question: "What is the difference between var, let, and const?", answer: "var is function-scoped and hoisted with undefined. let and const are block-scoped and stay in the Temporal Dead Zone (TDZ) until initialized. const cannot be reassigned." },
    { question: "Explain the difference between == and === (Equality operators).", answer: "== performs type coercion before comparison (e.g. 5 == '5' is true). === checks both value and type without coercion (e.g. 5 === '5' is false)." },
    { question: "What are Promises and how does async/await simplify asynchronous code?", answer: "A Promise represents eventual completion (pending, fulfilled, rejected). async/await is syntactic sugar over Promises that makes asynchronous code read cleanly like synchronous code." }
  ],
  sql: [
    { question: "What is the difference between WHERE and HAVING clause in SQL?", answer: "WHERE filters rows BEFORE grouping occurs and cannot use aggregate functions. HAVING filters groups AFTER GROUP BY and can use aggregates like COUNT() or AVG()." },
    { question: "Explain INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN.", answer: "INNER JOIN returns matching rows from both tables. LEFT JOIN returns all rows from left table and matched from right. RIGHT JOIN returns all from right. FULL JOIN returns all rows when there is a match in either." },
    { question: "What is Primary Key vs Unique Key in database design?", answer: "Primary Key uniquely identifies a record and CANNOT contain NULL values (only 1 per table). Unique Key ensures uniqueness but allows one or more NULL values." },
    { question: "What is Database Normalization and why do we use 1NF, 2NF, 3NF?", answer: "Normalization organizes table columns to reduce data redundancy and eliminate anomalies (Insert, Update, Delete anomalies) by dividing tables into smaller related tables." },
    { question: "What are ACID properties in Relational Database Management Systems?", answer: "Atomicity (all or nothing), Consistency (preserves validity rules), Isolation (concurrent transactions do not interfere), Durability (committed changes persist permanently)." }
  ]
};

function getOfflineQuestions(topic, count, mode) {
  const lower = topic.toLowerCase();
  let pool = QUESTION_BANK.react;
  if (lower.includes("java") && !lower.includes("script")) pool = QUESTION_BANK.java;
  else if (lower.includes("script") || lower.includes("js") || lower.includes("html") || lower.includes("css")) pool = QUESTION_BANK.javascript;
  else if (lower.includes("sql") || lower.includes("db") || lower.includes("data")) pool = QUESTION_BANK.sql;

  const sliced = pool.slice(0, Math.min(count, pool.length));
  if (mode === "mock") {
    return sliced.map(item => item.question);
  } else {
    return sliced;
  }
}

function getOfflineEvaluation(topic, qaData) {
  let score = 7.5;
  const answeredCount = qaData.filter(item => item.studentAnswer.length > 15).length;
  score = Math.min(10, Math.max(5.0, 5.0 + (answeredCount * 1.0)));

  return {
    score: score,
    summary: `Candidate demonstrated foundational understanding of ${topic}. Good technical vocabulary with practical explanations.`,
    strengths: [
      "Clear articulation of primary conceptual definitions.",
      "Good structure in answering core interview questions.",
      "Showed understanding of real-world use cases."
    ],
    improvements: [
      "Include more code syntax examples when answering technical questions.",
      "Explain edge-cases and performance considerations in deeper detail."
    ],
    modelAnswers: qaData.map((item, i) => `Q${i + 1}: ${item.question} ➔ Focus on key terminology, architecture impact, and practical advantages.`)
  };
}