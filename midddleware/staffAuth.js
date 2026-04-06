import jwt from "jsonwebtoken";

export const roleAuth = (allowedRoles = []) => (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  if (!authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Invalid token format" });

  const token = authHeader.split(" ")[1];
  // console.log(`Token_Start>>${token} << Token_End`)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; 

    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    console.error(error, "Error in roleAuth middleware");
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};