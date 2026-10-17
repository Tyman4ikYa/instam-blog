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
      user
        ? api.get(`/users/${id}/is-following`).catch(() => ({ data: { isFollowing: false } }))
        : Promise.resolve({ data: { isFollowing: false } }),
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
    <div className="container" style={{ maxWidth: "935px", marginTop: "30px" }}>
      {/* Шапка профиля */}
      <div style={{ display: "flex", gap: "80px", padding: "20px 0 40px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "center", minWidth: "200px" }}>
          {profile.avatar ? (
            <img
              src={`http://localhost:4000${profile.avatar}`}
              alt="avatar"
              className="avatar avatar-lg"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="avatar avatar-lg">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "400", margin: 0 }}>
              {profile.name}
            </h2>
            {!isMyProfile && (
              <button
                className={isFollowing ? "btn-insta-outline" : "btn-insta"}
                onClick={toggleFollow}
              >
                {isFollowing ? "Отписаться" : "Подписаться"}
              </button>
            )}
            {isMyProfile && (
              <span style={{ color: "var(--text-light)", fontSize: "14px" }}>Это вы</span>
            )}
          </div>

          <div style={{ color: "var(--text-light)", fontSize: "14px", marginBottom: "15px" }}>
            @{profile.username}
          </div>

          <div style={{ display: "flex", gap: "40px", marginBottom: "20px" }}>
            <div>
              <strong>{profile.postsCount}</strong>{" "}
              <span style={{ color: "var(--text)" }}>постов</span>
            </div>
            <div>
              <strong>{profile.followersCount}</strong>{" "}
              <span style={{ color: "var(--text)" }}>подписчиков</span>
            </div>
            <div>
              <strong>{profile.followingCount}</strong>{" "}
              <span style={{ color: "var(--text)" }}>подписок</span>
            </div>
            <div>
              <strong>{profile.likesCount}</strong>{" "}
              <span style={{ color: "var(--text)" }}>лайков</span>
            </div>
          </div>

          <div>
            <p style={{ margin: 0, fontSize: "14px" }}>
              <strong>{profile.name}</strong>
            </p>
            <p style={{ margin: 0, color: "var(--text-light)", fontSize: "14px" }}>
              {profile.bio || "Без описания"}
            </p>
          </div>
        </div>
      </div>

      {/* Сетка постов */}
      <div style={{ padding: "30px 0" }}>
        <h3 style={{ textAlign: "center", fontSize: "12px", letterSpacing: "1px", color: "var(--text-light)", marginBottom: "20px" }}>
          📷 ПОСТЫ
        </h3>

        {profile.posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-light)", padding: "40px" }}>
            Пока нет постов
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "4px",
            }}
          >
            {profile.posts.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                style={{
                  aspectRatio: "1",
                  borderRadius: "4px",
                  overflow: "hidden",
                  position: "relative",
                  display: "block",
                }}
              >
                {post.image ? (
                  <img
                    src={`http://localhost:4000${post.image}`}
                    alt={post.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #667eea, #764ba2)",
                      padding: "15px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "white",
                    }}
                  >
                    <h5 style={{ fontSize: "14px", margin: 0, overflow: "hidden" }}>
                      {post.title}
                    </h5>
                    <div style={{ fontSize: "12px" }}>❤️ {post.likesCount}</div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;