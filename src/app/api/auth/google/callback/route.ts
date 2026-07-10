import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  getOrCreateUserForGoogle,
  getExistingUserId,
  setUserIdCookie,
} from "@/lib/auth";
import { createApiCredential } from "@/lib/canonicalAuth";
import { isAllowedMobileReturnUrl } from "@/lib/mobileReturnUrl";

const STATE_COOKIE = "poly_oauth_state";
const MODE_COOKIE = "poly_oauth_mode";
const RETURN_TO_COOKIE = "poly_oauth_return_to";
const MOBILE_RETURN_TO_COOKIE = "poly_oauth_mobile_return_to";

const mobileApiScopes = [
  "orders:read",
  "orders:write",
  "fills:read",
  "account:read",
  "account:write",
  "markets:read",
] as const;

const appendMobileAuthParams = (returnTo: string, params: Record<string, string>) => {
  const target = new URL(returnTo);
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }
  return target.toString();
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const configuredBaseUrl = process.env.NEXTAUTH_URL?.trim();
  const baseUrl = configuredBaseUrl || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_oauth_failed`);
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const mode = cookieStore.get(MODE_COOKIE)?.value === "link" ? "link" : "login";
  const returnTo = cookieStore.get(RETURN_TO_COOKIE)?.value ?? null;
  const mobileReturnTo = cookieStore.get(MOBILE_RETURN_TO_COOKIE)?.value || null;
  cookieStore.set(STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(MODE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(RETURN_TO_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(MOBILE_RETURN_TO_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_not_configured`);
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_token_exchange`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
  };
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_no_access_token`);
  }

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  if (!profileRes.ok) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_profile_fetch`);
  }

  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!profile.sub) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_missing_sub`);
  }

  const currentUserId = await getExistingUserId();
  if (mode === "link" && !currentUserId) {
    return NextResponse.redirect(`${baseUrl}/login?error=link_requires_login`);
  }

  let userId: string;
  try {
    userId = await getOrCreateUserForGoogle({
      googleSub: profile.sub,
      email: profile.email?.toLowerCase() ?? null,
      name: profile.name ?? null,
      image: profile.picture ?? null,
      currentUserId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "google_link_failed";
    const code = encodeURIComponent(message.replace(/\s+/g, "_").toLowerCase());
    return NextResponse.redirect(`${baseUrl}/login?error=${code}`);
  }

  const provisionedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!provisionedUser) {
    return NextResponse.redirect(`${baseUrl}/login?error=user_provisioning_failed`);
  }

  await setUserIdCookie(userId);
  if (mobileReturnTo && isAllowedMobileReturnUrl(mobileReturnTo)) {
    const mobileCredential = await createApiCredential({
      userId,
      name: "Holiwyn Mobile Google",
      scopes: mobileApiScopes,
    });
    // `holiwynApiKey` is the mobile app credential. It is not a Google access
    // token; Google OAuth client credentials and token exchange remain here.
    return NextResponse.redirect(
      appendMobileAuthParams(mobileReturnTo, {
        googleAuth: "success",
        forcePortfolio: "1",
        forceRuntimePortfolioSync: "1",
        holiwynApiKey: mobileCredential.token,
        apiKey: mobileCredential.token,
      })
    );
  }

  const fallback = mode === "link" ? `${baseUrl}/?linked=google` : `${baseUrl}/`;
  const redirectTo = returnTo?.startsWith("/") ? `${baseUrl}${returnTo}` : fallback;
  return NextResponse.redirect(redirectTo);
}
