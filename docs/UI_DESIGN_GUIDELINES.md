# Guías de Diseño UI: VisionSUPER Responsivo

Para asegurar que VisionSUPER funcione perfectamente en móviles y tablets, se seguirán los siguientes lineamientos de diseño en Angular.

## 1. Enfoque Mobile-First
El diseño se prioriza para pantallas pequeñas y se escala hacia desktop. Esto garantiza que la lógica de aprobación (la más crítica para dispositivos móviles) sea fluida.

## 2. Puntos de Interrupción (Breakpoints)
Utilizaremos los estándares de Angular Material / Flex Layout:
*   **xs (Móvil)**: < 600px
*   **sm (Tablet)**: 600px - 960px
*   **md (Laptop)**: 960px - 1280px
*   **lg+ (Desktop)**: > 1280px

## 3. Adaptación de Componentes Críticos

### 3.1. Tablas de Datos (Staging)
*   **Desktop**: Visualización en rejilla tradicional con scroll horizontal.
*   **Móvil**: Conversión automática a **Tarjetas (Cards)**. Cada fila de la tabla se convierte en una tarjeta vertical para facilitar la lectura y edición táctil.

### 3.2. Dashboard de Cumplimiento
*   **Desktop**: Malla de 3 o 4 columnas con indicadores de estado.
*   **Móvil**: Lista vertical (stack) con indicadores tipo "Badge" simplificados.

### 3.3. Formularios de los Capítulos
*   Uso de **Steppers** verticales en móvil para evitar el scroll infinito en formularios con muchos campos.
*   Inputs optimizados para teclado móvil (numéricos para valores de salarios, selectores de fecha nativos).

## 4. Firma Digital en Móvil
La interfaz de aprobación incluirá una validación simplificada (MFA vía SMS o Push de Google) adaptada para ser accionada con una sola mano.
