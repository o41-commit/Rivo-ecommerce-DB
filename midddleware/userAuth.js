import jwt from "jsonwebtoken";

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.userId = null; // no user logged in
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    req.userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // store userId directly
  } catch (err) {
    req.userId = null;
  }

  next();
};