import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { type FC, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

type VerifyState = "loading" | "success" | "error";

const VerifyEmail: FC = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Verificando tu cuenta...");

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        setState("error");
        setMessage("El enlace de verificación no es válido.");
        return;
      }

      try {
        const response = await api.post<{ message?: string }>(
          "/api/verification/verify-email",
          { token },
        );

        setState("success");
        setMessage(
          response.data?.message || "Tu cuenta fue verificada correctamente.",
        );
      } catch (error: any) {
        setState("error");
        setMessage(
          error?.response?.data?.error ||
            "No se pudo verificar tu cuenta. Solicita un nuevo enlace desde Ajustes.",
        );
      }
    };

    void runVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm space-y-4 text-center">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <h1 className="text-xl font-semibold">Verificando cuenta</h1>
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
            <h1 className="text-xl font-semibold">Cuenta verificada</h1>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="h-9 w-9 text-red-600" />
            <h1 className="text-xl font-semibold">No se pudo verificar</h1>
          </div>
        )}

        <p className="text-sm text-muted-foreground">{message}</p>

        <div className="pt-2">
          <Button asChild className="w-full">
            <Link to="/settings">Ir a Ajustes</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
