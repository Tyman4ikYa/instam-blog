import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { initDb, getDb, saveDb } from "./db";
import { hashPassword } from "./auth";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import commentsRouter from "./routes/comments";
import usersRouter from "./routes/users";
import adminRouter from "./routes/admin";
import uploadRouter from "./routes/upload";

const app = express();
const PORT = 4000;

// Создаём папку uploads, если её нет
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Статика для загруженных файлов
app.use("/uploads", express.static(UPLOADS_DIR));

// Роуты
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api", commentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter);

app.get("/", (req, res) => {
  res.json({ message: "InstAm API работает!" });
});

async function start() {
  await initDb();

  const db = getDb();

  // Создаём аккаунт разработчика
  const devCheck = db.exec("SELECT id FROM users WHERE email = ?", ["dev@instam.ru"]);
  if (devCheck.length === 0 || devCheck[0].values.length === 0) {
    const hash = await hashPassword("dev12345");
    db.run(
      "INSERT INTO users (name, username, email, password_hash, role, bio) VALUES (?, ?, ?, ?, ?, ?)",
      ["Разработчик", "dev", "dev@instam.ru", hash, "dev", "Создатель InstAm"]
    );
    saveDb();
    console.log("✅ Аккаунт разработчика создан: dev@instam.ru / dev12345");
  }

  app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
  });
}

start();