import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .get(`/posts?search=${encodeURIComponent(search)}`)
        .then((res) => setPosts(res.data))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const toggleLike = async (postId) => {
    if (!user) {
      alert("Войдите, чтобы лайкать");
      return;
    }
    try {
      if (likedPosts[postId]) {
        await api.delete(`/posts/${postId}/like`);
        setLikedPosts({ ...likedPosts, [postId]: false });
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, likesCount: p.likesCount - 1 } : p
          )
        );
      } else {
        await api.post(`/posts/${postId}/like`);
        setLikedPosts({ ...likedPosts, [postId]: true });
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "540px", marginTop: "24px" }}>
      {/* Поиск */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          className="settings-input"
          placeholder="🔍 Поиск постов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p style={{ textAlign: "center" }}>Загрузка...</p>}

      {!loading && posts.length === 0 && (
        <div className="insta-card" style={{ padding: "60px", textAlign: "center" }}>
          <h4>{search ? "Ничего не найдено" : "Пока нет постов"}</h4>
          <p className="text-muted">
            {search ? "Попробуй другой запрос" : "Создай первый пост!"}
          </p>
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} className="insta-card">
          {/* Шапка карточки: автор */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px" }}>
            <Link to={`/users/${post.author.id}`} style={{ textDecoration: "none" }}>
              <div className="avatar">
                {post.author.name.charAt(0).toUpperCase()}
              </div>
            </Link>
            <div style={{ flex: 1 }}>
              <Link
                to={`/users/${post.author.id}`}
                style={{ fontWeight: "600", fontSize: "14px", color: "var(--text)" }}
              >
                {post.author.name}
              </Link>
              <div style={{ fontSize: "12px", color: "var(--text-light)" }}>
                {new Date(post.created_at).toLocaleString("ru")}
              </div>
            </div>
          </div>

          {/* Заголовок поста */}
          <div style={{ padding: "0 14px 12px" }}>
            <Link
              to={`/posts/${post.id}`}
              style={{ fontSize: "18px", fontWeight: "600", color: "var(--text)" }}
            >
              {post.title}
            </Link>
          </div>

          {/* Текст поста */}
          <div style={{ padding: "0 14px 14px", fontSize: "15px", lineHeight: "1.5" }}>
            {post.content.substring(0, 200)}
            {post.content.length > 200 ? "..." : ""}
          </div>

          {/* Кнопки действий */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "12px 14px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => toggleLike(post.id)}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {likedPosts[post.id] ? "❤️" : "🤍"}
            </button>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>
              {post.likesCount} {post.likesCount === 1 ? "лайк" : "лайков"}
            </span>
            <Link
              to={`/posts/${post.id}`}
              style={{ marginLeft: "auto", fontSize: "14px", fontWeight: "600" }}
            >
              Читать →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Posts;