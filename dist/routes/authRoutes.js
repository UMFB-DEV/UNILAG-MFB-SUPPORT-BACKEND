"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validate_1 = __importDefault(require("../middleware/validate"));
const authValidation_1 = require("../validations/authValidation");
const router = express_1.default.Router();
router.post("/register", (0, validate_1.default)(authValidation_1.registerSchema), authController_1.registerUser);
router.post("/register-agent", (0, validate_1.default)(authValidation_1.registerAgentSchema), authController_1.registerAgentUser);
router.post("/login", (0, validate_1.default)(authValidation_1.loginSchema), authController_1.loginUser);
router.post("/forgot-password", (0, validate_1.default)(authValidation_1.forgotPasswordSchema), authController_1.forgotPasswordUser);
router.post("/reset-password", (0, validate_1.default)(authValidation_1.resetPasswordSchema), authController_1.resetPasswordUser);
router.patch("/profile", authMiddleware_1.authenticate, (0, validate_1.default)(authValidation_1.updateProfileSchema), authController_1.updateProfileUser);
router.get("/me", authMiddleware_1.authenticate, authController_1.me);
exports.default = router;
