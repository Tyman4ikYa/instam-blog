import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => {
      setPost(res.data);
      setComments(res.data.comments || []);
    });
  }, [id]);

  const toggleLike = async () => {
    if (!user) {
      alert("Войдите, чтобы лайкать");
      return;
    }
    if (liked) {
      await api.delete(`/posts/${id}/like`);
      setPost({ ...post, likesCount: post.likesCount - 1 });
      setLiked(false);
    } else {
      await api.post(`/posts/${id}/like`);
      setPost({ ...post, likesCount: post.likesCount + 1 });
      setLiked(true);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    const res = await api.post(`/posts/${id}/comments`, { text });
    setComments([
      ...comments,
      { ...res.data, author: { id: user.id, name: user.name } },
    ]);
    setText("");
  };

  const deletePost = async () => {
    if (!confirm("Удалить пост?")) return;
    await api.delete(`/posts/${id}`);
    navigate("/");
  };

  const deleteComment = async (commentId) => {
    await api.delete(`/comments/${commentId}`);
    setComments(comments.filter((c) => c.id !== commentId));
  };

  if (!post) return <div className="container mt-5">Загрузка...</div>;

  return (
    <div className="container" style={{ marginTop: "30px", maxWidth: "700px" }}>
      <h1>{post.title}</h1>
      <p className="text-muted">
        ✍️ {post.author.name} · {new Date(post.created_at).toLocaleString("ru")}
      </p>
      <p style={{ fontSize: "18px", lineHeight: "1.7" }}>{post.content}</p>

      <div style={{ margin: "20px 0", display: "flex", gap: "15px", alignItems: "center" }}>
        <button
          onClick={toggleLike}
          style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}
        >
          {liked ? "❤️" : "🤍"} {post.likesCount}
        </button>
        {user && Number(user.id) === Number(post.author.id) && (
          <button className="btn btn-danger btn-sm" onClick={deletePost}>
            Удалить пост
          </button>
        )}
      </div>

      <hr />
      <h3>💬 Комментарии ({comments.length})</h3>

      {user ? (
        <form onSubmit={addComment} className="mb-3">
          <textarea
            className="form-control mb-2"
            rows="2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ваш комментарий..."
            required
          />
          <button type="submit" className="btn btn-primary btn-sm">Отправить</button>
        </form>
      ) : (
        <p className="text-muted">Войдите, чтобы оставить комментарий</p>
      )}

      {comments.map((c) => (
        <div key={c.id} className="card mb-2">
          <div className="card-body">
            <strong>{c.author.name}</strong>
            <span className="text-muted ms-2">
              {c.created_at ? new Date(c.created_at).toLocaleString("ru") : "только что"}
            </span>
            <p className="mt-2 mb-1">{c.text}</p>
            {user && Number(user.id) === Number(c.author.id) && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => deleteComment(c.id)}
              >
                Удалить
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostDetail;