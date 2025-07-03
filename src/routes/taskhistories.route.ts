import express from "express";
import * as ControllersEngine from "@/controllers/taskhistories.controller";

const router = express.Router();

router.get("/", ControllersEngine.get);
router.get("/:id", ControllersEngine.getOne);

export default router;
