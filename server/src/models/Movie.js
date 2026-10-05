import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    genres: { type: [String], default: [], index: true },
    language: { type: String, default: "English" },
    durationMins: { type: Number, required: true },
    rating: { type: Number, min: 0, max: 10, default: 7 },
    releaseDate: { type: Date, default: Date.now },
    director: String,
    cast: { type: [String], default: [] },
    // Used to render a gradient "poster" when no posterUrl is supplied
    posterColor: { type: String, default: "#6d28d9" },
    posterUrl: String,
    status: { type: String, enum: ["now_showing", "coming_soon"], default: "now_showing" },
  },
  { timestamps: true }
);

movieSchema.index({ title: "text", description: "text" });

export default mongoose.model("Movie", movieSchema);
