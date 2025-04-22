# RepoScan

A code‑QA and analysis service built with *LangChain, ChromaDB, and Express*.  
Index any GitHub/Bitbucket repository, run CI/CD & code‑quality checks, then ask natural‑language questions about your codebase (with optional regex filtering).

---

## Table of Contents

1. [Features](#features)  
2. [Tech Stack](#tech-stack)  
3. [Directory Structure](#directory-structure)  
4. [Prerequisites](#prerequisites)  
5. [Installation & Setup](#installation--setup)  
6. [Configuration](#configuration)  
7. [Usage](#usage)  
   - [Index a Repository](#index-a-repository)  
   - [Chat‑Q&A API](#chat‑qa-api)  
   - [Real‑Time Webhook](#real‑time-webhook)  
   - [Frontend Client](#frontend-client)  
8. [Environment Variables](#environment-variables)  
9. [Contributing](#contributing)  
10. [License](#license)

---

## Features

- 🔍 **Semantic & Regex Search**  
- 📊 **Code Metrics** (Cyclomatic complexity, anti‑patterns)  
- 🧑‍💻 **Authorship Info** via `git blame`  
- 🔄 **Real‑time Indexing** on GitHub webhook pushes  
- ⚙️ **CI/CD Checks** plug‑in stub  
- 🛠️ **Modular Services** (indexing, QA chain, code analysis)

---

## Tech Stack

- **Backend**: Node.js, TypeScript, Express  
- **Vector DB**: ChromaDB  
- **AI**: OpenAI GPT (via LangChain)  
- **Frontend**: React, Axios  
- **CI/CD & Git**: `child_process` + stubbed services  

---

## Directory Structure

  ```
    reposcan/
    ├─ server/
    │ ├─ controllers/
    │ ├─ routes/
    │ ├─ services/
    │ ├─ config/
    │ ├─ app.ts
    │ └─ server.ts
    ├─ client/
    │ ├─ src/
    │ │ └─ components/
    │ └─ package.json
    ├─ .env
    ├─ package.json
    └─ tsconfig.json
```

## Prerequisites

Node.js ≥ 14

Docker (for ChromaDB)

Git

## Installation & Setup

Clone the repo
git clone https://github.com/your‑username/reposcan.git
cd reposcan

**Install server dependencies**
cd server
npm install

**Install client dependencies & build**
cd ../client
npm install
npm run build

Run ChromaDB
docker run -p 8000:8000 chromadb/chromadb:latest

**Start the server**
cd ../server
npm start

**Configuration**

Copy .env.example to .env and fill in your keys:

Server
OPENAI_API_KEY=sk-...
CHROMA_URL=http://localhost:8000
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NODE_ENV=development

## Usage

**Index a Repository**

Endpoint: POST /api/repo

Body:
{
"repoUrl": "https://github.com/owner/repo.git",
"token": "optional_personal_access_token"
}

**Chat‑Q&A API**

Endpoint: POST /api/chat/ask

Body:
{
"question": "Where is the Shopify token handled?",
"regexPattern": "\btoken\b"
}

**Real‑Time Webhook**
Set up a GitHub webhook to POST http://<your‑server>/api/webhook. On each push, changed files are re‑indexed automatically.

**Frontend Client**
In the client/ folder you’ll find:

RepoInput.tsx – Index repos via UI

ChatUI.tsx – Ask questions & view sources

Dashboard.tsx – View aggregated metrics

**Run in dev mode:**
cd client
npm start

**Environment Variables**


Key	Description
OPENAI_API_KEY	Your OpenAI secret key
CHROMA_URL	URL of running ChromaDB (default localhost:8000)
GITHUB_CLIENT_ID	OAuth App Client ID for GitHub
GITHUB_CLIENT_SECRET	OAuth App Client Secret
NODE_ENV	development or production
