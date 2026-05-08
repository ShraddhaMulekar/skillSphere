import express from "express"
import cors from "cors"
import dotenv from 'dotenv'
import { connectDB } from "./config/mongoDB.js"
dotenv.config()

const app = express()
const port = process.env.PORT || 8080

app.use(express.json())
app.use(cors())

app.listen(port, ()=>{
    connectDB()
    console.log(`Server is running on port http://localhost:${port}`)
})