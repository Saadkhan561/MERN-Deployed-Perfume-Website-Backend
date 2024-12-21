const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(400);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  console.log("in auth", req.body);
  if (req.body.role !== "admin") {
    return res.sendStatus(403);
  }
  next();
};

module.exports = { authenticateToken, isAdmin };
