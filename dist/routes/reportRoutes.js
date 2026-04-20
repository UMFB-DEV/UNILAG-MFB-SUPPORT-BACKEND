"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use((0, authMiddleware_1.authorize)("admin", "agent"));
router.get("/summary", reportController_1.summary);
router.get("/export", reportController_1.exportCsv);
exports.default = router;
