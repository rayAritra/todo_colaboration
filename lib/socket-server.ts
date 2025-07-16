import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"

let io: SocketIOServer

export function initializeSocket(server: HTTPServer) {
  if (!io) {
    io = new SocketIOServer(server, {
      path: "/api/socket",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })
  }

  return io
}

export function getSocket() {
  return io
}
