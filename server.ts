
import { app } from "./app";
import{v2 as cloudinary} from "cloudinary"
import connectDB from "./Utils/db";

require("dotenv").config()
//cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY
})

const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
    console.log(`Server is connected at port ${PORT}`);
    connectDB();
})

 