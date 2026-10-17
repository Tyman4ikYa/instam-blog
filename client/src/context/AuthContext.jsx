import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState([]);

  // Загрузка сохранённых аккаунтов при старте
  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
    setSavedAccounts(accounts);

    const token = localStorage.getItem("token");
    if (token) {
      api
        .get("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Сохранить/обновить аккаунт в списке
  const saveAccount = (account) => {
    const accounts = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
    const filtered = accounts.filter((a) => a.id !== account.id);
    const updated = [account, ...filtered];
    localStorage.setItem("savedAccounts", JSON.stringify(updated));
    setSavedAccounts(updated);
  };

  // Удалить аккаунт из списка (выйти полностью)
  const removeAccount = (userId) => {
    const accounts = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
    const filtered = accounts.filter((a) => a.id !== userId);
    localStorage.setItem("savedAccounts", JSON.stringify(filtered));
    setSavedAccounts(filtered);
  };

  const login = async (login, password) => {
    const res = await api.post("/auth/login", { login, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    saveAccount({ ...res.data.user, token: res.data.token });
  };

  const register = async (name, username, email, password) => {
    const res = await api.post("/auth/register", { name, username, email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    saveAccount({ ...res.data.user, token: res.data.token });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Переключиться на другой сохранённый аккаунт
  const switchAccount = async (account) => {
    localStorage.setItem("token", account.token);
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      removeAccount(account.id);
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  // Обновить данные текущего юзера (после смены аватарки)
  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      saveAccount({ ...res.data, token: localStorage.getItem("token") });
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        savedAccounts,
        login,
        register,
        logout,
        switchAccount,
        removeAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);