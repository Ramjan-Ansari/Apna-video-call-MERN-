import express from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import cors from "cors";
import dotenv from "dotenv";
import userRoute from "./routes/userRoutes.js"
import connectToSocket from './controllers/soketManager.js';

dotenv.config();
const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));

app.use("/api/v1/users", userRoute);

const start = async () => {
    const connectionDb = await mongoose.connect(`${process.env.MONGO_URL}/Zoom-clone`);
    console.log(`mongo connnection DB host: ${connectionDb.connection.host}` )
    server.listen(app.get("port"), ()=>{
        console.log("LISENING PORT 8000")
    })
}
start();