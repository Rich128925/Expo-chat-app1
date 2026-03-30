import express from "express"
import http from "http"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/db"
import authRotes from './routes/auth.routes'

dotenv.config()

const app = express()

// routes
app.use("/auth", authRotes);

// Connect to MongoDB
connectDB().then(()=> {
  console.log("✅ Database Connected");
  
  server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
})
})
.catch((error) => {
  console.log("Failed to connect to MongoDB", error)
})



app.use(express.json())
app.use(cors())

app.get("/", (req, res) => {
  res.send("Server is running")
})

const PORT = process.env.PORT || 4000;

const server = http.createServer(app)

