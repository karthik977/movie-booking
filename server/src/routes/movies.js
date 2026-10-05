import { Router } from "express";
import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, genre, status } = req.query;
    const filter = {};
    if (q) filter.title = new RegExp(escapeRegex(String(q)), "i");
    if (genre) filter.genres = String(genre);
    if (status) filter.status = String(status);
    const movies = await Movie.find(filter).sort({ rating: -1, releaseDate: -1 });
    res.json(movies);
  })
);

router.get(
  "/genres",
  asyncHandler(async (_req, res) => {
    res.json((await Movie.distinct("genres")).sort());
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Movie not found" });
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  })
);

// Upcoming shows for a movie, grouped client-side by city/date.
router.get(
  "/:id/shows",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.json([]);
    const filter = { movie: req.params.id, startTime: { $gte: new Date() } };
    if (req.query.city) filter.city = String(req.query.city);
    const shows = await Show.find(filter).sort({ startTime: 1 });
    res.json(
      shows.map((s) => ({
        ...s.toObject(),
        seatsLeft: s.rows * s.cols - s.bookedSeats.length,
      }))
    );
  })
);

// Admin: create a movie
router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  })
);

export default router;
