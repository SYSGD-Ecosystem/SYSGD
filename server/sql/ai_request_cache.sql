-- Tabla de idempotencia/caché para respuestas de IA (ya creada en Supabase).
-- La usa routes/generate.ts vía Postgres estándar (pool de pg), no la API de Supabase.
-- Referencia: TODO resuelto en generate.ts (/text con requestId).

-- 1. Crear la tabla de idempotencia/caché
CREATE TABLE IF NOT EXISTS public.ai_request_cache (
    request_id TEXT PRIMARY KEY,
    response_body JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar acceso de lectura/escritura (Si no usas RLS estricto para consumo interno)
ALTER TABLE public.ai_request_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a la clave de servicio" ON public.ai_request_cache;
CREATE POLICY "Permitir todo a la clave de servicio" ON public.ai_request_cache
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Crear una función que elimina registros con más de 24 horas
CREATE OR REPLACE FUNCTION public.clean_old_ai_requests()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.ai_request_cache
    WHERE created_at < NOW() - INTERVAL '24 hours';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear un disparador que ejecute la limpieza ANTES de insertar cualquier fila nueva
DROP TRIGGER IF EXISTS trigger_clean_ai_requests ON public.ai_request_cache;
CREATE TRIGGER trigger_clean_ai_requests
BEFORE INSERT ON public.ai_request_cache
FOR EACH STATEMENT
EXECUTE FUNCTION public.clean_old_ai_requests();
