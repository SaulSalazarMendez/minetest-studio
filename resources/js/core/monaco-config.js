/**
 * Configuración de Monaco Editor para Lua con soporte Luanti/Minetest
 */

const MonacoConfig = {
    editor: null,
    
    /**
     * Inicializa el editor Monaco
     * @param {string} containerId - ID del contenedor DOM
     * @returns {Promise<object>} Instancia del editor
     */
    async init(containerId) {
        return new Promise((resolve, reject) => {
            // Configurar loader de Monaco
            require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
            
            require(['vs/editor/editor.main'], () => {
                try {
                    // Crear editor
                    this.editor = monaco.editor.create(document.getElementById(containerId), {
                        value: '-- Bienvenido a Minetest Studio\n-- Abre un archivo .lua para comenzar a editar\n',
                        language: 'lua',
                        theme: 'vs-dark',
                        automaticLayout: true,
                        minimap: { enabled: true },
                        fontSize: 14,
                        fontFamily: 'Consolas, "Courier New", monospace',
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                        tabSize: 4,
                        insertSpaces: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        autoIndent: 'full',
                        folding: true,
                        foldingStrategy: 'indentation',
                        wordWrap: 'off',
                        scrollBeyondLastLine: true,
                        cursorBlinking: 'smooth',
                        smoothScrolling: true,
                        contextmenu: true,
                        multiCursorModifier: 'alt',
                        rulers: [80, 120],
                        bracketPairColorization: { enabled: true },
                        guides: {
                            bracketPairs: true,
                            indentation: true
                        }
                    });
                    
                    // Registrar lenguaje Lua mejorado
                    this.registerLuaLanguage();
                    
                    // Registrar temas y snippets
                    this.registerLuantiAPI();
                    this.registerMobsRedoAPI();
                    this.registerSnippets();
                    
                    resolve(this.editor);
                } catch (error) {
                    reject(error);
                }
            });
        });
    },
    
    /**
     * Registra el lenguaje Lua con configuraciones personalizadas
     */
    registerLuaLanguage() {
        monaco.languages.registerCompletionItemProvider('lua', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                
                // Completados básicos de Lua
                const suggestions = [
                    { label: 'function', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'function ${1:name}(${2:args})\n\t${0}\nend', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if ${1:condition} then\n\t${0}\nend', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:i} = ${2:1}, ${3:10} do\n\t${0}\nend', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: ' ipairs', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:i}, ${2:v} in ipairs(${3:table}) do\n\t${0}\nend', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'pairs', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:key}, ${2:value} in pairs(${3:table}) do\n\t${0}\nend', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while ${1:condition} do\n\t${0}\nend', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'repeat', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'repeat\n\t${0}\nuntil ${1:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                ];
                
                return { suggestions };
            }
        });
    },
    
    /**
     * Registra la API de Luanti/Minetest
     */
    registerLuantiAPI() {
        const luantiFunctions = [
            // Funciones globales de Minetest
            { label: 'minetest.register_node', detail: 'Registrar un nodo', documentation: 'Registra un nuevo tipo de nodo en el juego' },
            { label: 'minetest.register_entity', detail: 'Registrar una entidad', documentation: 'Registra una nueva entidad móvil' },
            { label: 'minetest.register_item', detail: 'Registrar un ítem', documentation: 'Registra un nuevo ítem' },
            { label: 'minetest.register_craft', detail: 'Receta de crafteo', documentation: 'Registra una receta de fabricación' },
            { label: 'minetest.register_chatcommand', detail: 'Comando de chat', documentation: 'Registra un comando de consola' },
            { label: 'minetest.register_on_punchnode', detail: 'Evento punchar nodo', documentation: 'Se llama cuando un jugador punchar un nodo' },
            { label: 'minetest.register_on_placenode', detail: 'Evento colocar nodo', documentation: 'Se llama cuando un jugador coloca un nodo' },
            { label: 'minetest.register_globalstep', detail: 'Paso global', documentation: 'Función llamada cada paso del juego' },
            
            // Utilidades
            { label: 'minetest.get_modpath', detail: 'Obtener ruta del mod', documentation: 'Devuelve la ruta de un mod' },
            { label: 'minetest.get_current_modname', detail: 'Nombre del mod actual', documentation: 'Devuelve el nombre del mod que se está cargando' },
            { label: 'minetest.setting_get', detail: 'Obtener configuración', documentation: 'Obtiene un valor de configuración' },
            { label: 'minetest.log', detail: 'Registrar log', documentation: 'Escribe un mensaje en el log' },
            { label: 'minetest.after', detail: 'Ejecutar después', documentation: 'Ejecuta una función después de un tiempo' },
            { label: 'minetest.do_after', detail: 'Hacer después', documentation: 'Similar a after pero pasa el contexto' },
            
            // Posición y vectores
            { label: 'vector.new', detail: 'Nuevo vector', documentation: 'Crea un nuevo vector' },
            { label: 'vector.add', detail: 'Sumar vectores', documentation: 'Suma dos vectores' },
            { label: 'vector.subtract', detail: 'Restar vectores', documentation: 'Resta dos vectores' },
            { label: 'vector.multiply', detail: 'Multiplicar vector', documentation: 'Multiplica un vector por un escalar' },
            { label: 'vector.length', detail: 'Longitud del vector', documentation: 'Calcula la longitud de un vector' },
            { label: 'vector.distance', detail: 'Distancia entre puntos', documentation: 'Calcula la distancia entre dos puntos' },
            
            // Jugadores
            { label: 'minetest.get_player_by_name', detail: 'Obtener jugador', documentation: 'Obtiene un objeto jugador por nombre' },
            { label: 'minetest.get_online_players', detail: 'Jugadores en línea', documentation: 'Devuelve lista de jugadores conectados' },
            
            // Nodos
            { label: 'minetest.get_node', detail: 'Obtener nodo', documentation: 'Obtiene el nodo en una posición' },
            { label: 'minetest.set_node', detail: 'Colocar nodo', documentation: 'Coloca un nodo en una posición' },
            { label: 'minetest.remove_node', detail: 'Eliminar nodo', documentation: 'Elimina un nodo en una posición' },
            { label: 'minetest.swap_node', detail: 'Intercambiar nodo', documentation: 'Intercambia un nodo sin triggers' },
            { label: 'minetest.get_node_light', detail: 'Luz del nodo', documentation: 'Obtiene el nivel de luz en una posición' },
            
            // Entidades y objetos
            { label: 'minetest.add_entity', detail: 'Añadir entidad', documentation: 'Añade una entidad en una posición' },
            { label: 'minetest.add_particle', detail: 'Añadir partícula', documentation: 'Añade una partícula visual' },
            { label: 'minetest.sound_play', detail: 'Reproducir sonido', documentation: 'Reproduce un sonido' },
            
            // Utilidades varias
            { label: 'minetest.parse_json', detail: 'Parsear JSON', documentation: 'Convierte JSON a tabla Lua' },
            { label: 'minetest.write_json', detail: 'Escribir JSON', documentation: 'Convierte tabla a JSON' },
            { label: 'minetest.serialize', detail: 'Serializar', documentation: 'Serializa una tabla Lua' },
            { label: 'minetest.deserialize', detail: 'Deserializar', documentation: 'Deserializa una cadena a tabla' },
            { label: 'minetest.sha1', detail: 'Hash SHA1', documentation: 'Calcula hash SHA1 de una cadena' },
            { label: 'minetest.get_us_time', detail: 'Tiempo en microsegundos', documentation: 'Obtiene tiempo actual en µs' },
            { label: 'minetest.get_time', detail: 'Tiempo del juego', documentation: 'Obtiene el tiempo del juego (0-24000)' },
            { label: 'minetest.get_day_count', detail: 'Días transcurridos', documentation: 'Número de días desde el inicio' },
        ];
        
        // Añadir completados
        monaco.languages.registerCompletionItemProvider('lua', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                
                const suggestions = luantiFunctions.map(fn => ({
                    label: fn.label,
                    kind: monaco.languages.CompletionItemKind.Function,
                    detail: fn.detail,
                    documentation: fn.documentation,
                    insertText: fn.label.split('(')[0] + '(${1})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range
                }));
                
                return { suggestions };
            }
        });
    },
    
    /**
     * Registra la API de mobs_redo
     */
    registerMobsRedoAPI() {
        const mobsRedoFunctions = [
            { label: 'mobs:register_mob', detail: 'Registrar mob', documentation: 'Registra un nuevo mob usando mobs_redo' },
            { label: 'mobs:spawn', detail: 'Configurar spawn', documentation: 'Configura las reglas de aparición natural' },
            { label: 'mobs:egg', detail: 'Huevo de spawn', documentation: 'Registra un huevo para spawnear el mob' },
            { label: 'mobs:drop_items', detail: 'Soltar ítems', documentation: 'Suelta ítems en una posición' },
            { label: 'mobs:anim_start', detail: 'Iniciar animación', documentation: 'Inicia una animación del mob' },
            { label: 'mobs:anim_stop', detail: 'Detener animación', documentation: 'Detiene la animación actual' },
            { label: 'mobs:find_nearest_player', detail: 'Buscar jugador cercano', documentation: 'Encuentra el jugador más cercano al mob' },
            { label: 'mobs:is_player', detail: 'Es jugador', documentation: 'Verifica si una entidad es un jugador' },
            { label: 'mobs:is_npc', detail: 'Es NPC', documentation: 'Verifica si una entidad es un NPC' },
            { label: 'mobs:protect', detail: 'Proteger área', documentation: 'Verifica si un área está protegida' },
            { label: 'mobs:route', detail: 'Ruta de navegación', documentation: 'Calcula ruta para el mob' },
            { label: 'mobs:attack', detail: 'Atacar', documentation: 'Ordena al mob atacar' },
            { label: 'mobs:follow', detail: 'Seguir', documentation: 'Ordena al mob seguir a un objetivo' },
            { label: 'mobs:flee', detail: 'Huir', documentation: 'Ordena al mob huir' },
            { label: 'mobs:turn_to_face', detail: 'Mirar hacia', documentation: 'Gira al mob hacia una dirección' },
            { label: 'mobs:velocity', detail: 'Establecer velocidad', documentation: 'Establece la velocidad del mob' },
        ];
        
        monaco.languages.registerCompletionItemProvider('lua', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                
                const suggestions = mobsRedoFunctions.map(fn => ({
                    label: fn.label,
                    kind: monaco.languages.CompletionItemKind.Method,
                    detail: fn.detail,
                    documentation: fn.documentation,
                    insertText: fn.label + '(${1})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range
                }));
                
                return { suggestions };
            }
        });
    },
    
    /**
     * Registra snippets personalizados
     */
    registerSnippets() {
        const snippets = [
            {
                prefix: 'mobtemplate',
                body: `mobs:register_mob("${1:modname}:${2:entity}", {
    hp_min = ${3:20},
    hp_max = ${4:100},
    armor_groups = {fleshy = ${5:100}},
    attack_type = "${6:dogfight}",
    damage = ${7:5},
    reach = ${8:2},
    collisionbox = {-0.3, 0.0, -0.3, 0.3, 1.7, 0.3},
    visual = "${9|mesh,cube,sprite|}",
    mesh = "${10:model.obj}",
    textures = {"${11:texture.png}"},
    sounds = {},
    water_damage = ${12:0},
    lava_damage = ${13:0},
    fear_height = ${14:4},
    spawn_on = {"${15:default:dirt_with_grass}"},
    
    on_punch = function(self, puncher, time_from_last_punch, tool_capabilities, dir, damage)
        ${0}
    end,
})`,
                description: 'Plantilla completa de mob'
            },
            {
                prefix: 'node',
                body: `minetest.register_node("${1:modname}:${2:block}", {
    description = "${3:Block Description}",
    tiles = {"${4:texture.png}"},
    groups = {cracky = ${5:3}, level = ${6:2}},
    sounds = ${7|minetest.default_sound_table,default_sounds|},
    ${0}
})`,
                description: 'Registrar nodo'
            },
            {
                prefix: 'craft',
                body: `minetest.register_craft({
    output = "${1:modname:item} ${2:1}",
    recipe = {
        {"${3:material1}", "${4:material2}", "${5:material3}"},
        {"${6:material4}", "${7:material5}", "${8:material6}"},
        {"${9:material7}", "${10:material8}", "${11:material9}"}
    }
})`,
                description: 'Receta de crafteo en forma'
            },
            {
                prefix: 'craftshapeless',
                body: `minetest.register_craft({
    output = "${1:modname:item} ${2:1}",
    recipe = {
        {"${3:material1}"},
        {"${4:material2}"},
        {"${5:material3}"}
    }
})`,
                description: 'Receta de crafteo sin forma'
            },
            {
                prefix: 'chatcmd',
                body: `minetest.register_chatcommand("${1:command}", {
    params = "<${2:params}>",
    description = "${3:Command description}",
    privs = {${4:basic} = true},
    func = function(name, param)
        ${0}
    end,
})`,
                description: 'Comando de chat'
            },
            {
                prefix: 'abm',
                body: `minetest.register_abm({
    label = "${1:ABM Label}",
    nodenames = {"${2:group:xxx}"},
    neighbors = {"${3:any}"},
    interval = ${4:1.0},
    chance = ${5:1},
    action = function(pos, node, active_object_count, active_object_count_wider)
        ${0}
    end,
})`,
                description: 'ABM (Active Block Modifier)'
            },
            {
                prefix: 'lbm',
                body: `minetest.register_lbm({
    name = "${1:modname}:${2:lbm_name}",
    nodenames = {"${3:group:xxx}"},
    run_at_every_load = ${4:false},
    action = function(pos, node)
        ${0}
    end,
})`,
                description: 'LBM (Loading Block Modifier)'
            },
            {
                prefix: 'on_join',
                body: `minetest.register_on_joinplayer(function(player)
    local name = player:get_player_name()
    minetest.chat_send_all("Welcome, " .. name .. "!")
    ${0}
end)`,
                description: 'Evento al unir jugador'
            },
            {
                prefix: 'on_leave',
                body: `minetest.register_on_leaveplayer(function(player)
    local name = player:get_player_name()
    ${0}
end)`,
                description: 'Evento al dejar jugador'
            }
        ];
        
        // Registrar snippets como proveedores de completado
        monaco.languages.registerCompletionItemProvider('lua', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                
                const suggestions = snippets.map(snippet => ({
                    label: snippet.prefix,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    detail: snippet.description,
                    insertText: snippet.body,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range
                }));
                
                return { suggestions };
            }
        });
    },
    
    /**
     * Establece el contenido del editor
     * @param {string} content - Contenido a establecer
     */
    setContent(content) {
        if (this.editor) {
            this.editor.setValue(content);
        }
    },
    
    /**
     * Obtiene el contenido del editor
     * @returns {string} Contenido actual
     */
    getContent() {
        return this.editor ? this.editor.getValue() : '';
    },
    
    /**
     * Establece el lenguaje
     * @param {string} language - Identificador del lenguaje
     */
    setLanguage(language) {
        if (this.editor) {
            monaco.editor.setModelLanguage(this.editor.getModel(), language);
        }
    },
    
    /**
     * Marca el archivo como limpio (sin cambios)
     */
    markClean() {
        if (this.editor && this.editor.getModel()) {
            this.editor.getModel().updateEventEmitter = null;
        }
    },
    
    /**
     * Escucha cambios en el contenido
     * @param {Function} callback - Función a llamar cuando hay cambios
     */
    onContentChange(callback) {
        if (this.editor) {
            this.editor.onDidChangeModelContent(() => {
                callback(this.getContent());
            });
        }
    },
    
    /**
     * Enfoca el editor
     */
    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    },
    
    /**
     * Realiza layout del editor (para redimensionamiento)
     */
    layout() {
        if (this.editor) {
            this.editor.layout();
        }
    }
};
