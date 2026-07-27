const { SESSION_COOKIE, clearCookie, parseCookies, decodeSignedCookie } = require("../lib/whop");

module.exports = async function handler(req, res) {
  const session = decodeSignedCookie(parseCookies(req)[SESSION_COOKIE]);

  if (session?.refresh_token && process.env.WHOP_CLIENT_ID) {
    await fetch("https://api.whop.com/oauth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: session.refresh_token,
        client_id: process.env.WHOP_CLIENT_ID,
        client_secret: process.env.WHOP_CLIENT_SECRET
      })
    }).catch(() => {});
  }

  res.writeHead(302, {
    Location: "/",
    "Set-Cookie": clearCookie(SESSION_COOKIE)
  });
  res.end();
};
