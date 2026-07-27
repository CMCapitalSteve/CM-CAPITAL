const {
  PRODUCTS,
  setJson,
  readSession,
  getUserInfo,
  checkAccess
} = require("../lib/whop");

module.exports = async function handler(req, res) {
  try {
    const session = await readSession(req, res);
    if (!session?.access_token) {
      setJson(res, 401, { authenticated: false });
      return;
    }

    const user = await getUserInfo(session.access_token);
    const userId = user.sub;
    const [academy, paidDiscord, free, ebook] = await Promise.all([
      checkAccess(session.access_token, userId, PRODUCTS.academy),
      checkAccess(session.access_token, userId, PRODUCTS.paidDiscord),
      checkAccess(session.access_token, userId, PRODUCTS.free),
      checkAccess(session.access_token, userId, PRODUCTS.ebook)
    ]);

    const access = {
      academy: Boolean(academy.has_access),
      discord: Boolean(academy.has_access || paidDiscord.has_access),
      free: Boolean(academy.has_access || paidDiscord.has_access || free.has_access),
      ebook: Boolean(academy.has_access || ebook.has_access)
    };

    setJson(res, 200, {
      authenticated: true,
      user: {
        id: user.sub,
        name: user.name || user.preferred_username || "C|M member",
        username: user.preferred_username || "",
        email: user.email || "",
        picture: user.picture || ""
      },
      access,
      rawAccess: { academy, paidDiscord, free, ebook },
      missing: {
        ebookProductId: !PRODUCTS.ebook
      }
    });
  } catch (error) {
    setJson(res, 500, {
      authenticated: false,
      error: "member_status_failed",
      message: error.message
    });
  }
};
