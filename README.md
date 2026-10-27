# ⚡ RAJGPT

A modern, full-stack AI web application engineered to look, feel, and perform like a flagship AI platform. Built with **React + Vite** on the frontend, **Python + FastAPI + SQLite** on the backend, and powered by the **Google Gemini API** (`gemini-3-flash-preview` / `gemini-3.8-flash` / `gemini-3.5-flash`).

Designed and built by **Rajamani**.

---

## 🌟 Key Features

- **⚡ Lightning-Fast Streaming**: Real-time server-sent events (SSE) token streaming (<1.5s first-token latency) using Google's modern `google-genai` SDK.
- **🕒 Real-Time Temporal Grounding**: Dynamically aware of the exact current date, time, year, and day of the week—never trapped in outdated training cutoffs.
- **🌐 Live Web Search Grounding**: Automatically retrieves real-time search snippets for breaking news, live scores, stock prices, and current events without requiring paid search API keys.
- **🔐 Multi-Method Authentication**:
  - **Google Sign-In**: One-click Google authentication with user profile synchronization.
  - **Mobile Phone OTP**: International phone support with 6-digit verification code, countdown timer, and simulated SMS message notification banner.
  - **Guest Mode**: Instant exploration without mandatory login.
- **👤 Account-Scoped Conversations**: Strictly isolates chat histories so logged-in users only see conversations created under their account, while guest chats remain segregated.
- **🧠 Full Multi-Turn Conversation Memory**: Maintains full conversational context across multi-turn exchanges with automatic title generation.
- **🎨 Refined ChatGPT-Grade UI**: A distraction-free dark interface with 30 common AI-generated tells systematically eliminated.
- **📝 Markdown & Code Highlighting**: Syntax-highlighted code blocks with language indicators, one-click copy controls, tables, and formatted lists.
- **⚙️ In-App Settings & Customization**: Configure custom system prompts, manage your Gemini API key, switch AI models, and export chat histories to Markdown.

---

## 🎨 Design Philosophy: 30 AI Tells Avoided

RAJGPT avoids the generic, synthetic aesthetic common to boilerplate AI templates:

| # | Common AI-Generated Tell | How It Was Solved in RAJGPT |
|---|---------------------------|-----------------------------|
| 1 | **Harsh gradients** | Replaced with solid, authentic dark surfaces (`#212121` main, `#171717` sidebar, `#2f2f2f` chat bubbles). |
| 2 | **Pure white backgrounds** | Standardized on balanced dark mode contrast (`#ececec` text, `#b4b4b4` secondary). |
| 3 | **Rainbow coloring** | Eliminated rainbow palettes. Neutral charcoal tones with subtle emerald green (`#10a37f`) accents. |
| 4 | **Heavy drop shadows** | Replaced heavy shadows with crisp 1px borders (`#2e2e2e`, `#383838`). |
| 5 | **Liquid glass effects** | Removed blurry frosted glass in favor of clean, solid UI surfaces. |
| 6 | **Purple and black schemes** | Avoided stereotypical neon purple/black palettes; used natural zinc slate neutrals. |
| 7 | **Radial glowing orbs** | Zero glowing light blobs or floating orb animations. |
| 8 | **Neon colors** | Zero high-saturation neon greens, cyans, or magentas. |
| 9 | **Basic pastel colors** | Used authentic, muted monochrome shades. |
| 10 | **Default Lucide icons** | Replaced with custom, handcrafted SVG icons matching authentic ChatGPT geometry and stroke weights. |
| 11 | **Emojis used as icons** | Zero emojis used as UI buttons or navigation icons. |
| 12 | **Default Inter / Geist fonts** | Native OS system font stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`) for native rendering. |
| 13 | **Sparkle icons (`✨`)** | Completely avoided sparkle icons. |
| 14 | **Animated arrows** | Used static, clean direction indicators. |
| 15 | **Hover animations on everything** | Removed float/bounce effects; only snappy 100ms background transitions on interactive elements. |
| 16 | **Three feature cards in a row** | Replaced with ChatGPT-style 2x2 prompt starter cards. |
| 17 | **Colored left stripes on cards** | Completely absent. |
| 18 | **Bento grids** | Completely absent. |
| 19 | **Terminal window mockups** | Real markdown code blocks with real copy buttons and syntax highlighting. |
| 20 | **Three pricing tiers** | Completely absent. Designed as a real AI workspace, not a marketing funnel. |
| 21 | **Generic soft rounded corners** | Balanced, deliberate border radii (8px for buttons/cards, 24px for chat input capsule). |
| 22 | **Dot grid backgrounds** | Completely solid, distraction-free neutral backgrounds. |
| 23 | **Em dashes (`—`)** | Replaced with natural, clean phrasing. |
| 24 | **"It's not X, it's Y" copy** | Removed all artificial marketing copy. |
| 25 | **Checkmark bullet lists** | No marketing checkmarks. |
| 26 | **Fake testimonials** | Completely absent. |
| 27 | **Missing real product demos** | Fully functional application with SQLite database persistence, streaming SSE, and multi-turn Gemini reasoning. |
| 28 | **Missing skeleton loaders** | Added skeleton pulse loaders for sidebar conversation lists and pending model responses. |
| 29 | **Missing Terms of Service** | Comprehensive, readable Terms of Service modal accessible directly from the user menu. |
| 30 | **Missing Privacy Policy** | Comprehensive Privacy Policy modal explaining local SQLite data retention and Gemini API handling. |

---

## 🏗️ Architecture & Project Structure

```
RajGpt/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── gemini_service.py   # Gemini AI streaming, temporal grounding & web search
│   │   │   └── sms_service.py      # SMS OTP dispatch (Twilio, Fast2SMS, Simulator)
│   │   ├── database.py             # SQLite engine & session management
│   │   ├── main.py                 # FastAPI application, auth endpoints & chat routes
│   │   ├── models.py               # SQLAlchemy ORM models (User, Conversation, Message)
│   │   └── schemas.py              # Pydantic request/response schemas
│   ├── .env.example                # Sample environment variables
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInput.jsx       # Autosizing input with stop/send controls
│   │   │   ├── EmptyState.jsx      # Clean landing view with prompt starter cards
│   │   │   ├── Header.jsx          # Top navigation & model selector dropdown
│   │   │   ├── Icons.jsx           # Handcrafted SVG icons
│   │   │   ├── LegalPages.jsx      # Terms of Service & Privacy Policy modals
│   │   │   ├── LoginPage.jsx       # Google Sign-In & Phone OTP verification
│   │   │   ├── MessageItem.jsx     # Markdown renderer with Highlight.js code blocks
│   │   │   ├── SettingsModal.jsx   # API key and model configuration modal
│   │   │   ├── Sidebar.jsx         # Conversation history, search & user profile
│   │   │   └── SystemPromptModal.jsx # Custom system prompt editor
│   │   ├── api.js                  # Frontend API client
│   │   ├── App.jsx                 # Main application state & routing
│   │   ├── index.css               # Global dark-theme styles
│   │   └── main.jsx                # Application root entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**
- A **Google Gemini API Key** ([Get a free key here](https://aistudio.google.com/))

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be running at `http://127.0.0.1:8000` (API documentation at `http://127.0.0.1:8000/docs`).

---

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```

Visit **http://127.0.0.1:5173** in your browser.

---

## 🔑 Configuration

You can configure your settings in two ways:

1. **Directly in the Web UI**:
   - Click your profile avatar at the bottom-left of the sidebar.
   - Select **Settings**.
   - Enter your **Gemini API Key**, select your default model, and click **Save Settings**.
   - These settings persist securely in the SQLite database.

2. **Via `backend/.env`**:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   DEFAULT_MODEL=gemini-3-flash-preview
   DATABASE_URL=sqlite:///./chatgpt.db
   ```

---

## 🛠️ Supported Gemini Models

| Model | ID | Description |
|---|---|---|
| **Gemini 3 Flash** *(Default)* | `gemini-3-flash-preview` | Ultra-fast, low-latency (<1.5s) responses with real-time temporal and web grounding. |
| **Gemini 3.8 Flash** | `gemini-3.8-flash` | Flagship reasoning model with automatic graceful fallback if servers are busy. |
| **Gemini 3.5 Flash** | `gemini-3.5-flash` | Balanced high-performance model for complex instructions. |

---

## 👤 Author & Credits

- **Developer**: [Rajamani](https://github.com/rm934022-bit)
- **Repository**: [https://github.com/rm934022-bit/RajGpt](https://github.com/rm934022-bit/RajGpt)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
