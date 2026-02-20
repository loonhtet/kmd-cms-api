import { prisma } from "../config/db.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "../services/email.service.js";

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // GENERATE JWT TOKEN
    const token = generateToken(user.id, res);

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Could not login",
      error: error.message,
    });
  }
};

const logout = async (req, res) => {
  res.clearCookie("jwtToken", {
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
    message: "User logged out successfully",
  });
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Email does not exist",
      });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOTP: otp,
        resetOTPExpiry: otpExpiry,
      },
    });
    await sendEmail({
      to: user.email,
      type: "otp",
      variables: {
        otp,
        name: user.name,
      },
    });
    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        resetOTP: otp,
        resetOTPExpiry: { gte: new Date() },
      },
    });
    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired OTP",
      });
    }
    res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      data: { email: user.email },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Invalid or Expired OTP",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        resetOTP: otp,
        resetOTPExpiry: { gte: new Date() },
      },
    });
    if (!user) {
      return res.status(400).json({ message: "Something went wrong" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOTP: null,
        resetOTPExpiry: null,
      },
    });
    res.status(201).json({
      status: "success",
      message: "Password has been reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Could not reset password",
      error: error.message,
    });
  }
};

export { login, logout, sendOTP, verifyOTP, resetPassword };
