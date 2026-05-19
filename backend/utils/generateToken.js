import jwt from "jsonwebtoken";

export const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

export const generateTemp2FAToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id, purpose: "2fa" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
};

export const verifyTemp2FAToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== "2fa") {
    throw new Error("Invalid 2FA session");
  }
  return decoded;
};
