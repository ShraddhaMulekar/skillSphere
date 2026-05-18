import jwt from "jsonwebtoken";
import dotenv from "dotenv";    
dotenv.config();

export const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
}; 