import express from "express";
import * as ControllersEngine from "@/controllers/clients.controller";
import { multerMiddlewareImage, ensureBodyExists } from "@/middleware/multer.middleware";

const router = express.Router();

router.get("/", ControllersEngine.get);
router.get("/:id", ControllersEngine.getOne);
router.post("/", multerMiddlewareImage, ensureBodyExists, ControllersEngine.create);
router.patch("/", multerMiddlewareImage, ensureBodyExists, ControllersEngine.update);
router.delete("/", ControllersEngine.del);
router.delete("/bulk", ControllersEngine.bulkDel);

export default router;
