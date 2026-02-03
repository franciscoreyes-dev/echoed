import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import authRoutes from './routes/auth'
import { registerRoomHandlers } from './socket/roomHandlers'
import { registerPlayerHandlers } from './socket/playerHandlers'

const allowedOrigins: string[] = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://127.0.0.1:5173']

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
})

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use('/auth', authRoutes)

io.on('connection', (socket) => {
  registerRoomHandlers(io, socket)
  registerPlayerHandlers(io, socket)
})

const PORT: number = Number(process.env.PORT) || 3000

httpServer.listen(PORT, () => {
  console.log(`Echoed backend running on port ${PORT}`)
})
