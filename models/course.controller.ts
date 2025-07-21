import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../Utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "./course.model";

// upload course
export const uploadCourse = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }
        createCourse(data, res, next);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// edit course
export const editCourse = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;

            const thumbnail = data.thumbnail;

            if (thumbnail) {
                await cloudinary.v2.uploader.destroy(thumbnail.public_id);

                const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });

                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }

            const courseId = req.params.id;

            const course = await CourseModel.findByIdAndUpdate(
                courseId,
                {
                    $set: data,
                },
                { new: true }
            );

            res.status(201).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
// get single course ---- without purchasing
export const getSingleCourse = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const course = await CourseModel.findById(req.params.id).select(
                "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
            );
            
            res.status(200).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);