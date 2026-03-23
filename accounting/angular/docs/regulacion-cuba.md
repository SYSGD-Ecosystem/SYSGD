# Investigación inicial: registro de ingresos y gastos en Cuba

## Alcance

Esta nota resume criterios para implementar el módulo de registro de ingresos y gastos para cuentapropistas, con foco en contribuyentes con ingresos brutos anuales inferiores o iguales a **500,000 CUP**.

## Hallazgos normativos clave

1. **Umbral de 500,000 CUP y tipo de control**
- La normativa fiscal indica que personas naturales con ingresos brutos anuales **<= 500,000 CUP** aplican un esquema de control simplificado mediante registro.
- Referencia: **Resolución 272/2024 del MFP**, en vigor desde **1 de enero de 2025**.

2. **Control para <= 500,000 CUP**
- Para este tramo se establece el **“Registro de Control de Ingresos y Gastos”**.

3. **Por encima del umbral**
- Para ingresos superiores al umbral, la norma remite a **Normas Cubanas de Información Financiera (NCIF)**.

4. **Formato oficial y conservación**
- La implementación operativa del registro (formato/estructura) corresponde a la **ONAT**.
- Se reporta que los registros deben conservarse para fines de fiscalización.

## Implicaciones de diseño para la app

- Mantener un libro estructurado por transacciones con campos mínimos:
  - fecha, tipo (ingreso/gasto), categoría, descripción, monto, medio de pago.
- Calcular acumulado anual de ingresos para mostrar estado del umbral (<= / > 500,000 CUP).
- Permitir exportación (CSV/PDF) y respaldo para conservación documental.
- Diseñar para operación offline con persistencia local.

## Fuentes

- Gaceta Oficial / texto normativo (Resolución 272/2024, Anexo Único):
  - https://www.cubatrade.org/sites/default/files/2024-12/GOC-2024-O78.pdf
- Referencia legal internacional de la misma resolución (copia de consulta):
  - https://natlex.ilo.org/dyn/natlex2/r/natlex/fe/details?p3_isn=116611
- Nota periodística sobre aplicación práctica y plazos ONAT:
  - https://www.granma.cu/cuba/2025-01-06/como-seran-las-obligaciones-tributarias-para-las-formas-de-gestion-no-estatal

## Nota de cumplimiento

Antes de producción, validar contra publicación oficial más reciente de ONAT/MFP (posibles actualizaciones posteriores al 1 de enero de 2025).
