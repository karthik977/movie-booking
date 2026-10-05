import { Router } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const MAX_SEATS_PER_BOOKING = 8;
const CANCEL_CUTOFF_MS = 2 * 60 * 60 * 1000; // cannot cancel within 2 hours of showtime

function validSeat(seat, show) {
  const m = /^([A-Z])(\d{1,2})$/.exec(seat);
  if (!m) return false;
  const row = m[1].charCodeAt(0) - 65;
  const col = Number(m[2]);
  return row >= 0 && row < show.rows && col >= 1 && col <= show.cols;
}

router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { showId } = req.body || {};
    const seats = [...new Set(Array.isArray(req.body?.seats) ? req.body.seats.map(String) : [])];

    if (!mongoose.isValidObjectId(showId)) return res.status(400).json({ message: "Invalid show" });
    if (seats.length === 0) return res.status(400).json({ message: "Select at least one seat" });
    if (seats.length > MAX_SEATS_PER_BOOKING) {
      return res.status(400).json({ message: `You can book at most ${MAX_SEATS_PER_BOOKING} seats at once` });
    }

    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: "Show not found" });
    if (show.startTime <= new Date()) return res.status(400).json({ message: "This show has already started" });
    if (!seats.every((s) => validSeat(s, show))) return res.status(400).json({ message: "Invalid seat selection" });

    // Atomic reservation: the update only matches if NONE of the requested seats are taken,
    // so two people can never book the same seat, even under concurrent requests.
    const reserved = await Show.findOneAndUpdate(
      { _id: show._id, bookedSeats: { $nin: seats } },
      { $push: { bookedSeats: { $each: seats } } },
      { new: true }
    );
    if (!reserved) {
      return res.status(409).json({ message: "Some of the selected seats were just taken. Please pick others." });
    }

    try {
      const booking = await Booking.create({
        user: req.user._id,
        show: show._id,
        movie: show.movie,
        seats,
        totalAmount: seats.length * show.price,
        bookingCode: "MB" + crypto.randomBytes(4).toString("hex").toUpperCase(),
      });
      res.status(201).json(booking);
    } catch (err) {
      // Roll the seats back if the booking record could not be written.
      await Show.updateOne({ _id: show._id }, { $pull: { bookedSeats: { $in: seats } } });
      throw err;
    }
  })
);

router.get(
  "/mine",
  protect,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("movie", "title posterColor posterUrl genres")
      .populate("show", "theater city screen startTime price");
    res.json(bookings);
  })
);

router.post(
  "/:id/cancel",
  protect,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Booking not found" });
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

    const show = await Show.findById(booking.show);
    if (show && show.startTime.getTime() - Date.now() < CANCEL_CUTOFF_MS) {
      return res.status(400).json({ message: "Bookings cannot be cancelled within 2 hours of the show" });
    }

    booking.status = "cancelled";
    await booking.save();
    if (show) await Show.updateOne({ _id: show._id }, { $pull: { bookedSeats: { $in: booking.seats } } });
    res.json(booking);
  })
);

export default router;
