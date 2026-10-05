import { Router } from "express";
import mongoose from "mongoose";
import Show from "../models/Show.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Show not found" });
    const show = await Show.findById(req.params.id).populate("movie");
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json(show);
  })
);

// Admin: create a show
router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const show = await Show.create(req.body);
    res.status(201).json(show);
  })
);

export default router;
