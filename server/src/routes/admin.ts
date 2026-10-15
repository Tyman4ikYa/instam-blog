import { Router, Response } from "express";
import { getDb, saveDb } from "../db";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// Все репорты (только админ)
router.get("/reports", authMiddleware, adminMiddleware, (req, res) => {
  const db = getDb();
  const result = db.exec(`
    SELECT 
      r.id, r.target_type, r.target_id, r.reason, r.status, r.created_at,
      u.id as reporter_id, u.name as reporter_name
    FROM reports r
    JOIN users u ON u.id = r.reporter_id
    ORDER BY r.created_at DESC
  `);

  if (result.length === 0) return res.json([]);

  const reports = result[0].values.map((row) => ({
    id: row[0],
    targetType: row[1],
    targetId: row[2],
    reason: row[3],
    status: row[4],
    created_at: row[5],
    reporter: { id: row[6], name: row[7] },
  }));

  res.json(reports);
});

// Пометить репорт как решённый
router.put("/reports/:id/resolve", authMiddleware, adminMiddleware, (req, res) => {
  const db = getDb();
  db.run("UPDATE reports SET status = 'resolved' WHERE id = ?", [String(req.params.id)]);
  saveDb();
  res.json({ success: true });
});

// Удалить репорт
router.delete("/reports/:id", authMiddleware, adminMiddleware, (req, res) => {
  const db = getDb();
  db.run("DELETE FROM reports WHERE id = ?", [String(req.params.id)]);
  saveDb();
  res.json({ success: true });
});

// Статистика
router.get("/stats", authMiddleware, adminMiddleware, (req, res) => {
  const db = getDb();
  const users = db.exec("SELECT COUNT(*) FROM users")[0].values[0][0];
  const posts = db.exec("SELECT COUNT(*) FROM posts")[0].values[0][0];
  const comments = db.exec("SELECT COUNT(*) FROM comments")[0].values[0][0];
  const reports = db.exec("SELECT COUNT(*) FROM reports WHERE status = 'pending'")[0].values[0][0];

  res.json({ users, posts, comments, pendingReports: reports });
});

export default router;