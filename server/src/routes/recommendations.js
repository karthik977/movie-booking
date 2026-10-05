import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { recommendForUser, recommendFromPrompt, aiEnabled } from "../services/recommender.js";

const router = Router();

router.get(
  "/status",
  (_req, res) => res.json({ aiEnabled: aiEnabled() })
);

// Personalised picks (works for guests too: falls back to top-rated)
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    res.json(await recommendForUser(req.user, 6));
  })
);

// Natural-language request, e.g. "something funny for a family night"
router.post(
  "/ask",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const prompt = String(req.body?.prompt || "").trim().slice(0, 500);
    if (prompt.length < 3) return res.status(400).json({ message: "Tell me what you're in the mood for" });
    res.json(await recommendFromPrompt(req.user, prompt, 5));
  })
);

export default router;
