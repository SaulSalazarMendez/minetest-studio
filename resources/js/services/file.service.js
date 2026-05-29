/**
 * Servicio de Archivos
 * Maneja operaciones con archivos y sistema de archivos
 */

const FileService = {
    // Extensiones y sus tipos
    fileExtensions: {
        lua: 'lua',
        txt: 'text',
        json: 'json',
        xml: 'xml',
        md: 'markdown',
        png: 'image',
        jpg: 'image',
        jpeg: 'image',
        svg: 'image',
        gif: 'image',
        bmp: 'image'
    },

    // Iconos por tipo de archivo
    fileIcons: {
        lua: '📜',
        folder: '📁',
        folderOpen: '📂',
        image: '🖼️',
        text: '📄',
        json: '{ }',
        xml: '< >',
        markdown: '📝',
        default: '📄'
    },

    /**
     * Lee el contenido de un archivo
     * @param {string} path - Ruta del archivo
     * @returns {Promise<string|null>} Contenido del archivo
     */
    async readFile(path) {
        try {
            const content = await Neutralino.fs.readFile(path);
            return content;
        } catch (error) {
            console.error('Error al leer archivo:', error);
            return null;
        }
    },

    /**
     * Escribe contenido en un archivo
     * @param {string} path - Ruta del archivo
     * @param {string} content - Contenido a escribir
     * @returns {Promise<boolean>} True si se escribió correctamente
     */
    async writeFile(path, content) {
        try {
            await Neutralino.fs.writeFile(path, content);
            return true;
        } catch (error) {
            console.error('Error al escribir archivo:', error);
            return false;
        }
    },

    /**
     * Lista el contenido de un directorio
     * @param {string} path - Ruta del directorio
     * @returns {Promise<Array>} Array de entradas del directorio
     */
    async readDirectory(path) {
        try {
            const entries = await Neutralino.fs.readDirectory(path);
            return entries || [];
        } catch (error) {
            console.error('Error al leer directorio:', error);
            return [];
        }
    },

    /**
     * Verifica si una ruta es un directorio
     * @param {string} path - Ruta a verificar
     * @returns {Promise<boolean>} True si es directorio
     */
    async isDirectory(path) {
        try {
            return await Neutralino.fs.isDirectory(path);
        } catch (error) {
            return false;
        }
    },

    /**
     * Verifica si una ruta es un archivo
     * @param {string} path - Ruta a verificar
     * @returns {Promise<boolean>} True si es archivo
     */
    async isFile(path) {
        try {
            return await Neutralino.fs.isFile(path);
        } catch (error) {
            return false;
        }
    },

    /**
     * Crea un directorio
     * @param {string} path - Ruta del directorio a crear
     * @returns {Promise<boolean>} True si se creó correctamente
     */
    async createDirectory(path) {
        try {
            await Neutralino.fs.createDirectory(path);
            return true;
        } catch (error) {
            console.error('Error al crear directorio:', error);
            return false;
        }
    },

    /**
     * Elimina un archivo o directorio
     * @param {string} path - Ruta a eliminar
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    async remove(path) {
        try {
            await Neutralino.fs.remove(path);
            return true;
        } catch (error) {
            console.error('Error al eliminar:', error);
            return false;
        }
    },

    /**
     * Construye el árbol de archivos de un directorio
     * @param {string} rootPath - Ruta raíz
     * @param {number} maxDepth - Profundidad máxima (default: 5)
     * @returns {Promise<Array>} Árbol de archivos
     */
    async buildFileTree(rootPath, maxDepth = 5) {
        return await this.buildTreeRecursive(rootPath, rootPath, maxDepth, 0);
    },

    /**
     * Función recursiva para construir el árbol
     */
    async buildTreeRecursive(basePath, currentPath, maxDepth, currentDepth) {
        if (currentDepth >= maxDepth) {
            return [];
        }

        const entries = await this.readDirectory(currentPath);
        const tree = [];

        for (const entry of entries) {
            // Omitir archivos ocultos y carpetas comunes de Minetest
            if (entry.startsWith('.') || 
                entry === '.git' || 
                entry === '__pycache__') {
                continue;
            }

            const fullPath = currentPath + '/' + entry;
            const isDir = await this.isDirectory(fullPath);

            const node = {
                name: entry,
                path: fullPath,
                isDirectory: isDir,
                children: []
            };

            if (isDir && currentDepth < maxDepth - 1) {
                node.children = await this.buildTreeRecursive(basePath, fullPath, maxDepth, currentDepth + 1);
            }

            tree.push(node);
        }

        // Ordenar: carpetas primero, luego archivos
        tree.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name);
            }
            return a.isDirectory ? -1 : 1;
        });

        return tree;
    },

    /**
     * Obtiene el lenguaje de un archivo según su extensión
     * @param {string} fileName - Nombre del archivo
     * @returns {string} Identificador del lenguaje
     */
    getLanguage(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        
        const languageMap = {
            'lua': 'lua',
            'txt': 'plaintext',
            'md': 'markdown',
            'json': 'json',
            'xml': 'xml',
            'html': 'html',
            'css': 'css',
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'sh': 'shell',
            'bat': 'batch',
            'yaml': 'yaml',
            'yml': 'yaml'
        };

        return languageMap[ext] || 'plaintext';
    },

    /**
     * Verifica si un archivo es una imagen
     * @param {string} fileName - Nombre del archivo
     * @returns {boolean} True si es imagen
     */
    isImageFile(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        return ['png', 'jpg', 'jpeg', 'svg', 'gif', 'bmp', 'webp'].includes(ext);
    },

    /**
     * Obtiene el icono para un archivo
     * @param {string} fileName - Nombre del archivo
     * @param {boolean} isDirectory - Si es directorio
     * @returns {string} Icono
     */
    getFileIcon(fileName, isDirectory = false) {
        if (isDirectory) {
            return this.fileIcons.folder;
        }

        const ext = fileName.split('.').pop().toLowerCase();
        return this.fileIcons[ext] || this.fileIcons.default;
    },

    /**
     * Busca texto en archivos de un directorio
     * @param {string} rootPath - Ruta raíz de búsqueda
     * @param {string} query - Texto a buscar
     * @param {Array<string>} extensions - Extensiones a buscar (opcional)
     * @returns {Promise<Array>} Resultados de la búsqueda
     */
    async searchInFiles(rootPath, query, extensions = ['.lua', '.txt', '.md']) {
        const results = [];
        await this.searchRecursive(rootPath, query, extensions, results);
        return results;
    },

    /**
     * Búsqueda recursiva en archivos
     */
    async searchRecursive(path, query, extensions, results) {
        const entries = await this.readDirectory(path);

        for (const entry of entries) {
            if (entry.startsWith('.') || entry === '.git') {
                continue;
            }

            const fullPath = path + '/' + entry;
            const isDir = await this.isDirectory(fullPath);

            if (isDir) {
                await this.searchRecursive(fullPath, query, extensions, results);
            } else {
                const ext = '.' + entry.split('.').pop().toLowerCase();
                if (extensions.includes(ext)) {
                    const content = await this.readFile(fullPath);
                    if (content) {
                        const lines = content.split('\n');
                        lines.forEach((line, index) => {
                            if (line.toLowerCase().includes(query.toLowerCase())) {
                                results.push({
                                    file: fullPath,
                                    line: index + 1,
                                    text: line.trim()
                                });
                            }
                        });
                    }
                }
            }
        }
    },

    /**
     * Copia un archivo
     * @param {string} source - Ruta origen
     * @param {string} dest - Ruta destino
     * @returns {Promise<boolean>} True si se copió correctamente
     */
    async copyFile(source, dest) {
        try {
            const content = await this.readFile(source);
            if (content !== null) {
                await this.writeFile(dest, content);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al copiar archivo:', error);
            return false;
        }
    },

    /**
     * Obtiene la ruta relativa de un archivo respecto a una base
     * @param {string} fullPath - Ruta completa
     * @param {string} basePath - Ruta base
     * @returns {string} Ruta relativa
     */
    getRelativePath(fullPath, basePath) {
        if (fullPath.startsWith(basePath)) {
            return fullPath.substring(basePath.length + 1);
        }
        return fullPath;
    }
};
