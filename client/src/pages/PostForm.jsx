import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const PostForm = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Превью
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImageUrl(uploadRes.data.url);
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl("");
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/posts", { title, content, image: imageUrl });
      navigate(`/posts/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка создания");
    }
  };

  return (
    <div className="container" style={{ maxWidth: "700px", marginTop: "30px" }}>
      <h2>Новый пост</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            type="text"
            className="settings-input"
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <textarea
            className="settings-input"
            rows="8"
            placeholder="Текст поста..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ resize: "vertical" }}
          />
        </div>

        {/* Загрузка фото */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFile}
            style={{ display: "none" }}
          />

          {preview ? (
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <img
                src={preview}
                alt="preview"
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
              />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-insta-outline"
              disabled={uploading}
              style={{ width: "100%", padding: "15px" }}
            >
              {uploading ? "⏳ Загрузка..." : "📸 Добавить фото"}
            </button>
          )}
        </div>

        <button
          type="submit"
          className="btn-insta"
          disabled={uploading}
          style={{ width: "100%", padding: "12px", fontSize: "16px" }}
        >
          Опубликовать
        </button>
      </form>
    </div>
  );
};

export default PostForm;