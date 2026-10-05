import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
    theater: { type: String, required: true },
    city: { type: String, required: true },
    screen: { type: String, default: "Screen 1" },
    startTime: { type: Date, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    rows: { type: Number, default: 8 },
    cols: { type: Number, default: 12 },
    // Seat ids look like "A1", "C7" (row letter + column number)
    bookedSeats: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Show", showSchema);
