import express from "express";
import * as ControllersEngine from "@/controllers/auth.controller";
import { isAuth, redisLimiter15 } from "@/middleware/auth.middleware";
import { ensureBodyExists, multerMiddlewareImage } from "@/middleware/multer.middleware";

const router = express.Router();

router.post("/register", multerMiddlewareImage, ensureBodyExists, ControllersEngine.register);
router.post("/login", redisLimiter15, ControllersEngine.login);
router.post("/password/verify", redisLimiter15, ControllersEngine.sendForgotPasswordEmail);
router.patch("/password/forgot/", isAuth, ControllersEngine.forgotPassword);
router.patch("/password/update/", isAuth, ControllersEngine.updatePassword);
router.get("/", isAuth, ControllersEngine.get);
router.get("/refresh", isAuth, ControllersEngine.refresh);
router.get("/logout", isAuth, ControllersEngine.logout);

export default router;
