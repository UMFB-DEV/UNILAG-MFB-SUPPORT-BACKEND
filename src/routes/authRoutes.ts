import express from "express";
import {
  forgotPasswordUser,
  loginUser,
  me,
  registerAgentUser,
  registerUser,
  resetPasswordUser,
  updateProfileUser,
} from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";
import validate from "../middleware/validate";
import {
  forgotPasswordSchema,
  loginSchema,
  registerAgentSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validations/authValidation";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/register-agent", validate(registerAgentSchema), registerAgentUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordUser);
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordUser);
router.patch("/profile", authenticate, validate(updateProfileSchema), updateProfileUser);
router.get("/me", authenticate, me);

export default router;
