
import { app } from "./app";
import connectDB from "./Utils/db";

require("dotenv").config()

const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
    console.log(`Server is connected at port ${PORT}`);
    connectDB();
})

