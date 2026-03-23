# SYSGD Cont (Angular)

Proyecto Angular base para **registro de ingresos y gastos** orientado a cuentapropistas en Cuba.

## Estado actual

- Estructura Angular creada manualmente en `sysgd-cont` (sin descargar paquetes en este entorno).
- Módulo inicial implementado:
  - alta/eliminación de transacciones;
  - resumen anual (ingresos, gastos, utilidad);
  - validación de umbral de 500,000 CUP;
  - exportación CSV;
  - persistencia local (`localStorage`) para operación offline.
- Investigación fiscal inicial documentada en `docs/regulacion-cuba.md`.

## Cómo ejecutar

> Requiere conexión a internet para instalar dependencias la primera vez.

```bash
cd sysgd-cont
npm install
npm start
```

Abrir en `http://localhost:4200`.

## Estructura

- `src/app/services/ledger.service.ts`: lógica de almacenamiento local y resumen anual.
- `src/app/models/ledger-entry.model.ts`: modelos y constante de umbral.
- `src/app/app.component.ts`: UI inicial del registro.
- `docs/regulacion-cuba.md`: notas normativas y criterios de implementación.

## Próximos pasos sugeridos

1. Sincronización online/offline con backend (cola de cambios).
2. Control de autenticación y perfiles de contribuyente.
3. Reportes fiscales por período y clasificación tributaria.
4. Validaciones normativas por tipo de actividad económica.
