const {
  OAUTH_COOKIE,
  appUrl,
  redirectUri,
  randomString,
  sha256,
  encodeSignedCookie,
  cookie
} = require("../lib/whop");

module.exports = async function handler(req, res) {
  if (!process.env.WHOP_CLIENT_ID || !process.env.WHOP_CLIENT_SECRET || !appUrl()) {
    res.statusCode = 500;
    res.end("Whop login is not configured yet.");
    return;
  }

  const state = randomString(24);
  const nonce = randomString(24);
  const codeVerifier = randomString(48);
  const next = typeof req.query?.next === "string" ? req.query.next : "/members/";
  const scope = "openid profile email member:basic:read access_pass:basic:read plan:basic:read";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.WHOP_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope,
    state,
    nonce,
    code_challenge: sha256(codeVerifier),
    code_challenge_method: "S256"
  });

  res.setHeader("Set-Cookie", cookie(OAUTH_COOKIE, encodeSignedCookie({ state, nonce, codeVerifier, next }), { maxAge: 60 * 10 }));
  res.writeHead(302, { Location: `https://api.whop.com/oauth/authorize?${params}` });
  res.end();
};
