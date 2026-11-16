import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { io, type Socket } from "socket.io-client";
import { useToast } from "../../components/ui/Toast";
import { getApiOrigin } from "../../lib/api";
import type { Notification } from "../../types";
import { useAuth } from "../auth/AuthContext";

interface RealtimeContextValue {
  socket: Socket | null;
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({ socket: null, connected: false });

export function RealtimeProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const client = io(getApiOrigin(), {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    client.on("connect", () => setConnected(true));
    client.on("disconnect", () => setConnected(false));
    client.on("notification:new", (notification: Notification) => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast(notification.title, { description: notification.message, tone: "info" });
    });
    client.on("message:new", () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    });
    client.on("application:status", () => {
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    setSocket(client);

    return () => {
      client.disconnect();
    };
  }, [user, queryClient, toast]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
