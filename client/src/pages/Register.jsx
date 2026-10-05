import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(name, email, password);
      navigate("/for-you", { replace: true }); // let new users pick favourite genres
    } catch (err) {
      setError(errorMessage(err, "Sign up failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={submit}>
      <h1>Create account</h1>
      {error && <div className="alert error">{error}</div>}
      <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" /></label>
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" /></label>
      <button className="btn" disabled={busy}>{busy ? "Creating…" : "Sign up"}</button>
      <p className="muted">Already have an account? <Link to="/login" className="link">Log in</Link></p>
    </form>
  );
}
