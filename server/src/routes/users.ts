import { Router, Response } from "express";
import { getDb, saveDb } from "../db";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// СПИСОК ВСЕХ ЮЗЕРОВ (только admin/dev) с поиском
router.get("/", authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const search = req.query.search ? String(req.query.search).toLowerCase() : "";

  let query = `
    SELECT id, name, username, email, bio, role, avatar, created_at
    FROM users
  `;
  const params: string[] = [];

  if (search) {
    query += ` WHERE LOWER(name) LIKE ? OR LOWER(username) LIKE ? OR LOWER(email) LIKE ?`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  query += " ORDER BY id ASC";

  const result = db.exec(query, params);
  if (result.length === 0) return res.json([]);

  const users = result[0].values.map((row) => ({
    id: row[0],
    name: row[1],
    username: row[2],
    email: row[3],
    bio: row[4],
    role: row[5],
    avatar: row[6],
    created_at: row[7],
  }));

  res.json(users);
});

// НАЗНАЧИТЬ РОЛЬ (только dev)
router.put("/:id/role", authMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = Number(req.params.id);
  const { role } = req.body;

  if (!["user", "admin", "dev"].includes(role)) {
    return res.status(400).json({ error: "Неверная роль" });
  }

  const db = getDb();

  const me = db.exec("SELECT role FROM users WHERE id = ?", [String(req.userId)]);
  if (me.length === 0 || me[0].values[0][0] !== "dev") {
    return res.status(403).json({ error: "Только разработчик может назначать роли" });
  }

  const target = db.exec("SELECT id FROM users WHERE id = ?", [String(targetId)]);
  if (target.length === 0 || target[0].values.length === 0) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  if (targetId === Number(req.userId)) {
    return res.status(400).json({ error: "Нельзя менять свою роль" });
  }

  db.run("UPDATE users SET role = ? WHERE id = ?", [role, String(targetId)]);
  saveDb();

  res.json({ success: true, role });
});

// ОБНОВИТЬ АВАТАРКУ
router.put("/me/avatar", authMiddleware, (req: AuthRequest, res: Response) => {
  const { avatar } = req.body;

  if (typeof avatar !== "string") {
    return res.status(400).json({ error: "avatar должен быть строкой (URL)" });
  }

  const db = getDb();
  db.run("UPDATE users SET avatar = ? WHERE id = ?", [avatar, String(req.userId)]);
  saveDb();

  res.json({ success: true, avatar });
});

// ОБНОВИТЬ BIO
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

// ПРОФИЛЬ ЮЗЕРА (по id или нику) — ПУБЛИЧНО
router.get("/:idOrUsername", (req, res) => {
  const db = getDb();
  const param = String(req.params.idOrUsername);
  const isNumeric = /^\d+$/.test(param);

  const result = isNumeric
    ? db.exec(
        "SELECT id, name, username, email, bio, role, avatar, created_at FROM users WHERE id = ?",
        [param]
      )
    : db.exec(
        "SELECT id, name, username, email, bio, role, avatar, created_at FROM users WHERE username = ?",
        [param]
      );

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const [id, name, username, email, bio, role, avatar, created_at] = result[0].values[0];

  const postsResult = db.exec(
    `SELECT p.id, p.title, p.content, p.image, p.created_at,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
     FROM posts p
     WHERE p.author_id = ?
     ORDER BY p.created_at DESC`,
    [String(id)]
  );

  const posts =
    postsResult.length === 0
      ? []
      : postsResult[0].values.map((r) => ({
          id: r[0],
          title: r[1],
          content: r[2],
          image: r[3],
          created_at: r[4],
          likesCount: r[5],
        }));

  const followersResult = db.exec(
    "SELECT COUNT(*) FROM follows WHERE following_id = ?",
    [String(id)]
  );
  const followersCount = followersResult[0].values[0][0] as number;

  const followingResult = db.exec(
    "SELECT COUNT(*) FROM follows WHERE follower_id = ?",
    [String(id)]
  );
  const followingCount = followingResult[0].values[0][0] as number;

  const likesResult = db.exec(
    `SELECT COUNT(*) FROM likes 
     WHERE post_id IN (SELECT id FROM posts WHERE author_id = ?)`,
    [String(id)]
  );
  const likesCount = likesResult[0].values[0][0] as number;

  res.json({
    id,
    name,
    username,
    email,
    bio,
    role,
    avatar,
    created_at,
    posts,
    followersCount,
    followingCount,
    likesCount,
    postsCount: posts.length,
  });
});

// ПОДПИСАТЬСЯ / ОТПИСАТЬСЯ
router.post("/:id/follow", authMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = Number(req.params.id);
  const myId = Number(req.userId);

  if (targetId === myId) {
    return res.status(400).json({ error: "Нельзя подписаться на себя" });
  }

  const db = getDb();
  const check = db.exec("SELECT id FROM users WHERE id = ?", [String(targetId)]);
  if (check.length === 0 || check[0].values.length === 0) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const existing = db.exec(
    "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?",
    [String(myId), String(targetId)]
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run("DELETE FROM follows WHERE follower_id = ? AND following_id = ?", [
      String(myId),
      String(targetId),
    ]);
    saveDb();
    return res.json({ following: false });
  }

  db.run("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)", [
    String(myId),
    String(targetId),
  ]);
  saveDb();

  res.json({ following: true });
});

// ПРОВЕРИТЬ, ПОДПИСАН ЛИ Я
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

export default router;