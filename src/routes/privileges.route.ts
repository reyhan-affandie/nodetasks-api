import express from "express";
import * as ControllersEngine from "@/controllers/privileges.controller";

const router = express.Router();

router.get("/", ControllersEngine.get);
router.get("/:id", ControllersEngine.getOne);
router.post("/", ControllersEngine.create);
router.patch("/privilegeCreate", ControllersEngine.privilegeCreate);
router.patch("/privilegeRead", ControllersEngine.privilegeRead);
router.patch("/privilegeUpdate", ControllersEngine.privilegeUpdate);
router.patch("/privilegeDelete", ControllersEngine.privilegeDelete);
router.patch("/", ControllersEngine.update);
router.delete("/", ControllersEngine.del);
router.delete("/bulk", ControllersEngine.bulkDel);

export default router;
