/**
 * Neutralino.js - Cliente JavaScript para Neutralinojs
 * Versión simplificada para Minetest Studio
 */

var Neutralino = (function() {
    'use strict';

    const api = {};
    let accessToken = '';

    // Inicializar conexión con el servidor nativo
    async function init() {
        return new Promise((resolve, reject) => {
            // En modo embebido, Neutralino inyecta las funciones directamente
            if (window.Neutralino && window.Neutralino.os) {
                resolve();
            } else {
                // Intentar conectar vía WebSocket (modo desarrollo)
                console.log('Neutralino: Esperando inicialización...');
                resolve();
            }
        });
    }

    // Funciones del sistema operativo
    api.os = {
        async getPlatform() {
            try {
                const result = await Neutralino.os.getPlatform();
                return result;
            } catch (e) {
                // Fallback para testing
                const userAgent = navigator.userAgent;
                if (userAgent.includes('Win')) return 'win32';
                if (userAgent.includes('Mac')) return 'darwin';
                if (userAgent.includes('Linux')) return 'linux';
                return 'unknown';
            }
        },

        async getArch() {
            try {
                return await Neutralino.os.getArch();
            } catch (e) {
                return 'x64';
            }
        },

        async getKernelVersion() {
            try {
                return await Neutralino.os.getKernelVersion();
            } catch (e) {
                return 'unknown';
            }
        },

        async execCommand(command, options = {}) {
            try {
                return await Neutralino.os.execCommand(command, options);
            } catch (e) {
                console.warn('execCommand no disponible:', e);
                return { stdOut: '', stdErr: 'Comando no ejecutado', exitCode: -1 };
            }
        },

        async showOpenDialog(title, options = {}) {
            try {
                return await Neutralino.os.showOpenDialog(title, options);
            } catch (e) {
                console.warn('showOpenDialog no disponible:', e);
                return null;
            }
        },

        async showSaveDialog(title, options = {}) {
            try {
                return await Neutralino.os.showSaveDialog(title, options);
            } catch (e) {
                console.warn('showSaveDialog no disponible:', e);
                return null;
            }
        },

        async showMessagebox(title, content, options = {}) {
            try {
                return await Neutralino.os.showMessagebox(title, content, options);
            } catch (e) {
                alert(`${title}\n\n${content}`);
                return 0;
            }
        },

        async open(url) {
            try {
                return await Neutralino.os.open(url);
            } catch (e) {
                window.open(url, '_blank');
            }
        }
    };

    // Funciones del sistema de archivos
    api.fs = {
        async readFile(path) {
            try {
                return await Neutralino.fs.readFile(path);
            } catch (e) {
                console.error('readFile error:', e);
                return null;
            }
        },

        async writeFile(path, data) {
            try {
                return await Neutralino.fs.writeFile(path, data);
            } catch (e) {
                console.error('writeFile error:', e);
                return false;
            }
        },

        async readDirectory(path) {
            try {
                const entries = await Neutralino.fs.readDirectory(path);
                return entries || [];
            } catch (e) {
                console.error('readDirectory error:', e);
                return [];
            }
        },

        async createDirectory(path) {
            try {
                return await Neutralino.fs.createDirectory(path);
            } catch (e) {
                console.error('createDirectory error:', e);
                return false;
            }
        },

        async remove(path) {
            try {
                return await Neutralino.fs.remove(path);
            } catch (e) {
                console.error('remove error:', e);
                return false;
            }
        },

        async isFile(path) {
            try {
                return await Neutralino.fs.isFile(path);
            } catch (e) {
                return false;
            }
        },

        async isDirectory(path) {
            try {
                return await Neutralino.fs.isDirectory(path);
            } catch (e) {
                return false;
            }
        },

        async copy(source, destination) {
            try {
                return await Neutralino.fs.copy(source, destination);
            } catch (e) {
                console.error('copy error:', e);
                return false;
            }
        },

        async move(source, destination) {
            try {
                return await Neutralino.fs.move(source, destination);
            } catch (e) {
                console.error('move error:', e);
                return false;
            }
        },

        async getStats(path) {
            try {
                return await Neutralino.fs.getStats(path);
            } catch (e) {
                return null;
            }
        }
    };

    // Funciones de almacenamiento
    api.storage = {
        async setData(key, value) {
            try {
                return await Neutralino.storage.setData(key, value);
            } catch (e) {
                // Fallback a localStorage
                localStorage.setItem('nl_' + key, value);
                return true;
            }
        },

        async getData(key) {
            try {
                return await Neutralino.storage.getData(key);
            } catch (e) {
                // Fallback a localStorage
                return localStorage.getItem('nl_' + key);
            }
        },

        async unsetData(key) {
            try {
                return await Neutralino.storage.unsetData(key);
            } catch (e) {
                localStorage.removeItem('nl_' + key);
                return true;
            }
        },

        async getKeys() {
            try {
                return await Neutralino.storage.getKeys();
            } catch (e) {
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('nl_')) {
                        keys.push(key.substring(3));
                    }
                }
                return keys;
            }
        }
    };

    // Funciones de la aplicación
    api.app = {
        async exit(code = 0) {
            try {
                return await Neutralino.app.exit(code);
            } catch (e) {
                console.log('Saliendo de la aplicación...');
            }
        },

        async killProcess() {
            try {
                return await Neutralino.app.killProcess();
            } catch (e) {
                console.warn('killProcess no disponible');
            }
        },

        async restartProcess() {
            try {
                return await Neutralino.app.restartProcess();
            } catch (e) {
                location.reload();
            }
        },

        getConfig() {
            return {
                applicationId: 'com.minetest.studio',
                version: '1.0.0'
            };
        },

        broadcast(event, data) {
            const customEvent = new CustomEvent(event, { detail: data });
            document.dispatchEvent(customEvent);
        }
    };

    // Funciones de ventana
    api.window = {
        async setTitle(title) {
            try {
                document.title = title;
                return await Neutralino.window.setTitle(title);
            } catch (e) {
                document.title = title;
            }
        },

        async getTitle() {
            try {
                return await Neutralino.window.getTitle();
            } catch (e) {
                return document.title;
            }
        },

        async maximize() {
            try {
                return await Neutralino.window.maximize();
            } catch (e) {
                console.warn('maximize no disponible');
            }
        },

        async unmaximize() {
            try {
                return await Neutralino.window.unmaximize();
            } catch (e) {
                console.warn('unmaximize no disponible');
            }
        },

        async isMaximized() {
            try {
                return await Neutralino.window.isMaximized();
            } catch (e) {
                return false;
            }
        },

        async minimize() {
            try {
                return await Neutralino.window.minimize();
            } catch (e) {
                console.warn('minimize no disponible');
            }
        },

        async unminimize() {
            try {
                return await Neutralino.window.unminimize();
            } catch (e) {
                console.warn('unminimize no disponible');
            }
        },

        async isMinimized() {
            try {
                return await Neutralino.window.isMinimized();
            } catch (e) {
                return false;
            }
        },

        async setAlwaysOnTop(onTop) {
            try {
                return await Neutralino.window.setAlwaysOnTop(onTop);
            } catch (e) {
                console.warn('setAlwaysOnTop no disponible');
            }
        },

        async move(x, y) {
            try {
                return await Neutralino.window.move(x, y);
            } catch (e) {
                console.warn('move no disponible');
            }
        },

        async setSize(width, height) {
            try {
                return await Neutralino.window.setSize(width, height);
            } catch (e) {
                console.warn('setSize no disponible');
            }
        },

        async getSize() {
            try {
                return await Neutralino.window.getSize();
            } catch (e) {
                return { width: window.innerWidth, height: window.innerHeight };
            }
        },

        async getPosition() {
            try {
                return await Neutralino.window.getPosition();
            } catch (e) {
                return { x: 0, y: 0 };
            }
        },

        async setFullscreen(fullscreen) {
            try {
                return await Neutralino.window.setFullscreen(fullscreen);
            } catch (e) {
                console.warn('setFullscreen no disponible');
            }
        },

        async isFullscreen() {
            try {
                return await Neutralino.window.isFullscreen();
            } catch (e) {
                return false;
            }
        },

        async show() {
            try {
                return await Neutralino.window.show();
            } catch (e) {
                document.body.style.display = 'block';
            }
        },

        async hide() {
            try {
                return await Neutralino.window.hide();
            } catch (e) {
                document.body.style.display = 'none';
            }
        },

        async isVisible() {
            try {
                return await Neutralino.window.isVisible();
            } catch (e) {
                return document.body.style.display !== 'none';
            }
        }
    };

    // Funciones de debug
    api.debug = {
        log(message) {
            console.log('[Neutralino]', message);
        },

        error(message) {
            console.error('[Neutralino]', message);
        },

        warn(message) {
            console.warn('[Neutralino]', message);
        }
    };

    // Información
    api.info = {
        VERSION: '2.0.0',
        CAPI_VERSION: '1.0.0'
    };

    // Inicializar
    async function initialize() {
        await init();
        
        // Dispatch evento de ready
        const readyEvent = new CustomEvent('neutralinoReady', { detail: { Neutralino: api } });
        document.dispatchEvent(readyEvent);
        
        return api;
    }

    return {
        ...api,
        init: initialize,
        ready: (callback) => {
            document.addEventListener('neutralinoReady', () => callback(api), { once: true });
        }
    };
})();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Neutralino.init());
} else {
    Neutralino.init();
}
