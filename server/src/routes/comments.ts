import { Router, Response } from "express";
import { getDb, saveDb } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// СОЗДАТЬ КОММЕНТАРИЙ
router.post("/posts/:postId/comments", authMiddleware, (req: AuthRequest, res: Response) => {
  const { text } = req.body;
  const postId = String(req.params.postId);

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Текст комментария обязателен" });
  }

  const db = getDb();

  const check = db.exec("SELECT id FROM posts WHERE id = ?", [postId]);
  if (check.length === 0 || check[0].values.length === 0) {
    return res.status(404).json({ error: "Пост не найден" });
  }

  db.run(
    "INSERT INTO comments (text, post_id, author_id, created_at) VALUES (?, ?, ?, ?)",
    [text, postId, req.userId!, new Date().toISOString()]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const newId = result[0].values[0][0] as number;

  saveDb();

  res.status(201).json({
    id: newId,
    text,
    postId: Number(postId),
    created_at: new Date().toISOString(),
  });
});

// УДАЛИТЬ КОММЕНТАРИЙ
router.delete("/comments/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const commentId = String(req.params.id);
  const db = getDb();

  const check = db.exec("SELECT author_id FROM comments WHERE id = ?", [commentId]);
  if (check.length === 0 || check[0].values.length === 0) {
    return res.status(404).json({ error: "Комментарий не найден" });
  }

  if (Number(check[0].values[0][0]) !== Number(req.userId)) {
    return res.status(403).json({ error: "Можно удалять только свои комментарии" });
  }

  db.run("DELETE FROM comments WHERE id = ?", [commentId]);
  saveDb();

  res.json({ success: true });
});

export default router;