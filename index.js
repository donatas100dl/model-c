import express, { json } from "express"
import roomRouter from "./router/rooms/roomRouter.js"
import dotenv from "dotenv"
import OpenAI from 'openai';


dotenv.config();

const app = express()
app.use(express.json())
app.get("/", (req, res) => {
    res.send("Hello")
})


app.listen(4000, () => {
    console.log("app is runing on port hhtp://localhost:4000")
})


app.use("/api/v1/",roomRouter)



