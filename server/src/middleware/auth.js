import jwt from "jsonwebtoken";
import User from "../models/User.js";

async function userFromRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(payload.id);
  } catch {
    return null;
  }
}

export async function protect(req, res, next) {
  const user = await userFromRequest(req);
  if (!user) return res.status(401).json({ message: "Please log in to continue" });
  req.user = user;
  next();
}

// Attaches req.user when a valid token is present, but never blocks the request.
export async function optionalAuth(req, _res, next) {
  req.user = await userFromRequest(req);
  next();
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admins only" });
  next();
}

export function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
