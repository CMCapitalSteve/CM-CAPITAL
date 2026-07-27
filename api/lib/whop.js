const crypto = require("crypto");

const WHOP_API_BASE = "https://api.whop.com";
const WHOP_PUBLIC_API = "https://api.whop.com/api/v1";
const SESSION_COOKIE = "cm_whop_session";
const OAUTH_COOKIE = "cm_whop_oauth";

const PRODUCTS = {
  academy: process.env.WHOP_PRODUCT_ACADEMY || "prod_6uCRaYVbbZGDo",
  paidDiscord: process.env.WHOP_PRODUCT_PAID_DISCORD || "prod_iBe8QfjjJFpPI",
  free: process.env.WHOP_PRODUCT_FREE || "prod_so7e07Zy82gMy",
  ebook: process.env.WHOP_PRODUCT_EBOOK || ""
};

function appUrl() {
  return (process.env.APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || "").replace(/\/$/, "");
}

function redirectUri() {
  return `${appUrl()}/api/auth/callback`;
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomString(bytes = 32) {
  return base64url(crypto.randomBytes(bytes));
}

function sha256(value) {
  return base64url(crypto.createHash("sha256").update(value).digest());
}

function secret() {
  return process.env.SESSION_SECRET || process.env.WHOP_CLIENT_SECRET || "cm-capital-dev-secret";
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function encodeSignedCookie(payload) {
  const value = base64url(JSON.stringify(payload));
  return `${value}.${sign(value)}`;
}

function decodeSignedCookie(value) {
  if (!value || !value.includes(".")) return null;
  const [body, signature] = value.split(".");
  const expected = sign(body);
  if (!signature || signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((cookies, part) => {
    const index = part.indexOf("=");
    if (index === -1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function cookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax"];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join("; ");
}

function clearCookie(name) {
  return cookie(name, "", { maxAge: 0 });
}

function setJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

async function exchangeToken(body) {
  const payload = {
    client_id: process.env.WHOP_CLIENT_ID,
    ...body
  };

  if (process.env.WHOP_USE_CLIENT_SECRET === "true") {
    payload.client_secret = process.env.WHOP_CLIENT_SECRET;
  }

  const response = await fetch(`${WHOP_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error_description || data.error || `Whop token request failed with ${response.status}`);
  }
  return data;
}

async function refreshSession(session) {
  if (!session?.refresh_token) return null;
  const refreshed = await exchangeToken({
    grant_type: "refresh_token",
    refresh_token: session.refresh_token
  });
  return {
    ...session,
    ...refreshed,
    obtained_at: Date.now()
  };
}

function tokenExpiresSoon(session) {
  if (!session?.expires_in || !session?.obtained_at) return false;
  return Date.now() > session.obtained_at + session.expires_in * 1000 - 5 * 60 * 1000;
}

async function getUserInfo(accessToken) {
  const response = await fetch(`${WHOP_API_BASE}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || `Failed to load Whop user: ${response.status}`);
  return data;
}

async function checkAccess(accessToken, userId, resourceId) {
  if (!resourceId) return { has_access: false, access_level: "missing_product_id" };
  const response = await fetch(`${WHOP_PUBLIC_API}/users/${encodeURIComponent(userId)}/access/${encodeURIComponent(resourceId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { has_access: false, access_level: "error", error: data };
  return data;
}

async function readSession(req, res) {
  const cookies = parseCookies(req);
  let session = decodeSignedCookie(cookies[SESSION_COOKIE]);
  if (session && tokenExpiresSoon(session)) {
    session = await refreshSession(session);
    res.setHeader("Set-Cookie", cookie(SESSION_COOKIE, encodeSignedCookie(session), { maxAge: 60 * 60 * 24 * 30 }));
  }
  return session;
}

module.exports = {
  OAUTH_COOKIE,
  SESSION_COOKIE,
  PRODUCTS,
  appUrl,
  redirectUri,
  randomString,
  sha256,
  encodeSignedCookie,
  decodeSignedCookie,
  parseCookies,
  cookie,
  clearCookie,
  setJson,
  exchangeToken,
  getUserInfo,
  checkAccess,
  readSession
};
