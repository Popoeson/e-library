# E-Library — Brave Search + Qwen 2.2 (Fullstack)

This is a simple full-stack e-library starter. Users search anything (course, topic, department), the backend uses **Qwen 2.2** (via OpenRouter) to rewrite and optimize the query, then calls **Brave Search** to find PDFs and other resources on the web. Results are returned to a minimal frontend with e-library-style cards.

> This repo contains a minimal production-ready skeleton. You will need API keys and the exact endpoint URLs from the Brave Search and OpenRouter dashboards.

## What you get
- Node.js + Express backend (`/backend`)
- Vanilla frontend (`/frontend`) — HTML, CSS, JS (e-library card layout)
- Brave Search integration (backend/services/braveSearch.js)
- Qwen rewrite helper (backend/services/qwenModel.js)
- Easy to extend with summarization or fetching/downloading PDFs

## Quick start

1. Copy files into repo with this structure.
2. In `backend/` create `.env` based on `.env.example`.