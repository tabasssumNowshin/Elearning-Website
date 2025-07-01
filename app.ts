require('dotenv').config()
import express, { NextFunction, Request, Response } from "express";
export const app = express();

import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/Error";


// body parser
app.use(express.json({limit: "50mb"}))

//cookie-parser
app.use(cookieParser());

//cors
app.use(cors({
    origin: process.env.ORIGIN 
}));

//TESTING API
app.get("/test",(req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "api is working",
    })

})

//unkonown route

app.all("/{*path}", (req: Request, res: Response, next: NextFunction) => {
  // Create a new Error object with a specific message
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404; // Set the status code for a "Not Found" error
  next(err); // Pass the error to the next error-handling middleware
});

app.use(ErrorMiddleware);

    
