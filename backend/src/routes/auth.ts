import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import db from "../db/database.js";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth.js";
import { isBcryptHash, normalizeEmail, passwordValidationError } from "../auth/credentials.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!isPublicSignupEnabled()) {
      res.status(403).json({ error: "Public signup is disabled" });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }

    const passwordError = passwordValidationError(password);
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }

    const existing = db
      .prepare("SELECT id FROM profiles WHERE email = ? COLLATE NOCASE")
      .get(normalizedEmail);
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const id = uuid();
    const passwordHash = await bcrypt.hash(password, 12);
    const normalizedFullName =
      typeof fullName === "string" && fullName.trim() ? fullName.trim() : null;

    // Recheck inside a synchronous transaction after hashing so two concurrent
    // requests cannot both pass the earlier existence check.
    const accountCreated = db.transaction(() => {
      const duplicate = db
        .prepare("SELECT id FROM profiles WHERE email = ? COLLATE NOCASE")
        .get(normalizedEmail);
      if (duplicate) return false;

      db.prepare(
        "INSERT INTO profiles (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, 'agent')"
      ).run(id, normalizedEmail, passwordHash, normalizedFullName);
      return true;
    })();

    if (!accountCreated) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const token = generateToken(id);
    res.json({
      user: {
        id,
        email: normalizedEmail,
        fullName: normalizedFullName,
        role: "agent",
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || typeof password !== "string") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = db
      .prepare(
        "SELECT id, email, full_name, role, password_hash FROM profiles WHERE email = ? COLLATE NOCASE"
      )
      .get(normalizedEmail) as any;

    if (!user || !isBcryptHash(user.password_hash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch {
    // bcrypt.compare also rejects malformed hashes; never expose internal auth
    // details to clients.
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare("SELECT * FROM profiles WHERE id = ?").get(req.userId!) as any;
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
  });
});

export default router;

function isPublicSignupEnabled(): boolean {
  const configured = process.env.ALLOW_PUBLIC_SIGNUP?.trim().toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;

  // Development remains convenient, while production is deny-by-default.
  return process.env.NODE_ENV !== "production";
}
