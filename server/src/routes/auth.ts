import { Router, Response } from "express";
import { getDb, saveDb } from "../db";
import { hashPassword, comparePassword, generateToken } from "../auth";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// РЕГИСТРАЦИЯ
router.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Пароль минимум 6 символов" });
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: "Ник: 3-20 символов, буквы, цифры, _" });
  }

  const db = getDb();

  const existingEmail = db.exec("SELECT id FROM users WHERE email = ?", [email]);
  if (existingEmail.length > 0 && existingEmail[0].values.length > 0) {
    return res.status(400).json({ error: "Email уже занят" });
  }

  const existingNick = db.exec("SELECT id FROM users WHERE username = ?", [username]);
  if (existingNick.length > 0 && existingNick[0].values.length > 0) {
    return res.status(400).json({ error: "Ник уже занят" });
  }

  const passwordHash = await hashPassword(password);

  db.run(
    "INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)",
    [name, username, email, passwordHash]
  );

  const result = db.exec("SELECT id, role FROM users WHERE email = ?", [email]);
  const userId = result[0].values[0][0] as number;
  const role = result[0].values[0][1] as string;

  const token = generateToken(userId, email);

  saveDb();

  res.json({
    token,
    user: { id: userId, name, username, email, role },
  });
});

// ВХОД (по email ИЛИ нику)
router.post("/login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: "Логин и пароль обязательны" });
  }

  const db = getDb();
  const result = db.exec(
    "SELECT id, name, username, email, password_hash, role FROM users WHERE email = ? OR username = ?",
    [login, login]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(401).json({ error: "Неверный логин или пароль" });
  }

  const [id, name, username, userEmail, passwordHash, role] = result[0].values[0] as [
    number, string, string, string, string, string
  ];

  const isValid = await comparePassword(password, passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Неверный логин или пароль" });
  }

  const token = generateToken(id, userEmail);

  res.json({
    token,
    user: { id, name, username, email: userEmail, role },
  });
});

// ТЕКУЩИЙ ЮЗЕР
router.get("/me", authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const result = db.exec(
    "SELECT id, name, username, email, role FROM users WHERE id = ?",
    [req.userId!]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const [id, name, username, email, role] = result[0].values[0];
  res.json({ id, name, username, email, role });
});

export default router;