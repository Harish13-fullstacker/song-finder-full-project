import { useEffect, useState } from "react";
import { AudioLines, Search, Play, Copy, ExternalLink, Music2, LoaderCircle, Radio, CircleAlert } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const TAGS = ["Tamil Hits", "Anirudh Musical", "A.R. Rahman", "Lo-Fi Chill", "EDM Party"];

export default function App() {
  const [query, setQuery] = useState("Anirudh Musical");
  const [songs, setSongs] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: "Search for a song, artist, or movie.", type: "info" });
  const [copied, setCopied] = useState("");

  useEffect(() => {
    document.title = "Song Finder";
  }, []);

  async function searchSongs(value = query) {
    const q = value.trim();
    if (!q) {
      setStatus({ text: "Please enter a song name.", type: "error" });
      return;
    }
    setLoading(true);
    setStatus({ text: `Searching for “${q}”…`, type: "info" });
    try {
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Search failed (${response.status}).`);
      setSongs(data.items || []);
      setStatus({
        text: data.items?.length ? `Found ${data.items.length} results for “${q}”.` : "No results found. Try another search.",
        type: data.items?.length ? "success" : "info"
      });
      if (data.items?.length && !current) setCurrent(data.items[0]);
    } catch (error) {
      setStatus({ text: `${error.message}. Check the Render API URL and backend logs.`, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(song) {
    try {
      await navigator.clipboard.writeText(song.url);
      setCopied(song.id);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setStatus({ text: "Copy failed. Open the song and copy its URL from the browser.", type: "error" });
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Song Finder home">
          <span className="brand-icon"><AudioLines size={24} /></span>
          <span>Song Finder</span>
        </a>
        <div className="creator"><span>Music discovery</span><span className="avatar">S</span></div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><span className="pulse" /> YOUR PERSONAL MUSIC DISCOVERY</div>
          <h1>Find your <span>favorite tracks</span></h1>
          <p className="subtitle">Search songs, explore artists, and play through the official YouTube player.</p>

          <form className="search-box" onSubmit={(e) => { e.preventDefault(); searchSongs(); }}>
            <AudioLines className="search-wave" size={23} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Song name, artist, or movie…" aria-label="Search songs" />
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <Search size={18} />}
              {loading ? "Searching" : "Search"}
            </button>
          </form>

          <div className="trending"><span>Trending</span>{TAGS.map(tag =>
            <button key={tag} onClick={() => { setQuery(tag); searchSongs(tag); }}>{tag}</button>
          )}</div>
          <div className={`status ${status.type}`} aria-live="polite">
            {status.type === "error" ? <CircleAlert size={16} /> : <span className="status-dot" />}
            {status.text}
          </div>
        </section>

        <section className="content-grid">
          <div className="results-panel">
            <div className="section-heading"><Music2 size={24} /><h2>Song Results</h2><span className="count">{songs.length}</span></div>
            {songs.length === 0 ? (
              <div className="empty-state"><Radio size={44} /><h3>Your next favorite song is waiting</h3><p>Search above to load songs from YouTube.</p></div>
            ) : (
              <div className="song-list">
                {songs.map((song, index) => (
                  <article key={song.id} className={`song-card ${current?.id === song.id ? "active" : ""}`}>
                    <div className="song-art"><img src={song.thumb} alt="" loading="lazy" /><span>#{index + 1}</span></div>
                    <div className="song-meta"><h3 title={song.title}>{song.title}</h3><p>{song.channel}</p><span className="tag">YouTube video</span></div>
                    <div className="song-actions">
                      <button className="play-btn" onClick={() => { setCurrent(song); setStatus({ text: `Selected: ${song.title}`, type: "success" }); }}><Play size={16} fill="currentColor" /> Play</button>
                      <button className="icon-btn" title="Copy YouTube link" aria-label="Copy YouTube link" onClick={() => copyLink(song)}><Copy size={17} /></button>
                      <a className="icon-btn" title="Open on YouTube" aria-label="Open on YouTube" href={song.url} target="_blank" rel="noreferrer"><ExternalLink size={17} /></a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="player-panel">
            <div className="player-title"><span className="live-dot" /><h2>Studio Player</h2><AudioLines size={22} /></div>
            <div className="video-frame">
              {current ? (
                <iframe
                  key={current.id}
                  src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(current.id)}?autoplay=0&rel=0`}
                  title={`YouTube player: ${current.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : <div className="player-placeholder"><Music2 size={46} /><p>Select a song to play</p></div>}
            </div>
            <div className="now-playing">
              <div className="vinyl"><Music2 size={23} /></div>
              <div className="now-meta"><span>NOW SELECTED</span><strong>{current?.title || "No track selected"}</strong><small>{current?.channel || "Choose a result to begin"}</small></div>
            </div>
            {current && <div className="player-actions">
              <button onClick={() => copyLink(current)}><Copy size={16} /> {copied === current.id ? "Copied!" : "Copy link"}</button>
              <a href={current.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Watch on YouTube</a>
            </div>}
            <p className="notice">Some videos may not play when embedding is disabled or when the video is restricted. Use “Watch on YouTube” to open the original source.</p>
          </aside>
        </section>
      </main>
      <footer><span className="footer-mark"><AudioLines size={17} /></span><span>Song Finder · Music discovery, made simple.</span><span className="footer-right">React + FastAPI</span></footer>
    </div>
  );
}
