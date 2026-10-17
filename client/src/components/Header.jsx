import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Settings from "./Settings";

const Header = () => {
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header
        style={{
          background: "var(--card-bg)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
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
              background: "var(--gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.5px",
              fontFamily: "'Billabong', cursive, sans-serif",
            }}
          >
            InstAm
          </Link>

          <nav style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {user && (
              <>
                <Link
                  to="/posts/new"
                  style={{
                    color: "var(--text)",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  ✏️ Создать
                </Link>
                <Link
                  to={`/users/${user.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text)",
                    textDecoration: "none",
                    padding: "4px 12px 4px 4px",
                    borderRadius: "24px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {user.avatar && (
                    <img
                      src={`http://localhost:4000${user.avatar}`}
                      alt="avatar"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {!user.avatar && (
                    <div
                      className="avatar"
                      style={{ width: "32px", height: "32px", fontSize: "14px" }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
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
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.4s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "rotate(90deg)";
                e.currentTarget.style.background = "var(--hover-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "rotate(0deg)";
                e.currentTarget.style.background = "transparent";
              }}
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