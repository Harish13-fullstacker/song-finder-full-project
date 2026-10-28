
# Song Finder — Netlify + Render

Full-stack React/Vite frontend + FastAPI backend.

## Features
- Search YouTube videos using the YouTube Data API (API key stays on Render).
- Play videos through YouTube's official embedded player.
- Copy or open the original YouTube link.
- Health endpoint for Render deployment.
- Clear error messages for missing API key, quota errors, and unavailable videos.

This project does not extract/download YouTube or Instagram media. Use official playback or media you own/have permission to distribute.

## 1. Project structure

```text
song-finder/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml
└── frontend/
    ├── index.html
    ├── package.json
    ├── netlify.toml
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── style.css
```

## 2. Deploy backend to Render
1. Push this folder to GitHub.
2. In Render, create **New → Web Service** and connect the repository.
3. Set **Root Directory** to `backend`.
4. Set **Runtime** to Docker (Render detects `Dockerfile`).
5. Add environment variable `YOUTUBE_API_KEY` with a YouTube Data API v3 key.
6. Add environment variable `FRONTEND_ORIGIN` with your Netlify site URL, e.g. `https://your-site.netlify.app`.
7. Deploy. Test `https://YOUR-RENDER-SERVICE.onrender.com/health`.

## 3. Deploy frontend to Netlify
1. Create a Netlify site from the same GitHub repository.
2. Set **Base directory** to `frontend`.
3. Set **Build command** to `npm run build`.
4. Set **Publish directory** to `dist`.
5. Add environment variable `VITE_API_URL` = your Render service URL (no trailing slash).
6. Redeploy.

## 4. Local development
Backend (Python 3.11+):
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Set YOUTUBE_API_KEY and FRONTEND_ORIGIN in your shell
uvicorn app:app --reload --port 8000
```

Frontend (Node.js 20+):
```bash
cd frontend
copy .env.example .env
# Edit .env and set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

## Troubleshooting
- `/health` fails: check Render deploy logs and Docker build.
- Search says API key missing: add `YOUTUBE_API_KEY` in Render environment variables and redeploy.
- `403 quotaExceeded`: YouTube Data API daily quota has been exhausted.
- Player says unavailable: video may be private, age-restricted, region-restricted, or embedding may be disabled. Open the source link.
- If you change a `VITE_` variable in Netlify, trigger a new deploy; Vite variables are baked into the frontend build.
"# song-finder-full-project" 
