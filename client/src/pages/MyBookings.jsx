import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import api, { errorMessage } from "../api.js";

export default function MyBookings() {
  const location = useLocation();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api.get("/bookings/mine")
      .then((r) => setBookings(r.data))
      .catch((e) => setError(errorMessage(e)));

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      setError("");
      load();
    } catch (e) {
      setError(errorMessage(e, "Could not cancel"));
    }
  };

  if (!bookings) return <div className="center muted">Loading…</div>;

  return (
    <>
      <h1>My bookings</h1>
      {location.state?.justBooked && <div className="alert success">🎉 Booking confirmed! Enjoy the movie.</div>}
      {error && <div className="alert error">{error}</div>}

      {bookings.length === 0 ? (
        <div className="center muted">
          You have no bookings yet. <Link to="/" className="link">Browse movies</Link>
        </div>
      ) : (
        <div className="list">
          {bookings.map((b) => (
            <div key={b._id} className={`ticket ${b.status}`}>
              <div>
                <h3>{b.movie?.title ?? "Movie"}</h3>
                {b.show && (
                  <p className="muted">
                    {b.show.theater} · {b.show.screen} · {b.show.city}<br />
                    {new Date(b.show.startTime).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                )}
                <p>Seats: <strong>{b.seats.slice().sort().join(", ")}</strong> · ₹{b.totalAmount}</p>
              </div>
              <div className="ticket-side">
                <code>{b.bookingCode}</code>
                {b.status === "cancelled" ? (
                  <span className="badge">Cancelled</span>
                ) : (
                  b.show && new Date(b.show.startTime) > new Date() && (
                    <button className="btn btn-ghost" onClick={() => cancel(b._id)}>Cancel</button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
