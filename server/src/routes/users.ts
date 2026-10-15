import { Router, Response } from "express";
import { getDb, saveDb } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// ПРОФИЛЬ ЮЗЕРА (публично)
// GET /api/users/:id
router.get("/:id", (req, res) => {
  const db = getDb();
  const userId = String(req.params.id);

  const result = db.exec(
    "SELECT id, name, email, bio, created_at FROM users WHERE id = ?",
    [userId]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const [id, name, email, bio, created_at] = result[0].values[0];

  // Посты юзера
  const postsResult = db.exec(
    `SELECT p.id, p.title, p.content, p.created_at,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
     FROM posts p
     WHERE p.author_id = ?
     ORDER BY p.created_at DESC`,
    [userId]
  );

  const posts =
    postsResult.length === 0
      ? []
      : postsResult[0].values.map((r) => ({
          id: r[0],
          title: r[1],
          content: r[2],
          created_at: r[3],
          likesCount: r[4],
        }));

  // Подписчики (кто подписан на меня)
  const followersResult = db.exec(
    "SELECT COUNT(*) FROM follows WHERE following_id = ?",
    [userId]
  );
  const followersCount = followersResult[0].values[0][0] as number;

  // Подписки (на кого я подписан)
  const followingResult = db.exec(
    "SELECT COUNT(*) FROM follows WHERE follower_id = ?",
    [userId]
  );
  const followingCount = followingResult[0].values[0][0] as number;

  // Всего лайков на моих постах
  const likesResult = db.exec(
    `SELECT COUNT(*) FROM likes 
     WHERE post_id IN (SELECT id FROM posts WHERE author_id = ?)`,
    [userId]
  );
  const likesCount = likesResult[0].values[0][0] as number;

  res.json({
    id,
    name,
    email,
    bio,
    created_at,
    posts,
    followersCount,
    followingCount,
    likesCount,
    postsCount: posts.length,
  });
});

// ПОДПИСАТЬСЯ / ОТПИСАТЬСЯ
// POST /api/users/:id/follow
router.post("/:id/follow", authMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = Number(req.params.id);
  const myId = Number(req.userId);

  if (targetId === myId) {
    return res.status(400).json({ error: "Нельзя подписаться на себя" });
  }

  const db = getDb();

  // Проверяем, что юзер существует
  const check = db.exec("SELECT id FROM users WHERE id = ?", [String(targetId)]);
  if (check.length === 0 || check[0].values.length === 0) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  // Проверяем, не подписан ли уже
  const existing = db.exec(
    "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?",
    [String(myId), String(targetId)]
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    // Уже подписан → отписываемся
    db.run("DELETE FROM follows WHERE follower_id = ? AND following_id = ?", [
      String(myId),
      String(targetId),
    ]);
    saveDb();
    return res.json({ following: false });
  }

  // Подписываемся
  db.run("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)", [
    String(myId),
    String(targetId),
  ]);
  saveDb();

  res.json({ following: true });
});

// ПРОВЕРИТЬ, ПОДПИСАН ЛИ Я
// GET /api/users/:id/is-following
router.get("/:id/is-following", authMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = Number(req.params.id);
  const myId = Number(req.userId);

  const db = getDb();
  const result = db.exec(
    "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?",
    [String(myId), String(targetId)]
  );

  const isFollowing = result.length > 0 && result[0].values.length > 0;
  res.json({ isFollowing });
});

// ОБНОВИТЬ BIO (описание профиля)
// PUT /api/users/me/bio
router.put("/me/bio", authMiddleware, (req: AuthRequest, res: Response) => {
  const { bio } = req.body;

  if (typeof bio !== "string") {
    return res.status(400).json({ error: "bio должен быть строкой" });
  }

  const db = getDb();
  db.run("UPDATE users SET bio = ? WHERE id = ?", [bio, String(req.userId)]);
  saveDb();

  res.json({ success: true, bio });
});

export default router;