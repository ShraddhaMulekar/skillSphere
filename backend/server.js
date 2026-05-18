import express from "express"
import cors from "cors"
import dotenv from 'dotenv'
import helmet from "helmet"
import { connectDB } from "./config/mongoDB.js"
import { authRoutes } from "./routes/authRoutes.js"

// Load env variables
dotenv.config()

const app = express()
const port = process.env.PORT || 8080

// Middlewares
app.use(helmet())
app.use(express.json())
app.use(cors())

app.use("/auth", authRoutes)

// Start server
app.listen(port, async ()=>{
    await connectDB()
    console.log(`Server is running on port http://localhost:${port}`)
})