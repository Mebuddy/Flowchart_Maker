# Flowcraft — AI-Powered Text-to-Flowchart Web App

Flowcraft is a web application that transforms natural-language descriptions into real, interactive, and editable flowcharts. Powered by Google Gemini (`gemini-3.8-flash`), Next.js App Router, `@xyflow/react` (React Flow), and `elkjs` automatic layered layout.

---

## Features

- **Text-to-Flowchart Generation**: Converts natural descriptions into structured, directed graphs with start/end terminators, processes, decision diamonds with labelled branches (Yes/No, True/False), loops, and database/document shapes.
- **ELK.js Layered Layout**: Automatic directed graph layout preserving loops, feedback cycles, and branch hierarchies (supporting both Top-to-Bottom and Left-to-Right orientations).
- **Interactive Studio**:
  - Drag-and-drop node movement and handle connections.
  - Quick-add toolbar for standard flowchart symbols (Start, Process, Decision, I/O, Subprocess, Document, Database, End).
  - Multi-level Undo & Redo (with `Ctrl+Z` / `Ctrl+Y`).
  - Viewport zoom, pan, fit-to-view, and minimap.
  - Interactive Inspector to modify node labels, shapes, technical descriptions, and edge branch conditions.
- **Semantic Analysis & Assumptions**: Displays model assumptions and semantic health checks (unreachable nodes, incomplete branches, missing endpoints).
- **Multi-Format Export**:
  - High-Resolution PNG (`html-to-image` at 2x pixel ratio).
  - Scalable Vector Graphics (SVG).
  - Mermaid Flowchart (`.mmd` syntax).
  - Flowcraft Project JSON (full fidelity).
- **Persistence & Versioning**: Automatic debounced `localStorage` persistence, project duplication, renaming, and JSON project import/export.
- **Security & Single-Owner Gate**: Constant-time password verification, signed JWT session cookies (`jose`), and server-side authorization on protected API routes.

---

## 1. Prerequisites

- **Node.js**: `v18.18.0` or higher (Node 20+ or 24+ recommended).
- **npm**: `v9.0.0` or higher.
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

---

## 2. Installing Dependencies

Clone the repository and install packages:

```bash
git clone https://github.com/<your-username>/flowcraft.git
cd flowcraft
npm install
```

---

## 3. Obtaining a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** and create a key in a new or existing Google Cloud project.
4. Copy the API key for use in your environment.

---

## 4. Configuring `.env.local`

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Populate the required configuration variables:

```env
# Required: Google Gemini API key (server-side only)
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# Optional: Gemini model override (defaults to gemini-3.8-flash)
GEMINI_MODEL=gemini-3.8-flash

# Required for Single-Owner Password Gate (Optional in development, required in production)
APP_ACCESS_PASSWORD=choose_a_strong_password

# Required: 32+ character secret for signing session cookies
APP_SESSION_SECRET=create_a_random_32_character_string_here
```

> **Note**: In local development, if `APP_ACCESS_PASSWORD` is omitted, the studio opens directly for rapid development. In production (`NODE_ENV=production`), authentication is strictly enforced.

---

## 5. Running the Application Locally

Start the local development server:

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 6. Running Tests and Production Builds

### Automated Unit & Integration Tests
Run Vitest test suites (validates schema, semantics, ELK layout, export, and security):

```bash
npm test
```

### TypeScript Type-Checking
Verify strict type consistency:

```bash
npx tsc --noEmit
```

### ESLint Code Standards
Check code styling and Next.js best practices:

```bash
npm run lint
```

### Production Build
Verify the production bundle locally:

```bash
npm run build
npm start
```

---

## 7. Pushing to GitHub

Initialize and push to your GitHub repository:

```bash
git add .
git commit -m "feat: initial Flowcraft release"
git branch -M main
git remote add origin https://github.com/<your-username>/flowcraft.git
git push -u origin main
```

---

## 8. Deploying to Vercel

1. Log into your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** > **Project**.
3. Import your `flowcraft` GitHub repository.
4. Framework Preset will be automatically detected as **Next.js**.
5. In the **Environment Variables** section, configure:
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Gemini API key.
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - `APP_ACCESS_PASSWORD`: Your private password for logging into Flowcraft.
   - `APP_SESSION_SECRET`: A secure random string (at least 32 characters).
6. Click **Deploy**.

---

## 9. Checking Deployment Logs & Verification

1. Once deployment finishes, open the live URL (e.g., `https://flowcraft.vercel.app`).
2. Enter your `APP_ACCESS_PASSWORD` on the access gate.
3. In the Vercel dashboard, navigate to **Deployments** > Select active deployment > **Functions** or **Runtime Logs** to monitor serverless invocations.

---

## 10. Privacy, Pricing & Quotas

- **Server-Side API Calls**: All interactions with Google Gemini happen through the protected server-side route `/api/generate`. API keys are never exposed in browser bundles or client-side network traffic.
- **Prompt Privacy**: User prompts and generated diagrams are not written to server logs or databases.
- **Google AI Pricing & Quotas**:
  - `gemini-3.8-flash` provides cost efficiency and high generation speed.
  - Check your quotas and rate limits in the Google AI Studio / Google Cloud Console.
  - The API route enforces a 12,000-character prompt limit and maximum 80 nodes / 150 edges to protect quotas.

---

## 11. Local Storage vs Server Processing

- **Diagram Persistence**: All diagrams, node coordinates, custom labels, and metadata are saved strictly inside the browser's `localStorage`.
- **Zero Cloud Database Requirement**: No hosted database, third-party storage, or account registration is required.
- **Data Portability**: Use **Export Project JSON** for long-term backups or moving diagrams across devices.

---

## 12. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `Google Gemini API key is missing` | Missing `GOOGLE_GENERATIVE_AI_API_KEY` | Add your API key to `.env.local` (local) or Vercel Environment Variables (production). |
| `Too many login attempts` | Login rate limiting triggered after 5 failures | Wait 60 seconds before retrying login. |
| `Diagram exceeds maximum allowed nodes` | Prompt describes an excessively large system | Break the process into sub-processes or higher-level stages. |
| Exported image is cut off | Viewport zoomed far out or uncentered | Click the **Fit-to-View** button on canvas controls before exporting. |
