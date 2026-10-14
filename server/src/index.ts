import express from "express";
import cors from "cors";
import { initDb } from "./db";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import commentsRouter from "./routes/comments";

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Роуты
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api", commentsRouter);

// Тестовый роут
app.get("/", (req, res) => {
  res.json({ message: "Блог API работает!" });
});

// Запуск
async function start() {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
  });
}

start();