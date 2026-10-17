import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// Настройка multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Только изображения (jpeg, png, gif, webp)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ЗАГРУЗИТЬ ФАЙЛ (нужен токен)
router.post("/", authMiddleware, upload.single("file"), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "Файл не загружен" });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

export default router;