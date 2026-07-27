const {
  OAUTH_COOKIE,
  SESSION_COOKIE,
  redirectUri,
  decodeSignedCookie,
  encodeSignedCookie,
  parseCookies,
  cookie,
  clearCookie,
  exchangeToken
} = require("../lib/whop");

module.exports = async function handler(req, res) {
  const cookies = parseCookies(req);
  const oauth = decodeSignedCookie(cookies[OAUTH_COOKIE]);
  const code = req.query?.code;
  const state = req.query?.state;

  if (!oauth || !code || !state || oauth.state !== state) {
    res.writeHead(302, {
      Location: "/members/?auth=failed",
      "Set-Cookie": clearCookie(OAUTH_COOKIE)
    });
    res.end();
    return;
  }

  try {
    const tokens = await exchangeToken({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      code_verifier: oauth.codeVerifier
    });

    const session = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      obtained_at: Date.now()
    };

    res.writeHead(302, {
      Location: oauth.next || "/members/",
      "Set-Cookie": [
        clearCookie(OAUTH_COOKIE),
        cookie(SESSION_COOKIE, encodeSignedCookie(session), { maxAge: 60 * 60 * 24 * 30 })
      ]
    });
    res.end();
  } catch (error) {
    res.writeHead(302, {
      Location: `/members/?auth=failed&reason=${encodeURIComponent(error.message)}`,
      "Set-Cookie": clearCookie(OAUTH_COOKIE)
    });
    res.end();
  }
};
