// @deprecated: Este componente se mantiene por compatibilidad pero no se recomienda su uso en nuevos desarrollos. Para la gestión de usuarios, roles y permisos, se recomienda utilizar el nuevo "Admin Panel" que ofrece una experiencia más completa y segura. Se planea migrar completamente las funciones de administración al nuevo proyecto "Admin Panel" y eliminar este componente en futuras versiones para evitar confusiones y mantener el código limpio.
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserProfileTrigger from '@/components/UserProfileTrigger';
import AdminDashboard from './admin-dashboard';

const Admin: React.FC = () => {
  return (
    // 1. h-screen fija la altura al total de la pantalla y evita el scroll global
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      
      {/* Header - Se mantiene estático arriba */}
      <div className="border-b shrink-0"> 
        <div className="flex justify-between items-center container max-w-7xl mx-auto p-4">
          <Button variant="ghost" asChild>
            <Link to="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          <div className="flex items-center justify-end flex-1">
            <UserProfileTrigger/>
          </div>
        </div>
      </div>

      {/* 2. Contenedor con Scroll - flex-1 toma el espacio sobrante */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto py-6">
          <AdminDashboard />
        </div>
      </main>
      
    </div>
  );
};

export default Admin;