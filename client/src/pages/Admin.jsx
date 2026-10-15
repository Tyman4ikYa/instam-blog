import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/reports"),
    ])
      .then(([statsRes, reportsRes]) => {
        setStats(statsRes.data);
        setReports(reportsRes.data);
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Доступ запрещён");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const resolveReport = async (id) => {
    await api.put(`/admin/reports/${id}/resolve`);
    setReports(reports.map((r) => (r.id === id ? { ...r, status: "resolved" } : r)));
  };

  const deleteReport = async (id) => {
    if (!confirm("Удалить репорт?")) return;
    await api.delete(`/admin/reports/${id}`);
    setReports(reports.filter((r) => r.id !== id));
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;

  return (
    <div className="container" style={{ maxWidth: "935px", marginTop: "30px" }}>
      <h1 style={{ marginBottom: "30px" }}>🛡️ Админ-панель</h1>

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div className="insta-card" style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--accent)" }}>
              {stats.users}
            </div>
            <div style={{ color: "var(--text-light)", fontSize: "14px" }}>👥 Пользователей</div>
          </div>
          <div className="insta-card" style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--accent)" }}>
              {stats.posts}
            </div>
            <div style={{ color: "var(--text-light)", fontSize: "14px" }}>📝 Постов</div>
          </div>
          <div className="insta-card" style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--accent)" }}>
              {stats.comments}
            </div>
            <div style={{ color: "var(--text-light)", fontSize: "14px" }}>💬 Комментариев</div>
          </div>
          <div className="insta-card" style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#e74c3c" }}>
              {stats.pendingReports}
            </div>
            <div style={{ color: "var(--text-light)", fontSize: "14px" }}>🚨 Репортов</div>
          </div>
        </div>
      )}

      <h2 style={{ marginBottom: "20px" }}>🚨 Жалобы ({reports.length})</h2>

      {reports.length === 0 ? (
        <div className="insta-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--text-light)" }}>Жалоб пока нет 🎉</p>
        </div>
      ) : (
        reports.map((report) => (
          <div key={report.id} className="insta-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span
                    style={{
                      background: report.status === "resolved" ? "#10b981" : "#e74c3c",
                      color: "white",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {report.status === "resolved" ? "✅ Решён" : "⏳ Ожидает"}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-light)" }}>
                    {report.targetType === "post" ? "📝 Пост" : "💬 Комментарий"} #{report.targetId}
                  </span>
                </div>
                <p style={{ marginBottom: "8px", fontWeight: "600" }}>
                  Причина: {report.reason}
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-light)" }}>
                  Пожаловался: {report.reporter.name} · {new Date(report.created_at).toLocaleString("ru")}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
              {report.targetType === "post" && (
                <Link
                  to={`/posts/${report.targetId}`}
                  className="btn-insta-outline"
                  style={{ fontSize: "13px", padding: "6px 12px", textDecoration: "none" }}
                >
                  Посмотреть пост
                </Link>
              )}
              {report.status !== "resolved" && (
                <button
                  className="btn-insta"
                  onClick={() => resolveReport(report.id)}
                  style={{ fontSize: "13px", padding: "6px 12px" }}
                >
                  ✅ Решено
                </button>
              )}
              <button
                onClick={() => deleteReport(report.id)}
                style={{
                  background: "none",
                  border: "1px solid #e74c3c",
                  color: "#e74c3c",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                🗑 Удалить
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Admin;