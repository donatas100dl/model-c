import express, { json } from "express"
import roomRouter from "./router/rooms/roomRouter.js"
import reservationRouter from "./router/rooms/reservationRouter.js"
import { configDotenv } from "dotenv"
configDotenv.apply()

const app = express()
app.use(express.json())
app.get("/", (req, res) => {
    res.send("Hello")
})


app.listen(4000, () => {
    console.log("app is runing on port hhtp://localhost:4000")
})


app.use("/api/v1/rooms",roomRouter)
app.use("/api/v1/reservations",reservationRouter)



