import React, { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  type: "positive" | "negative" | "neutral";
}

interface ToastContextProps {
  toasts: Toast[];
  addToast: (
    message: string,
    type: "positive" | "negative" | "neutral"
  ) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    message: string,
    type: "positive" | "negative" | "neutral"
  ) => {
    const id = Math.random();
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: number) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-5 right-5 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-white font-light text-lg flex items-center ${
              toast.type === "positive"
                ? "bg-green-500"
                : toast.type === "negative"
                ? "bg-red-500"
                : "bg-slate-500"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
