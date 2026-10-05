import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Movie from "./models/Movie.js";
import Show from "./models/Show.js";
import Booking from "./models/Booking.js";

// All titles below are fictional sample data.
const movies = [
  { title: "Midnight Circuit", genres: ["Action", "Thriller"], language: "English", durationMins: 128, rating: 8.1, color: "#be123c", director: "Ava Lindqvist", cast: ["Marcus Reyes", "Tara Okafor"], description: "A retired courier races across a neon-lit city to deliver one last package before dawn, with every rival syndicate on her tail." },
  { title: "The Quiet Orchard", genres: ["Drama", "Romance"], language: "English", durationMins: 112, rating: 7.8, color: "#15803d", director: "Elena Marsh", cast: ["Julian Park", "Nora Vance"], description: "Two estranged siblings return to their family orchard for one harvest and slowly rediscover what held them together." },
  { title: "Laugh Track", genres: ["Comedy"], language: "English", durationMins: 98, rating: 7.2, color: "#d97706", director: "Sam Okonkwo", cast: ["Dee Hartley", "Rico Alvarez"], description: "A struggling stand-up gets mistaken for a famous comedian and must fake his way through a sold-out festival weekend." },
  { title: "Starlit Voyagers", genres: ["Sci-Fi", "Adventure"], language: "English", durationMins: 142, rating: 8.6, color: "#4338ca", director: "Mira Castellanos", cast: ["Idris Bell", "Yuki Tanaka"], description: "A crew of ordinary technicians must guide a failing colony ship through an uncharted nebula to reach a new home." },
  { title: "Echoes in the Attic", genres: ["Horror", "Mystery"], language: "English", durationMins: 104, rating: 6.9, color: "#334155", director: "Peter Holloway", cast: ["Claire Duval", "Owen Pryce"], description: "A family inherits a creaking old house and discovers that the whispers in the walls are repeating tomorrow's conversations." },
  { title: "Monsoon Melodies", genres: ["Romance", "Musical"], language: "Hindi", durationMins: 135, rating: 7.9, color: "#0e7490", director: "Anika Rao", cast: ["Kabir Mehta", "Isha Verma"], description: "A street musician and a conservatory student bond over rain-soaked rehearsals in a story told through song." },
  { title: "Dhoom Street Racers", genres: ["Action", "Comedy"], language: "Hindi", durationMins: 121, rating: 7.0, color: "#c2410c", director: "Vikram Sethi", cast: ["Arjun Khanna", "Meera Das"], description: "A crew of mechanics enters an underground race to save their neighbourhood garage and ends up in a heist they never planned." },
  { title: "Ghost of Banjara", genres: ["Mystery", "Thriller"], language: "Telugu", durationMins: 133, rating: 8.0, color: "#7c3aed", director: "Srinivas Reddy", cast: ["Naveen Chandra", "Pooja Hegde Rao"], description: "A young detective in Hyderabad investigates a decades-old disappearance linked to a haunted hilltop mansion." },
  { title: "Village Cricket Club", genres: ["Comedy", "Drama", "Sport"], language: "Telugu", durationMins: 126, rating: 8.3, color: "#16a34a", director: "Lakshmi Narayan", cast: ["Ravi Teja Varma", "Sneha Kumari"], description: "A ragtag village team with one borrowed bat takes on the district champions in a heartfelt underdog tale." },
  { title: "Paper Kingdoms", genres: ["Animation", "Family", "Adventure"], language: "English", durationMins: 94, rating: 8.4, color: "#db2777", director: "Hana Kobayashi", cast: ["Voice: Lily Brandt", "Voice: Theo Ng"], description: "A curious girl folds a map out of origami and finds herself inside a kingdom where every citizen is made of paper." },
  { title: "Last Train to Kyoto", genres: ["Drama", "Thriller"], language: "English", durationMins: 117, rating: 7.5, color: "#0f766e", director: "Daniel Okada", cast: ["Ellie Marsh", "Kenji Aoki"], description: "Strangers on an overnight train realise that each of them is carrying a piece of the same secret." },
  { title: "Comet Kids", genres: ["Animation", "Family", "Comedy"], language: "English", durationMins: 91, rating: 7.6, color: "#0284c7", director: "Priya Nair", cast: ["Voice: Max Rowe", "Voice: Zoe Allard"], description: "Three kids and a talkative robot dog must return a lost comet to the sky before the town's big festival night." },
  { title: "Iron Harvest", genres: ["War", "Drama"], language: "English", durationMins: 148, rating: 7.7, color: "#57534e", director: "Henrik Vogel", cast: ["Mateo Silva", "Anna Kowalski"], description: "A field medic and a farmer's daughter struggle to keep a small village alive through one brutal winter at the front." },
  { title: "Neon Samurai 2099", genres: ["Sci-Fi", "Action"], language: "English", durationMins: 125, rating: 7.4, color: "#a21caf", director: "Ren Takahashi", cast: ["Akira Mori", "Dana Fox"], description: "In a rain-slicked future Tokyo, a lone swordswoman takes on a corporation that sells stolen memories." },
  { title: "Autumn Letters", genres: ["Romance", "Drama"], language: "English", durationMins: 107, rating: 7.3, color: "#b45309", director: "Grace Eliot", cast: ["Sofia Marin", "Henry Cole"], description: "Two pen pals who have never met plan to finally meet on the last day of autumn." },
  { title: "Solar Rebellion", genres: ["Sci-Fi", "Adventure"], language: "English", durationMins: 138, rating: 0, color: "#ea580c", director: "Omar Haddad", cast: ["Lena Brandt", "Chidi Eze"], status: "coming_soon", description: "When the sun's output begins to flicker, a band of engineers launches a risky mission to restart it." },
];

const theaters = [
  { theater: "Galaxy Cinemas", city: "Hyderabad", screen: "Screen 1", price: 250 },
  { theater: "Galaxy Cinemas", city: "Hyderabad", screen: "Screen 3", price: 320 },
  { theater: "Sunrise Multiplex", city: "Hyderabad", screen: "Screen 2", price: 200 },
  { theater: "City Center Cinemas", city: "Bengaluru", screen: "Screen 1", price: 280 },
  { theater: "Marina Screens", city: "Chennai", screen: "Screen 2", price: 220 },
];

const slotHours = [10, 13, 16, 19, 22];

async function seed() {
  await connectDB(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/movie_booking");
  await Promise.all([User.deleteMany({}), Movie.deleteMany({}), Show.deleteMany({}), Booking.deleteMany({})]);

  await User.create({ name: "Admin", email: "admin@example.com", password: "admin123", role: "admin" });
  await User.create({ name: "Demo User", email: "demo@example.com", password: "demo123", favoriteGenres: ["Sci-Fi", "Comedy"] });

  const created = await Movie.insertMany(
    movies.map(({ color, ...m }) => ({ ...m, posterColor: color, releaseDate: new Date(Date.now() - Math.random() * 60 * 864e5) }))
  );

  const shows = [];
  const nowShowing = created.filter((m) => m.status === "now_showing");
  nowShowing.forEach((movie, i) => {
    for (let day = 0; day < 4; day++) {
      // each movie plays at 2 theaters, 2 slots per day
      for (let t = 0; t < 2; t++) {
        const th = theaters[(i + t * 2) % theaters.length];
        for (let s = 0; s < 2; s++) {
          const start = new Date();
          start.setDate(start.getDate() + day);
          start.setHours(slotHours[(i + s * 2 + t) % slotHours.length], 0, 0, 0);
          if (start <= new Date()) continue;
          shows.push({ movie: movie._id, ...th, startTime: start, rows: 8, cols: 12 });
        }
      }
    }
  });
  await Show.insertMany(shows);

  console.log(`Seeded ${created.length} movies and ${shows.length} shows.`);
  console.log("Admin: admin@example.com / admin123");
  console.log("Demo:  demo@example.com / demo123");
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
