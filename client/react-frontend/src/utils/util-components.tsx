import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export const getStatusIcon = (status: string) => {
      switch (status) {
        case "Completado":
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case "En Progreso":
          return <Clock className="w-4 h-4 text-blue-500" />;
        case "Pendiente":
          return <AlertCircle className="w-4 h-4 text-yellow-500" />;
        default:
          return null;
      }
    };