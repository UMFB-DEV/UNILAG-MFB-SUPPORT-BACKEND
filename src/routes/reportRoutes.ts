import express from "express";
import { exportCsv, summary } from "../controllers/reportController";
import { authorize } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authorize("admin", "agent"));
router.get("/summary", summary);
router.get("/export", exportCsv);

export default router;
