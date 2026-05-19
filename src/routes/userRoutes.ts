import express from "express";
import { createUser, deactivateUser, listUsers, reactivateUser, updateUser } from "../controllers/userController";
import { authorize } from "../middleware/authMiddleware";
import validate from "../middleware/validate";
import { createUserSchema, updateUserSchema } from "../validations/userValidation";

const router = express.Router();

router.use(authorize("admin"));
router.get("/", listUsers);
router.post("/", validate(createUserSchema), createUser);
router.patch("/:id", validate(updateUserSchema), updateUser);
router.patch("/:id/deactivate", deactivateUser);
router.patch("/:id/reactivate", reactivateUser);

export default router;
