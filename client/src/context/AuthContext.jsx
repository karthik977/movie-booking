import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("token")));

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = useCallback(async (path, body) => {
    const { data } = await api.post(`/auth/${path}`, body);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = (email, password) => authenticate("login", { email, password });
  const register = (name, email, password) => authenticate("register", { name, email, password });

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const savePreferences = async (favoriteGenres) => {
    const { data } = await api.put("/auth/preferences", { favoriteGenres });
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, savePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}
