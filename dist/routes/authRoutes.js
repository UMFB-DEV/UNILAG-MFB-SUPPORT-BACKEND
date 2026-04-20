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
router.post("/login", (0, validate_1.default)(authValidation_1.loginSchema), authController_1.loginUser);
router.get("/me", authMiddleware_1.authenticate, authController_1.me);
exports.default = router;
