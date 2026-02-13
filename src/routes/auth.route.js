import { Router } from "express";
import {
  login,
  logout,
  resendOTP,
  resetPassword,
  sendOTP,
  verifyOTP,
} from "../controllers/auth.controller.js";
import validate from "../utils/validate.js";
import {
  authSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOTPSchema,
} from "../schemas/auth.schema.js";

const authRouter = Router();

authRouter.post("/login", validate(authSchema), login);

authRouter.post("/logout", logout);

authRouter.post("/forgot-password", validate(forgotPasswordSchema), sendOTP);

authRouter.post("/verify-otp", validate(verifyOTPSchema), verifyOTP);

authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword,
);

authRouter.post("/resend-otp", resendOTP);

// authRouter.post("/resend-otp", validate(verifyOTPSchema), resendOTP);

export default authRouter;
