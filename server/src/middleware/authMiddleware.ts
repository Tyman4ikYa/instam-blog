import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth";
import { getDb } from "../db";

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

// Middleware: проверяет токен из заголовка Authorization
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Токен не предоставлен" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Невалидный токен" });
  }

  req.userId = decoded.userId;
  req.userEmail = decoded.email;
  next();
}

// Проверка: админ ИЛИ разработчик
export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const db = getDb();
  const result = db.exec("SELECT role FROM users WHERE id = ?", [
    String(req.userId),
  ]);

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const role = result[0].values[0][0];
  if (role !== "admin" && role !== "dev") {
    return res.status(403).json({ error: "Доступ только для админов и разработчиков" });
  }

  next();
}