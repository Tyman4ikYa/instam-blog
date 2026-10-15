import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const Settings = ({ onClose }) => {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [view, setView] = useState("main"); // main | login | register | privacy

  // Форма входа/регистрации
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const themes = [
    { id: "light", label: "Светлая" },
    { id: "dark", label: "Тёмная" },
    { id: "purple", label: "Фиолетовая" },
    { id: "blue", label: "Синяя" },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      onClose();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка входа");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      onClose();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка регистрации");
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/");
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="settings-close" onClick={onClose}>×</button>

        {view === "main" && (
          <>
            <h2>⚙️ Настройки</h2>

            {/* ТЕМА */}
            <div className="settings-section">
              <h3>🎨 Тема оформления</h3>
              <div className="theme-options">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    className={`theme-btn theme-${t.id} ${theme === t.id ? "active" : ""}`}
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                  />
                ))}
              </div>
            </div>

            {/* АККАУНТ */}
            <div className="settings-section">
              <h3>👤 Аккаунт</h3>
              {user ? (
                <>
                  <p style={{ marginBottom: "10px" }}>
                    Вы вошли как <strong>{user.name}</strong>
                  </p>
                  <button
                    className="settings-link"
                    onClick={() => { navigate(`/users/${user.id}`); onClose(); }}
                  >
                    👤 Мой профиль
                  </button>
                  <button className="settings-link" onClick={handleLogout}>
                    🚪 Выйти
                  </button>
                </>
              ) : (
                <>
                  <button className="settings-link" onClick={() => setView("login")}>
                    🔑 Войти
                  </button>
                  <button className="settings-link" onClick={() => setView("register")}>
                    ✨ Зарегистрироваться
                  </button>
                  <button className="settings-link" onClick={() => alert("Вход для админа — в разработке")}>
                    🛡️ Вход для админа
                  </button>
                </>
              )}
            </div>

            {/* КОНФИДЕНЦИАЛЬНОСТЬ */}
            <div className="settings-section">
              <h3>🔒 Конфиденциальность</h3>
              <button className="settings-link" onClick={() => setView("privacy")}>
                Политика конфиденциальности
              </button>
              <button className="settings-link" onClick={() => alert("Скоро!")}>
                Безопасность
              </button>
            </div>

            {/* О ПРИЛОЖЕНИИ */}
            <div className="settings-section">
              <h3>ℹ️ О приложении</h3>
              <button className="settings-link" onClick={() => alert("InstAm v1.0\nСделано с ❤️")}>
                О InstAm
              </button>
            </div>
          </>
        )}

        {view === "login" && (
          <>
            <button className="settings-link" onClick={() => setView("main")}>
              ← Назад
            </button>
            <h2>🔑 Вход</h2>
            {error && <div style={{ color: "#e74c3c", marginBottom: "10px" }}>{error}</div>}
            <form onSubmit={handleLogin}>
              <input
                className="settings-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="settings-input"
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" className="btn-insta" style={{ width: "100%" }}>
                Войти
              </button>
            </form>
          </>
        )}

        {view === "register" && (
          <>
            <button className="settings-link" onClick={() => setView("main")}>
              ← Назад
            </button>
            <h2>✨ Регистрация</h2>
            {error && <div style={{ color: "#e74c3c", marginBottom: "10px" }}>{error}</div>}
            <form onSubmit={handleRegister}>
              <input
                className="settings-input"
                type="text"
                placeholder="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="settings-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="settings-input"
                type="password"
                placeholder="Пароль (мин. 6 символов)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" className="btn-insta" style={{ width: "100%" }}>
                Зарегистрироваться
              </button>
            </form>
          </>
        )}

        {view === "privacy" && (
          <>
            <button className="settings-link" onClick={() => setView("main")}>
              ← Назад
            </button>
            <h2>🔒 Конфиденциальность</h2>
            <p style={{ lineHeight: "1.7", color: "var(--text-light)", fontSize: "14px" }}>
              InstAm заботится о ваших данных. Мы не передаём личную информацию третьим лицам.
              Пароли хранятся в зашифрованном виде (bcrypt). Все данные защищены.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;