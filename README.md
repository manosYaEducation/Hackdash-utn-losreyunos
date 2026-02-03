#  Plataforma Institucional: Hackdash Los Reyunos - AI DAY  UTN FRSR (2025)

![PHP Version](https://img.shields.io/badge/PHP-8.0%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-MVC%20Native-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Stable-success?style=for-the-badge)

> **Sistema de Gestión y Exhibición de Proyectos Finales - Tecnicatura Universitaria en Programación (Cohorte 2024).**

Este repositorio contiene el código fuente de la plataforma oficial utilizada para el evento de graduación **AI DAY 2025**. Es una evolución arquitectónica del sistema *Hackdash*, refactorizada bajo el patrón **"Fork & Detach"** para servir como un activo institucional independiente, mantenible y escalable.

---

##  Contexto del Proyecto

Originalmente basado en una arquitectura multi-dashboard para hackathones genéricos, este sistema ha sido transformado en una solución **Fullstack Aislada**.

**¿Por qué este fork?**
1.  **Independencia de Datos:** Se requería extender la entidad `Projects` con atributos académicos (Pitch, Video Demo, Deploy Link, Integrantes JSON) sin afectar la base de datos de eventos anteriores.
2.  **Identidad Institucional:** Se necesitaba una interfaz (Frontend) totalmente personalizada para la UTN FRSR, libre de las restricciones visuales del proyecto *legacy*.
3.  **Legado:** El objetivo fue crear una base de código limpia que las futuras cohortes puedan desplegar y evolucionar fácilmente en infraestructuras compartidas (cPanel).

---

##  Stack Tecnológico

El proyecto prioriza la **performance y la portabilidad**, evitando el *overhead* de frameworks pesados para garantizar su funcionamiento en cualquier hosting universitario estándar.

* **Backend:** PHP 8.x (Nativo, POO Estricto).
* **Base de Datos:** MySQL / MariaDB (Motor InnoDB).
* **Frontend:** HTML5, CSS3 (Variables Nativas), JavaScript Vanilla (ES6+).
* **Gestión de Dependencias:** [Composer](https://getcomposer.org/) (PSR-4 Autoloading).
* **Variables de Entorno:** `vlucas/phpdotenv`.
* **Servidor Web:** Apache (con `mod_rewrite`).

---

##  Arquitectura del Sistema (MVC)

El sistema implementa un patrón **Modelo-Vista-Controlador** artesanal, orquestado por un enrutador personalizado.

```text
/
├── backend/
│   ├── app/
│   │   ├── Controllers/   # Lógica (ProjectController, DashboardController)
│   │   ├── Models/        # Acceso a Datos (PDO, Consultas SQL)
│   │   └── Routes/        # Definición de Endpoints
│   ├── public/            # Entry Point API (si aplica)
│   └── conexion.php       # (Legacy Support)
├── frontend/              # Lógica de vistas (si aplica)
├── public/                # ROOT WEB: index.php, CSS, JS, Uploads
├── views/                 # Plantillas HTML/PHP (Landing, Login, Detail)
├── .env.example           # Template de credenciales
├── composer.json          # Definición de Namespaces (PSR-4)
├── index.php              # Front Controller Principal
└── Router.php             # Enrutador Custom (Sin Frameworks)
```
Características Clave
Custom Router: Despacha peticiones analizando la REQUEST_URI e instanciando dinámicamente los controladores.

Singleton Database: La clase Database::getInstance() asegura una única conexión SQL por petición.

Persistencia JSON: El campo members_data en la tabla projects almacena la información del equipo en formato JSON para simplificar las relaciones.

##  Guía de Instalación
1. Prerrequisitos
PHP 8.0 o superior.

Composer instalado globalmente.

Servidor MySQL.

2. Instalación Local
Bash

1. Clonar el repositorio
git clone [https://github.com/fernando-alma/aiday-utn-sanrafael-2025.git](https://github.com/fernando-alma/aiday-utn-sanrafael-2025.git)
Bash
2. Instalar dependencias (genera carpeta /vendor)
composer install
Bash
3. Configurar entorno
cp .env.example .env
## (Editar .env con tus credenciales de BD locales)
3. Base de Datos
Crear una base de datos vacía (ej: alphadocere_losreyunos).

Importar el archivo SQL provisto en /database/alphadocere_losreyunos.sql.

##  Despliegue en Producción (cPanel)
Archivos: Subir todo el contenido (incluyendo vendor/ generado previamente) a public_html.

Base de Datos: Crear la BD desde el panel, importar el SQL y asignar usuario/permisos.

Variables: Editar el archivo .env con las credenciales reales del servidor.

Enrutamiento: CRÍTICO: Asegurarse de que el archivo .htaccess esté presente en la raíz para manejar las rutas amigables.

##  Roadmap & Futuro (V2.0)
Este sistema está diseñado para evolucionar. Se proponen las siguientes mejoras para la Cohorte 2025/2026:

* **[Propuesta A]** Normalización Académica: Migrar el campo JSON members_data a una tabla relacional students para generar historiales académicos por alumno.

* **[Propuesta B]** Cloud Storage: Implementar un adaptador para subir imágenes a Cloudinary o AWS S3 en lugar del almacenamiento local.

* **[Propuesta C]** Gamificación: Agregar un módulo de "Voto del Público" en tiempo real para premiar proyectos durante el evento.

* **[Propuesta D]** API Pública: Exponer endpoints REST (GET /api/projects) para que el sitio web institucional de la UTN consuma los destacados automáticamente.

##  Créditos
Desarrollado con 💙 por Alpha Docere.

Líderes Técnicos & Arquitectura: Gabriel Calcagni y Fernando Alma

Equipo de Desarrollo: Alpha Docere / Alumnos TUP Cohorte 2024.

Institución: Universidad Tecnológica Nacional - Facultad Regional San Rafael.

© 2025 UTN FRSR. Código liberado bajo licencia interna para uso académico.
