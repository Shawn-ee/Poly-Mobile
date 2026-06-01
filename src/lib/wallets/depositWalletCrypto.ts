import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { config, getDepositConfigIssues } from "@/lib/config";

const ALGORITHM = "aes-256-gcm";

function getKeyMaterial() {
  const secret = config.depositWalletEncryptionKey.trim();
  const { errors, warnings } = getDepositConfigIssues(process.env);
  if (!secret || errors.some((message) => message.includes("DEPOSIT_WALLET_ENCRYPTION_KEY"))) {
    console.error("[deposits] invalid_encryption_key", {
      warnings,
      errors,
    });
    throw new Error("Deposit wallet encryption key is invalid.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptPrivateKey(privateKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKeyMaterial(), iv);
  const ciphertext = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    alg: ALGORITHM,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: ciphertext.toString("base64"),
  });
}

export function decryptPrivateKey(payload: string) {
  const parsed = JSON.parse(payload) as {
    v: number;
    alg: string;
    iv: string;
    tag: string;
    data: string;
  };
  if (parsed.alg !== ALGORITHM) {
    throw new Error(`Unsupported deposit wallet encryption algorithm: ${parsed.alg}`);
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getKeyMaterial(),
    Buffer.from(parsed.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(parsed.data, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
