// Renders the seat map. Seat ids are row letter + column number, e.g. "A1".
export default function SeatGrid({ rows, cols, booked, selected, onToggle }) {
  const bookedSet = new Set(booked);
  const selectedSet = new Set(selected);

  return (
    <div className="seat-wrap">
      <div className="screen">SCREEN</div>
      <div className="seat-grid">
        {Array.from({ length: rows }, (_, r) => {
          const letter = String.fromCharCode(65 + r);
          return (
            <div key={letter} className="seat-row">
              <span className="row-label">{letter}</span>
              {Array.from({ length: cols }, (_, c) => {
                const id = `${letter}${c + 1}`;
                const isBooked = bookedSet.has(id);
                const isSelected = selectedSet.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={isBooked}
                    aria-label={`Seat ${id}${isBooked ? " (booked)" : ""}`}
                    aria-pressed={isSelected}
                    className={`seat ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => onToggle(id)}
                  >
                    {c + 1}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="seat" /> Available</span>
        <span><i className="seat selected" /> Selected</span>
        <span><i className="seat booked" /> Booked</span>
      </div>
    </div>
  );
}
