import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import MovieCard from "../components/MovieCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const SUGGESTIONS = [
  "A feel-good comedy for a family night",
  "Something thrilling with a twist",
  "A romantic movie in Hindi",
  "Mind-bending sci-fi under 2.5 hours",
];

const ALL_GENRES = ["Action", "Comedy", "Drama", "Romance", "Sci-Fi", "Thriller", "Horror", "Mystery", "Animation", "Family"];

function Results({ data }) {
  if (!data) return null;
  return (
    <>
      <p className="ai-note">
        {data.source === "ai" ? "🤖 Powered by Claude" : "📊 Smart picks (add an Anthropic API key for AI-powered picks)"}
        {data.message ? ` — ${data.message}` : ""}
      </p>
      <div className="grid">
        {data.recommendations.map(({ movie, reason }) => (
          <MovieCard key={movie._id} movie={movie} reason={reason} />
        ))}
      </div>
    </>
  );
}

export default function Recommendations() {
  const { user, savePreferences } = useAuth();
  const [forYou, setForYou] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [genres, setGenres] = useState([]);

  useEffect(() => { setGenres(user?.favoriteGenres ?? []); }, [user]);

  const loadForYou = () =>
    api.get("/recommendations").then((r) => setForYou(r.data)).catch((e) => setError(errorMessage(e)));
  useEffect(() => { loadForYou(); }, [user]);

  const ask = async (text) => {
    const q = (text ?? prompt).trim();
    if (q.length < 3) return;
    setPrompt(q);
    setAsking(true);
    setError("");
    try {
      const { data } = await api.post("/recommendations/ask", { prompt: q });
      setAnswer(data);
    } catch (e) {
      setError(errorMessage(e, "Could not get suggestions"));
    } finally {
      setAsking(false);
    }
  };

  const toggleGenre = async (g) => {
    const next = genres.includes(g) ? genres.filter((x) => x !== g) : [...genres, g];
    setGenres(next);
    await savePreferences(next);
    loadForYou();
  };

  return (
    <>
      <h1>✨ Movie recommendations</h1>

      <section className="panel">
        <h2>What are you in the mood for?</h2>
        <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="ask-form">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. a funny movie to watch with friends"
            maxLength={500}
            aria-label="Describe what you want to watch"
          />
          <button className="btn" disabled={asking}>{asking ? "Thinking…" : "Recommend"}</button>
        </form>
        <div className="chips">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>
          ))}
        </div>
        {error && <div className="alert error">{error}</div>}
        <Results data={answer} />
      </section>

      <section>
        <h2>{user ? "Picked for you" : "Top picks"}</h2>
        {user ? (
          <>
            <p className="muted">Choose your favourite genres to sharpen suggestions. Your booking history is used too.</p>
            <div className="chips">
              {ALL_GENRES.map((g) => (
                <button key={g} className={`chip ${genres.includes(g) ? "active" : ""}`} onClick={() => toggleGenre(g)}>{g}</button>
              ))}
            </div>
          </>
        ) : (
          <p className="muted"><Link to="/login" className="link">Log in</Link> to get picks tailored to your taste.</p>
        )}
        {forYou ? <Results data={forYou} /> : <div className="center muted">Loading…</div>}
      </section>
    </>
  );
}
