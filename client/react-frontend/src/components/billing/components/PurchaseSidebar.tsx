import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Home,
} from "lucide-react";

type Section = "credits" | "plans" | "transactions" | "categories";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

interface PurchaseSidebarProps {
  navItems: NavItem[];
  activeSection: Section;
  setActiveSection: (section: Section) => void;
}

const PurchaseSidebar: FC<PurchaseSidebarProps> = ({
  navItems,
  activeSection,
  setActiveSection,
}) => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  return (
    <aside className="hidden md:flex w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-col">
      <div className="flex flex-col h-full p-4">
        {/* Volver al Dashboard */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={handleGoToDashboard}
          >
            <Home className="w-4 h-4 mr-3" />
            ← Volver al Dashboard
          </Button>
        </div>

        {/* Título sección */}
        <h3 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider mb-3">
          Billing & Suscripciones
        </h3>

        {/* Navegación principal */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className="w-full justify-start text-xs h-9 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setActiveSection(item.id as Section)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Configuración al final */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-xs h-9 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={handleGoToSettings}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuración General
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default PurchaseSidebar;