import { CheckCircle2, KeyRound, Loader2, XCircle } from "lucide-react";
import { type FC, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

type ResetState = "idle" | "loading" | "success" | "error";

const ResetPassword: FC = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<ResetState>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!token) {
      setState("error");
      setMessage("El enlace de recuperación no es válido.");
      return;
    }

    if (password.length < 6) {
      setState("error");
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setState("error");
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await api.post<{ message?: string }>(
        "/api/verification/reset-password",
        {
          token,
          newPassword: password,
        },
      );

      setState("success");
      setMessage(
        response.data?.message || "Contraseña actualizada correctamente.",
      );
    } catch (error: any) {
      setState("error");
      setMessage(
        error?.response?.data?.error ||
          "No se pudo restablecer tu contraseña. Solicita un nuevo enlace.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Restablecer contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Define una nueva contraseña para tu cuenta.
          </p>
        </div>

        {state === "success" ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700">{message}</p>
            </div>
            <Button asChild className="w-full">
              <Link to="/login">Ir a iniciar sesión</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
              />
            </div>

            {state === "error" && message && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={state === "loading"}
              className="w-full"
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Actualizar contraseña"
              )}
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Volver a login</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
