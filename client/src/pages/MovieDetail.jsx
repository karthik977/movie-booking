import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Poster } from "../components/MovieCard.jsx";

const dayKey = (d) => new Date(d).toDateString();
const fmtDay = (d) =>
  new Date(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [error, setError] = useState("");
  const [city, setCity] = useState("");
  const [day, setDay] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/movies/${id}`), api.get(`/movies/${id}/shows`)])
      .then(([m, s]) => { setMovie(m.data); setShows(s.data); })
      .catch((e) => setError(errorMessage(e, "Movie not found")));
  }, [id]);

  const cities = useMemo(() => [...new Set(shows.map((s) => s.city))], [shows]);
  useEffect(() => { if (!city && cities.length) setCity(cities[0]); }, [cities, city]);

  const cityShows = shows.filter((s) => s.city === city);
  const days = [...new Set(cityShows.map((s) => dayKey(s.startTime)))];
  useEffect(() => { if (days.length && !days.includes(day)) setDay(days[0]); }, [days, day]);

  const dayShows = cityShows.filter((s) => dayKey(s.startTime) === day);
  const byTheater = dayShows.reduce((acc, s) => {
    const key = `${s.theater} · ${s.screen}`;
    (acc[key] ||= []).push(s);
    return acc;
  }, {});

  if (error) return <div className="alert error">{error}</div>;
  if (!movie) return <div className="center muted">Loading…</div>;

  return (
    <>
      <div className="detail">
        <Poster movie={movie} className="poster-lg" />
        <div>
          <h1>{movie.title}</h1>
          <div className="meta">
            {movie.status === "now_showing" && <span className="rating">★ {movie.rating.toFixed(1)}</span>}
            <span className="muted">{movie.durationMins} min</span>
            <span className="muted">{movie.language}</span>
          </div>
          <div className="tags">{movie.genres.map((g) => <span key={g} className="tag">{g}</span>)}</div>
          <p>{movie.description}</p>
          {movie.director && <p className="muted">Director: {movie.director}</p>}
          {movie.cast?.length > 0 && <p className="muted">Cast: {movie.cast.join(", ")}</p>}
        </div>
      </div>

      <section>
        <h2>Showtimes</h2>
        {movie.status === "coming_soon" ? (
          <div className="alert">Bookings are not open yet for this movie.</div>
        ) : shows.length === 0 ? (
          <div className="alert">No upcoming shows right now. Check back soon!</div>
        ) : (
          <>
            <div className="filters">
              <select value={city} onChange={(e) => { setCity(e.target.value); setDay(""); }} aria-label="City">
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
              <div className="chips">
                {days.map((d) => (
                  <button key={d} className={`chip ${day === d ? "active" : ""}`} onClick={() => setDay(d)}>
                    {fmtDay(d)}
                  </button>
                ))}
              </div>
            </div>
            {Object.entries(byTheater).map(([name, list]) => (
              <div key={name} className="theater">
                <h3>{name}</h3>
                <div className="slots">
                  {list.map((s) => (
                    <Link key={s._id} to={`/shows/${s._id}/seats`} className={`slot ${s.seatsLeft === 0 ? "sold" : ""}`}>
                      <strong>{fmtTime(s.startTime)}</strong>
                      <small>₹{s.price} · {s.seatsLeft === 0 ? "Sold out" : `${s.seatsLeft} left`}</small>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </>
  );
}
