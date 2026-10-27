# 🌐 OPSATEL FRONTEND - PLATAFORMA DE GESTIÓN ISP

Sistema frontend integral para la administración, aprovisionamiento técnico, facturación y operaciones de campo de **Opsatel** (Proveedor de Servicios de Internet / ISP). Construido sobre una arquitectura moderna con **React 19**, **Vite** y un sistema de diseño propio basado en **Glassmorphism** y CSS fluido de alto rendimiento.

---

## 📑 Tabla de Contenidos
1. [Tecnologías Principales](#-tecnologías-principales)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
4. [Sistema de Diseño y Responsive](#-sistema-de-diseño-y-responsive)
5. [Autenticación y Control de Acceso (RBAC)](#-autenticación-y-control-de-acceso-rbac)
6. [Guía Completa de Módulos y Pantallas](#-guía-completa-de-módulos-y-pantallas)
7. [Capa de Servicios y Comunicación API](#-capa-de-servicios-y-comunicación-api)
8. [Despliegue y Producción](#-despliegue-y-producción)

---

## 🚀 Tecnologías Principales

| Tecnología | Versión / Tipo | Propósito en la Plataforma |
| :--- | :--- | :--- |
| **React** | 19.x | Núcleo de componentes reactivos y gestión de estado del UI |
| **Vite** | 6.x | Bundler ultra rápido para desarrollo local y builds optimizados |
| **React Router DOM** | 7.x | Enrutamiento SPA, control de historial y protección de rutas |
| **Framer Motion** | 12.x | Microinteracciones, transiciones de modales y animaciones suaves |
| **Recharts** | 2.x | Visualización analítica de ingresos, métodos de pago y métricas financieras |
| **Axios** | 1.x | Cliente HTTP con interceptores JWT y manejo unificado de errores |
| **Lucide React** | Icons | Paquete moderno de iconografía vectorial |
| **Vanilla CSS** | Tokens HSL | Sistema visual sin sobrecarga de frameworks, altamente personalizable |

---

## 📂 Estructura del Proyecto

```text
Opsatel-Frontend/
├── public/                     # Recursos públicos estáticos (logos, favicons)
├── src/
│   ├── assets/                 # Recursos gráficos importados en componentes
│   ├── components/             # Componentes compartidos y transversales
│   │   ├── Layout.jsx          # Shell global (Navbar superior, Sidebar y contenedor fluido)
│   │   ├── Sidebar.jsx         # Menú de navegación principal con filtrado por rol
│   │   └── ProtectedRoute.jsx  # Guardián de seguridad para validar sesión y roles JWT
│   ├── context/
│   │   └── AuthContext.jsx     # Contexto global de autenticación, usuario activo y tokens
│   ├── pages/                  # Vistas principales del sistema (23 módulos)
│   │   ├── Dashboard.jsx       # Métricas y KPIs globales en tiempo real
│   │   ├── General.jsx         # Directorio maestro de clientes con filtros multivariables
│   │   ├── Ventas.jsx          # Formulario de registro y captura con IA de contratos
│   │   ├── Tecnica.jsx         # Aprovisionamiento técnico OLT, cálculo de IPs y scripts
│   │   ├── Activacion.jsx      # Flujo de activación masiva de equipos ONT
│   │   ├── Admin.jsx           # Facturación mensual global, cobros y cierres de ciclo
│   │   ├── Administrar.jsx     # Control de permanencia de contratos y transiciones
│   │   ├── Balance.jsx         # Libro contable, ingresos bancarios, IPTV y egresos
│   │   ├── CallCenter.jsx      # Mesa de ayuda, tickets CRM y vinculación a Hoja de Ruta
│   │   ├── HojaRuta.jsx        # Agenda técnica de visitas en campo y órdenes de trabajo
│   │   ├── WhatsApp.jsx        # Panel de control de mensajería masiva y bot automatizado
│   │   ├── Configuraciones.jsx # Catálogos: Nodos, Planes, Bancos, Puertos y Finanzas
│   │   ├── Asistencia.jsx      # Marcación y registro de asistencia de colaboradores
│   │   ├── ExtrasGeneral.jsx   # Gestión de cuentas y contratos de servicios extras
│   │   ├── ExtraPagos.jsx      # Control financiero y pagos de clientes extras
│   │   ├── SubirBD.jsx         # Respaldos SQL, importación y exportación de bases de datos
│   │   ├── ONT.jsx             # Descubrimiento y monitoreo de dispositivos ópticos
│   │   ├── TECdt.jsx           # Panel de diagnóstico y herramientas técnicas avanzadas
│   │   ├── Tickets.jsx         # Vista administrativa consolidada de incidentes
│   │   ├── Eliminados.jsx      # Papelera de reciclaje y recuperación de registros
│   │   └── LoginPage.jsx       # Pantalla de acceso seguro al sistema
│   ├── services/
│   │   ├── api.js              # Cliente centralizado y métodos para todos los endpoints
│   │   └── whatsappService.js  # Métodos específicos para campañas y estado de WhatsApp
│   ├── App.jsx                 # Configuración de rutas y distribución de accesos
│   ├── main.jsx                # Punto de entrada ReactDOM
│   ├── index.css               # Variables de tema, reset, utilidades y Glassmorphism
│   └── responsive.css          # Reglas de adaptación multidispositivo y vistas móviles
├── nginx.conf                  # Configuración de servidor web para despliegue en producción
├── Dockerfile                  # Empaquetado en contenedor Docker multi-stage
├── vite.config.js              # Configuración del servidor de desarrollo y alias
└── package.json                # Definición de dependencias y scripts de ejecución
```

---

## ⚙️ Instalación y Puesta en Marcha

### Requisitos Previos
*   **Node.js**: Versión 18.x o superior (recomendado LTS 20+).
*   **npm**: Versión 9.x o superior.
*   **Backend Opsatel**: Servidor FastAPI en ejecución (por defecto en `http://localhost:8000`).

### 1. Clonar e Instalar Dependencias
```bash
# Entrar a la carpeta del proyecto
cd Opsatel-Frontend

# Instalar los paquetes requeridos
npm install
```

### 2. Variables de Entorno
Por defecto, la aplicación se comunica con el backend mediante rutas relativas (`/api` o proxy de Vite) o la URL configurada en `src/services/api.js`. En desarrollo, Vite gestiona la conexión con el servidor backend en el puerto `8000`.

### 3. Ejecutar en Modo Desarrollo
```bash
npm run dev
```
La aplicación estará disponible de inmediato en [http://localhost:5173](http://localhost:5173).

### 4. Compilación para Producción
```bash
npm run build
```
Genera la carpeta `dist/` con los assets minificados, optimizados y listos para servir mediante Nginx o cualquier CDN.

---

## 🎨 Sistema de Diseño y Responsive

La interfaz adopta un diseño **Glassmorphism** contemporáneo, combinando fondos oscuros profundos con tarjetas translúcidas, bordes sutiles y gradientes armoniosos:

*   **Paleta de Color Base:** Variables HSL en tonos Índigo, Violeta profundo, Azul eléctrico, Esmeralda (estados activos/completados) y Carmesí (cortes/alertas).
*   **Superficies de Cristal:** Clases y estilos con `backdrop-filter: blur(12px-20px)` y fondos con opacidad controlada (`rgba(255, 255, 255, 0.03)` a `0.07`).
*   **Tipografía de Alta Legibilidad:** Inter y fuentes sans-serif modernas con jerarquía clara en pesos y tamaños.

### Adaptabilidad Multidispositivo (`src/responsive.css`)
1.  **Monitores Grandes y Escritorios (1440px en adelante):** Aprovechamiento al 100% del ancho del viewport sin márgenes desperdiciados, permitiendo visualizar tablas con hasta 15 columnas con total claridad.
2.  **Portátiles y Escritorios Medianos (1025px a 1439px):** Ajuste balanceado de espaciados internos y distribución dinámica de tarjetas de KPI.
3.  **Tablets (769px a 1024px):** Reorganización de filtros en dos columnas y scroll horizontal suave para data tables extensas.
4.  **Móviles (hasta 768px):** 
    *   La barra lateral colapsa en un menú hamburguesa desplegable.
    *   En módulos clave como **Call Center**, el diseño conmuta automáticamente de una tabla tradicional a un sistema ergonómico de tarjetas móviles (`cc-card-mobile`), optimizando la lectura táctil de datos, estados y llamadas directas.

---

## 🔐 Autenticación y Control de Acceso (RBAC)

La plataforma utiliza tokens **JWT (JSON Web Tokens)** para garantizar la seguridad en cada petición:

1.  **Almacenamiento Local Seguro:** El token de autenticación y los datos del usuario se conservan en `localStorage` tras un inicio de sesión exitoso.
2.  **Interceptores Axios:** Cada llamada hacia el backend inyecta automáticamente la cabecera `Authorization: Bearer <TOKEN>`.
3.  **Detección de Sesión Expirada:** Si el backend responde con código `401 Unauthorized`, el interceptor limpia el almacenamiento local y redirige al usuario a `/login`.
4.  **Matriz de Roles:**
    *   `administrador`: Acceso ilimitado a todos los 23 módulos, facturación, usuarios, respaldos y configuración.
    *   `secretario`: Operaciones comerciales, cobros, balances, clientes, contratos y gestión de tickets.
    *   `tecnico`: Aprovisionamiento técnico, OLT, hoja de ruta, diagnóstico de red y call center. Si un técnico inicia sesión, es redirigido automáticamente a `/hoja-ruta`.
    *   `instalador`: Enfoque operativo para despliegue de clientes en campo y revisión técnica.

---

## 🖥️ Guía Completa de Módulos y Pantallas

### 1. 📊 Dashboard (`/`)
*   **Contadores de Clientes:** Métricas actualizadas de clientes Activos, Pendientes, Cortados y Retirados.
*   **Métricas Financieras:** Recaudación acumulada de servicios de Internet, servicios Plus/IPTV y cargos Adicionales.
*   **Distribución de Pagos:** Gráficos circulares interactivos con porcentajes recaudados en Efectivo versus Transferencias Bancarias.
*   **Liquidez Bancaria Global:** Gráfico de barras consolidado que muestra los saldos reales disponibles en Banco Pichincha, Cooperativa JEP y Caja Chica.

### 2. 📝 Ventas (`/ventas`)
*   **Alta de Nuevos Clientes:** Formulario estructurado para registrar datos personales, cédula, teléfono, dirección, geolocalización y nodo.
*   **Condiciones Comerciales:** Selección de plan contratado, servicios adicionales (IPTV), y duración de permanencia del contrato (`tiempo`).
*   **Captura Inteligente con IA:** Herramienta integrada que permite pegar un mensaje de texto no estructurado (por ejemplo, enviado por WhatsApp) y enviarlo al endpoint `/clientes/parse-smart`. La IA extrae y normaliza automáticamente la cédula, teléfono, nodo y plan, rellenando el formulario en segundos.

### 3. 🔧 Técnica (`/tecnica`)
*   **Aprovisionamiento de Instalaciones:** Bandeja de clientes en estado pendiente de configuración física.
*   **Cálculo Automático de Parámetros:** Al seleccionar un nodo y un puerto, el sistema calcula de forma instantánea:
    *   Siguiente **ID Port (ONT ID)** libre en el puerto.
    *   Siguiente **Service Port** global único.
    *   **Dirección IP dinámica** asignada según el prefijo del nodo.
*   **Generador de Scripts OLT Huawei:** Creación automática de los comandos de configuración de terminal GPON (`ont add`, `ont port native-vlan`, `service-port`) listos para copiar con un clic.
*   **Medición Óptica y NAP:** Registro de la potencia óptica en dBm recibida en la ONT y coordenadas de la caja NAP.

### 4. ⚡ Activación Masiva (`/activacion`)
*   Procesamiento en lote para activación rápida de equipos de clientes detectados en la OLT.
*   Verificación de conectividad, asignación secuencial y limpieza de registros provisionales.

### 5. 👥 Gestión General (`/general`)
*   **Directorio Maestro de Clientes:** Tabla completa de todos los abonados con renderizado ultra rápido.
*   **Filtros Multivariables:** Búsqueda en tiempo real por nombres, apellidos, cédula, dirección, IP, nodo, plan y estado de pago (Al día / Con deuda).
*   **Acciones Rápidas:**
    *   Enlace directo para abrir chat de WhatsApp con el número del cliente.
    *   Visualizador y cargador de fotos de cédulas para archivo digital.
    *   Cambio ágil de estado operativo: Activo, Cortado, Retirado, Pendiente.
    *   Edición de parámetros de red y modo bridge/router.

### 6. 💰 Administración y Cobros (`/admin`)
*   **Registro Unificado de Pagos:** Modal interactivo para asentar abonos desglosados en:
    *   Pago recurrente de Internet.
    *   Servicios Plus (IPTV).
    *   Cargos Adicionales (materiales, routers, reconexiones).
*   **Gestión por Cuentas Bancarias:** Asignación del pago a Banco Pichincha, Cooperativa JEP o Efectivo/Caja Chica con número de referencia.
*   **Modo Cortesía:** Registro de exoneraciones justificadas sin alterar negativamente la contabilidad.
*   **Facturación Mensual Global:** Ejecución del cobro programado para todos los clientes activos del sistema al inicio de cada mes.
*   **Cierre de Mes y Reportes Excel:** Finalización del ciclo de cobros y generación de hojas de cálculo con el detalle de ingresos.

### 7. ⏳ Administrar Permanencia (`/administrar`)
*   Monitoreo del tiempo de permanencia contratado por cada cliente.
*   Contador de meses transcurridos vs meses pactados en el contrato original.
*   Función de cierre de permanencia individual o masiva ("Finalizar Todos") para trasladar a los clientes a la gestión general sin restricciones de plazo.

### 8. 📈 Balance Financiero (`/balance`)
*   **Auditoría de Flujo de Caja:** Conciliación en tiempo real entre ingresos totales y egresos operacionales.
*   **Desglose por Entidad Financiera:** Vista aislada de movimientos en Banco Pichincha, JEP y Caja Chica.
*   **Discriminación de Ingresos:** Separación clara entre facturación recurrente de Internet, suscripciones IPTV y ventas adicionales.
*   **Módulo de Gastos y Egresos:** Registro detallado de compras, viáticos, pagos a proveedores y suministros.

### 9. 📞 Call Center y Soporte (`/call-center`)
*   **Mesa de Ayuda Integral:** Registro ágil de llamadas de clientes reportando incidencias, cortes o dudas técnicas.
*   **Búsqueda Dinámica de Clientes:** Autocompletado inmediato al ingresar la cédula o nombre del usuario para cargar su historial.
*   **Gestión de Tickets:** Categorización por prioridad (Alta, Media, Baja), tipología de falla y seguimiento de estado (Abierto, En Proceso, Resuelto, Cerrado).
*   **Agendamiento Directo:** Botón integrado para convertir un reclamo en una visita técnica, creando directamente el registro en la **Hoja de Ruta**.
*   **Modo Tarjeta Móvil:** Vista optimizada para teléfonos con tarjetas compactas que permiten llamar al cliente con un toque.

### 10. 📅 Hoja de Ruta (`/hoja-ruta`)
*   **Agenda de Operaciones en Campo:** Programación diaria de visitas de instalación, mantenimiento y retiro de equipos.
*   **Asignación de Personal:** Selección del técnico responsable, fecha programada, franja horaria y detalles de la tarea.
*   **Estados de Cumplimiento:** Marcado de actividades como Pendiente, En proceso, Completado o No completado.
*   **Regla de Expiración Automática:** Los registros que permanecen sin resolución tras 24 horas pasan de forma automática a estado "No completado" para control de calidad.

### 11. 💬 WhatsApp y Automatización (`/whatsapp`)
*   **Sincronización Web:** Código QR para vincular la sesión de WhatsApp del negocio mediante el bridge backend.
*   **Mensajería Masiva Programada:** Envío de notificaciones de cobranza, recordatorios de corte y avisos de mantenimiento a toda la base o segmentos específicos.
*   **Asistente Virtual (Bot Sam):** Monitoreo del estado del bot inteligente capaz de responder consultas frecuentes de los clientes de manera automática.

### 12. 🛠️ Configuraciones (`/config`)
*   **Nodos:** Creación y modificación de nodos con sus prefijos de red (ej: `172.16.x.x`).
*   **Planes de Internet:** Configuración de anchos de banda (subida/bajada), tarifas mensuales y nombres comerciales.
*   **Puertos y NAPs:** Mapeo de puertos físicos por nodo para distribución ordenada de ONTs.
*   **Bancos y Finanzas Base:** Administración de cuentas bancarias admitidas y configuración de los fondos de arranque de caja.

### 13. 📦 Extras General (`/extras-general`) y Extras Pagos (`/extras-pagos`)
*   Sub-sistema paralelo para administrar clientes especiales, contratos temporales o servicios adicionales no clasificados en la base matriz, manteniendo su propio registro de cobros y saldos.

### 14. 💾 Subir BD y Respaldos (`/upload-db`)
*   **Copias de Seguridad:** Generación y descarga de volcados SQL completos del sistema con un solo clic.
*   **Restauración Segura:** Carga guiada de archivos `.sql` con validación previa de estructura para recuperación ante incidentes.
*   **Migración de Datos:** Herramientas para importación de hojas de cálculo Excel.

### 15. 🕒 Control de Asistencia (`/asistencia`)
*   Registro de entrada y salida de colaboradores con estampado de fecha y hora exacta.
*   Resumen de horas laboradas por empleado y exportación para liquidación interna.

### 16. 📡 ONT y Diagnóstico (`/ont`, `/tecdt`)
*   Inspección del estado de señal, descubrimiento de números de serie (SN) no autorizados y herramientas de diagnóstico de enlace de fibra.

### 17. 🗑️ Papelera de Eliminados (`/eliminados`)
*   Respaldo temporal de clientes dados de baja, permitiendo su restauración completa o purga definitiva por parte de los administradores.

---

## 📡 Capa de Servicios y Comunicación API

Todas las peticiones HTTP están centralizadas en `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar token de autorización
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Los servicios están divididos funcionalmente:
*   `clienteService`: Operaciones CRUD, activación, cálculo técnico, pagos y facturación.
*   `configuracionService`: Gestión de nodos, planes, bancos, puertos y finanzas base.
*   `callCenterService`: Creación y actualización de tickets de soporte.
*   `hojaRutaService`: Planificación y estados de visitas técnicas.
*   `balanceService`: Métricas de caja, ingresos y gastos.
*   `backupService`: Descarga y restauración de copias de seguridad.
*   `whatsappService`: Programación de mensajes masivos y estado de vinculación.

---

## 🚢 Despliegue y Producción

### Despliegue con Docker y Nginx
El repositorio incluye un `Dockerfile` multi-stage que compila el frontend con Node.js y entrega los estáticos con **Nginx Alpine**:

```dockerfile
# 1. Compilación
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Servidor web liviano
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Configuración Nginx (`nginx.conf`)
Maneja el enrutamiento de la SPA y redirige las llamadas API hacia el contenedor del backend:
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

*Documentación técnica del Frontend actualizada conforme al estado funcional del sistema.*
