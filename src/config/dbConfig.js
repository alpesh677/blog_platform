import mongoose from "mongoose";
import { Blog } from "../models/blog.models.js";
import { DB_NAME,MONGO_URL } from "./serverConfig.js";

async function connectDB() {
    try {
        const connectionInstance = await mongoose.connect(`${MONGO_URL}/${DB_NAME}`);
        const count = await Blog.countDocuments();
        console.log("document in blog : ", count);
        console.log(`Connected to  database : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(`Error connecting to database: ${error}`);
        process.exit(1);
    }
}

export default connectDB;