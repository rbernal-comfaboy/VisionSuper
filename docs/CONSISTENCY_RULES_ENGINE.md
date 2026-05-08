# Diseño: Motor de Consistencia Inter-Capítulo (VisionSUPER)

Este motor garantiza que la información reportada en diferentes capítulos sea coherente entre sí, cumpliendo con los requisitos de calidad del Anexo Técnico.

## 1. Definición de Regla de Consistencia
Una regla define una relación lógica entre dos o más puntos de datos.

| Atributo | Descripción |
| --- | --- |
| `rule_id` | Identificador único (ej: `RULE_CAP2_CAP3_AFFILIATES`). |
| `source_query` | Punto de datos A (ej: Suma de afiliados en Cap 2). |
| `target_query` | Punto de datos B (ej: Cantidad esperada según aportes en Cap 3). |
| `tolerance` | Margen de error aceptable (ej: 0.1% para redondeos). |
| `severity` | `CRITICAL` (Bloquea firma) o `WARNING` (Informa pero permite seguir). |

## 2. Tipos de Validaciones
1.  **Igualdad Directa**: El total de activos en el Cap III debe ser idéntico al reportado en el balance consolidado.
2.  **Validación de Existencia**: Si se reporta un proyecto en el Cap V, debe existir su correspondiente rubro presupuestal en el Cap III.
3.  **Cálculo Derivado**: El promedio de aportes por afiliado debe caer dentro de un rango lógico basado en el salario mínimo.

## 3. Flujo de Ejecución
1.  **Activación**: El motor corre automáticamente al finalizar la **Consolidación** de cualquier reporte.
2.  **Evaluación**: Ejecuta las consultas SQL sobre el área de `staging_items`.
3.  **Resultado**: 
    *   Si es **Exitoso**: El reporte avanza a `EN_REVISION`.
    *   Si hay **Fallas**: Se genera un reporte de inconsistencias detallado para el Preparador.

## 4. Interfaz para el Revisor
El Revisor técnico verá una pestaña de "Consistencia" donde el sistema marcará con check verde o alerta roja cada una de las reglas predefinidas. Esto le da la seguridad necesaria para aprobar el reporte.
