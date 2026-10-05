import { Router } from "express";
import User from "../models/User.js";
import { protect, signToken } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  favoriteGenres: u.favoriteGenres,
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (await User.findOne({ email: String(email).toLowerCase() })) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: String(email || "").toLowerCase() }).select("+password");
    if (!user || !(await user.matchPassword(password || ""))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

router.get("/me", protect, (req, res) => res.json({ user: publicUser(req.user) }));

router.put(
  "/preferences",
  protect,
  asyncHandler(async (req, res) => {
    const genres = Array.isArray(req.body?.favoriteGenres) ? req.body.favoriteGenres : [];
    req.user.favoriteGenres = genres.map(String).slice(0, 10);
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  })
);

export default router;
