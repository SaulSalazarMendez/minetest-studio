/**
 * Vuex Store para Minetest Studio
 * Maneja el estado global de la aplicación
 */

const store = new Vuex.Store({
    state: {
        // Configuración
        config: {
            minetestPath: '',
            workspacePath: '',
            theme: 'dark'
        },
        
        // Estado del proyecto
        projectPath: null,
        projectName: null,
        
        // Archivos abiertos
        openFiles: [],
        currentFile: null,
        
        // Árbol de archivos
        fileTree: [],
        
        // Mobs encontrados
        mobsList: [],
        
        // Búsqueda
        searchQuery: '',
        searchResults: [],
        
        // Terminal
        terminalInstance: null,
        terminalCollapsed: false,
        
        // Panel activo
        activePanel: 'explorer',
        
        // Notificaciones
        notifications: [],
        
        // Diálogos
        showSettingsDialog: false,
        showCreateMobDialog: false,
        newMobName: '',
        newMobDescription: ''
    },
    
    mutations: {
        // Configuración
        SET_CONFIG(state, config) {
            state.config = { ...state.config, ...config };
        },
        
        SET_MINETEST_PATH(state, path) {
            state.config.minetestPath = path;
        },
        
        SET_WORKSPACE_PATH(state, path) {
            state.config.workspacePath = path;
            state.projectPath = path;
            state.projectName = path ? path.split(/[\\/]/).pop() : null;
        },
        
        // Archivos
        SET_FILE_TREE(state, tree) {
            state.fileTree = tree;
        },
        
        ADD_OPEN_FILE(state, file) {
            const exists = state.openFiles.find(f => f.path === file.path);
            if (!exists) {
                state.openFiles.push({
                    ...file,
                    modified: false
                });
            }
        },
        
        REMOVE_OPEN_FILE(state, file) {
            state.openFiles = state.openFiles.filter(f => f.path !== file.path);
        },
        
        SET_CURRENT_FILE(state, file) {
            state.currentFile = file;
        },
        
        SET_FILE_MODIFIED(state, { path, modified }) {
            const file = state.openFiles.find(f => f.path === path);
            if (file) {
                file.modified = modified;
            }
        },
        
        UPDATE_FILE_CONTENT(state, { path, content }) {
            const file = state.openFiles.find(f => f.path === path);
            if (file) {
                file.content = content;
            }
        },
        
        // Mobs
        SET_MOBS_LIST(state, mobs) {
            state.mobsList = mobs;
        },
        
        // Búsqueda
        SET_SEARCH_QUERY(state, query) {
            state.searchQuery = query;
        },
        
        SET_SEARCH_RESULTS(state, results) {
            state.searchResults = results;
        },
        
        // Terminal
        SET_TERMINAL_COLLAPSED(state, collapsed) {
            state.terminalCollapsed = collapsed;
        },
        
        // Panel
        SET_ACTIVE_PANEL(state, panel) {
            state.activePanel = panel;
        },
        
        // Notificaciones
        ADD_NOTIFICATION(state, notification) {
            state.notifications.push({
                id: Date.now(),
                ...notification
            });
        },
        
        REMOVE_NOTIFICATION(state, id) {
            state.notifications = state.notifications.filter(n => n.id !== id);
        },
        
        // Diálogos
        SET_SETTINGS_DIALOG(state, show) {
            state.showSettingsDialog = show;
        },
        
        SET_CREATE_MOB_DIALOG(state, show) {
            state.showCreateMobDialog = show;
        },
        
        SET_NEW_MOB_NAME(state, name) {
            state.newMobName = name;
        },
        
        SET_NEW_MOB_DESCRIPTION(state, desc) {
            state.newMobDescription = desc;
        }
    },
    
    actions: {
        // Cargar configuración desde storage
        async loadConfig({ commit }) {
            try {
                const data = await Neutralino.storage.getData('minetest_studio_config');
                if (data) {
                    const config = JSON.parse(data);
                    commit('SET_CONFIG', config);
                }
            } catch (error) {
                console.log('No hay configuración guardada o error al cargar');
            }
        },
        
        // Guardar configuración en storage
        async saveConfig({ commit, state }) {
            try {
                await Neutralino.storage.setData('minetest_studio_config', JSON.stringify(state.config));
                return true;
            } catch (error) {
                console.error('Error al guardar configuración:', error);
                return false;
            }
        },
        
        // Agregar notificación
        notify({ commit }, { type, message, duration = 5000 }) {
            const id = Date.now();
            commit('ADD_NOTIFICATION', { type, message });
            
            if (duration > 0) {
                setTimeout(() => {
                    commit('REMOVE_NOTIFICATION', id);
                }, duration);
            }
            
            return id;
        },
        
        // Dismiss notification
        dismissNotification({ commit }, id) {
            commit('REMOVE_NOTIFICATION', id);
        }
    },
    
    getters: {
        getFileByPath: (state) => (path) => {
            return state.openFiles.find(f => f.path === path);
        },
        
        isFileOpen: (state) => (path) => {
            return state.openFiles.some(f => f.path === path);
        },
        
        hasUnsavedChanges: (state) => {
            return state.openFiles.some(f => f.modified);
        }
    }
});
