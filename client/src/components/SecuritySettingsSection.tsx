import { type FC, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";

interface TwoFactorStatus {
  enabled: boolean;
  mandatory: boolean;
  method: "email";
  emailVerified?: boolean;
}

interface VerificationStatus {
  verified: boolean;
  verifiedAt?: string | null;
}

const SUPPORT_WHATSAPP = "+5351158544";
const SUPPORT_MESSAGE = encodeURIComponent(
  "Hola, necesito ayuda con seguridad de mi cuenta en SYSGD.",
);

interface SecuritySettingsSectionProps {
  onAccountDeleted?: () => void;
}

const SecuritySettingsSection: FC<SecuritySettingsSectionProps> = ({
  onAccountDeleted,
}) => {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);
  const [twoFactorEnabledDraft, setTwoFactorEnabledDraft] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSending, setVerificationSending] = useState(false);
  const [securityPassword, setSecurityPassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    void fetchTwoFactorStatus();
    void fetchVerificationStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    setTwoFactorLoading(true);
    setSecurityError("");
    try {
      const response = await api.get<TwoFactorStatus>("/api/auth/2fa/status");
      setTwoFactorStatus(response.data);
      setTwoFactorEnabledDraft(response.data.enabled);
      if (typeof response.data.emailVerified === "boolean") {
        setEmailVerified(response.data.emailVerified);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
      setSecurityError("No se pudo cargar la configuración de seguridad.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    setVerificationLoading(true);
    try {
      const response = await api.get<VerificationStatus>("/api/verification/status");
      setEmailVerified(Boolean(response.data.verified));
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setVerificationSending(true);
    setSecurityError("");
    setSecurityMessage("");
    try {
      const response = await api.post<{ message?: string }>(
        "/api/verification/resend-verification",
      );
      setSecurityMessage(
        response.data?.message ||
          "Te enviamos un correo con el enlace para verificar tu cuenta.",
      );
    } catch (error: any) {
      setSecurityError(
        error?.response?.data?.error ||
          "No se pudo enviar el correo de verificación.",
      );
    } finally {
      setVerificationSending(false);
    }
  };

  const handleSaveTwoFactor = async () => {
    if (!securityPassword.trim()) {
      setSecurityError("Debes confirmar tu contraseña para actualizar 2FA.");
      return;
    }

    setTwoFactorSaving(true);
    setSecurityError("");
    setSecurityMessage("");
    try {
      const response = await api.put<{
        message: string;
        enabled: boolean;
        mandatory: boolean;
      }>("/api/auth/2fa/status", {
        enabled: twoFactorEnabledDraft,
        password: securityPassword,
      });

      setTwoFactorStatus({
        enabled: response.data.enabled,
        mandatory: response.data.mandatory,
        method: "email",
      });
      setTwoFactorEnabledDraft(response.data.enabled);
      setSecurityPassword("");
      setSecurityMessage(response.data.message || "Configuración actualizada.");
    } catch (error: any) {
      setSecurityError(
        error?.response?.data?.message ||
          "No se pudo actualizar la configuración de 2FA.",
      );
    } finally {
      setTwoFactorSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setSecurityError("Debes escribir tu contraseña para eliminar la cuenta.");
      return;
    }

    setDeleteLoading(true);
    setSecurityError("");
    try {
      await api.delete("/api/auth/account", {
        data: { password: deletePassword },
      });
      localStorage.removeItem("token");
      setDeleteDialogOpen(false);
      onAccountDeleted?.();
      window.location.href = "/login";
    } catch (error: any) {
      setSecurityError(
        error?.response?.data?.message || "No se pudo eliminar la cuenta.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      setSecurityError("Escribe tu correo para recuperar contraseña.");
      return;
    }

    setResetLoading(true);
    setSecurityError("");
    setSecurityMessage("");
    try {
      const response = await api.post<{ message?: string }>(
        "/api/verification/request-password-reset",
        {
          email: resetEmail.trim(),
        },
      );
      setSecurityMessage(
        response.data?.message ||
          "Si el correo está verificado, recibirás un enlace de recuperación.",
      );
    } catch (error: any) {
      const backendError = error?.response?.data?.error;
      const supportInfo = error?.response?.data?.support;
      if (supportInfo?.whatsapp) {
        setSecurityError(
          `${backendError || "No se pudo procesar la recuperación."} Soporte: ${supportInfo.whatsapp} (${supportInfo.responseTime || "72h hábiles"}).`,
        );
      } else {
        setSecurityError(
          backendError || "No se pudo procesar la recuperación de contraseña.",
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Doble Factor (2FA)</CardTitle>
          <CardDescription>
            Añade un segundo paso de verificación por correo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando configuración...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Activar 2FA en tu cuenta</p>
                  <p className="text-xs text-muted-foreground">
                    Método actual: correo electrónico
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabledDraft}
                  disabled={Boolean(twoFactorStatus?.mandatory) || !emailVerified}
                  onCheckedChange={setTwoFactorEnabledDraft}
                />
              </div>

              {!emailVerified && (
                <p className="text-xs text-amber-600">
                  Debes verificar tu correo para activar 2FA.
                </p>
              )}

              {twoFactorStatus?.mandatory && (
                <p className="text-xs text-amber-600">
                  En tu rol actual, 2FA es obligatorio y no se puede desactivar.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="security-password">Confirma tu contraseña</Label>
                <Input
                  id="security-password"
                  type="password"
                  value={securityPassword}
                  onChange={(e) => setSecurityPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                />
              </div>

              <Button
                onClick={handleSaveTwoFactor}
                disabled={twoFactorSaving || twoFactorLoading}
                className="w-full"
              >
                {twoFactorSaving ? "Guardando..." : "Guardar seguridad"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Verificación de correo</CardTitle>
          <CardDescription>
            Confirma tu correo electrónico para habilitar funciones sensibles como 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {verificationLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando estado...
            </div>
          ) : emailVerified ? (
            <p className="text-sm text-green-700">
              Tu correo está verificado.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Tu correo aún no está verificado. Te enviaremos un enlace para confirmar la cuenta.
              </p>
              <Button
                onClick={handleSendVerificationEmail}
                disabled={verificationSending}
                variant="outline"
                className="w-full"
              >
                {verificationSending ? "Enviando..." : "Enviar enlace de verificación"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recuperación de contraseña</CardTitle>
          <CardDescription>
            Solo disponible para correos verificados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Correo de tu cuenta</Label>
            <Input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <Button
            onClick={handlePasswordReset}
            disabled={resetLoading}
            variant="outline"
            className="w-full"
          >
            {resetLoading ? "Enviando..." : "Enviar enlace de recuperación"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Si tu correo no está verificado, escribe a soporte por WhatsApp:{" "}
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP.replace("+", "")}?text=${SUPPORT_MESSAGE}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {SUPPORT_WHATSAPP}
            </a>{" "}
            (respuesta en 72h hábiles).
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-sm text-red-600">Zona peligrosa</CardTitle>
          <CardDescription>
            Esta acción bloquea tu acceso y anonimiza la cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="delete-password">Confirma tu contraseña</Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Contraseña para eliminar cuenta"
            />
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteLoading}
          >
            Eliminar mi cuenta
          </Button>
        </CardContent>
      </Card>

      {securityMessage && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700">
          {securityMessage}
        </div>
      )}
      {securityError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
          {securityError}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Tu acceso se desactivará inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteLoading}>
              {deleteLoading ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecuritySettingsSection;
