import { useEffect } from "react";
import { useSignalR } from "@/hooks/useSignalR";
import { signalRService } from "@/services/signalRService";
import { toast } from "sonner";

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  useSignalR();

  useEffect(() => {
    const unsub = signalRService.onConnectionStatusChanged((status) => {
      if (status === "Connected") {
        toast.success("Live updates connected", { duration: 2000 });
      } else if (status === "Disconnected") {
        toast.error("Live updates disconnected");
      }
    });
    return unsub;
  }, []);

  return <>{children}</>;
}
