import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { pool } from "./db";
import { verifyToken } from "./middlewares/auth-jwt";

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_HOST || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

    console.log("Socket handshake auth:", socket.handshake.auth);
    console.log("Socket handshake headers:", socket.handshake.headers);
    console.log("Token extracted:", token ? "present" : "missing");

    if (!token) {
      console.log("No token provided, rejecting connection");
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = verifyToken(token) as { id: string; email: string } | null;
      if (!decoded) {
        console.log("Token verification failed");
        return next(new Error("Invalid token"));
      }
      socket.data.userId = decoded.id;
      socket.data.email = decoded.email;
      console.log("User authenticated:", decoded.email);
      next();
    } catch (err) {
      console.error("Token verification error:", err);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.data.email} (${socket.id})`);

    socket.on("join_conversation", async (conversationId: string) => {
      try {
        const membership = await pool.query(
          `SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`,
          [conversationId, socket.data.userId]
        );

        if (membership.rowCount === 0) {
          socket.emit("error", { message: "No tienes acceso a esta conversación" });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.data.email} joined conversation ${conversationId}`);
      } catch (err) {
        console.error("Error joining conversation:", err);
        socket.emit("error", { message: "Error al unirse a la conversación" });
      }
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.data.email} left conversation ${conversationId}`);
    });

    socket.on("typing", ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        conversationId,
        userId: socket.data.userId,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.data.email}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitNewMessage(conversationId: string, message: unknown) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit("new_message", message);
  }
}

export function emitConversationUpdate(conversationId: string, data: unknown) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit("conversation_updated", data);
  }
}
