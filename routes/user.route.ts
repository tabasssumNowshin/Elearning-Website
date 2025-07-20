import express from 'express';
import { activateUser, getUserInfo, loginUser, logoutUser, registrationUser, updateAccessToken } from '../models/user.controller'; 
import { IsAuthenticated } from '../middleware/auth';


const userRouter = express.Router();

userRouter.post('/registration', registrationUser);
userRouter.post('/activateuser', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout',IsAuthenticated,logoutUser);
userRouter.get('/refresh',updateAccessToken);
userRouter.get('/me',IsAuthenticated,getUserInfo);


export default userRouter;
