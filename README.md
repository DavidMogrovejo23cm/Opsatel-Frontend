# DOCUMENTACIÓN DE OPSATEL FRONTEND (React + Vite)

Este documento detalla todas las funcionalidades, componentes y mejoras de diseño implementadas para la gestión ISP de Opsatel.

## 1. Panel de Control (Dashboard.jsx)
Se implementó un sistema de visualización interactiva para el seguimiento de la red:

- **Tarjetas de Estado Clickables**: Las tarjetas de **Servicios por Activar** y **Servicios Inactivos** ahora abren un modal detallado con la lista de clientes correspondientes.
- **Gráficos en Tiempo Real**: 
  - **Distribución**: Gráfico de pastel para estados de servicios.
  - **Recaudación**: Gráfico de área para la tendencia histórica de ingresos totales.
- **Lista de Pagos Recientes**: Visualización rápida de los últimos cobros realizados (Monto, ID, Método de Pago).

## 2. Vista General de Clientes (General.jsx)
Mejorada para ser el centro de reportes y seguimiento rápido:

- **Edición Inline (En Vivo)**: Todos los campos son editables mediante doble clic.
- **Nuevos Estados**: Integración de estados **"En Proceso"** (Amarillo) y **"Jurídico"** (Fucsia).
- **Columna Observaciones**: Nueva columna al lado de Estado para notas generales persistentes.
- **Resumen de Pago Inteligente**: La columna de Plus muestra el valor actual o el valor ya pagado si el campo fue limpiado durante el cobro.

## 3. Administración y Cobros (Admin.jsx)
Funcionalidad refinada para una gestión financiera sin errores:

- **Modal de Pagos Rediseñado**:
  - **Título Dinámico**: Incluye el nombre del cliente en el encabezado.
  - **Desglose de Costos**: Muestra claramente el precio del **Plan Base** + **Plus** actual.
  - **Pre-llenado de Monto**: El sistema detecta el plan del cliente y rellena automáticamente el costo base esperado.
  - **Botón de Acuerdo**: El botón de confirmación suma dinámicamente el total pagado (Monto Internet + Adicional) para dejar el saldo en cero.
- **Gestión de Saldos**:
  - Eliminación de la columna `Total Mes` para priorizar el estado de **Pendiente** (Saldo neto).
  - Colores condicionales: **Rojo** para deudas, **Verde** para excedentes (Saldo a favor).

## 4. Estética y UX (index.css)
Diseño moderno basado en **Glassmorphism**:

- **Barras de Desplazamiento Personalizadas**: Barras delgadas y sutiles dentro de los modales para una mejor estética.
- **Grids Responsivos**: Los paneles y tablas se adaptan a diferentes tamaños de pantalla.
- **Micro-animaciones**: Transiciones suaves al abrir modales y cargar componentes dinámicos.

## 5. Historial de Correcciones (Bugfixes)
- **ReferenceError (Dashboard)**: Se restauró el estado de `recentPagos` que causaba el fallo de carga del panel.
- **Error de Excedente (Saldo)**: Ajustada la lógica de visualización para que el vaciado de campos de Plus/Adicional no se interprete como una rebaja de la factura, manteniendo el saldo en cero tras el pago.
- **Sincronización Total de Cobro**: Implementada la suma lógica de `Monto + Adicional` en el envío para garantizar que el abono cubra todos los nuevos cargos simultáneamente.

---
## 6. Actualizaciones de Seguridad y Análisis (Marzo 2024)

### Panel de Control (Dashboard.jsx)
Se optimizó el panel informativo con visualizaciones específicas para la directiva:
- **Gráficas de Recaudación Segmentada**: Dos nuevos gráficos de pastel muestran el dinero recolectado en el mes actual desglosado por banco (**Efectivo**, **Pichincha**, **JEP**) tanto para los planes de **Internet** como para servicios **IP TV**.
- **Tarjetas Informativas**: Nuevos indicadores con el total a cobrar del mes.

### Seguridad (PIN Modal)
Para proteger la integridad de los datos en la **Vista General**, se implementó un sistema de autorización por PIN:
- **Validación Requerida**: Cualquier edición (Inline o Selección) solicita un **PIN de Seguridad** (`1234566`) mediante un modal de diseño premium antes de guardar.
- **Detección Automática**: El sistema valida el PIN localmente antes de intentar la actualización en el servidor, mejorando la respuesta de la interfaz.

### Cambios de Terminología
- **Renombrado General**: El concepto de "Plus" ha sido actualizado a **"IP TV"** en todas las tablas administrativas y formularios de pago para reflejar mejor los servicios ofrecidos.

---
*Última actualización: Marzo 2024*
