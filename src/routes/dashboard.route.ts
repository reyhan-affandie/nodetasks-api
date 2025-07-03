import express from "express";
import * as ControllersEngine from "@/controllers/dashboard.controller";

const router = express.Router();

router.get("/", ControllersEngine.getDashboard);

export default router;
