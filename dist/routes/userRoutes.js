"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validate_1 = __importDefault(require("../middleware/validate"));
const userValidation_1 = require("../validations/userValidation");
const router = express_1.default.Router();
router.use((0, authMiddleware_1.authorize)("admin"));
router.get("/", userController_1.listUsers);
router.post("/", (0, validate_1.default)(userValidation_1.createUserSchema), userController_1.createUser);
router.patch("/:id", (0, validate_1.default)(userValidation_1.updateUserSchema), userController_1.updateUser);
router.patch("/:id/deactivate", userController_1.deactivateUser);
router.patch("/:id/reactivate", userController_1.reactivateUser);
exports.default = router;
