import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    api.get("/posts")
      .then((res) => setPosts(res.data))
      .finally(() => setLoading(false));
  }, []);

  const toggleLike = async (postId) => {
    if (!user) {
      alert("Войдите, чтобы лайкать");
      return;
    }
    try {
      if (likedPosts[postId]) {
        await api.delete(`/posts/${postId}/like`);
        setLikedPosts({ ...likedPosts, [postId]: false });
        setPosts(posts.map((p) => p.id === postId ? { ...p, likesCount: p.likesCount - 1 } : p));
      } else {
        await api.post(`/posts/${postId}/like`);
        setLikedPosts({ ...likedPosts, [postId]: true });
        setPosts(posts.map((p) => p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;

  return (
    <div className="container" style={{ marginTop: "30px", maxWidth: "700px" }}>
      <h1 style={{ marginBottom: "30px" }}>📰 Лента</h1>
      {posts.length === 0 && <p>Пока нет постов</p>}
      {posts.map((post) => (
        <div key={post.id} className="card mb-4" style={{ borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
          <div className="card-body">
            <h3 style={{ marginBottom: "10px" }}>
              <Link to={`/posts/${post.id}`} style={{ textDecoration: "none", color: "#333" }}>
                {post.title}
              </Link>
            </h3>
            <p className="text-muted small">
              ✍️ <Link to={`/users/${post.author.id}`} style={{ color: "#667eea", textDecoration: "none", fontWeight: "bold" }}>{post.author.name}</Link> · {new Date(post.created_at).toLocaleString("ru")}
            </p>
            <p>{post.content.substring(0, 150)}{post.content.length > 150 ? "..." : ""}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
              <button
                onClick={() => toggleLike(post.id)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                {likedPosts[post.id] ? "❤️" : "🤍"} {post.likesCount}
              </button>
              <Link to={`/posts/${post.id}`} className="btn btn-sm btn-primary">
                Читать →
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Posts;