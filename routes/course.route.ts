import express from "express";
import { editCourse, getSingleCourse, uploadCourse } from "../models/course.controller";
import { authorizeRoles, IsAuthenticated } from "../middleware/auth";

const courseRouter = express.Router();
courseRouter.post("/create-course", IsAuthenticated, authorizeRoles("admin"), uploadCourse)

courseRouter.put("/edit-course/:id", IsAuthenticated, authorizeRoles("admin"), editCourse)
courseRouter.get("/get-course/:id", getSingleCourse)

export default courseRouter;