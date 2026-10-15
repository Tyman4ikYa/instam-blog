import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    if (user.role !== "admin" && user.role !== "dev") {
      alert("Доступ только для админов и разработчиков");
      navigate("/");
      return;
    }

    const timer = setTimeout(() => {
      api
        .get(`/users?search=${encodeURIComponent(search)}`)
        .then((res) => setUsers(res.data))
        .catch((err) => {
          alert(err.response?.data?.error || "Ошибка загрузки");
          navigate("/");
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [user, navigate, search]);

  const changeRole = async (userId, newRole) => {
    if (!confirm(`Изменить роль на "${newRole}"?`)) return;
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка");
    }
  };

  const getRoleBadge = (role) => {
    if (role === "dev") return { text: "DEV", color: "#8b5cf6" };
    if (role === "admin") return { text: "ADMIN", color: "#e74c3c" };
    return { text: "USER", color: "#6b7280" };
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;

  const isDev = user?.role === "dev";

  return (
    <div className="container" style={{ maxWidth: "935px", marginTop: "30px" }}>
      <h1 style={{ marginBottom: "20px" }}>👥 Все пользователи ({users.length})</h1>

      {/* Поиск */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          className="settings-input"
          placeholder="🔍 Поиск по имени, нику или email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {users.length === 0 && (
        <div className="insta-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--text-light)" }}>
            {search ? "Ничего не найдено" : "Пока нет пользователей"}
          </p>
        </div>
      )}

      {users.map((u) => {
        const badge = getRoleBadge(u.role);
        const isMe = u.id === user.id;

        return (
          <div
            key={u.id}
            className="insta-card"
            style={{
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <Link to={`/users/${u.id}`} style={{ textDecoration: "none" }}>
              <div
                className="avatar"
                style={{ width: "50px", height: "50px", fontSize: "20px" }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            </Link>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link
                  to={`/users/${u.id}`}
                  style={{
                    fontWeight: "600",
                    color: "var(--text)",
                    textDecoration: "none",
                    fontSize: "15px",
                  }}
                >
                  {u.name}
                </Link>
                <span
                  style={{
                    background: badge.color,
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {badge.text}
                </span>
                {isMe && (
                  <span style={{ color: "var(--text-light)", fontSize: "12px" }}>
                    (это вы)
                  </span>
                )}
              </div>
              <div style={{ color: "var(--text-light)", fontSize: "13px", marginTop: "2px" }}>
                @{u.username} · {u.email}
              </div>
            </div>

            {isDev && !isMe && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {u.role !== "user" && (
                  <button
                    className="btn-insta-outline"
                    style={{ fontSize: "11px", padding: "4px 10px" }}
                    onClick={() => changeRole(u.id, "user")}
                  >
                    → USER
                  </button>
                )}
                {u.role !== "admin" && (
                  <button
                    style={{
                      background: "#e74c3c",
                      color: "white",
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                    onClick={() => changeRole(u.id, "admin")}
                  >
                    → ADMIN
                  </button>
                )}
                {u.role !== "dev" && (
                  <button
                    style={{
                      background: "#8b5cf6",
                      color: "white",
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                    onClick={() => changeRole(u.id, "dev")}
                  >
                    → DEV
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Users;