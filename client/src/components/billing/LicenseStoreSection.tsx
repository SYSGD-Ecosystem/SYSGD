import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  AlertCircle,
  Calendar,
  Crown,
  Zap,
  Monitor,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type PlanTier = "monthly" | "quarterly" | "annual";

interface LicenseRow {
  id: string;
  licenseKey: string;
  machineId: string;
  tier: PlanTier;
  issuedAt: string;
  expiresAt: string;
}

const plans: {
  id: PlanTier;
  name: string;
  duration: string;
  days: number;
  icon: typeof Zap;
  color: string;
  bg: string;
  border: string;
  highlight?: boolean;
}[] = [
  {
    id: "monthly",
    name: "Mensual",
    duration: "30 días",
    days: 30,
    icon: Zap,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  {
    id: "quarterly",
    name: "Trimestral",
    duration: "90 días",
    days: 90,
    icon: Calendar,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    highlight: true,
  },
  {
    id: "annual",
    name: "Anual",
    duration: "365 días",
    days: 365,
    icon: Crown,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function LicenseStoreSection() {
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(true);

  // Flujo de generación
  const [flowStep, setFlowStep] = useState<"idle" | "enter-code" | "choose-plan" | "done">("idle");
  const [requestCode, setRequestCode] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [codeError, setCodeError] = useState("");

  const fetchLicenses = async () => {
    try {
      const res = await api.get("/api/licenses");
      setLicenses(res.data.licenses ?? []);
    } catch {
      // silencioso
    } finally {
      setIsLoadingLicenses(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  // ── Validar que el request code no esté vacío antes de continuar ────────────
  const handleContinueWithCode = () => {
    if (!requestCode.trim()) {
      setCodeError("Pega el código que generó la aplicación de escritorio");
      return;
    }
    // Validación básica de formato base64url (no vacío, no espacios internos)
    const clean = requestCode.trim();
    if (clean.includes(" ") || clean.length < 20) {
      setCodeError("El código no parece válido. Cópialo completo desde la app.");
      return;
    }
    setCodeError("");
    setFlowStep("choose-plan");
  };

  // ── Generar licencia ─────────────────────────────────────────────────────────
  const handleGenerate = async (tier: PlanTier) => {
    setSelectedPlan(tier);
    setIsGenerating(true);
    try {
      const res = await api.post("/api/licenses/generate", {
        requestCode: requestCode.trim(),
        tier,
      });
      setGeneratedKey(res.data.licenseKey);
      setFlowStep("done");
      fetchLicenses();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      const message = e.response?.data?.error ?? "Error al generar la licencia";
      toast.error(message);
      // Si el código expiró, volver al paso del código
      if (message.includes("expirado") || message.includes("inválido")) {
        setFlowStep("enter-code");
        setRequestCode("");
      }
    } finally {
      setIsGenerating(false);
      setSelectedPlan(null);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setFlowStep("idle");
    setRequestCode("");
    setGeneratedKey("");
    setCodeError("");
  };

  if (isLoadingLicenses) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Monitor className="w-6 h-6" />
          SYSGD Desktop
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Licencias para activar la aplicación de escritorio
        </p>
      </div>

      {/* ── Flujo de activación ─────────────────────────────────────────────── */}
      <div className="border rounded-lg p-5 space-y-5">

        {/* IDLE: botón de inicio */}
        {flowStep === "idle" && (
          <div className="text-center space-y-4 py-4">
            <p className="text-gray-400">
              Para obtener una licencia, primero genera un código en la
              aplicación de escritorio y pégalo aquí.
            </p>
            <Button
              onClick={() => setFlowStep("enter-code")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              Obtener licencia
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* PASO 1: Pegar request code */}
        {flowStep === "enter-code" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="font-semibold">
                Pega el código de la aplicación de escritorio
              </h3>
            </div>

            <ol className="text-sm text-gray-400 space-y-1 pl-8 list-decimal">
              <li>Abre la aplicación SYSGD Desktop</li>
              <li>Ve a Configuración → Licencia → "Obtener código"</li>
              <li>Copia el código que aparece y pégalo aquí</li>
            </ol>

            <textarea
              className="w-full bg-muted border rounded-lg p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-600"
              rows={3}
              placeholder="Pega aquí el código de solicitud de la app..."
              value={requestCode}
              onChange={(e) => {
                setRequestCode(e.target.value);
                setCodeError("");
              }}
            />

            {codeError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{codeError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleContinueWithCode}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* PASO 2: Elegir plan */}
        {flowStep === "choose-plan" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-semibold">Elige tu plan</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <button
				  type="button"
                    key={plan.id}
                    onClick={() => handleGenerate(plan.id)}
                    disabled={isGenerating}
                    className={`
                      relative border rounded-lg p-4 text-left transition-all
                      hover:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500
                      ${plan.highlight ? "border-blue-500/50 bg-blue-500/5" : "border-border"}
                      ${isGenerating && selectedPlan === plan.id ? "opacity-60" : ""}
                      disabled:cursor-not-allowed
                    `}
                  >
                    {plan.highlight && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2">
                        Popular
                      </Badge>
                    )}
                    <div className={`w-9 h-9 ${plan.bg} rounded-full flex items-center justify-center mb-3`}>
                      {isGenerating && selectedPlan === plan.id ? (
                        <RefreshCw className={`w-4 h-4 ${plan.color} animate-spin`} />
                      ) : (
                        <Icon className={`w-4 h-4 ${plan.color}`} />
                      )}
                    </div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className={`text-sm ${plan.color}`}>{plan.duration}</p>
                  </button>
                );
              })}
            </div>

            <button
			type="button"
              onClick={() => setFlowStep("enter-code")}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Cambiar código
            </button>
          </div>
        )}

        {/* DONE: Mostrar la license key generada */}
        {flowStep === "done" && (
          <div className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500/30">
              <Check className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-400">
                ¡Licencia generada! Cópiala y pégala en la app de escritorio
                para activarla.
              </AlertDescription>
            </Alert>

            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Tu clave de licencia
              </p>
              <div className="flex items-start gap-3">
                <code className="flex-1 text-sm font-mono text-cyan-400 break-all leading-relaxed">
                  {generatedKey}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopyKey}
                  className="flex-shrink-0 mt-0.5"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Esta clave es válida solo para el dispositivo con el que generaste
              el código. Si cambias de equipo, necesitarás una nueva licencia.
            </p>

            <Button variant="outline" onClick={handleReset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generar otra licencia
            </Button>
          </div>
        )}
      </div>

      {/* ── Licencias activas del usuario ───────────────────────────────────── */}
      {licenses.length > 0 && (
        <div className="border rounded-lg p-5 space-y-4">
          <h3 className="font-semibold">Tus licencias</h3>
          <div className="space-y-3">
            {licenses.map((lic) => {
              const plan = plans.find((p) => p.id === lic.tier);
              const Icon = plan?.icon ?? Monitor;
              const daysLeft = Math.ceil(
                (new Date(lic.expiresAt).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              );
              const isExpired = daysLeft <= 0;
              return (
                <div
                  key={lic.id}
                  className="flex items-center justify-between bg-muted rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 ${plan?.bg ?? "bg-gray-500/10"} rounded-full flex items-center justify-center`}
                    >
                      <Icon className={`w-4 h-4 ${plan?.color ?? "text-gray-400"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {plan?.name ?? lic.tier} — {lic.machineId.substring(0, 8)}…
                      </p>
                      <p className="text-xs text-gray-500">
                        Expira:{" "}
                        {new Date(lic.expiresAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      isExpired
                        ? "text-red-500"
                        : daysLeft <= 7
                        ? "text-orange-400"
                        : plan?.color ?? "text-gray-400"
                    }`}
                  >
                    {isExpired ? "Expirada" : `${daysLeft}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}