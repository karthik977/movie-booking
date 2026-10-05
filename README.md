# CineBook – Movie Ticket Booking (React + Node + MongoDB + AI)

A full-stack movie ticket booking web app.

**Features**
- Browse, search and filter movies by genre
- Showtimes grouped by city, date and theatre
- Interactive seat map with **race-safe booking** (atomic MongoDB update – two people can't get the same seat)
- Register / login (JWT), booking history, cancellation (up to 2 hours before the show)
- **AI recommendations**
  - "For You" picks based on favourite genres + booking history
  - Natural-language requests ("a funny movie for a family night")
  - Powered by Claude when `ANTHROPIC_API_KEY` is set; otherwise automatically uses a built-in content-based recommender, so the app works out of the box

## Tech stack
| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Node.js, Express, JWT, bcrypt |
| Database | MongoDB + Mongoose |
| AI | Anthropic API (`@anthropic-ai/sdk`) with local fallback |

## Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a MongoDB Atlas connection string

## Setup

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env
#    edit server/.env: set JWT_SECRET, MONGODB_URI, and (optionally) ANTHROPIC_API_KEY

# 3. Load sample movies, shows and demo users
npm run seed

# 4. Run (two terminals)
npm run dev:server     # API on http://localhost:5000
npm run dev:client     # App on http://localhost:5173
```

Open http://localhost:5173

**Demo accounts** (created by the seed script)
- User: `demo@example.com` / `demo123`
- Admin: `admin@example.com` / `admin123`

## Production build
```bash
npm run build     # builds client/dist
npm start         # the Node server also serves client/dist
```
Open http://localhost:5000.

## Enabling Claude recommendations
Get an API key from https://console.anthropic.com and put it in `server/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-5-5
```
The server sends Claude a compact movie catalog plus the user's taste profile and asks for JSON picks.
Returned ids are validated against the database, so the AI can never recommend a movie that doesn't exist.
If the API call fails for any reason, the app silently falls back to the local recommender.
The API key stays on the server and is never sent to the browser.

## API overview
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | – | Create account |
| POST | `/api/auth/login` | – | Log in |
| GET | `/api/auth/me` | ✔ | Current user |
| PUT | `/api/auth/preferences` | ✔ | Save favourite genres |
| GET | `/api/movies?q=&genre=` | – | List/search movies |
| GET | `/api/movies/:id` | – | Movie details |
| GET | `/api/movies/:id/shows` | – | Upcoming shows |
| GET | `/api/shows/:id` | – | Show + seat map |
| POST | `/api/bookings` | ✔ | Book seats `{showId, seats[]}` |
| GET | `/api/bookings/mine` | ✔ | My bookings |
| POST | `/api/bookings/:id/cancel` | ✔ | Cancel booking |
| GET | `/api/recommendations` | optional | Personalised picks |
| POST | `/api/recommendations/ask` | optional | `{prompt}` natural-language picks |
| POST | `/api/movies`, `/api/shows` | admin | Add movies / shows |

## Project structure
```
movie-booking/
├── server/
│   └── src/
│       ├── index.js            # Express app
│       ├── seed.js             # Sample data
│       ├── models/             # User, Movie, Show, Booking
│       ├── routes/             # auth, movies, shows, bookings, recommendations
│       ├── middleware/auth.js  # JWT guard
│       └── services/recommender.js   # Claude + fallback recommender
└── client/
    └── src/
        ├── pages/              # Home, MovieDetail, SeatSelection, MyBookings, Recommendations, Login, Register
        ├── components/         # Navbar, MovieCard, SeatGrid
        └── context/AuthContext.jsx
```

## Notes / next steps
This is a solid starting point, not a finished commercial product. Before going live you'd want to add:
a real payment gateway (e.g. Razorpay/Stripe) with temporary seat holds, email confirmations, rate limiting,
and an admin dashboard UI (admin endpoints already exist). All movie titles in the seed data are fictional.
