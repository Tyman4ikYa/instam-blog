import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const PostForm = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.post("/posts", { title, content });
    navigate(`/posts/${res.data.id}`);
  };

  return (
    <div className="container" style={{ maxWidth: "700px", marginTop: "30px" }}>
      <h2>Новый пост</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input type="text" className="form-control" placeholder="Заголовок"
            value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="mb-3">
          <textarea className="form-control" rows="10" placeholder="Текст поста..."
            value={content} onChange={(e) => setContent(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary">Опубликовать</button>
      </form>
    </div>
  );
};

export default PostForm;