import { Response } from "express";
import userModel from "../models/user.model";
import { redis } from "../redis";

// get user by id
export const getUserById = async (id: string, res: Response) => {
    const userJson = await redis.get(id);
    
    if (userJson) {
        const user = JSON.parse(userJson);
        res.status(201).json({
            success: true,
            user,
        });
    }
};