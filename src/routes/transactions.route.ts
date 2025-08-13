import express from "express";
import * as ControllersEngine from "@/controllers/transactions.controller";
import { multerMiddlewareImageFile, ensureBodyExists } from "@/middleware/multer.middleware";

const router = express.Router();

router.get("/", ControllersEngine.get);
router.get("/:id", ControllersEngine.getOne);
router.post("/", multerMiddlewareImageFile, ensureBodyExists, ControllersEngine.create);
router.patch("/phase", ControllersEngine.stage);
router.patch("/", multerMiddlewareImageFile, ensureBodyExists, ControllersEngine.update);
router.delete("/", ControllersEngine.del);
router.delete("/bulk", ControllersEngine.bulkDel);

export default router;
