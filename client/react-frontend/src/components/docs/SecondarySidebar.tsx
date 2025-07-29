import type { FC } from "react";
import { twMerge } from "tailwind-merge";
import ToolBar from "../ToolBar";

const SecondarySidebar: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        "max-w-64 w-full h-full overflow-auto border-l dark:border-slate-700 bg-white dark:bg-slate-950 lg:flex flex-col gap-2 hidden",
        className ?? ""
      )}
    >
      <div className="flex size-full flex-col overflow-auto">
        <ToolBar className="w-full border-y justify-end" />
        <div className="flex flex-col gap-2 p-2">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <span role="img" aria-label="megafono">📢</span>
            ¡Hola, explorador documental!
          </h4>
          <p className="text-sm text-muted-foreground">
            Estás usando una versión <span className="font-bold">beta</span> de <span className="font-semibold">SYSGD</span>, lo que significa que aún estamos afinando muchos detalles bajo el capó.<br />
            Puede que algunas funciones no estén completas, otras cambien sin previo aviso… ¡y alguna que otra se rompa cuando menos lo esperas! <span role="img" aria-label="carita">😅</span>
          </p>
          <blockquote className="border-l-4 pl-3 italic text-muted-foreground">
            Agradecemos enormemente que formes parte del programa beta. Tu uso y tus comentarios nos ayudan a mejorar el sistema día a día.
          </blockquote>
          <p className="text-xs text-muted-foreground">
            Gracias por ser parte del inicio. Lo que hoy es beta, mañana será historia. <span role="img" aria-label="cohete">🚀</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecondarySidebar;
