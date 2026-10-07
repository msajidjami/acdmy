import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

export interface AIDesignSession {
  userId: string;
  role: string;
  email?: string;
  name?: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or too short.");
  }
  return secret;
}

export function getToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");

  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }

  return request.cookies.get("token")?.value || null;
}

export function getSessionFromRequest(
  request: NextRequest
): AIDesignSession | null {
  const token = getToken(request);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & {
      userId?: string;
      id?: string;
      email?: string;
      role?: string;
      name?: string;
    };

    const userId = String(decoded.userId || decoded.id || decoded.sub || "");
    const role = String(decoded.role || "");

    if (!userId || !role) return null;

    return {
      userId,
      role,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

export function requireAdmin(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    return {
      ok: false as const,
      status: 401,
      error: "Authentication required.",
    };
  }

  if (session.role !== "admin") {
    return {
      ok: false as const,
      status: 403,
      error: "Admin access required.",
    };
  }

  return { ok: true as const, session };
}
