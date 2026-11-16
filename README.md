# PrepMind AI — Smart Placement & Technical Mock Interview Platform

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Google Gemini API](https://img.shields.io/badge/Google%20Gemini-API-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An intelligent, interactive technical mock interview simulator built with Vanilla JavaScript, HTML5, and CSS3 that dynamically generates fresher placement questions across multiple software engineering stacks and evaluates candidate answers in real time using the Google Gemini API.

---

## 🌟 Key Features

- **Dynamic Role-Based Question Generation:** Generates real-time interview questions for Java Full Stack, Frontend (HTML/CSS/JS), Database & SQL, Core CS (OOPs, DBMS, OS), and Python.
- **Asynchronous AI Integration:** Leverages Google Gemini API (`gemini-3.5-flash-lite`) via asynchronous `fetch` calls with structured prompt engineering.
- **Automated Scorecard & Evaluation:** Evaluates candidate answers on clarity, technical accuracy, and completeness, producing an instant rating (0 to 10), identified strengths, actionable improvement tips, and ideal model answers.
- **Offline Fallback Question Bank:** Seamlessly serves curated placement questions if API rate limits or network issues occur.
- **Persistent LocalStorage State:** Retains candidate session scorecards and past mock interview histories locally without requiring backend database configuration.
- **Privacy-First API Key Management:** Gemini API keys are safely maintained on the client browser via `localStorage` and never hardcoded or transmitted to third-party servers.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+, Async/Await, DOM Manipulation), HTML5, CSS3 (Modern Flexbox/Grid, Dark Mode UI)
- **AI Engine:** Google Gemini API (`v1beta` / `v1`)
- **Storage:** Browser `localStorage`

---

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sripallav/PrepMind-AI.git
   cd PrepMind-AI
   ```

2. **Open in Browser:**
   - Simply double-click `index.html` or open it with Live Server in VS Code.

3. **Provide API Key:**
   - On first question generation, enter your free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).
   - The key is securely stored in your browser's `localStorage`.

---

## 👨‍💻 Author

**Sripallav Yerram**  
- GitHub: [@sripallav](https://github.com/sripallav)  
- LinkedIn: [linkedin.com/in/yerram-sripallav](https://linkedin.com/in/yerram-sripallav-bb976525b)  
- Email: sripallav85@gmail.com
