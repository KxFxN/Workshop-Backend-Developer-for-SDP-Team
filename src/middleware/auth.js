const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
  let token = null;
  if (req.headers.cookie) {
    const cookiePairs = req.headers.cookie.split(";");
    for (let pair of cookiePairs) {
      const [key, value] = pair.trim().split("=");
      if (key === "token") {
        token = value;
        break;
      }
    }
  }

  if (!token) {
    token = req.body.token || req.query.token || req.headers["x-access-token"];
  }

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const decoded = jwt.verify(token, config.TOKEN_KEY);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }

  next();
};

module.exports = verifyToken;
