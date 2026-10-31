import { Router } from "express";
import { getUserProfile, updateUserProfile } from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);

export default router;
