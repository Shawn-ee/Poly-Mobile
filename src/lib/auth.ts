import { cookies } from "next/headers";
import { createHmac, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

const COOKIE_NAME = "poly_session";
const LEGACY_COOKIE_NAME = "poly_user_id";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const getSessionSecret = () =>
  process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || "dev-insecure-secret";

const toBase64Url = (value: string) =>
  Buffer.from(value).toString("base64url");

const fromBase64Url = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const sign = (value: string) =>
  createHmac("sha256", getSessionSecret()).update(value).digest("base64url");

const encodeSession = (payload: { uid: string; exp: number }) => {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  return `${data}.${sign(data)}`;
};

const decodeSession = (token: string | undefined | null): { uid: string; exp: number } | null => {
  if (!token) return null;
  const [header, body, sig] = token.split(".");
  if (!header || !body || !sig) return null;
  const data = `${header}.${body}`;
  if (sign(data) !== sig) return null;
  const parsed = JSON.parse(fromBase64Url(body)) as { uid?: string; exp?: number };
  if (!parsed?.uid || !parsed?.exp) return null;
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return { uid: parsed.uid, exp: parsed.exp };
};

export const getUserId = async () => {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(COOKIE_NAME)?.value);
  if (session) return session.uid;
  return cookieStore.get(LEGACY_COOKIE_NAME)?.value ?? null;
};

export const getExistingUserId = async () => {
  const userId = await getUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (user) return user.id;

  // Clear stale cookies so downstream routes do not keep receiving a non-existent user id.
  await clearUserIdCookie();
  return null;
};

export const resolveAuthenticatedUser = async () => {
  const userId = await getUserId();
  if (!userId) {
    return { user: null, reason: "missing_session" as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });

  if (!user) {
    await clearUserIdCookie();
    return { user: null, reason: "missing_user_record" as const };
  }

  return { user, reason: null };
};

export const setUserIdCookie = async (userId: string) => {
  const cookieStore = await cookies();
  const token = encodeSession({
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  });
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
};

export const clearUserIdCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  cookieStore.set(LEGACY_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
};

const sanitizeUsername = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

const randomSuffix = () => randomBytes(3).toString("hex");

export const ensureUniqueUsername = async (baseInput: string) => {
  const base = sanitizeUsername(baseInput) || `user_${randomSuffix()}`;
  let candidate = base;
  let attempts = 0;
  while (attempts < 10) {
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
    candidate = `${base.slice(0, 18)}_${randomSuffix()}`;
    attempts += 1;
  }
  return `user_${randomSuffix()}_${randomSuffix()}`;
};

export const getOrCreateUserForGoogle = async (params: {
  googleSub: string;
  email: string | null;
  name: string | null;
  image: string | null;
  currentUserId: string | null;
}) => {
  const providerAccountId = params.googleSub;
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider: "google", providerAccountId },
    },
    include: { user: true },
  });
  if (existingAccount) {
    if (params.currentUserId && existingAccount.userId !== params.currentUserId) {
      throw new Error("Google account is already linked to another user.");
    }
    const updateData: {
      email?: string | null;
      displayName?: string | null;
      image?: string | null;
    } = {};
    if (params.email && existingAccount.user.email !== params.email) {
      updateData.email = params.email;
    }
    if (params.name && existingAccount.user.displayName !== params.name) {
      updateData.displayName = params.name;
    }
    if (
      params.image &&
      !existingAccount.user.hasCustomAvatar &&
      existingAccount.user.image !== params.image
    ) {
      updateData.image = params.image;
    }
    if (Object.keys(updateData).length) {
      await prisma.user.update({
        where: { id: existingAccount.userId },
        data: updateData,
      });
    }
    return existingAccount.userId;
  }

  const currentUser =
    params.currentUserId
      ? await prisma.user.findUnique({
          where: { id: params.currentUserId },
        })
      : null;

  if (params.currentUserId && currentUser) {
    const emailOwner =
      params.email
        ? await prisma.user.findUnique({ where: { email: params.email } })
        : null;
    await prisma.account.create({
      data: {
        userId: params.currentUserId,
        provider: "google",
        providerAccountId,
      },
    });
    await prisma.user.update({
      where: { id: params.currentUserId },
      data: {
        ...(params.email &&
        (!emailOwner || emailOwner.id === params.currentUserId)
          ? { email: params.email }
          : {}),
        ...(params.name ? { displayName: params.name } : {}),
        ...(params.image && currentUser && !currentUser.hasCustomAvatar
          ? {
              image: params.image,
            }
          : {}),
      },
    });
    return params.currentUserId;
  }

  const existingByEmail =
    params.email
      ? await prisma.user.findUnique({ where: { email: params.email } })
      : null;
  if (existingByEmail) {
    await prisma.account.create({
      data: {
        userId: existingByEmail.id,
        provider: "google",
        providerAccountId,
      },
    });
    const updateData: {
      displayName?: string | null;
      image?: string | null;
    } = {};
    if (params.name) updateData.displayName = params.name;
    if (params.image && !existingByEmail.hasCustomAvatar) updateData.image = params.image;
    if (Object.keys(updateData).length) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: updateData,
      });
    }
    return existingByEmail.id;
  }

  const base = params.email ? params.email.split("@")[0] : "user";
  const username = await ensureUniqueUsername(base || "user");
  const isAdmin =
    params.email ? config.adminEmails.includes(params.email.toLowerCase()) : false;
  const created = await prisma.user.create({
    data: {
      username,
      email: params.email,
      displayName: params.name,
      image: params.image,
      isAdmin,
      accounts: {
        create: {
          provider: "google",
          providerAccountId,
        },
      },
    },
  });
  return created.id;
};
