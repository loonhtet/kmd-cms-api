import { Router } from "express";
import {
  createUser,
  deleteUser,
  getSingleUser,
  getUsers,
  updateUser,
  getUserLookup,
} from "../controllers/user.controller.js";
import { userSchema } from "../schemas/user.schema.js";
import validate from "../utils/validate.js";
import { requireStaffOrAdmin } from "../middleware/permissionMiddleware.js";

const userRouter = Router();

userRouter.get("/", getUsers);

userRouter.get("/lookup", getUserLookup);

userRouter.get("/:id", getSingleUser);

userRouter.post("/", validate(userSchema), requireStaffOrAdmin, createUser);

userRouter.put("/:id", requireStaffOrAdmin, updateUser);

userRouter.delete("/:id", requireStaffOrAdmin, deleteUser);

export default userRouter;
