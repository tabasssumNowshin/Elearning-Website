require('dotenv').config();
import { Request, Response, NextFunction } from "express";
import userModel from "./user.model";

import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import ejs, { Template } from "ejs";
import path from "path";


import ErrorHandler from "../Utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import sendMail from "../Utils/sendMail";


// Register user
interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}
export const registrationUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        const isEmailExists = await userModel.findOne({ email });
        if (isEmailExists) {
            return next(new ErrorHandler("Email already exists", 400));
        }

        const user: IRegistrationBody = {
            name,
            email,
            password
        };

        const activationToken = createActivationToken(user);
        const activationCode= activationToken.activationCode;
        const data={user: {name: user.name},activationCode}
        const html =await ejs.renderFile(path.join(__dirname, "../mail/Activation-mail.ejs"),data);
        try{
            await sendMail({
                email: user.email,
                subject : 'activate your account',
                template :'Activation-mail.ejs',
                data,

            })
            res.status(201).json({
                success: true,
                message :'please check your email: $(user.email) to activate your account',
                activationToken:activationToken.token

            })

            }catch(error:any){
                return next(new ErrorHandler(error.message,400))
            

        }
    }
        catch(error:any){
            return next (new ErrorHandler(error.message,400))
        
        }
});
interface IActivationToken {
    token: string;
    activationCode: string;
}

const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign(
        {
            user,
            activationCode
        },
        process.env.ACTIVATION_SECRET as Secret,
        {
            expiresIn: "5m"
        }
    );

    return { token, activationCode };
};

