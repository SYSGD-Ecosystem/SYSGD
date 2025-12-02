import React, { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Verificar estado inicial de la ventana
    const checkMaximized = async () => {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isMaximized();
        setIsMaximized(maximized);
      }
    };
    
    checkMaximized();

    // Escuchar cambios de ventana (opcional, podrías agregar eventos desde main)
    const interval = setInterval(checkMaximized, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximize();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.close();
    }
  };

  // Solo mostrar en modo Electron
  if (!window.electronAPI) {
    return null;
  }

  return (
    <div className="flex items-center justify-between h-8 bg-background border-b border-border select-none drag-region">
      {/* Área de arrastre (título) */}
      <div className="flex-1 flex items-center px-4 drag-region">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="SYSGD" 
            className="w-5 h-5 rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <span className="text-sm font-medium text-foreground">SYSGD</span>
        </div>
      </div>

      {/* Controles de ventana */}
      <div className="flex no-drag-region">
        <button
          onClick={handleMinimize}
          className="h-8 w-12 flex items-center justify-center hover:bg-muted transition-colors rounded-tr-none"
          title="Minimizar"
        >
          <Minus className="w-4 h-4 text-foreground" />
        </button>
        
        <button
          onClick={handleMaximize}
          className="h-8 w-12 flex items-center justify-center hover:bg-muted transition-colors"
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          <Square className="w-3 h-3 text-foreground" />
        </button>
        
        <button
          onClick={handleClose}
          className="h-8 w-12 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors rounded-tl-none"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
