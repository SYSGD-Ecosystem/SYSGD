import {
  Copy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
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

interface Token {
  id: string;
  token_type: "github" | "gemini" | "replicate";
  created_at: string;
  updated_at: string;
}

const TokenManagement = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [tokenType, setTokenType] = useState<"github" | "gemini" | "replicate">("gemini");
  const [tokenValue, setTokenValue] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [externalToken, setExternalToken] = useState("");
  const [externalTokenLoading, setExternalTokenLoading] = useState(false);
  const [showExternalToken, setShowExternalToken] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<Token | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await api.get<Token[]>("/api/tokens");
      setTokens(response.data);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los tokens",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = async () => {
    if (!tokenValue.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El token no puede estar vacío",
      });
      return;
    }

    setSaving(true);
    try {
      await api.post("/api/tokens", {
        token: tokenValue,
        tokenType: tokenType,
      });

      toast({
        title: "Token guardado",
        description: "El token se ha guardado correctamente",
      });

      // Reset form
      setTokenValue("");
      setShowToken(false);

      // Refresh tokens
      await fetchTokens();
    } catch (error: any) {
      console.error("Error saving token:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "No se pudo guardar el token",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateExternalToken = async () => {
    setExternalTokenLoading(true);
    try {
      const response = await api.post<{ token: string }>("/api/auth/external-token");
      setExternalToken(response.data.token);
      setShowExternalToken(true);
      toast({
        title: "Token generado",
        description: "Ya puedes copiarlo para usarlo en apps externas.",
      });
    } catch (error: any) {
      console.error("Error generating external token:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "No se pudo generar el token externo",
      });
    } finally {
      setExternalTokenLoading(false);
    }
  };

  const handleCopyExternalToken = async () => {
    if (!externalToken) return;
    try {
      await navigator.clipboard.writeText(externalToken);
      toast({
        title: "Token copiado",
        description: "Pégalo en tu app externa para autenticarte.",
      });
    } catch (error) {
      console.error("Error copying token:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar el token.",
      });
    }
  };

  const handleDeleteToken = async () => {
    if (!tokenToDelete) return;

    try {
      await api.delete(`/api/tokens/${tokenToDelete.id}`);

      toast({
        title: "Token eliminado",
        description: "El token se ha eliminado correctamente",
      });

      setDeleteDialogOpen(false);
      setTokenToDelete(null);
      await fetchTokens();
    } catch (error) {
      console.error("Error deleting token:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el token",
      });
    }
  };

  const getTokenTypeColor = (type: string) => {
    switch (type) {
      case "github":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "gemini":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "replicate":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTokenTypeDescription = (type: string) => {
    switch (type) {
      case "github":
        return "Para integración con GitHub repositories";
      case "gemini":
        return "Para usar tu propia API key de Google Gemini";
      case "replicate":
        return "Para usar tu propia API key de Replicate";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Tokens</h1>
        <p className="text-muted-foreground mt-2">
          Configura tus propios tokens API para usar servicios externos
        </p>
      </div>

      {/* Add/Update Token */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar o Actualizar Token
          </CardTitle>
          <CardDescription>
            Configura tus propias API keys para servicios externos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token-type">Tipo de Token</Label>
            <Select
              value={tokenType}
              onValueChange={(value: any) => setTokenType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini API</SelectItem>
                <SelectItem value="github">GitHub Token</SelectItem>
                <SelectItem value="replicate">Replicate API</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getTokenTypeDescription(tokenType)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-value">Token / API Key</Label>
            <div className="relative">
              <Input
                id="token-value"
                type={showToken ? "text" : "password"}
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                placeholder="Ingresa tu token aquí..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSaveToken}
            disabled={saving || !tokenValue.trim()}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Token
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* External Token */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Token para Apps Externas
          </CardTitle>
          <CardDescription>
            Genera un token para autenticarte desde apps móviles, escritorio o
            integraciones externas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="external-token">Token de acceso</Label>
            <div className="relative">
              <Input
                id="external-token"
                type={showExternalToken ? "text" : "password"}
                value={externalToken}
                readOnly
                placeholder="Genera tu token para copiarlo aquí"
                className="pr-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-9 top-0 h-full px-2"
                onClick={() => setShowExternalToken(!showExternalToken)}
                disabled={!externalToken}
              >
                {showExternalToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={handleCopyExternalToken}
                disabled={!externalToken}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Úsalo cuando te autenticas con Google en la web y necesitas acceso
              en tu teléfono u otros sistemas.
            </p>
          </div>

          <Button
            onClick={handleGenerateExternalToken}
            disabled={externalTokenLoading}
            className="w-full"
          >
            {externalTokenLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar token externo"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Tokens Configurados
          </CardTitle>
          <CardDescription>
            Tokens que has configurado en tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes tokens configurados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getTokenTypeColor(token.token_type)}>
                        {token.token_type.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getTokenTypeDescription(token.token_type)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Actualizado:{" "}
                      {new Date(token.updated_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTokenToDelete(token);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">¿Por qué usar tokens propios?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              • Usa tus propios límites de API sin consumir créditos de la
              plataforma
            </p>
            <p>• Control total sobre tu uso y costos</p>
            <p>• Ideal para usuarios con alto volumen de uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Tus tokens están encriptados en nuestra base de datos</p>
            <p>• Solo tú tienes acceso a ellos</p>
            <p>• Puedes eliminarlos en cualquier momento</p>
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar token?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El token{" "}
              <span className="font-semibold">
                {tokenToDelete?.token_type.toUpperCase()}
              </span>{" "}
              será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteToken}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TokenManagement;
