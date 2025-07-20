require('dotenv').config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "./user.model";
import { redis } from "../redis";
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import ejs, { Template } from "ejs";
import path from "path";


import ErrorHandler from "../Utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import sendMail from "../Utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../Utils/jwt";
import { getUserById } from "../services/user.service";


// Register user
interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}
export const registrationUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    console.log("Received registration data:", req.body);
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
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode }
        const html = await ejs.renderFile(path.join(__dirname, "../mail/Activation-mail.ejs"), data);
        try {
            await sendMail({
                email: user.email,
                subject: 'activate your account',
                template: 'Activation-mail.ejs',
                data,

            })
            res.status(201).json({
                success: true,
                message: 'please check your email: $(user.email) to activate your account',
                activationToken: activationToken.token

            })

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400))


        }
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

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
// activate user
interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activation_token, activation_code } = req.body as IActivationRequest;

        const newUser: { user: IUser; activationCode: string } = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as { user: IUser; activationCode: string };

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid activation code", 400));
        }

        const { name, email, password } = newUser.user;

        const existUser = await userModel.findOne({ email });

        if (existUser) {
            return next(new ErrorHandler("Email already exist", 400));
        }
        const user = await userModel.create({
            name,
            email,
            password,
        })
        console.log("User created successfully:", user);
        res.status(201).json({
            success: true,
        })


    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

//login user
interface ILoginRequest {
    email: string;
    password: string;
}
export const loginUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body as ILoginRequest;

        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400));
        }

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }
        sendToken(user, 200, res)

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});


// logout user
export const logoutUser = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.cookie("access_token", "", { maxAge: 1 });
            res.cookie("refresh_token", "", { maxAge: 1 });
            const userId = req.user?._id || "";
            redis.del(userId);

            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);


// update access token
export const updateAccessToken = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token as string;
        const decoded = jwt.verify(refresh_token,
            process.env.REFRESH_TOKEN as string) as JwtPayload;

        const message = 'Could not refresh token';
        if (!decoded) {
            return next(new ErrorHandler(message, 400));
        }

        const session = await redis.get(decoded.id as string);

        if (!session) {
            return next(new ErrorHandler(message, 400));
        }

        const user = JSON.parse(session);

        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, {
            expiresIn: "5m"
        })
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, {
            expiresIn: "3d"
        })
        req.user=user;
        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        res.status(200).json({
            status: "success",
            accessToken,
        });



    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});



// get user info
export const getUserInfo = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;

            await getUserById(userId!, res);

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);
// social auth
interface ISocialAuthBody {
    email: string;
    name: string;
    avatar: string;
}


export const socialAuth = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, name, avatar } = req.body as ISocialAuthBody;
            const user = await userModel.findOne({ email });
            if (!user) {
                const newUser = await userModel.create({ email, name, avatar });
                sendToken(newUser, 200, res);
            } else {
                sendToken(user, 200, res);
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);
// update user info
interface IUpdateUserInfo {
    name?: string;
    email?: string;
}

export const updateUserInfo = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email } = req.body as IUpdateUserInfo;
            const userId = req.user?._id;
            const user = await userModel.findById(userId);

            if (email && user) {
                const isEmailExist = await userModel.findOne({ email });
                if (isEmailExist) {
                    return next(new ErrorHandler("Email already exist", 400));
                }
                user.email = email;
            }

            if (name && user) {
                user.name = name;
            }

            await user?.save();

            await redis.set(userId!, JSON.stringify(user));

            res.status(201).json({
                success: true,
                user,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);




