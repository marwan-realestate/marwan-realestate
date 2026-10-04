import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("hex");
}
