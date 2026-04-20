import express from "express";
import { loginUser, me, registerUser } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";
import validate from "../middleware/validate";
import { loginSchema, registerSchema } from "../validations/authValidation";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/me", authenticate, me);

export default router;
