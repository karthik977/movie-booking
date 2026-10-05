import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import SeatGrid from "../components/SeatGrid.jsx";

const MAX_SEATS = 8;

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api
      .get(`/shows/${id}`)
      .then((r) => setShow(r.data))
      .catch((e) => setError(errorMessage(e, "Show not found")));

  useEffect(() => { load(); }, [id]);

  const toggle = (seat) => {
    setError("");
    setSelected((cur) => {
      if (cur.includes(seat)) return cur.filter((s) => s !== seat);
      if (cur.length >= MAX_SEATS) {
        setError(`You can select up to ${MAX_SEATS} seats`);
        return cur;
      }
      return [...cur, seat];
    });
  };

  const confirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/bookings", { showId: id, seats: selected });
      navigate("/bookings", { state: { justBooked: true } });
    } catch (e) {
      setError(errorMessage(e, "Booking failed"));
      setSelected([]);
      await load(); // refresh so newly taken seats show as booked
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return error ? <div className="alert error">{error}</div> : <div className="center muted">Loading…</div>;

  const total = selected.length * show.price;
  const when = new Date(show.startTime).toLocaleString(undefined, {
    weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });

  return (
    <>
      <h1>{show.movie.title}</h1>
      <p className="muted">{show.theater} · {show.screen} · {show.city} · {when}</p>

      <SeatGrid
        rows={show.rows}
        cols={show.cols}
        booked={show.bookedSeats}
        selected={selected}
        onToggle={toggle}
      />

      {error && <div className="alert error">{error}</div>}

      <div className="checkout">
        <div>
          <strong>{selected.length ? selected.slice().sort().join(", ") : "No seats selected"}</strong>
          <div className="muted">₹{show.price} per seat</div>
        </div>
        <div className="checkout-right">
          <span className="total">₹{total}</span>
          <button className="btn" disabled={!selected.length || submitting} onClick={confirm}>
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      </div>
    </>
  );
}
