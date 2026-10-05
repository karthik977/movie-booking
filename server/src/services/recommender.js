import Anthropic from "@anthropic-ai/sdk";
import Movie from "../models/Movie.js";
import Booking from "../models/Booking.js";

const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

/* ---------- Taste profile ---------- */

// Build a taste profile from the user's declared genres and their booking history.
export async function buildProfile(user) {
  const genreWeights = {};
  const bump = (g, w) => (genreWeights[g] = (genreWeights[g] || 0) + w);
  const watchedIds = new Set();
  const watchedTitles = [];

  if (user) {
    (user.favoriteGenres || []).forEach((g) => bump(g, 3));
    const bookings = await Booking.find({ user: user._id, status: "confirmed" })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("movie", "title genres");
    for (const b of bookings) {
      if (!b.movie) continue;
      watchedIds.add(String(b.movie._id));
      watchedTitles.push(b.movie.title);
      b.movie.genres.forEach((g) => bump(g, 2));
    }
  }
  return { genreWeights, watchedIds, watchedTitles: [...new Set(watchedTitles)] };
}

/* ---------- Fallback recommender (no API key needed) ---------- */

function scoreMovie(movie, profile) {
  let score = movie.rating; // quality baseline (0-10)
  for (const g of movie.genres) score += (profile.genreWeights[g] || 0) * 1.5;
  if (profile.watchedIds.has(String(movie._id))) score -= 100; // don't re-recommend
  return score;
}

function localRecommend(movies, profile, limit) {
  const topGenres = Object.entries(profile.genreWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([g]) => g);
  return movies
    .map((m) => ({ m, score: scoreMovie(m, profile) }))
    .filter((x) => x.score > -50)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ m }) => {
      const shared = m.genres.filter((g) => topGenres.includes(g));
      return {
        movie: m,
        reason: shared.length
          ? `Matches your taste for ${shared.join(" & ")} and is rated ${m.rating}/10.`
          : `Highly rated (${m.rating}/10) and popular right now.`,
      };
    });
}

function keywordRecommend(movies, prompt, limit) {
  const words = prompt.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  return movies
    .map((m) => {
      const hay = `${m.title} ${m.description} ${m.genres.join(" ")} ${m.language}`.toLowerCase();
      const hits = words.filter((w) => hay.includes(w)).length;
      return { m, score: hits * 2 + m.rating / 10 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ m, score }) => ({
      movie: m,
      reason: score >= 2 ? "Matches keywords in your request." : "A well-rated pick you might enjoy.",
    }));
}

/* ---------- Claude-powered recommender ---------- */

function compactCatalog(movies) {
  return movies.map((m) => ({
    id: String(m._id),
    title: m.title,
    genres: m.genres,
    language: m.language,
    rating: m.rating,
    durationMins: m.durationMins,
    blurb: m.description.slice(0, 160),
  }));
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model response");
  return JSON.parse(text.slice(start, end + 1));
}

async function askClaude({ movies, system, userMessage, limit }) {
  const c = getClient();
  const response = await c.messages.create({
    model: MODEL(),
    max_tokens: 1200,
    system,
    messages: [{ role: "user", content: userMessage }],
  });
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = extractJson(text);

  const byId = new Map(movies.map((m) => [String(m._id), m]));
  const picks = [];
  for (const r of parsed.recommendations || []) {
    const movie = byId.get(String(r.id));
    if (movie && !picks.some((p) => p.movie._id === movie._id)) {
      picks.push({ movie, reason: String(r.reason || "").slice(0, 300) });
    }
    if (picks.length >= limit) break;
  }
  if (picks.length === 0) throw new Error("Model returned no valid movie ids");
  return { picks, message: parsed.message ? String(parsed.message).slice(0, 400) : "" };
}

const SYSTEM = `You are the recommendation engine of a movie ticket booking site.
You may ONLY recommend movies from the provided catalog, referenced by their exact "id".
Reply with a single JSON object and nothing else, in this shape:
{"message": "<one friendly sentence>", "recommendations": [{"id": "<catalog id>", "reason": "<one short, specific sentence>"}]}
Order recommendations from best to worst fit. Never invent movies or ids.`;

/* ---------- Public API ---------- */

export async function recommendForUser(user, limit = 6) {
  const movies = await Movie.find({ status: "now_showing" });
  const profile = await buildProfile(user);
  const candidates = movies.filter((m) => !profile.watchedIds.has(String(m._id)));
  const pool = candidates.length ? candidates : movies;

  if (aiEnabled()) {
    try {
      const topGenres = Object.entries(profile.genreWeights)
        .sort((a, b) => b[1] - a[1])
        .map(([g, w]) => `${g} (${w})`);
      const userMessage = JSON.stringify({
        task: `Recommend up to ${limit} movies this user would enjoy most.`,
        user: {
          signedIn: Boolean(user),
          genrePreferences: topGenres,
          recentlyWatched: profile.watchedTitles.slice(0, 10),
        },
        catalog: compactCatalog(pool),
      });
      const { picks, message } = await askClaude({ movies: pool, system: SYSTEM, userMessage, limit });
      return { source: "ai", message, recommendations: picks };
    } catch (err) {
      console.warn("[recommender] AI call failed, using fallback:", err.message);
    }
  }
  return {
    source: "local",
    message: user ? "Picked from your favourite genres and booking history." : "Top-rated movies right now.",
    recommendations: localRecommend(pool, profile, limit),
  };
}

export async function recommendFromPrompt(user, prompt, limit = 5) {
  const movies = await Movie.find({});
  const profile = await buildProfile(user);

  if (aiEnabled()) {
    try {
      const userMessage = JSON.stringify({
        task: `The user is asking for movie suggestions in their own words. Recommend up to ${limit} from the catalog.`,
        request: prompt,
        user: { genrePreferences: Object.keys(profile.genreWeights), recentlyWatched: profile.watchedTitles.slice(0, 10) },
        catalog: compactCatalog(movies),
      });
      const { picks, message } = await askClaude({ movies, system: SYSTEM, userMessage, limit });
      return { source: "ai", message, recommendations: picks };
    } catch (err) {
      console.warn("[recommender] AI chat failed, using fallback:", err.message);
    }
  }
  return {
    source: "local",
    message: "Here are the closest matches I could find.",
    recommendations: keywordRecommend(movies, prompt, limit),
  };
}
