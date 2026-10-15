import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Settings = ({ onClose }) => {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [view, setView] = useState("main");

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
      await login(loginValue, password);
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
      await register(name, username, email, password);
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

  const goToAdmin = () => {
    onClose();
    navigate("/admin");
  };

  const goToUsers = () => {
    onClose();
    navigate("/users");
  };

  const getRoleBadge = (role) => {
    if (role === "dev") return { text: "DEV", color: "#8b5cf6" };
    if (role === "admin") return { text: "ADMIN", color: "#e74c3c" };
    return null;
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="settings-close" onClick={onClose}>×</button>

        {view === "main" && (
          <>
            <h2>⚙️ Настройки</h2>

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

            <div className="settings-section">
              <h3>👤 Аккаунт</h3>
              {user ? (
                <>
                  <p style={{ marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Вы вошли как <strong>{user.name}</strong></span>
                    {getRoleBadge(user.role) && (
                      <span style={{
                        background: getRoleBadge(user.role).color,
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: "bold"
                      }}>{getRoleBadge(user.role).text}</span>
                    )}
                  </p>
                  <p style={{ color: "var(--text-light)", fontSize: "13px", marginBottom: "10px" }}>
                    @{user.username}
                  </p>
                  <button
                    className="settings-link"
                    onClick={() => { navigate(`/users/${user.id}`); onClose(); }}
                  >
                    👤 Мой профиль
                  </button>

                  {(user.role === "admin" || user.role === "dev") && (
                    <>
                      <button className="settings-link" onClick={goToUsers}>
                        👥 Все пользователи
                      </button>
                      <button className="settings-link" onClick={goToAdmin}>
                        🛡️ Админ-панель
                      </button>
                    </>
                  )}

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
                </>
              )}
            </div>

            <div className="settings-section">
              <h3>🔒 Конфиденциальность</h3>
              <button className="settings-link" onClick={() => setView("privacy")}>
                Политика конфиденциальности
              </button>
            </div>

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
            <button className="settings-link" onClick={() => setView("main")}>← Назад</button>
            <h2>🔑 Вход</h2>
            {error && <div style={{ color: "#e74c3c", marginBottom: "10px" }}>{error}</div>}
            <form onSubmit={handleLogin}>
              <input
                className="settings-input"
                type="text"
                placeholder="Email или ник"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
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
            <button className="settings-link" onClick={() => setView("main")}>← Назад</button>
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
                type="text"
                placeholder="Ник (латиница, 3-20)"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
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
            <button className="settings-link" onClick={() => setView("main")}>← Назад</button>
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