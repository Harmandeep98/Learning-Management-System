require("dotenv").config();
import { app } from "./app";
import { v2 as cloudinary } from 'cloudinary';
import connectDB from "./db/dbConfig";

cloudinary.config({
    cloud_name: process.env.CLOUDINARYNAME,
    api_key: process.env.CLOUDINARYAPIKEY,
    api_secret: process.env.CLOUDINARYAPISECRET
})

app.listen(process.env.PORT, () => {
    console.log("server listening on port " + process.env.PORT);
    connectDB();
});