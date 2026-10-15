import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/users/${id}`),
      user ? api.get(`/users/${id}/is-following`).catch(() => ({ data: { isFollowing: false } })) : Promise.resolve({ data: { isFollowing: false } }),
    ])
      .then(([profileRes, followRes]) => {
        setProfile(profileRes.data);
        setIsFollowing(followRes.data.isFollowing);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user) {
      alert("Войдите, чтобы подписаться");
      return;
    }
    try {
      const res = await api.post(`/users/${id}/follow`);
      setIsFollowing(res.data.following);
      setProfile({
        ...profile,
        followersCount: res.data.following
          ? profile.followersCount + 1
          : profile.followersCount - 1,
      });
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка");
    }
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;
  if (!profile) return <div className="container mt-5">Пользователь не найден</div>;

  const isMyProfile = user && Number(user.id) === Number(profile.id);

  return (
    <div className="container" style={{ marginTop: "30px", maxWidth: "700px" }}>
      <div className="card mb-4" style={{ borderRadius: "12px" }}>
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "32px",
                fontWeight: "bold",
              }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ marginBottom: "5px" }}>{profile.name}</h2>
              <p className="text-muted" style={{ marginBottom: "5px" }}>
                {profile.bio || "Без описания"}
              </p>
              <p className="text-muted small">📅 {new Date(profile.created_at).toLocaleDateString("ru")}</p>
            </div>
            {!isMyProfile && (
              <button
                className={`btn ${isFollowing ? "btn-outline-secondary" : "btn-primary"}`}
                onClick={toggleFollow}
              >
                {isFollowing ? "Отписаться" : "Подписаться"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "30px", marginTop: "20px", textAlign: "center" }}>
            <div>
              <h4 style={{ margin: 0 }}>{profile.postsCount}</h4>
              <small className="text-muted">постов</small>
            </div>
            <div>
              <h4 style={{ margin: 0 }}>{profile.followersCount}</h4>
              <small className="text-muted">подписчиков</small>
            </div>
            <div>
              <h4 style={{ margin: 0 }}>{profile.followingCount}</h4>
              <small className="text-muted">подписок</small>
            </div>
            <div>
              <h4 style={{ margin: 0 }}>{profile.likesCount}</h4>
              <small className="text-muted">лайков</small>
            </div>
          </div>
        </div>
      </div>

      <h3>📝 Посты ({profile.posts.length})</h3>
      {profile.posts.length === 0 && <p className="text-muted">Пока нет постов</p>}
      {profile.posts.map((post) => (
        <div key={post.id} className="card mb-2">
          <div className="card-body">
            <h5>
              <Link to={`/posts/${post.id}`} style={{ textDecoration: "none" }}>
                {post.title}
              </Link>
            </h5>
            <p className="text-muted small">
              ❤️ {post.likesCount} · {new Date(post.created_at).toLocaleString("ru")}
            </p>
            <p>{post.content.substring(0, 100)}...</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Profile;