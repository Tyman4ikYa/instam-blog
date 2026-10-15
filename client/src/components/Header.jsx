import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Settings from "./Settings";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header
        style={{
          background: "var(--card-bg)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            to="/"
            style={{
              fontSize: "26px",
              fontWeight: "bold",
              textDecoration: "none",
              color: "var(--text)",
              fontFamily: "'Billabong', cursive, sans-serif",
            }}
          >
            InstAm
          </Link>

          <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            {user && (
              <>
                <Link
                  to="/posts/new"
                  style={{
                    color: "var(--text)",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  + Создать
                </Link>
                <Link
                  to={`/users/${user.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text)",
                    textDecoration: "none",
                  }}
                >
                  <div className="avatar" style={{ width: "32px", height: "32px", fontSize: "14px" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>{user.name}</span>
                </Link>
              </>
            )}

            <button
              onClick={() => setSettingsOpen(true)}
              title="Настройки"
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "var(--text)",
                padding: "4px 8px",
                transition: "transform 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(45deg)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
            >
              ⚙️
            </button>
          </nav>
        </div>
      </header>

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </>
  );
};

export default Header;