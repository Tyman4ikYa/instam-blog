import express from "express";
import cors from "cors";
import { initDb } from "./db";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import commentsRouter from "./routes/comments";
import usersRouter from "./routes/users";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Роуты
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api", commentsRouter);
app.use("/api/users", usersRouter);

app.get("/", (req, res) => {
  res.json({ message: "InstAm API работает!" });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
  });
}

start();