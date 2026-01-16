<<<<<<< HEAD
console.log("Write Routes in here");
=======
import { Router } from "express";
import {
     createAdmin,
     deleteAdmin,
     getAdmin,
     getAdmins,
     updateAdmin,
} from "../controllers/admin.controller.js";
import { adminSchema } from "../schemas/admin.schema.js";
import validateRequest from "../utils/validateRequest.js";

const adminRouter = Router();

adminRouter.get("/", getAdmins);

adminRouter.get("/:id", getAdmin);

adminRouter.post("/", validateRequest(adminSchema), createAdmin);

adminRouter.put("/:id", updateAdmin);

adminRouter.delete("/:id", deleteAdmin);

export default adminRouter;
>>>>>>> master
