import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Code2, FileText, Github, HelpCircle, Zap } from "lucide-react";

type HelpCategoryId = "help" | "api" | "updates";

type HelpItem = {
  id: string;
  title: string;
  category: HelpCategoryId;
  summary: string;
  content: string[];
  icon: React.ReactNode;
};

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState<HelpCategoryId>("help");
  const [activeItemId, setActiveItemId] = useState<string>("getting-started");
  const [search, setSearch] = useState("");

  const categories = useMemo(
    () =>
      [
        { id: "help" as const, label: "Help", icon: <HelpCircle className="h-4 w-4" /> },
        { id: "api" as const, label: "API", icon: <Code2 className="h-4 w-4" /> },
        { id: "updates" as const, label: "Updates", icon: <Zap className="h-4 w-4" /> },
      ],
    []
  );

  const items = useMemo<HelpItem[]>(
    () => [
      {
        id: "getting-started",
        title: "Primeros pasos",
        category: "help",
        summary: "Qué es SYSGD y cómo empezar.",
        icon: <BookOpen className="h-4 w-4" />,
        content: [
          "SYSGD es un sistema para gestionar información y procesos documentales con seguridad y trazabilidad.",
          "",
          "Recomendado para comenzar:",
          "- Inicia sesión.",
          "- Crea/abre tu espacio de trabajo.",
          "- Organiza documentos y permisos.",
        ],
      },
      {
        id: "api-overview",
        title: "API overview",
        category: "api",
        summary: "Resumen rápido de endpoints.",
        icon: <Code2 className="h-4 w-4" />,
        content: [
          "La API está pensada principalmente para el cliente web.",
          "",
          "Endpoints (resumen):",
          "- /api/auth/*",
          "- /api/projects/*",
          "- /api/tasks/*",
          "- /api/github/*",
        ],
      },
      {
        id: "changelog",
        title: "Cambios recientes",
        category: "updates",
        summary: "Notas rápidas de versión.",
        icon: <FileText className="h-4 w-4" />,
        content: [
          "Aquí puedes mantener un changelog simple para los usuarios.",
          "",
          "Ejemplo:",
          "- Integración GitHub: repositorio por proyecto y token por usuario.",
          "- Tokens cifrados en BD.",
        ],
      },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    const base = items.filter((i) => i.category === activeCategory);
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (i) => i.title.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q)
    );
  }, [items, activeCategory, search]);

  const activeItem = useMemo(() => {
    return items.find((i) => i.id === activeItemId) || filteredItems[0] || items[0];
  }, [items, activeItemId, filteredItems]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Centro de ayuda</h1>
            <p className="text-muted-foreground mt-2">
              Categorías arriba, índice lateral y contenido por sección.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/landpage">Volver</Link>
          </Button>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={activeCategory === c.id ? "default" : "outline"}
              onClick={() => {
                setActiveCategory(c.id);
                const first = items.find((i) => i.category === c.id);
                if (first) setActiveItemId(first.id);
              }}
              className="gap-2"
            >
              {c.icon}
              {c.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <Card className="lg:col-span-4">
            <CardHeader className="space-y-3">
              <CardTitle className="text-base">Índice</CardTitle>
              <Input
                placeholder="Buscar en esta categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-2">
                  {filteredItems.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setActiveItemId(i.id)}
                      className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-muted ${
                        activeItemId === i.id ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{i.icon}</span>
                          <span className="font-medium">{i.title}</span>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {i.category.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{i.summary}</p>
                    </button>
                  ))}

                  {filteredItems.length === 0 && (
                    <div className="text-sm text-muted-foreground p-3">No hay resultados.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-muted-foreground">{activeItem.icon}</span>
                {activeItem.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeItem.content.map((line, idx) => (
                  <p key={`${activeItem.id}-${idx}`} className="text-sm leading-6">
                    {line}
                  </p>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Soporte: <a className="underline underline-offset-4" href="mailto:lazaroyunier96@gmail.com">lazaroyunier96@gmail.com</a>
                </div>
                <Button variant="outline" asChild className="gap-2">
                  <Link to="https://github.com/lazaroysr96/sysgd/" target="_blank">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
