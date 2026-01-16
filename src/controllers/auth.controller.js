import { prisma } from "../config/db.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcrypt";

const login = async (req, res) => {
     const { email, password } = req.body;

     const admin = await prisma.admin.findUnique({ where: { email } });
     if (!admin) {
          return res.status(404).json({ message: "Admin not found" });
     }

     const isPasswordValid = await bcrypt.compare(password, admin.password);
     if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid password" });
     }

     // GENERATE JWT TOKEN
     const token = generateToken(admin.id, res);

     res.status(200).json({
          status: "success",
          message: "Admin logged in successfully",
          token,
     });
};

const logout = async (req, res) => {
     res.clearCookie("jwtToken", {
          httpOnly: true,
     });
     res.status(200).json({
          status: "success",
          message: "Admin logged out successfully",
     });
};

export { login, logout };
