import { useState, useCallback } from "react";

type Status = "checking" | "online" | "offline";

const useConnection2 = (serverUrl: string) => {
  const [status, setStatus] = useState<Status>("checking");

  const checkServerStatus = useCallback(async () => {
    try {
      const res = await fetch(`${serverUrl}/api/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ok") {
          setStatus("online");
          return;
        }
      }
      setStatus("offline");
    } catch {
      setStatus("offline");
    }
  }, [serverUrl]);

  return { status, checkServerStatus };
};

export default useConnection2;
