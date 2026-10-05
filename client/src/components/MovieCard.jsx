import { Link } from "react-router-dom";

export function Poster({ movie, className = "" }) {
  const style = movie.posterUrl
    ? { backgroundImage: `url(${movie.posterUrl})` }
    : { background: `linear-gradient(160deg, ${movie.posterColor}, #0f172a)` };
  return (
    <div className={`poster ${className}`} style={style}>
      {!movie.posterUrl && <span className="poster-title">{movie.title}</span>}
    </div>
  );
}

export default function MovieCard({ movie, reason }) {
  return (
    <Link to={`/movies/${movie._id}`} className="card movie-card">
      <Poster movie={movie} />
      <div className="card-body">
        <h3>{movie.title}</h3>
        <div className="meta">
          {movie.status === "now_showing" ? (
            <span className="rating">★ {movie.rating.toFixed(1)}</span>
          ) : (
            <span className="badge">Coming soon</span>
          )}
          <span className="muted">{movie.language}</span>
        </div>
        <div className="tags">
          {movie.genres.slice(0, 3).map((g) => <span key={g} className="tag">{g}</span>)}
        </div>
        {reason && <p className="reason">✨ {reason}</p>}
      </div>
    </Link>
  );
}
