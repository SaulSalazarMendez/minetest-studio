# Minetest Studio

Editor de texto estilo Visual Studio Code dedicado exclusivamente a la creación y edición de mods para Luanti/Minetest.

## 🛠️ Tecnologías

- **Neutralinojs** - Entorno de escritorio multiplataforma
- **Vue.js 2 + Vuex** - Framework de UI y gestión de estado
- **Monaco Editor** - Editor de código (el mismo que VS Code)
- **xterm.js** - Terminal integrada
- **JavaScript** - Lenguaje principal

## 📁 Estructura del Proyecto

```
minetest-studio/
├── bin/                          # Binarios de Neutralinojs
├── resources/                    # Recursos de la aplicación
│   ├── icons/                    # Iconos de la aplicación
│   ├── js/                       # Código JavaScript
│   │   ├── components/           # Componentes Vue
│   │   ├── core/                 # Núcleo de la aplicación
│   │   ├── services/             # Servicios
│   │   ├── stores/               # Vuex Store
│   │   ├── main.js               # Punto de entrada Vue
│   │   └── neutralino.js         # Cliente Neutralino
│   ├── index.html                # HTML principal
│   └── styles.css                # Estilos CSS
├── neutralino.config.json        # Configuración de Neutralino
└── README.md                     # Este archivo
```

## 🚀 Funcionalidades Principales

1. **Detección automática de Luanti/Minetest** - Búsqueda en rutas comunes según SO
2. **Gestión de Mobs** - Crear, editar y gestionar mobs con plantilla mobs_redo
3. **Soporte Lua avanzado** - Autocompletado con API de Minetest y mobs_redo
4. **Vista previa de imágenes** - Soporte para texturas PNG, JPG, SVG
5. **Interfaz estilo VS Code** - Activity bar, sidebar, tabs, status bar
6. **Terminal integrada** - xterm.js con ejecución de comandos
7. **Gestión de estado con Vuex** - Archivos abiertos, configuración, notificaciones

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| Ctrl+S | Guardar archivo |
| Ctrl+P | Buscar |
| Ctrl+` | Toggle terminal |
| Escape | Cerrar diálogos |

## 📦 Instalación

```bash
# Instalar Neutralino CLI
npm install -g @neutralinojs/neu

# Ejecutar en modo desarrollo
neu run

# Construir para producción
neu build
```

## 🔗 Enlaces

- [Neutralinojs Docs](https://neutralino.js.org/docs/)
- [Minetest API](https://www.minetest.net/dev/)
- [mobs_redo](https://github.com/Minetest-for-Humans/mobs_redo)

---
**Minetest Studio** - Hecho para la comunidad de Minetest/Luanti
