import { FC } from "react";
import Button from "./Button";

const AlertDialog: FC<{
  message: string;
  onClick: () => void;
  onCancel: () => void;
}> = ({ message, onClick, onCancel }) => {
  return (
      <div className="w-80 h-48 relative bg-white dark:bg-slate-900 overflow-hidden rounded px-2 py-4 flex items-center flex-col gap-2 shadow-xl before:absolute before:w-32 before:h-20 before:right-2 before:bg-rose-300 dark:before:bg-rose-700 before:-z-10 before:rounded-full before:blur-xl before:-top-12 z-10 after:absolute after:w-24 after:h-24 after:bg-purple-300 dark:after:bg-rose-600/50 after:-z-10 after:rounded-full after:blur after:-top-12 after:-right-6">
        <div className="flex flex-col size-full">
          <div className="size-full p-2 text-center flex items-center justify-center text-lg">
            {message}
          </div>
          <div className="w-full text-center flex gap-2 justify-center">
            <Button
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              onClick={onClick}
            >
              Aceptar
            </Button>
          </div>
        </div>
      </div>
  );
};

export default AlertDialog;
