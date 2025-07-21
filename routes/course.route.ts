import express from "express";
import { uploadCourse } from "../models/course.controller";
import { authorizeRoles, IsAuthenticated } from "../middleware/auth";

const courseRouter = express.Router();
courseRouter.post("/create-course", IsAuthenticated, authorizeRoles("admin"), uploadCourse)

export default courseRouter;