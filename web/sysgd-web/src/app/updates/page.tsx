import { UpdateCard } from "@/components/update-card";
import useUpdates from "@/hooks/useUpdates";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

export default function UpdatesPage() {
  const { updates, loading, error, refetch } = useUpdates();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header Section */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-6">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Actualizaciones
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
              Mantente al día con los últimos avances, nuevas funcionalidades y
              mejoras del ecosistema SYSGD.
            </p>
          </div>

          {/* Content Section */}
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : updates.length === 0 ? (
            <EmptyState />
          ) : (
            <UpdatesList updates={updates} />
          )}
        </div>
      </div>
    </div>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[500px] gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-blue-400 dark:border-b-blue-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Cargando actualizaciones...
        </p>
        <p className="text-sm text-muted-foreground">
          Esto solo tomará un momento
        </p>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[500px] gap-6 max-w-md mx-auto text-center px-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Oops, algo salió mal
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          No pudimos cargar las actualizaciones en este momento. Por favor, verifica tu conexión e intenta nuevamente.
        </p>
      </div>
      
      <button
        onClick={onRetry || (() => window.location.reload())}
        className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
      >
        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
        Reintentar
      </button>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[500px] gap-6 max-w-md mx-auto text-center px-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
          <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">0</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          No hay actualizaciones disponibles
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Aún no se han publicado actualizaciones. Vuelve pronto para descubrir las últimas novedades del ecosistema SYSGD.
        </p>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 Te notificaremos cuando haya nuevas actualizaciones
        </p>
      </div>
    </div>
  );
}

// Updates List Component
function UpdatesList({ updates }: { updates: any[] }) {
  return (
    <div className="grid gap-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">
          {updates.length} {updates.length === 1 ? 'actualización' : 'actualizaciones'} {updates.length === 1 ? 'encontrada' : 'encontradas'}
        </p>
      </div>
      
      {updates.map((update, index) => (
        <div
          key={update.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <UpdateCard update={update} />
        </div>
      ))}
    </div>
  );
}