import express from "express";
import * as ControllersEngine from "@/controllers/roles.controller";

const router = express.Router();

router.get("/", ControllersEngine.get);
router.get("/:id", ControllersEngine.getOne);
router.post("/", ControllersEngine.create);
router.patch("/", ControllersEngine.update);
router.patch("/status", ControllersEngine.status);
router.delete("/", ControllersEngine.del);
router.delete("/bulk", ControllersEngine.bulkDel);

export default router;
