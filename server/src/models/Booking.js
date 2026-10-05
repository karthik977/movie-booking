import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    seats: { type: [String], required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    bookingCode: { type: String, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
