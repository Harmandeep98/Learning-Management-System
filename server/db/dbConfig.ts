import mongoose from "mongoose";
const dbUrl: string = process.env.MONGOURI || "";

const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl).then((data: any) => {
            data.connections.forEach((conect: any) => {
                console.log(`DB ${conect.name} connected successfully`)
            });
        })
    } catch (error: any) {
        console.error(error);
        setTimeout(() => {
            connectDB
        }, 5000);
    }
};

export default connectDB;