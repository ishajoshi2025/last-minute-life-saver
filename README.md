# ⚡ Last-Minute Life Saver

> **The AI-powered productivity companion that proactively plans, prioritizes, and gets you across the finish line — before the deadline does.**

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Google Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=flat-square&logo=google)
![Deployed on Google Cloud](https://img.shields.io/badge/Deployed%20on-Google%20Cloud-34A853?style=flat-square&logo=googlecloud)
![Hackathon](https://img.shields.io/badge/Vibe2Ship-Hackathon%202026-purple?style=flat-square)

---

## 🧠 What Is This?

Most productivity apps remind you about deadlines. **Last-Minute Life Saver** helps you *beat* them.

You tell the app what you need to do, when it's due, and how much energy you have. An AI agent breaks your task into 15-minute micro-steps, monitors your progress in real time, re-plans around blockers, nudges you when you go idle, and adapts its entire personality to your preferred coaching style — all without you lifting a finger.

It's not a to-do list. It's an agentic productivity companion.

---

## ✨ Features

### 🤖 Core AI Engine
- **Energy-Aware Plan Generation** — Gemini acts as an elite productivity coach and generates a structured, 15-minute micro-task execution plan tailored to your current energy level (1–10)
- **Google Search Grounding** — Gemini searches the web in real time to weave relevant resources, tutorials, and references directly into your plan

### ♻️ Agentic Feedback Loops
- **Living Checklist + Auto Re-Plan** — Check off a task or mark one as blocked, and an AI agent instantly regenerates the remaining plan around your progress — a true agentic loop
- **Drift Detector Agent** — A background agent monitors your mouse, keyboard, and touch activity. Go idle for 5 minutes and it automatically calls Gemini, generates a personalized motivational nudge, and reads it aloud via the Web Speech API
- **"Ask Your Plan" Chat** — A conversational agent that knows your specific plan. Ask it anything: "simplify step 3", "what if I only have 20 minutes?", "I hate task 4, give me an alternative"

### 📷 Multimodal Input
- **Gemini Vision: Photo-to-Tasks** — Snap a photo of your assignment sheet, whiteboard, or handwritten notes. Gemini reads the image and auto-fills your task description
- **Voice Input** — Click the mic, speak your task out loud. The Web Speech API transcribes it and Gemini cleans and structures it automatically

### 📊 Live Intelligence
- **Deadline Danger Risk Score** — A live 0–100 completion probability gauge that recalculates in real time based on hours left, tasks done, blocks hit, and energy level
- **Cost of Procrastination Counter** — A ticking live counter: "You've spent X minutes not working. That's Y micro-tasks you could have finished"
- **Dynamic Deadline Themes** — The app's entire colour scheme shifts automatically as the deadline approaches: calm blue → amber alert → critical red
- **Multi-Deadline War Room** — Manage multiple active deadlines simultaneously with a mission sidebar and AI-powered prioritisation advisor

### 📅 Productivity Tools
- **Google Calendar Export** — One click to export any task to Google Calendar using the Calendar URL API, or download a complete `.ics` file for all tasks
- **Zen Focus Mode** — Full-screen, distraction-free view of a single micro-task with a 15-minute countdown timer
- **"The Negotiator"** — When your risk score drops critically low, AI drafts a professional, believable extension request email addressed to your professor, manager, or client
- **Shareable Battle Card** — Generates a downloadable 1080×1080 PNG summary of your plan — the Spotify Wrapped of deadlines

### 🎨 Personalization
- **7 Visual Themes** — Complete personality overhauls that change colours, fonts, border radii, and button shapes:
  - 🌙 Midnight (default dark hacker)
  - 💪 Beast Mode (aggressive gym energy, Barlow Condensed font, 0px radius)
  - 👑 Royale (gold & luxury, Playfair Display serif, italic headings)
  - 🌸 Sakura (kawaii dark pink, Nunito font, pill-shaped everything)
  - ⛏️ Pixelcraft (8-bit retro, VT323 monospace, zero border radius, pixel borders)
  - 💼 Hustle (CEO energy, DM Sans, clean navy)
  - 🌿 Vitality (health & wellness, Nunito, forest green)
- **Supportive vs. Savage AI Persona** — Toggle between a warm, encouraging coach and a brutally honest drill sergeant who will roast you for procrastinating

### 🖌️ Design & Accessibility
- **Ambient Theme Backgrounds** — Each of the 7 themes has its own CSS/SVG-generated background texture (soft glows, diagonal hazard lines, gold damask, petal blooms, pixel grids) tuned to that theme's mood — zero external image requests, so load time stays instant
- **WCAG-Aware Legibility Pass** — Text contrast, font pairing, and sizing were independently tuned per theme so every theme stays readable, not just stylish — e.g. Royale's display-serif headings pair with a more legible body serif, and Pixelcraft's retro font is scaled up for actual readability

### 🎉 Engagement & Retention
- **Confetti + AI Win Message** — Complete all tasks and a canvas-confetti burst fires with a personalised Gemini-generated celebration message
- **Auto-Save** — Full app state (tasks, plan, deadline, theme) persists across browser refreshes via localStorage
- **Restore Banner** — On reload, a notification confirms your plan was recovered

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| AI Engine | Google Gemini 1.5 Flash (`@google/genai`) |
| Voice I/O | Web Speech API (browser-native) |
| Canvas | HTML Canvas API (battle card generation) |
| Animations | canvas-confetti |
| Storage | localStorage (no backend required) |
| Deployment | Google Cloud via AI Studio |

---

## 🌐 Google Technologies Used

| Technology | How It's Used |
|---|---|
| **Google Gemini 1.5 Flash** | Plan generation, re-planning, nudges, chat, vision extraction, win messages, negotiator emails, battle card taglines |
| **Gemini Vision (Multimodal)** | Reading uploaded assignment photos and extracting task descriptions |
| **Google Search Grounding** | Gemini searches the web in real time to add current resources to plans |
| **Google Gemini SDK** (`@google/genai`) | All Gemini API integrations |
| **Google Calendar URL API** | No-auth one-click event creation |
| **Google AI Studio** | App deployment on Google Cloud |
| **Google Antigravity** | AI-powered coding agent used to build the entire application |
| **Google Fonts** | 5 font families loaded for the 7-theme system (Inter, Barlow Condensed, Playfair Display, Nunito, DM Sans, VT323) |

---

## 🔒 Security & Reliability

- **No client-exposed secrets** — `GEMINI_API_KEY` is read exclusively inside server-side API routes (`app/api/.../route.ts`) via `process.env`. It is never prefixed with `NEXT_PUBLIC_` and never reaches the browser bundle.
- **Rate limiting on every AI endpoint** — A lightweight in-memory sliding-window limiter protects all nine Gemini-backed routes against request flooding.
- **Server-side input validation** — All text and image inputs are length/size-checked before being forwarded to Gemini, preventing oversized or malformed payloads.
- **Safe content rendering** — AI-generated text is rendered through React's default escaping rather than raw HTML injection, avoiding XSS from model output.
- **Generic error responses** — Internal error details and stack traces are never surfaced to the client; only safe, user-facing messages are returned.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- A Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/last-minute-life-saver.git
cd last-minute-life-saver

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Add your API key to `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌍 Live Demo

🔗 **[Try it live →](YOUR_DEPLOYED_URL_HERE)**

---

## 🏆 Hackathon

Built for **Vibe2Ship 2026** — Google for Developers × Coding Ninjas

- **Problem Statement:** #1 — The Last-Minute Life Saver
- **Track:** AI-powered productivity
- **Built with:** Google Gemini, Google Antigravity, Google AI Studio

---

## 📁 Project Structure

---

## 👤 Author

Built by a first-time hackathon participant who learned to vibe-code an entire production app in 48 hours using AI tools. Proof that motivation + the right tools beats years of experience.

---

*Made with ⚡ and a lot of last-minute energy*
