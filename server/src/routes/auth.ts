import { Router, Response } from "express";
import { getDb, saveDb } from "../db";
import { hashPassword, comparePassword, generateToken } from "../auth";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// РЕГИСТРАЦИЯ
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Валидация
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Пароль минимум 6 символов" });
  }

  const db = getDb();

  // Проверяем, есть ли уже такой email
  const existing = db.exec("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    return res.status(400).json({ error: "Email уже занят" });
  }

  // Хешируем пароль
  const passwordHash = await hashPassword(password);

  // Вставляем в БД
  db.run("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [
    name,
    email,
    passwordHash,
  ]);

  // Получаем id нового юзера
  const result = db.exec("SELECT id FROM users WHERE email = ?", [email]);
  const userId = result[0].values[0][0] as number;
  
  // Создаём токен
  const token = generateToken(userId, email);

  saveDb();

  res.json({
    token,
    user: { id: userId, name, email },
  });
});

// ВХОД
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  const db = getDb();
  const result = db.exec(
    "SELECT id, name, email, password_hash FROM users WHERE email = ?",
    [email]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }

  const [id, name, userEmail, passwordHash] = result[0].values[0] as [
    number,
    string,
    string,
    string
  ];

  // Проверяем пароль
  const isValid = await comparePassword(password, passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }

  const token = generateToken(id, userEmail);

  res.json({
    token,
    user: { id, name, email: userEmail },
  });
});

// ТЕКУЩИЙ ЮЗЕР (нужен токен)
router.get("/me", authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const result = db.exec("SELECT id, name, email FROM users WHERE id = ?", [
        req.userId!,
  ]);

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const [id, name, email] = result[0].values[0];
  res.json({ id, name, email });
});

export default router;
