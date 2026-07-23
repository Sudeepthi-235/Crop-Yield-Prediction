const jwt = require("jsonwebtoken");
const config = require("../config/env");

function auth(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        msg: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      msg: "Invalid token",
    });
  }
}

module.exports = auth;
