# AI Chat App

Kiro/Claude jaisa AI chat app — React frontend + Node.js backend.

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# .env me apni OpenAI API key daalo
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

## API Key kahan se milegi?
- OpenAI: https://platform.openai.com/api-keys

## Features
- Streaming responses (real-time typing effect)
- Code syntax highlighting with copy button
- Multiple chat sessions (localStorage me save)
- Markdown support (tables, lists, code blocks)
- Collapsible sidebar
