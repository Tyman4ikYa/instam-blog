import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth";

// Расширяем тип Request, чтобы добавить userId
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

  const token = authHeader.substring(7); // убираем "Bearer "
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Невалидный токен" });
  }

  req.userId = decoded.userId;
  req.userEmail = decoded.email;
  next();
}