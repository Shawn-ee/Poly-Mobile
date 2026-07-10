import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const STATE_COOKIE = "poly_oauth_state";
const MODE_COOKIE = "poly_oauth_mode";
const RETURN_TO_COOKIE = "poly_oauth_return_to";
const MOBILE_RETURN_TO_COOKIE = "poly_oauth_mobile_return_to";

const parseMobileReturnTo = (value: string | null) => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "holiwyn:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID is not configured." },
      { status: 500 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const requestUrl = new URL(request.url);
  const mode = requestUrl.searchParams.get("mode") === "link" ? "link" : "login";
  const rawReturnTo = requestUrl.searchParams.get("returnTo");
  const mobileReturnTo = parseMobileReturnTo(requestUrl.searchParams.get("mobileReturnTo"));
  let returnToPath = "/";
  if (rawReturnTo) {
    try {
      const parsed = new URL(rawReturnTo, requestUrl.origin);
      if (parsed.origin === requestUrl.origin) {
        returnToPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      returnToPath = "/";
    }
  }
  const configuredBaseUrl = process.env.NEXTAUTH_URL?.trim();
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? configuredBaseUrl || requestUrl.origin
      : requestUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  cookieStore.set(MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  cookieStore.set(RETURN_TO_COOKIE, returnToPath, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  cookieStore.set(MOBILE_RETURN_TO_COOKIE, mobileReturnTo ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: mobileReturnTo ? 60 * 10 : 0,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
