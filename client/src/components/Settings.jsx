import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const Settings = ({ onClose }) => {
  const {
    user, login, register, logout,
    savedAccounts, switchAccount, removeAccount, refreshUser,
  } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [view, setView] = useState("main");
  const fileInputRef = useRef(null);

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

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
      setView("main");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка входа");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(name, username, email, password);
      setView("main");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка регистрации");
    }
  };

  const handleLogout = () => { logout(); onClose(); navigate("/"); };

  const handleSwitch = async (account) => {
    await switchAccount(account);
    onClose(); navigate("/"); window.location.reload();
  };

  const handleRemove = (e, userId) => {
    e.stopPropagation();
    if (confirm("Удалить этот аккаунт?")) {
      removeAccount(userId);
      if (user && user.id === userId) handleLogout();
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await api.put("/users/me/avatar", { avatar: uploadRes.data.url });
      await refreshUser();
      alert("Аватарка обновлена!");
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
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
              <h3>🎨 Тема</h3>
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

            {savedAccounts.length > 0 && (
              <div className="settings-section">
                <h3>👥 Аккаунты ({savedAccounts.length})</h3>
                {savedAccounts.map((acc) => {
                  const badge = getRoleBadge(acc.role);
                  const isActive = user && user.id === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => !isActive && handleSwitch(acc)}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px", borderRadius: "10px", marginBottom: "8px",
                        cursor: isActive ? "default" : "pointer",
                        background: isActive ? "var(--hover-bg)" : "transparent",
                        border: isActive ? "2px solid var(--accent)" : "1px solid var(--border)",
                        transition: "all 0.2s",
                      }}
                    >
                      {acc.avatar ? (
                        <img src={`http://localhost:4000${acc.avatar}`} alt="avatar"
                          style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div className="avatar" style={{ width: "36px", height: "36px", fontSize: "14px" }}>
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong style={{ fontSize: "14px" }}>{acc.name}</strong>
                          {badge && (
                            <span style={{ background: badge.color, color: "white", padding: "1px 6px", borderRadius: "8px", fontSize: "9px", fontWeight: "bold" }}>
                              {badge.text}
                            </span>
                          )}
                          {isActive && <span style={{ fontSize: "11px", color: "var(--accent)" }}>активен</span>}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-light)" }}>@{acc.username}</div>
                      </div>
                      <button
                        onClick={(e) => handleRemove(e, acc.id)}
                        style={{ background: "none", border: "none", color: "#e74c3c", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}
                      >×</button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="settings-section">
              <h3>👤 Аккаунт</h3>
              {user ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
                    {user.avatar ? (
                      <img src={`http://localhost:4000${user.avatar}`} alt="avatar"
                        style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div className="avatar" style={{ width: "60px", height: "60px", fontSize: "24px" }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong>{user.name}</strong>
                        {getRoleBadge(user.role) && (
                          <span style={{ background: getRoleBadge(user.role).color, color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>
                            {getRoleBadge(user.role).text}
                          </span>
                        )}
                      </p>
                      <p style={{ color: "var(--text-light)", fontSize: "13px", margin: 0 }}>@{user.username}</p>
                    </div>
                  </div>

                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} style={{ display: "none" }} />
                  <button className="btn-insta" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: "100%", marginBottom: "10px" }}>
                    {uploading ? "Загрузка..." : "📸 Загрузить аватарку"}
                  </button>

                  <button className="settings-link" onClick={() => { navigate(`/users/${user.id}`); onClose(); }}>👤 Мой профиль</button>
                  {(user.role === "admin" || user.role === "dev") && (
                    <>
                      <button className="settings-link" onClick={() => { onClose(); navigate("/users"); }}>👥 Все пользователи</button>
                      <button className="settings-link" onClick={() => { onClose(); navigate("/admin"); }}>🛡️ Админ-панель</button>
                    </>
                  )}
                  <button className="settings-link" onClick={handleLogout}>🚪 Выйти</button>
                  <button className="settings-link" onClick={() => setView("login")}>➕ Добавить аккаунт</button>
                </>
              ) : (
                <>
                  <button className="settings-link" onClick={() => setView("login")}>🔑 Войти</button>
                  <button className="settings-link" onClick={() => setView("register")}>✨ Зарегистрироваться</button>
                </>
              )}
            </div>

            <div className="settings-section">
              <h3>🔒 Информация</h3>
              <button className="settings-link" onClick={() => setView("privacy")}>Политика конфиденциальности</button>
              <button className="settings-link" onClick={() => setView("rules")}>📜 Правила InstAm</button>
            </div>

            <div className="settings-section">
              <h3>ℹ️ О приложении</h3>
              <button className="settings-link" onClick={() => alert("InstAm v1.0\nСделано с ❤️")}>О InstAm</button>
            </div>
          </>
        )}

        {view === "login" && (
          <>
            <button className="settings-link" onClick={() => setView("main")}>← Назад</button>
            <h2>🔑 Вход</h2>
            {error && <div style={{ color: "#e74c3c", marginBottom: "10px" }}>{error}</div>}
            <form onSubmit={handleLogin}>
              <input className="settings-input" type="text" placeholder="Email или ник" value={loginValue} onChange={(e) => setLoginValue(e.target.value)} required />
              <input className="settings-input" type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" className="btn-insta" style={{ width: "100%" }}>Войти</button>
            </form>
          </>
        )}

        {view === "register" && (
          <>
            <button className="settings-link" onClick={() => setView("main")}>← Назад</button>
            <h2>✨ Регистрация</h2>
            {error && <div style={{ color: "#e74c3c", marginBottom: "10px" }}>{error}</div>}
            <form onSubmit={handleRegister}>
              <input className="settings-input" type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} required />
              <input className="settings-input" type="text" placeholder="Ник (латиница, 3-20)" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required />
              <input className="settings-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="settings-input" type="password" placeholder="Пароль (мин. 6)" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" className="btn-insta" style={{ width: "100%" }}>Зарегистрироваться</button>
            </form>
          </>
        )}

        {view === "privacy" && (
          <>
            <button className="settings-link" onClick={() => setView("main")}>← Назад</button>
            <h2>🔒 Конфиденциальность</h2>
            <p style={{ lineHeight: "1.7", color: "var(--text-light)", fontSize: "14px" }}>
              InstAm заботится о ваших данных. Мы не передаём личную информацию третьим лицам.
              Пароли хранятся в зашифрованном виде (bcrypt).
            </p>
          </>
        )}

        {view === "rules" && (
          <>
            <button className="settings-link" onClick={() => setView("main")}>← Назад</button>
            <h2>📜 Правила InstAm</h2>
            <div style={{ lineHeight: "1.8", fontSize: "14px" }}>
              <p><strong>1. Уважение</strong><br />Не оскорбляйте других.</p>
              <p><strong>2. Контент</strong><br />Запрещено: спам, реклама, экстремизм, порнография.</p>
              <p><strong>3. Авторские права</strong><br />Не публикуйте чужой контент.</p>
              <p><strong>4. Аккаунт</strong><br />Один человек — один аккаунт.</p>
              <p><strong>5. Жалобы</strong><br />Нажмите "🚨 Пожаловаться" при нарушении.</p>
              <p><strong>6. Модерация</strong><br />Администрация может удалять посты, нарушающие правила.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;