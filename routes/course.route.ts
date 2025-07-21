import express from "express";
import { editCourse, uploadCourse } from "../models/course.controller";
import { authorizeRoles, IsAuthenticated } from "../middleware/auth";

const courseRouter = express.Router();
courseRouter.post("/create-course", IsAuthenticated, authorizeRoles("admin"), uploadCourse)

courseRouter.put("/edit-course/:id", IsAuthenticated, authorizeRoles("admin"), editCourse)

export default courseRouter;