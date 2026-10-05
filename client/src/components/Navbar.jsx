import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand">🎬 CineBook</Link>
        <nav className="nav-links">
          <NavLink to="/" end>Movies</NavLink>
          <NavLink to="/for-you">✨ For You</NavLink>
          {user && <NavLink to="/bookings">My Bookings</NavLink>}
        </nav>
        <div className="nav-user">
          {user ? (
            <>
              <span className="muted hide-sm">Hi, {user.name.split(" ")[0]}</span>
              <button className="btn btn-ghost" onClick={() => { logout(); navigate("/"); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
