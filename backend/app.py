import os
import logging
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("song-finder")

app = FastAPI(title="Song Finder API", version="1.0.0")

def allowed_origins():
    configured = os.getenv("FRONTEND_ORIGIN", "")
    origins = [item.strip().rstrip("/") for item in configured.split(",") if item.strip()]
    # Local development origin is useful; production origin should be set in Render.
    origins += ["http://localhost:5173", "http://127.0.0.1:5173"]
    return list(dict.fromkeys(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Song Finder API is running", "docs": "/docs", "health": "/health"}

@app.get("/health")
def health():
    return {"status": "healthy", "youtube_api_key_configured": bool(os.getenv("YOUTUBE_API_KEY"))}

@app.get("/search")
async def search_songs(q: str = Query(..., min_length=1, max_length=150)):
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Enter a song or artist name.")

    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="YouTube API key is not configured on the Render backend.")

    params = {
        "part": "snippet",
        "type": "video",
        "maxResults": 12,
        "q": f"{query} official song",
        "videoEmbeddable": "true",
        "key": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params=params,
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="YouTube search timed out. Please try again.")
    except httpx.HTTPError:
        logger.exception("YouTube API network error")
        raise HTTPException(status_code=502, detail="Could not connect to YouTube search.")

    try:
        payload = response.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="YouTube returned an invalid response.")

    if response.status_code >= 400:
        api_error = payload.get("error", {}).get("errors", [{}])[0].get("reason", "")
        message = payload.get("error", {}).get("message", "YouTube search failed.")
        logger.warning("YouTube API error (%s): %s", api_error, message)
        if api_error == "quotaExceeded":
            raise HTTPException(status_code=503, detail="YouTube API quota exceeded. Try again tomorrow or review your Google Cloud quota.")
        if response.status_code == 403:
            raise HTTPException(status_code=403, detail="YouTube API access was denied. Check API enablement, key restrictions, and quota.")
        raise HTTPException(status_code=502, detail=message)

    results = []
    for item in payload.get("items", []):
        video_id = item.get("id", {}).get("videoId")
        snippet = item.get("snippet", {})
        if not video_id:
            continue
        thumbnails = snippet.get("thumbnails", {})
        thumb = (
            thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
            or f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"
        )
        results.append({
            "id": video_id,
            "title": snippet.get("title", "Untitled"),
            "channel": snippet.get("channelTitle", "YouTube"),
            "thumb": thumb,
            "url": f"https://www.youtube.com/watch?v={video_id}",
        })
    return {"query": query, "count": len(results), "items": results}
