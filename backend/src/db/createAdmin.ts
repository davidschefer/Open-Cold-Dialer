import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { normalizeEmail, passwordValidationError } from "../auth/credentials.js";
import db from "./database.js";

const email = normalizeEmail(process.env.ADMIN_EMAIL);
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_FULL_NAME?.trim() || "Administrator";
const passwordError = passwordValidationError(password);

if (!email || passwordError || typeof password !== "string") {
  throw new Error(
    "Set ADMIN_EMAIL and a valid ADMIN_PASSWORD before running create-admin"
  );
}

const existing = db
  .prepare("SELECT id FROM profiles WHERE email = ? COLLATE NOCASE")
  .get(email);

if (existing) {
  throw new Error("An account with ADMIN_EMAIL already exists; it was not modified");
}

const passwordHash = bcrypt.hashSync(password, 12);
const id = uuid();
db.prepare(
  "INSERT INTO profiles (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, 'admin')"
).run(id, email, passwordHash, fullName);

console.log(`Created admin account for ${email}`);
