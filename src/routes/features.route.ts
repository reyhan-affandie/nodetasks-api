import express from "express";
import * as ControllersEngine from "@/controllers/features.controller";

const router = express.Router();

router.get("/", ControllersEngine.get);
router.get("/:id", ControllersEngine.getOne);
router.post("/", ControllersEngine.create);
router.patch("/featureCreate", ControllersEngine.featureCreate);
router.patch("/featureRead", ControllersEngine.featureRead);
router.patch("/featureUpdate", ControllersEngine.featureUpdate);
router.patch("/featureDelete", ControllersEngine.featureDelete);
router.patch("/", ControllersEngine.update);
router.delete("/", ControllersEngine.del);
router.delete("/bulk", ControllersEngine.bulkDel);

export default router;
