import { createContext, useContext, useState, useEffect, useRef, useCallback, type PropsWithChildren } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export interface SocketMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  attachment_type: string | null;
  attachment_url: string | null;
  reply_to: string | null;
  created_at: string;
  sender_email?: string | null;
  sender_name?: string | null;
}

interface SocketContextValue {
  isConnected: boolean;
  socket: Socket | null;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: PropsWithChildren) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isConnecting = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Socket: Token from localStorage:", token ? "present" : "missing");
    
    if (!token) {
      console.warn("No token available for socket connection");
      return;
    }

    // Evitar múltiples conexiones
    if (isConnecting.current || socketRef.current?.connected) {
      console.log("Socket: Already connected or connecting, skipping");
      return;
    }

    isConnecting.current = true;
    console.log("Socket: Connecting with token:", token.substring(0, 20) + "...");
    
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current?.id);
      isConnecting.current = false;
      setIsConnected(true);
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent("socket-connected"));
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      window.dispatchEvent(new CustomEvent("socket-disconnected"));
    });

    socketRef.current.on("error", (error: { message: string }) => {
      console.error("Socket error:", error.message);
    });

    return () => {
      isConnecting.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join_conversation", conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_conversation", conversationId);
    }
  }, []);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing", { conversationId, isTyping });
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        socket: socketRef.current,
        joinConversation,
        leaveConversation,
        sendTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within SocketProvider");
  }
  return context;
}

// Hook para usar en componentes individuales (para recibir eventos)
export function useSocketEvents(options: {
  onNewMessage?: (message: SocketMessage) => void;
  onUserTyping?: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
}) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    if (options.onNewMessage) {
      socket.on("new_message", options.onNewMessage);
    }

    if (options.onUserTyping) {
      socket.on("user_typing", options.onUserTyping);
    }

    return () => {
      if (options.onNewMessage) {
        socket.off("new_message", options.onNewMessage);
      }
      if (options.onUserTyping) {
        socket.off("user_typing", options.onUserTyping);
      }
    };
  }, [socket, options]);
}
