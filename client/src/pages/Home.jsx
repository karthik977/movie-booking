import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import MovieCard from "../components/MovieCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [picks, setPicks] = useState(null);

  useEffect(() => {
    api.get("/movies/genres").then((r) => setGenres(r.data)).catch(() => {});
  }, []);

  // Debounced search / filter
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get("/movies", { params: { q: q || undefined, genre: genre || undefined } })
        .then((r) => { setMovies(r.data); setError(""); })
        .catch((e) => setError(errorMessage(e, "Could not load movies")))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, genre]);

  useEffect(() => {
    api.get("/recommendations").then((r) => setPicks(r.data)).catch(() => {});
  }, [user]);

  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const comingSoon = movies.filter((m) => m.status === "coming_soon");

  return (
    <>
      {picks && picks.recommendations.length > 0 && !q && !genre && (
        <section>
          <div className="section-head">
            <h2>✨ {user ? "Recommended for you" : "Top picks"}</h2>
            <Link to="/for-you" className="link">Ask the AI →</Link>
          </div>
          <div className="grid">
            {picks.recommendations.slice(0, 4).map(({ movie, reason }) => (
              <MovieCard key={movie._id} movie={movie} reason={reason} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>Now showing</h2>
        </div>
        <div className="filters">
          <input
            type="search"
            placeholder="Search movies…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search movies"
          />
          <div className="chips">
            <button className={`chip ${genre === "" ? "active" : ""}`} onClick={() => setGenre("")}>All</button>
            {genres.map((g) => (
              <button key={g} className={`chip ${genre === g ? "active" : ""}`} onClick={() => setGenre(g)}>{g}</button>
            ))}
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {loading ? (
          <div className="center muted">Loading movies…</div>
        ) : nowShowing.length === 0 ? (
          <div className="center muted">No movies match your search.</div>
        ) : (
          <div className="grid">
            {nowShowing.map((m) => <MovieCard key={m._id} movie={m} />)}
          </div>
        )}
      </section>

      {comingSoon.length > 0 && (
        <section>
          <div className="section-head"><h2>Coming soon</h2></div>
          <div className="grid">
            {comingSoon.map((m) => <MovieCard key={m._id} movie={m} />)}
          </div>
        </section>
      )}
    </>
  );
}
