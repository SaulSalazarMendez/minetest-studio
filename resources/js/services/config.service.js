/**
 * Servicio de Configuración
 * Maneja la configuración de la aplicación y detección de Luanti/Minetest
 */

const ConfigService = {
    // Rutas comunes de Minetest según SO
    commonPaths: {
        win32: [
            'C:\\Program Files\\Luanti',
            'C:\\Program Files (x86)\\Luanti',
            'C:\\Program Files\\Minetest',
            'C:\\Program Files (x86)\\Minetest',
            process.env.APPDATA ? `${process.env.APPDATA}\\..\\Local\\Minetest` : null,
            process.env.APPDATA ? `${process.env.APPDATA}\\Minetest` : null
        ].filter(Boolean),
        
        linux: [
            '/usr/share/minetest',
            '/usr/local/share/minetest',
            '/opt/minetest',
            '/usr/games/minetest',
            process.env.HOME ? `${process.env.HOME}/.minetest` : null,
            process.env.HOME ? `${process.env.HOME}/.local/share/minetest` : null
        ].filter(Boolean),
        
        darwin: [
            '/Applications/Luanti.app/Contents/Resources',
            '/Applications/Minetest.app/Contents/Resources',
            process.env.HOME ? `${process.env.HOME}/Library/Application Support/minetest` : null
        ].filter(Boolean)
    },

    /**
     * Detecta automáticamente la instalación de Luanti/Minetest
     * @returns {Promise<string|null>} Ruta encontrada o null
     */
    async detectMinetestPath() {
        const platform = await Neutralino.os.getPlatform();
        const paths = this.commonPaths[platform] || [];
        
        for (const path of paths) {
            try {
                const exists = await Neutralino.fs.isFile(path + '/bin/minetest') ||
                              await Neutralino.fs.isDirectory(path + '/mods') ||
                              await Neutralino.fs.isDirectory(path + '/builtin');
                
                if (exists) {
                    console.log('Minetest encontrado en:', path);
                    return path;
                }
            } catch (error) {
                // Continuar buscando
            }
        }
        
        return null;
    },

    /**
     * Abre diálogo nativo para seleccionar carpeta
     * @returns {Promise<string|null>} Ruta seleccionada o null
     */
    async selectFolderDialog() {
        try {
            const result = await Neutralino.os.showOpenDialog('Seleccionar carpeta de Luanti/Minetest', {
                filters: [
                    { name: 'Carpetas', extensions: ['*'] }
                ]
            });
            
            if (result && result.length > 0) {
                return result[0];
            }
        } catch (error) {
            console.error('Error al abrir diálogo:', error);
        }
        
        return null;
    },

    /**
     * Valida que una ruta sea una instalación válida de Minetest
     * @param {string} path - Ruta a validar
     * @returns {Promise<boolean>} True si es válida
     */
    async validateMinetestPath(path) {
        try {
            // Verificar existencia de carpetas características
            const hasMods = await Neutralino.fs.isDirectory(path + '/mods');
            const hasBuiltin = await Neutralino.fs.isDirectory(path + '/builtin');
            const hasBin = await Neutralino.fs.isDirectory(path + '/bin');
            
            return hasMods || hasBuiltin || hasBin;
        } catch (error) {
            return false;
        }
    },

    /**
     * Obtiene la ruta de la carpeta de mods
     * @param {string} minetestPath - Ruta de instalación de Minetest
     * @returns {string} Ruta de la carpeta mods
     */
    getModsPath(minetestPath) {
        return minetestPath + '/mods';
    },

    /**
     * Carga configuración desde storage
     * @returns {Promise<object>} Configuración cargada
     */
    async load() {
        try {
            const data = await Neutralino.storage.getData('minetest_studio_config');
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.log('No hay configuración guardada');
        }
        
        return {
            minetestPath: '',
            workspacePath: '',
            theme: 'dark'
        };
    },

    /**
     * Guarda configuración en storage
     * @param {object} config - Configuración a guardar
     * @returns {Promise<boolean>} True si se guardó correctamente
     */
    async save(config) {
        try {
            await Neutralino.storage.setData('minetest_studio_config', JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            return false;
        }
    },

    /**
     * Obtiene información del sistema operativo
     * @returns {Promise<object>} Información del SO
     */
    async getOSInfo() {
        try {
            const platform = await Neutralino.os.getPlatform();
            const arch = await Neutralino.os.getArch();
            const kernelVersion = await Neutralino.os.getKernelVersion();
            
            return { platform, arch, kernelVersion };
        } catch (error) {
            console.error('Error al obtener info del SO:', error);
            return { platform: 'unknown', arch: 'unknown' };
        }
    }
};
