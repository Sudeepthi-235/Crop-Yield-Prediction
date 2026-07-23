import { createContext, useContext, useState, useEffect } from "react";
import { getMe, logoutUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((res) => setUser(res.data?.user || res.data))
      .catch(() => setUser(null)) // 401 is expected when not logged in
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await logoutUser().catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
