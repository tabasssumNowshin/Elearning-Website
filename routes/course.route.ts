import express from "express";
import { addAnswer, addQuestion, addReplyToReview, addReview, editCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse } from "../models/course.controller";
import { authorizeRoles, IsAuthenticated } from "../middleware/auth";

const courseRouter = express.Router();
courseRouter.post("/create-course", IsAuthenticated, authorizeRoles("admin"), uploadCourse)

courseRouter.put("/edit-course/:id", IsAuthenticated, authorizeRoles("admin"), editCourse)

courseRouter.get("/get-course/:id", getSingleCourse)
courseRouter.get("/get-courses", getAllCourses)
courseRouter.get("/get-course-content/:id",IsAuthenticated, getCourseByUser)
courseRouter.put("/add-question",IsAuthenticated,addQuestion)
courseRouter.put("/add-answer",IsAuthenticated,addAnswer)
courseRouter.put("/add-reviews/:id",IsAuthenticated,addReview)
courseRouter.put("/add-reply",IsAuthenticated,authorizeRoles("admin"),addReplyToReview)

export default courseRouter;