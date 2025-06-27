import { app } from "./app";
import connectDB from "./Utils/db";
require("dotenv").config()

// app.listen(process.env.PORT, ()=>{
//     console.log(`server is connected port  ${process.env.PORT}`)
// })
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is connected at port ${PORT}`);
    connectDB();
});
