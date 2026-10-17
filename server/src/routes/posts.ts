import { Router, Response } from "express";
import { getDb, saveDb } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// ПОЛУЧИТЬ ВСЕ ПОСТЫ (с поиском)
router.get("/", (req, res) => {
  const db = getDb();
  const search = req.query.search ? String(req.query.search).toLowerCase() : "";

  let query = `
    SELECT 
      p.id, p.title, p.content, p.image, p.created_at,
      u.id as author_id, u.name as author_name, u.avatar as author_avatar, u.username as author_username,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
    FROM posts p
    JOIN users u ON u.id = p.author_id
  `;
  const params: string[] = [];

  if (search) {
    query += ` WHERE LOWER(p.title) LIKE ? OR LOWER(p.content) LIKE ?`;
    const like = `%${search}%`;
    params.push(like, like);
  }

  query += " ORDER BY p.created_at DESC";

  const result = db.exec(query, params);

  if (result.length === 0) {
    return res.json([]);
  }

  const posts = result[0].values.map((row) => ({
    id: row[0],
    title: row[1],
    content: row[2],
    image: row[3],
    created_at: row[4],
    author: { id: row[5], name: row[6], avatar: row[7], username: row[8] },
    likesCount: row[9],
  }));

  res.json(posts);
});

// ПОЛУЧИТЬ ОДИН ПОСТ + КОММЕНТАРИИ
router.get("/:id", (req, res) => {
  const db = getDb();
  const postId = String(req.params.id);

  const postResult = db.exec(
    `SELECT p.id, p.title, p.content, p.image, p.created_at,
            u.id as author_id, u.name as author_name, u.avatar as author_avatar, u.username as author_username,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
     FROM posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.id = ?`,
    [postId]
  );

  if (postResult.length === 0 || postResult[0].values.length === 0) {
    return res.status(404).json({ error: "Пост не найден" });
  }

  const row = postResult[0].values[0];
  const post = {
    id: row[0],
    title: row[1],
    content: row[2],
    image: row[3],
    created_at: row[4],
    author: { id: row[5], name: row[6], avatar: row[7], username: row[8] },
    likesCount: row[9],
  };

  const commentsResult = db.exec(
    `SELECT c.id, c.text, c.created_at,
            u.id as author_id, u.name as author_name, u.avatar as author_avatar, u.username as author_username
     FROM comments c
     JOIN users u ON u.id = c.author_id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [postId]
  );

  const comments =
    commentsResult.length === 0
      ? []
      : commentsResult[0].values.map((r) => ({
          id: r[0],
          text: r[1],
          created_at: r[2],
          author: { id: r[3], name: r[4], avatar: r[5], username: r[6] },
        }));

  res.json({ ...post, comments });
});

// СОЗДАТЬ ПОСТ
router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, content, image } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Заголовок и текст обязательны" });
  }

  const db = getDb();
  db.run(
    "INSERT INTO posts (title, content, image, author_id, created_at) VALUES (?, ?, ?, ?, ?)",
    [title, content, image || "", req.userId!, new Date().toISOString()]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const newId = result[0].values[0][0] as number;

  saveDb();

  res.status(201).json({ id: newId, title, content, image });
});

// ОБНОВИТЬ ПОСТ
router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, content, image } = req.body;
  const postId = String(req.params.id);

  if (!title || !content) {
    return res.status(400).json({ error: "Заголовок и текст обязательны" });
  }

  const db = getDb();
  const check = db.exec("SELECT author_id FROM posts WHERE id = ?", [postId]);
  if (check.length === 0 || check[0].values.length === 0) {
    return res.status(404).json({ error: "Пост не найден" });
  }

  if (Number(check[0].values[0][0]) !== Number(req.userId)) {
    return res.status(403).json({ error: "Можно редактировать только свои посты" });
  }

  db.run(
    "UPDATE posts SET title = ?, content = ?, image = ?, updated_at = ? WHERE id = ?",
    [title, content, image || "", new Date().toISOString(), postId]
  );

  saveDb();

  res.json({ id: Number(postId), title, content, image });
});

// УДАЛИТЬ ПОСТ (автор ИЛИ admin/dev)
router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const postId = String(req.params.id);
  const db = getDb();

  const check = db.exec("SELECT author_id FROM posts WHERE id = ?", [postId]);
  if (check.length === 0 || check[0].values.length === 0) {
    return res.status(404).json({ error: "Пост не найден" });
  }

  const authorId = Number(check[0].values[0][0]);

  const userResult = db.exec("SELECT role FROM users WHERE id = ?", [String(req.userId)]);
  const role = userResult.length > 0 ? userResult[0].values[0][0] : "user";

  const isAuthor = authorId === Number(req.userId);
  const isModerator = role === "admin" || role === "dev";

  if (!isAuthor && !isModerator) {
    return res.status(403).json({ error: "Можно удалять только свои посты" });
  }

  db.run("DELETE FROM comments WHERE post_id = ?", [postId]);
  db.run("DELETE FROM likes WHERE post_id = ?", [postId]);
  db.run("DELETE FROM posts WHERE id = ?", [postId]);

  saveDb();

  res.json({ success: true });
});

// ЛАЙКНУТЬ ПОСТ
router.post("/:id/like", authMiddleware, (req: AuthRequest, res: Response) => {
  const postId = String(req.params.id);
  const db = getDb();

  const check = db.exec("SELECT id FROM posts WHERE id = ?", [postId]);
  if (check.length === 0 || check[0].values.length === 0) {
    return res.status(404).json({ error: "Пост не найден" });
  }

  const existing = db.exec(
    "SELECT id FROM likes WHERE post_id = ? AND user_id = ?",
    [postId, String(req.userId)]
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    return res.status(400).json({ error: "Вы уже лайкнули этот пост" });
  }

  db.run("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [
    postId,
    String(req.userId),
  ]);

  saveDb();

  res.json({ success: true });
});

// УБРАТЬ ЛАЙК
router.delete("/:id/like", authMiddleware, (req: AuthRequest, res: Response) => {
  const postId = String(req.params.id);
  const db = getDb();

  db.run("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [
    postId,
    String(req.userId),
  ]);

  saveDb();

  res.json({ success: true });
});

// ПОЖАЛОВАТЬСЯ НА ПОСТ
router.post("/:id/report", authMiddleware, (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const postId = String(req.params.id);

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "Укажите причину" });
  }

  const db = getDb();
  db.run(
    "INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)",
    [String(req.userId), "post", postId, reason]
  );
  saveDb();
  res.json({ success: true });
});

export default router;