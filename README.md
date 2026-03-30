# 🎨 OPSATEL FRONTEND - INTERFAZ DE GESTIÓN ISP

Este repositorio contiene la aplicación frontend del sistema **Opsatel**, una plataforma de gestión integral para proveedores de servicios de internet (ISP). La interfaz está diseñada con un enfoque en la estética moderna (**Glassmorphism**) y una experiencia de usuario fluida y reactiva.

---

## 🚀 Tecnologías Principales
*   **React 19:** Biblioteca base para la construcción de interfaces de usuario.
*   **Vite:** Herramienta de construcción ultra rápida para el desarrollo.
*   **Framer Motion:** Motor de animaciones para transiciones suaves y micro-interacciones.
*   **Recharts:** Visualización de datos y estadísticas financieras mediante gráficos dinámicos.
*   **Axios:** Cliente HTTP para la comunicación eficiente con el backend FastAPI.
*   **CSS Moderno (Variables & Glassmorphism):** Sistema de diseño personalizado sin dependencias de frameworks externos pesados.

---

## ⚙️ Instalación y Desarrollo
Para ejecutar el proyecto en tu máquina local, sigue estos pasos:

1.  **Clonar el repositorio.**
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
4.  **Acceder a la app:** Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 📂 Estructura del Código
*   **`src/pages/`:** Contiene las vistas principales de la aplicación (Dashboard, Ventas, Técnica, etc.).
*   **`src/components/`:** Componentes reutilizables como la Barra Lateral (Sidebar), Tarjetas (Cards), Formularios y Modales.
*   **`src/services/`:** Archivo `api.js` que centraliza todas las peticiones al backend.
*   **`src/assets/`:** Imágenes, logos y recursos estáticos.
*   **`src/index.css`:** Sistema de diseño centralizado con variables raíz y estilos globales de Glassmorphism.

---

## 🖥️ Módulos y Funcionalidades

### 📊 1. Dashboard Inteligente
Vista panorámica que muestra el estado actual del negocio:
*   Contadores de clientes en diferentes estados.
*   Gráficos circulares de métodos de pago (Efectivo vs. Bancos).
*   Métricas de recaudación mensual para planes de Internet y servicios Plus.

### 📝 2. Módulo de Ventas
Optimizado para el registro rápido de nuevos prospectos:
*   Formularios validados para captura de datos.
*   Gestión de ubicación geográfica por nodos.

### 🔧 3. Módulo Técnico (Activaciones)
Herramienta avanzada para el equipo de campo:
*   Cálculo automático de **IPs** y **ONT IDs** para evitar colisiones.
*   Generador de **Scripts GPON** (comandos Huawei OLT) listos para copiar.
*   Registro de potencia óptica (dBm) y geolocalización de cajas NAP.

### 💰 4. Gestión General y Administrativa
Panel centralizado para el control financiero:
*   Historial de clientes con búsqueda y filtrado multivariable.
*   Registro de pagos simplificado con vinculación automática de saldo.
*   Carga de fotos de cédulas para seguridad de contratos.

### 📑 5. Reportes y Cierres
Gestión de la continuidad del negocio:
*   Visualización de historiales de cierres pasados.
*   Generación de reportes Excel de recaudación con un solo clic.

---

## 🔐 Autenticación y Seguridad
La aplicación implementa un sistema de protección de rutas basado en **JWT**. 
*   **Roles admitidos:** Administrador, Secretario, Técnico e Instalador.
*   Las interfaces se adaptan dinámicamente según el rol del usuario logueado, ocultando o mostrando herramientas específicas.

---

## 🎨 Diseño y Estética
La aplicación utiliza un sistema de **Glassmorphism** premium:
*   **Fondos con gradientes profundos:** Uso de paletas HSL (Indigo, Violet, Slate).
*   **Efectos de desenfoque (Blur):** Transparencias elegantes en tarjetas y barras laterales.
*   **Responsive Pro:** Adaptación total para dispositivos móviles y tablets utilizando media queries personalizadas.

---
**Opsatel ISP Management System** - Elevando el estándar de las interfaces para gestión de infraestructura.
