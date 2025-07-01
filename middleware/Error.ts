import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../Utils/ErrorHandler";
            
export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal server error';

    // Wrong Mongoose Object ID Error (CastError)
    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // Duplicate key error (MongoDB)
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    }

    // Wrong JWT error
    if (err.name === 'JsonWebTokenError') {
        const message = 'JSON Web Token is invalid. Try Again!';
        err = new ErrorHandler(message, 400);
    }

    // JWT Expired error
    if (err.name === 'TokenExpiredError') {
        const message = 'JSON Web Token is expired. Try Again!';
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
