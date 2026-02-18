import {
  CreditCard,
  KeyRound,
  Loader2,
  LogOut,
  Shield,
  Star,
  Wallet,
  Zap,
  TrendingUp,
  Calendar,
} from "lucide-react";
import type React from "react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import useCurrentUser from "../hooks/connection/useCurrentUser";
import useBillingData from "@/hooks/connection/useBillingData";

interface UserProfileDialogProps {
  trigger?: React.ReactNode;
}

interface UsageStats {
  projects: { current: number; limit: number; percentage: number };
  documents: { current: number; limit: number; percentage: number };
}

const UserProfileDialog: FC<UserProfileDialogProps> = ({ trigger }) => {
  const { user, loading } = useCurrentUser();
  const { billing } = useBillingData();
  const [open, setOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUsageStats();
    }
  }, [open, user]);

  const fetchUsageStats = async () => {
    setLoadingStats(true);
    try {
      const response = await api.get("/api/users/usage");
      setUsageStats(response.data.usage);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const getPrivilegeColor = (privilege: string) => {
    switch (privilege?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "moderator":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "user":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "free":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
      case "pro":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "vip":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "vip":
        return <Star className="h-4 w-4 fill-current" />;
      case "pro":
        return <Zap className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      localStorage.removeItem("token");
      setOpen(false);
      location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No disponible";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Contenido del dialog cuando está cargando
  const LoadingContent = () => (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-muted-foreground">
          Cargando datos del usuario...
        </span>
      </div>
    </div>
  );

  // Contenido del dialog cuando no hay usuario
  const NoUserContent = () => (
    <div className="text-center p-8">
      <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">Sesión expirada</h3>
      <p className="text-muted-foreground mb-4">
        Por favor, inicia sesión nuevamente
      </p>
      <Button asChild onClick={() => setOpen(false)}>
        <a href="/login">Iniciar sesión</a>
      </Button>
    </div>
  );

  // Contenido principal del perfil
  const ProfileContent = () => {
    if (!user || !billing) return <LoadingContent />;

    const creditsPercentage = billing.limits.max_projects === -1 
      ? 100 
      : Math.min((billing.ai_task_credits / 100) * 100, 100);

    return (
      <>
        <DialogHeader className="text-center pb-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-lg font-semibold bg-primary/10">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold">
                {user.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={getPrivilegeColor(user.privileges)}>
                <Shield className="h-3 w-3 mr-1" />
                {user.privileges.charAt(0).toUpperCase() + user.privileges.slice(1)}
              </Badge>
              <Badge className={getTierColor(billing.tier)}>
                {getTierIcon(billing.tier)}
                <span className="ml-1">
                  {billing.tier.charAt(0).toUpperCase() + billing.tier.slice(1)}
                </span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="usage">Uso</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Tab: General Overview */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Créditos AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {billing.ai_task_credits}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      disponibles
                    </span>
                  </div>
                  <Progress value={creditsPercentage} className="h-2" />
                  {(billing.plan_credits ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {billing.plan_credits} créditos del plan
                    </p>
                  )}
                  {billing.purchased_credits > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {billing.purchased_credits} créditos comprados
                    </p>
                  )}
                  {(billing.bonus_credits ?? []).length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {(billing.bonus_credits ?? []).reduce((acc, item) => acc + item.amount, 0)} créditos bono
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {billing.billing_cycle?.next_reset && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Próxima renovación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {formatDate(billing.billing_cycle.next_reset)}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Button
                className="w-full"
                variant="default"
                asChild
              >
                <Link to="/billing/purchase" onClick={() => setOpen(false)}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Comprar Créditos
                </Link>
              </Button>

              {billing.tier === "free" && (
                <Button
                  className="w-full"
                  variant="outline"
                  asChild
                >
                  <Link to="/billing/upgrade" onClick={() => setOpen(false)}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Actualizar Plan
                  </Link>
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Tab: Usage Stats */}
          <TabsContent value="usage" className="space-y-4">
            {loadingStats ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : usageStats ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Proyectos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{usageStats.projects.current}</span>
                        <span className="text-muted-foreground">
                          {usageStats.projects.limit === -1
                            ? "∞"
                            : `de ${usageStats.projects.limit}`}
                        </span>
                      </div>
                      {usageStats.projects.limit !== -1 && (
                        <Progress
                          value={usageStats.projects.percentage}
                          className="h-2"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Documentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{usageStats.documents.current}</span>
                        <span className="text-muted-foreground">
                          {usageStats.documents.limit === -1
                            ? "∞"
                            : `de ${usageStats.documents.limit}`}
                        </span>
                      </div>
                      {usageStats.documents.limit !== -1 && (
                        <Progress
                          value={usageStats.documents.percentage}
                          className="h-2"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>GitHub Integration</span>
                        <Badge variant={billing.limits.github_integration ? "default" : "secondary"}>
                          {billing.limits.github_integration ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Bank Ideas</span>
                        <Badge variant={billing.limits.bank_ideas ? "default" : "secondary"}>
                          {billing.limits.bank_ideas ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Chat</span>
                        <Badge variant={billing.limits.chat ? "default" : "secondary"}>
                          {billing.limits.chat ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Priority Support</span>
                        <Badge variant={billing.limits.priority_support ? "default" : "secondary"}>
                          {billing.limits.priority_support ? "✓" : "✗"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-center text-muted-foreground p-4">
                No se pudo cargar las estadísticas
              </p>
            )}
          </TabsContent>

          {/* Tab: Billing */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Plan Actual</CardTitle>
                <CardDescription>
                  {billing.tier === "free" && "Plan gratuito con límites básicos"}
                  {billing.tier === "pro" && "Plan Pro con features avanzados"}
                  {billing.tier === "vip" && "Plan VIP con todo ilimitado"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Proyectos</span>
                    <span className="font-medium">
                      {billing.limits.max_projects === -1 ? "∞" : billing.limits.max_projects}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Documentos</span>
                    <span className="font-medium">
                      {billing.limits.max_documents === -1 ? "∞" : billing.limits.max_documents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tareas por proyecto</span>
                    <span className="font-medium">
                      {billing.limits.max_task_per_projects === -1 ? "∞" : billing.limits.max_task_per_projects}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Miembros de equipo</span>
                    <span className="font-medium">
                      {billing.limits.max_team_members === -1 ? "∞" : billing.limits.max_team_members}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button className="w-full" variant="default" asChild>
                <Link to="/billing/purchase" onClick={() => setOpen(false)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Comprar con Crypto
                </Link>
              </Button>

              <Button className="w-full" variant="outline" asChild>
                <Link to="/settings/tokens" onClick={() => setOpen(false)}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Gestionar Tokens
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="space-y-2">
          {user.privileges.toLowerCase() === "admin" && (
            <Button
              variant="outline"
              className="w-full"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link to="/admin" className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                Administración
              </Link>
            </Button>
          )}

          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">Perfil</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {loading ? <LoadingContent /> : !user ? <NoUserContent /> : <ProfileContent />}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;