import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", padding: "15px 0" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" style={{ color: "white", fontSize: "24px", fontWeight: "bold", textDecoration: "none" }}>
          📸 InstAm
        </Link>
        <nav style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          {user ? (
            <>
              <Link to="/posts/new" style={{ color: "white", textDecoration: "none" }}>
                + Новый пост
              </Link>
              <span style={{ color: "#ffd6d6" }}>Привет, {user.name}</span>
              <button onClick={handleLogout} className="btn btn-sm btn-outline-light">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: "white", textDecoration: "none" }}>Вход</Link>
              <Link to="/register" style={{ color: "white", textDecoration: "none" }}>Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;