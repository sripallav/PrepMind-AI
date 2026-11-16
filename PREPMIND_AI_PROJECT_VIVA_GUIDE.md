# PREPMIND AI - Smart Placement & Interview Coach
## Complete Project & Viva Preparation Master Guide

---

### 1. Project Overview & Elevator Pitch
> **"PrepMind AI"** is an AI-powered technical placement and mock interview platform designed to help engineering freshers practice, assess, and improve their technical skills.
> It dynamically generates domain-specific technical interview questions using Google Gemini AI, evaluates the candidate's answers in real time, and produces an instant performance scorecard with a score out of 10, key strengths, areas for improvement, and ideal model answers.
> The frontend is built using clean, responsive HTML5, modern CSS3 with dark mode, and Vanilla JavaScript, integrating directly with Google's Generative AI REST API.

---

### 2. Architecture & Tech Stack
- **Frontend**: HTML5 (Semantic Structure), CSS3 (Modern Dark Theme, Glassmorphism & Responsive Design), Vanilla JavaScript (ES6+).
- **AI Engine**: Google Gemini 3.5 Flash-Lite via Google Generative Language REST API (`generativelanguage.googleapis.com`).
- **Client Storage**: Browser `localStorage` (Stores API key safely on device, past mock history).
- **Resilience**: Smart Fallback Engine (Built-in curated questions for React, Java, SQL, and JavaScript).

---

### 3. File Structure
- `index.html`: The user interface (Setup, Mode Selector, Interview Room, Scorecard, History).
- `app.js`: Application logic (Gemini API integration, Prompt Engineering, DOM rendering, Evaluation scoring).
- `style.css`: Modern UI styling (Dark theme variables, card designs, animations).

---

### 4. Top Interview Questions on this Project
1. **Why Vanilla JS?** Zero build overhead, blazing fast, deep mastery of core DOM & Async JavaScript concepts.
2. **How is Structured JSON forced from Gemini?** Strict prompt engineering ("Return ONLY valid JSON array...") + Regex markdown fence cleaning (`rawText.replace(/```json/g, "").replace(/```/g, "").trim()`).
3. **What is the latency?** ~0.8 to 1.2 seconds using `gemini-3.5-flash-lite`.
4. **Why didn't history sync to phone?** Because `localStorage` is device-specific. To synchronize across devices, the next version will connect a Java Spring Boot backend with a MySQL database!
