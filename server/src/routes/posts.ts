import { Router, Response } from "express";
import { getDb, saveDb } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// ПОЛУЧИТЬ ВСЕ ПОСТЫ
router.get("/", (req, res) => {
  const db = getDb();
  const result = db.exec(`
    SELECT 
      p.id, p.title, p.content, p.created_at,
      u.id as author_id, u.name as author_name,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
    FROM posts p
    JOIN users u ON u.id = p.author_id
    ORDER BY p.created_at DESC
  `);

  if (result.length === 0) {
    return res.json([]);
  }

  const posts = result[0].values.map((row) => ({
    id: row[0],
    title: row[1],
    content: row[2],
    created_at: row[3],
    author: { id: row[4], name: row[5] },
    likesCount: row[6],
  }));

  res.json(posts);
});

// ПОЛУЧИТЬ ОДИН ПОСТ
router.get("/:id", (req, res) => {
  const db = getDb();
  const postId = String(req.params.id);

  const postResult = db.exec(
    `SELECT p.id, p.title, p.content, p.created_at,
            u.id as author_id, u.name as author_name,
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
    created_at: row[3],
    author: { id: row[4], name: row[5] },
    likesCount: row[6],
  };

  const commentsResult = db.exec(
    `SELECT c.id, c.text, c.created_at,
            u.id as author_id, u.name as author_name
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
          author: { id: r[3], name: r[4] },
        }));

  res.json({ ...post, comments });
});

// СОЗДАТЬ ПОСТ
router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Заголовок и текст обязательны" });
  }

  const db = getDb();
  db.run(
    "INSERT INTO posts (title, content, author_id, created_at) VALUES (?, ?, ?, ?)",
    [title, content, req.userId!, new Date().toISOString()]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const newId = result[0].values[0][0] as number;

  saveDb();

  res.status(201).json({ id: newId, title, content });
});

// ОБНОВИТЬ ПОСТ
router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;
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
    "UPDATE posts SET title = ?, content = ?, updated_at = ? WHERE id = ?",
    [title, content, new Date().toISOString(), postId]
  );

  saveDb();

  res.json({ id: Number(postId), title, content });
});

// УДАЛИТЬ ПОСТ
router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const postId = String(req.params.id);
  const db = getDb();

  const check = db.exec("SELECT author_id FROM posts WHERE id = ?", [postId]);
  if (check.length === 0 || check[0].values.length === 0) {
    return res.status(404).json({ error: "Пост не найден" });
  }

  if (Number(check[0].values[0][0]) !== Number(req.userId)) {
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

  // Проверяем, что пост есть
  const check = db.exec("SELECT id FROM posts WHERE id = ?", [postId]);
  if (check.length === 0 || check[0].values.length === 0) {
    return res.status(404).json({ error: "Пост не найден" });
  }

  // Проверяем, не лайкал ли уже
  const existing = db.exec(
    "SELECT id FROM likes WHERE post_id = ? AND user_id = ?",
    [postId, req.userId!]
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    return res.status(400).json({ error: "Вы уже лайкнули этот пост" });
  }

  db.run("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [
    postId,
    req.userId!,
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
    req.userId!,
  ]);

  saveDb();

  res.json({ success: true });
});

export default router;