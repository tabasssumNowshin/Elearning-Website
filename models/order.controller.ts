import { NextFunction, Request, Response } from "express";
import OrderModel, { IOrder } from "./orderModel";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../Utils/sendMail";
import NotificationModel from "./notificationModel";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../Utils/ErrorHandler";
import { newOrder } from "../services/order.service";

// create order
export const createOrder = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, payment_info } = req.body as IOrder;

        const user = await userModel.findById(req.user?._id);

        const courseExistInUser = user?.courses.some((course: any) => course._id.toString() === courseId);

        if (courseExistInUser) {
            return next(new ErrorHandler("You have already purchased this course", 400));
        }

        const course = await CourseModel.findById(courseId);

        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const data: any = {
            courseId: course._id,
            userId: user?._id,
        };
        newOrder(data, res, next);

        const mailData = {
            order: {
               _id: course?._id?.toString().slice(0, 6) ?? "",//ongodb object to string

                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}),
            }
        }

        const html = await ejs.renderFile(path.join(__dirname,'../mails/order-confirmation.ejs'),{order:mailData});

        try {
            if(user){
                await sendMail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        } catch (error:any) {
            return next(new ErrorHandler(error.message,500));
        }
 
        user?.courses?.push(course?._id?.toString() as any);


        await user?.save();

        await NotificationModel.create({
            user: user?._id,
            title:"New Order",
            message: `You have a new order from ${course?.name}`,
        });

        res.status(201).json({
            success:true,
            order: course,
        })
    }catch (error: any) {

        return next(new ErrorHandler(error.message, 500));
    }
});