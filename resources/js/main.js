/**
 * Minetest Studio - Aplicación Principal
 * Punto de entrada de la aplicación Vue.js
 */

// Esperar a que Neutralino esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando Minetest Studio...');
    
    // Inicializar Vue App
    const app = new Vue({
        el: '#app',
        
        store,
        
        data: {
            // Estado local
            activePanel: 'explorer',
            explorerSections: {
                workspace: true
            },
            searchQuery: '',
            terminalCollapsed: false,
            showSettingsDialog: false,
            showCreateMobDialog: false,
            newMobName: '',
            newMobDescription: '',
            
            // Datos computados del store
            config: { minetestPath: '', workspacePath: '' },
            projectPath: null,
            openFiles: [],
            currentFile: null,
            fileTree: [],
            mobsList: [],
            searchResults: [],
            notifications: []
        },
        
        computed: {
            ...Vuex.mapState(['projectPath', 'openFiles', 'currentFile', 'fileTree', 'mobsList', 'searchResults', 'notifications'])
        },
        
        async created() {
            // Cargar configuración guardada
            await this.loadConfig();
            
            // Verificar si hay ruta de Minetest configurada
            if (!this.config.minetestPath) {
                await this.autoDetectMinetest();
            }
            
            // Si hay workspace configurado, cargarlo
            if (this.config.workspacePath) {
                await this.loadWorkspace(this.config.workspacePath);
            }
        },
        
        mounted() {
            // Inicializar Monaco Editor
            this.initMonacoEditor();
            
            // Inicializar Terminal
            this.initTerminal();
            
            // Manejar redimensionamiento
            window.addEventListener('resize', () => {
                if (MonacoConfig.editor) {
                    MonacoConfig.editor.layout();
                }
                if (TerminalManager.fitAddon) {
                    TerminalManager.fitAddon.fit();
                }
            });
            
            // Atajos de teclado globales
            document.addEventListener('keydown', this.handleKeyboardShortcuts);
        },
        
        methods: {
            // ============================================
            // Configuración
            // ============================================
            
            async loadConfig() {
                const config = await ConfigService.load();
                this.config = config;
                this.$store.commit('SET_CONFIG', config);
                
                if (config.workspacePath) {
                    this.$store.commit('SET_WORKSPACE_PATH', config.workspacePath);
                }
            },
            
            async autoDetectMinetest() {
                const detectedPath = await ConfigService.detectMinetestPath();
                
                if (detectedPath) {
                    this.config.minetestPath = detectedPath;
                    this.$store.commit('SET_MINETEST_PATH', detectedPath);
                    await this.saveConfig();
                    this.notify('success', 'Luanti/Minetest detectado automáticamente');
                    
                    // Escanear mobs existentes
                    await this.scanMobs();
                } else {
                    this.notify('warning', 'No se encontró Luanti/Minetest. Configura la ruta manualmente.');
                }
            },
            
            async selectMinetestPath() {
                const path = await ConfigService.selectFolderDialog();
                
                if (path) {
                    const isValid = await ConfigService.validateMinetestPath(path);
                    
                    if (isValid) {
                        this.config.minetestPath = path;
                        this.$store.commit('SET_MINETEST_PATH', path);
                        await this.saveConfig();
                        this.showSettingsDialog = false;
                        this.notify('success', 'Ruta de Luanti/Minetest guardada');
                        
                        // Escanear mobs
                        await this.scanMobs();
                    } else {
                        this.notify('error', 'La ruta seleccionada no parece ser una instalación válida de Minetest');
                    }
                }
            },
            
            async saveConfig() {
                const saved = await ConfigService.save(this.config);
                if (saved) {
                    console.log('Configuración guardada');
                }
            },
            
            openSettings() {
                this.showSettingsDialog = true;
            },
            
            // ============================================
            // Workspace
            // ============================================
            
            async selectWorkspace() {
                const path = await ConfigService.selectFolderDialog();
                
                if (path) {
                    await this.loadWorkspace(path);
                }
            },
            
            async loadWorkspace(path) {
                this.$store.commit('SET_WORKSPACE_PATH', path);
                this.config.workspacePath = path;
                await this.saveConfig();
                
                // Construir árbol de archivos
                await this.refreshFileTree();
                
                this.notify('success', `Workspace cargado: ${this.getProjectName()}`);
            },
            
            getProjectName() {
                if (this.projectPath) {
                    const parts = this.projectPath.split(/[\\/]/);
                    return parts[parts.length - 1] || 'Proyecto';
                }
                return '';
            },
            
            // ============================================
            // Árbol de archivos
            // ============================================
            
            async refreshFileTree() {
                if (!this.projectPath) {
                    this.$store.commit('SET_FILE_TREE', []);
                    return;
                }
                
                const tree = await FileService.buildFileTree(this.projectPath, 5);
                this.$store.commit('SET_FILE_TREE', tree);
            },
            
            toggleExplorerSection(section) {
                this.explorerSections[section] = !this.explorerSections[section];
            },
            
            // ============================================
            // Gestión de archivos
            // ============================================
            
            async openFile(item, lineNumber = null) {
                try {
                    // Verificar si ya está abierto
                    const existing = this.openFiles.find(f => f.path === item.path);
                    
                    if (existing) {
                        this.currentFile = existing;
                        MonacoConfig.focus();
                        if (lineNumber) {
                            MonacoConfig.editor.revealLine(lineNumber);
                        }
                        return;
                    }
                    
                    // Leer contenido
                    const content = await FileService.readFile(item.path);
                    
                    if (content === null) {
                        this.notify('error', 'Error al leer el archivo');
                        return;
                    }
                    
                    // Determinar lenguaje
                    const language = FileService.getLanguage(item.name);
                    
                    // Añadir a archivos abiertos
                    const fileData = {
                        path: item.path,
                        name: item.name,
                        content: content,
                        language: language,
                        isDirectory: false
                    };
                    
                    this.$store.commit('ADD_OPEN_FILE', fileData);
                    this.currentFile = fileData;
                    
                    // Actualizar editor
                    MonacoConfig.setContent(content);
                    MonacoConfig.setLanguage(language);
                    
                    this.notify('info', `Archivo abierto: ${item.name}`);
                } catch (error) {
                    console.error('Error al abrir archivo:', error);
                    this.notify('error', 'Error al abrir archivo: ' + error.message);
                }
            },
            
            async closeTab(file) {
                // Verificar cambios no guardados
                if (file.modified) {
                    const confirmed = confirm(`¿Guardar cambios en ${file.name}?`);
                    if (confirmed) {
                        await this.saveCurrentFile();
                    }
                }
                
                this.$store.commit('REMOVE_OPEN_FILE', file);
                
                // Seleccionar otro archivo o ninguno
                if (this.currentFile && this.currentFile.path === file.path) {
                    const remaining = this.openFiles.filter(f => f.path !== file.path);
                    if (remaining.length > 0) {
                        this.currentFile = remaining[remaining.length - 1];
                        MonacoConfig.setContent(this.currentFile.content);
                        MonacoConfig.setLanguage(this.currentFile.language);
                    } else {
                        this.currentFile = null;
                        MonacoConfig.setContent('-- Bienvenido a Minetest Studio\n');
                    }
                }
            },
            
            switchTab(file) {
                this.currentFile = file;
                MonacoConfig.setContent(file.content);
                MonacoConfig.setLanguage(file.language);
                MonacoConfig.focus();
            },
            
            async saveCurrentFile() {
                if (!this.currentFile) return;
                
                const content = MonacoConfig.getContent();
                const success = await FileService.writeFile(this.currentFile.path, content);
                
                if (success) {
                    this.$store.commit('SET_FILE_MODIFIED', { path: this.currentFile.path, modified: false });
                    this.currentFile.content = content;
                    this.notify('success', 'Archivo guardado');
                } else {
                    this.notify('error', 'Error al guardar archivo');
                }
            },
            
            previewImage(item) {
                this.openFile(item);
            },
            
            isImageFile(fileName) {
                return FileService.isImageFile(fileName);
            },
            
            getImagePreviewUrl(filePath) {
                // En Neutralino, necesitamos leer el archivo y convertirlo a base64
                // Esto es un placeholder - en producción se implementaría la conversión
                return filePath;
            },
            
            getFileIcon(fileName) {
                return FileService.getFileIcon(fileName);
            },
            
            // ============================================
            // Mobs
            // ============================================
            
            async scanMobs() {
                if (!this.config.minetestPath) return;
                
                const modsPath = ConfigService.getModsPath(this.config.minetestPath);
                const mobs = await MobService.scanMobs(modsPath);
                this.$store.commit('SET_MOBS_LIST', mobs);
            },
            
            createNewMob() {
                this.showCreateMobDialog = true;
                this.newMobName = '';
                this.newMobDescription = '';
            },
            
            async confirmCreateMob() {
                // Validar nombre
                const validation = MobService.validateMobName(this.newMobName);
                
                if (!validation.valid) {
                    this.notify('error', validation.message);
                    return;
                }
                
                // Determinar ruta base
                let basePath;
                
                if (this.config.workspacePath) {
                    basePath = this.config.workspacePath;
                } else if (this.config.minetestPath) {
                    basePath = ConfigService.getModsPath(this.config.minetestPath);
                } else {
                    this.notify('error', 'No hay workspace o ruta de Minetest configurada');
                    return;
                }
                
                // Crear mob
                const success = await MobService.createMob(
                    basePath,
                    this.newMobName,
                    this.newMobDescription || 'Mob creado con Minetest Studio'
                );
                
                if (success) {
                    this.notify('success', `Mob "${this.newMobName}" creado exitosamente`);
                    this.showCreateMobDialog = false;
                    
                    // Refrescar árbol de archivos y lista de mobs
                    await this.refreshFileTree();
                    await this.scanMobs();
                    
                    // Abrir init.lua del nuevo mob
                    const modName = this.newMobName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                    const initPath = basePath + '/' + modName + '/init.lua';
                    
                    setTimeout(async () => {
                        const exists = await FileService.isFile(initPath);
                        if (exists) {
                            this.openFile({ path: initPath, name: 'init.lua', isDirectory: false });
                        }
                    }, 500);
                } else {
                    this.notify('error', 'Error al crear el mob');
                }
            },
            
            selectMob(mob) {
                // Establecer como workspace y abrir init.lua
                this.loadWorkspace(mob.path);
                
                setTimeout(() => {
                    this.openFile({ path: mob.path + '/init.lua', name: 'init.lua', isDirectory: false });
                }, 300);
            },
            
            // ============================================
            // Búsqueda
            // ============================================
            
            async performSearch() {
                if (!this.searchQuery.trim() || !this.projectPath) {
                    return;
                }
                
                const results = await FileService.searchInFiles(this.projectPath, this.searchQuery);
                this.$store.commit('SET_SEARCH_RESULTS', results);
                
                if (results.length > 0) {
                    this.notify('info', `${results.length} resultados encontrados`);
                } else {
                    this.notify('info', 'No se encontraron resultados');
                }
            },
            
            // ============================================
            // Terminal
            // ============================================
            
            async initTerminal() {
                await TerminalManager.init();
            },
            
            toggleTerminal() {
                this.terminalCollapsed = !this.terminalCollapsed;
                this.$store.commit('SET_TERMINAL_COLLAPSED', this.terminalCollapsed);
                
                setTimeout(() => {
                    TerminalManager.fit();
                }, 100);
            },
            
            // ============================================
            // Monaco Editor
            // ============================================
            
            async initMonacoEditor() {
                await MonacoConfig.init('monaco-editor');
                
                // Escuchar cambios
                MonacoConfig.onContentChange((content) => {
                    if (this.currentFile) {
                        this.$store.commit('SET_FILE_MODIFIED', { 
                            path: this.currentFile.path, 
                            modified: true 
                        });
                        this.currentFile.content = content;
                    }
                });
                
                // Guardar con Ctrl+S
                MonacoConfig.editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                    () => {
                        this.saveCurrentFile();
                    }
                );
            },
            
            // ============================================
            // Notificaciones
            // ============================================
            
            notify(type, message, duration = 5000) {
                this.$store.dispatch('notify', { type, message, duration });
            },
            
            dismissNotification(id) {
                this.$store.dispatch('dismissNotification', id);
            },
            
            // ============================================
            // Atajos de teclado
            // ============================================
            
            handleKeyboardShortcuts(e) {
                // Ctrl+S: Guardar
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    this.saveCurrentFile();
                }
                
                // Ctrl+P: Buscar archivo (futuro)
                if (e.ctrlKey && e.key === 'p') {
                    e.preventDefault();
                    this.activePanel = 'search';
                }
                
                // Ctrl+B: Toggle sidebar (futuro)
                if (e.ctrlKey && e.key === 'b') {
                    e.preventDefault();
                    // Toggle sidebar visibility
                }
                
                // Ctrl+`: Toggle terminal
                if (e.ctrlKey && e.key === '`') {
                    e.preventDefault();
                    this.toggleTerminal();
                }
                
                // Escape: Cerrar diálogos
                if (e.key === 'Escape') {
                    this.showSettingsDialog = false;
                    this.showCreateMobDialog = false;
                }
            }
        }
    });
    
    // Exponer app globalmente para debugging
    window.app = app;
});
