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

const userRouter = Router();

userRouter.get("/", getUsers);

userRouter.get("/:id", getSingleUser);

userRouter.get("/lookup", getUserLookup);

userRouter.post("/", validate(userSchema), createUser);

userRouter.put("/:id", updateUser);

userRouter.delete("/:id", deleteUser);

export default userRouter;
