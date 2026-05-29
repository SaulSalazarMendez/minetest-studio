/**
 * Terminal integrada con xterm.js
 * Maneja la ejecución de comandos y puente con Neutralino
 */

const TerminalManager = {
    terminal: null,
    fitAddon: null,
    containerId: 'xterm-terminal',
    
    /**
     * Inicializa la terminal xterm.js
     * @returns {Promise<object>} Instancia de la terminal
     */
    async init() {
        return new Promise((resolve, reject) => {
            try {
                // Crear instancia de xterm
                this.terminal = new Terminal({
                    cursorBlink: true,
                    fontSize: 14,
                    fontFamily: 'Consolas, "Courier New", monospace',
                    theme: {
                        background: '#1e1e1e',
                        foreground: '#cccccc',
                        cursor: '#ffffff',
                        cursorAccent: '#000000',
                        selection: 'rgba(255, 255, 255, 0.3)',
                        black: '#000000',
                        red: '#cd3131',
                        green: '#0dbc79',
                        yellow: '#e5e510',
                        blue: '#2472c8',
                        magenta: '#bc3fbc',
                        cyan: '#11a8cd',
                        white: '#e5e5e5',
                        brightBlack: '#666666',
                        brightRed: '#f14c4c',
                        brightGreen: '#23d18b',
                        brightYellow: '#f5f543',
                        brightBlue: '#3b8eea',
                        brightMagenta: '#d670d6',
                        brightCyan: '#29b8db',
                        brightWhite: '#e5e5e5'
                    },
                    scrollback: 1000,
                    tabStopWidth: 4,
                    rightClickSelectsWord: true,
                    allowProposedApi: true
                });
                
                // Añadir addon Fit
                this.fitAddon = new FitAddon.FitAddon();
                this.terminal.loadAddon(this.fitAddon);
                
                // Montar en el DOM
                const container = document.getElementById(this.containerId);
                if (container) {
                    this.terminal.open(container);
                    this.fitAddon.fit();
                    
                    // Escribir mensaje de bienvenida
                    this.writeln('╔════════════════════════════════════════════╗');
                    this.writeln('║       Minetest Studio Terminal             ║');
                    this.writeln('╚════════════════════════════════════════════╝');
                    this.writeln('');
                    this.writeln('Bienvenido a la terminal integrada.');
                    this.writeln('Usa \'help\' para ver los comandos disponibles.');
                    this.writeln('');
                    this.prompt();
                    
                    // Configurar manejo de input
                    this.setupInputHandler();
                }
                
                resolve(this.terminal);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Configura el manejador de entrada
     */
    setupInputHandler() {
        let currentLine = '';
        let commandHistory = [];
        let historyIndex = -1;
        
        this.terminal.onData(e => {
            switch (e) {
                case '\r': // Enter
                    this.writeln('');
                    this.executeCommand(currentLine);
                    commandHistory.push(currentLine);
                    historyIndex = commandHistory.length;
                    currentLine = '';
                    this.prompt();
                    break;
                    
                case '\u007F': // Backspace
                    if (currentLine.length > 0) {
                        currentLine = currentLine.slice(0, -1);
                        this.terminal.write('\b \b');
                    }
                    break;
                    
                case '\u001B[A': // Flecha arriba
                    if (historyIndex > 0) {
                        historyIndex--;
                        this.clearCurrentLine();
                        currentLine = commandHistory[historyIndex];
                        this.terminal.write(currentLine);
                    }
                    break;
                    
                case '\u001B[B': // Flecha abajo
                    if (historyIndex < commandHistory.length - 1) {
                        historyIndex++;
                        this.clearCurrentLine();
                        currentLine = commandHistory[historyIndex];
                        this.terminal.write(currentLine);
                    } else if (historyIndex === commandHistory.length - 1) {
                        historyIndex++;
                        this.clearCurrentLine();
                        currentLine = '';
                    }
                    break;
                    
                case '\u0003': // Ctrl+C
                    this.writeln('^C');
                    currentLine = '';
                    this.prompt();
                    break;
                    
                case '\u000C': // Ctrl+L
                    this.terminal.clear();
                    this.prompt();
                    break;
                    
                default:
                    // Caracteres imprimibles
                    if (e >= ' ' && e <= '~') {
                        currentLine += e;
                        this.terminal.write(e);
                    }
            }
        });
    },
    
    /**
     * Limpia la línea actual
     */
    clearCurrentLine() {
        this.terminal.write('\r\x1b[K');
    },
    
    /**
     * Escribe el prompt
     */
    prompt() {
        this.terminal.write('\\x1b[1;32mminetest-studio\\x1b[0m$ ');
    },
    
    /**
     * Ejecuta un comando
     * @param {string} command - Comando a ejecutar
     */
    async executeCommand(command) {
        const trimmedCommand = command.trim();
        
        if (!trimmedCommand) {
            return;
        }
        
        // Comandos internos
        if (trimmedCommand === 'help') {
            this.showHelp();
            return;
        }
        
        if (trimmedCommand === 'clear' || trimmedCommand === 'cls') {
            this.terminal.clear();
            return;
        }
        
        if (trimmedCommand === 'version') {
            this.writeln('Minetest Studio v1.0.0');
            this.writeln('Neutralinojs: ' + (Neutralino?.info?.VERSION || 'N/A'));
            return;
        }
        
        if (trimmedCommand === 'path') {
            try {
                const cwd = await Neutralino.os.execCommand('pwd', { stdOut: 'Capture' });
                this.writeln(cwd.stdOut || 'No disponible');
            } catch (error) {
                this.writeln('Error al obtener ruta: ' + error.message);
            }
            return;
        }
        
        // Ejecutar comando del sistema
        try {
            this.writeln(`\\x1b[90mEjecutando: ${trimmedCommand}\\x1b[0m`);
            
            const result = await Neutralino.os.execCommand(trimmedCommand, {
                stdOut: 'Capture',
                stdErr: 'Capture'
            });
            
            if (result.stdOut) {
                this.writeln(result.stdOut);
            }
            
            if (result.stdErr) {
                this.writeln(`\\x1b[31m${result.stdErr}\\x1b[0m`);
            }
            
            if (result.exitCode !== undefined) {
                this.writeln(`\\x1b[90mCódigo de salida: ${result.exitCode}\\x1b[0m`);
            }
        } catch (error) {
            this.writeln(`\\x1b[31mError: ${error.message}\\x1b[0m`);
        }
    },
    
    /**
     * Muestra ayuda de comandos
     */
    showHelp() {
        const helpText = `
\\x1b[1mComandos disponibles:\\x1b[0m
  \\x1b[36mhelp\\x1b[0m     - Muestra esta ayuda
  \\x1b[36mclear\\x1b[0m    - Limpia la terminal
  \\x1b[36mcls\\x1b[0m      - Alias de clear
  \\x1b[36mversion\\x1b[0m  - Muestra versión
  \\x1b[36mpath\\x1b[0m     - Muestra ruta actual
  
Puedes ejecutar cualquier comando del sistema operativo.
Ejemplos:
  \\x1b[36mls\\x1b[0m       - Listar archivos (Linux/Mac)
  \\x1b[36mdir\\x1b[0m      - Listar archivos (Windows)
  \\x1b[36mpwd\\x1b[0m      - Mostrar directorio actual
  \\x1b[36mecho hello\\x1b[0m - Imprimir texto
`;
        this.writeln(helpText);
    },
    
    /**
     * Escribe texto en la terminal
     * @param {string} text - Texto a escribir
     */
    write(text) {
        if (this.terminal) {
            this.terminal.write(text);
        }
    },
    
    /**
     * Escribe texto con salto de línea
     * @param {string} text - Texto a escribir
     */
    writeln(text) {
        if (this.terminal) {
            this.terminal.writeln(text);
        }
    },
    
    /**
     * Limpia la terminal
     */
    clear() {
        if (this.terminal) {
            this.terminal.clear();
        }
    },
    
    /**
     * Ajusta el tamaño de la terminal
     */
    fit() {
        if (this.fitAddon) {
            this.fitAddon.fit();
        }
    },
    
    /**
     * Enfoca la terminal
     */
    focus() {
        if (this.terminal) {
            this.terminal.focus();
        }
    },
    
    /**
     * Ejecuta un script Lua usando minetest
     * @param {string} scriptPath - Ruta del script
     */
    async runLuaScript(scriptPath) {
        this.writeln(`\\x1b[33mEjecutando script Lua: ${scriptPath}\\x1b[0m`);
        
        try {
            // Intentar ejecutar con lua o luajit si está disponible
            const result = await Neutralino.os.execCommand(`lua ${scriptPath}`, {
                stdOut: 'Capture',
                stdErr: 'Capture'
            });
            
            if (result.stdOut) {
                this.writeln(result.stdOut);
            }
            
            if (result.stdErr) {
                this.writeln(`\\x1b[31m${result.stdErr}\\x1b[0m`);
            }
        } catch (error) {
            this.writeln(`\\x1b[31mError: Lua no está instalado o no está en el PATH\\x1b[0m`);
            this.writeln('Instala Lua para ejecutar scripts directamente desde la terminal.');
        }
    },
    
    /**
     * Cambia al directorio del proyecto
     * @param {string} projectPath - Ruta del proyecto
     */
    async cdProject(projectPath) {
        if (projectPath) {
            try {
                // En sistemas Unix-like
                await Neutralino.os.execCommand(`cd "${projectPath}"`, {
                    stdOut: 'Capture'
                });
                this.writeln(`\\x1b[32mDirectorio cambiado a: ${projectPath}\\x1b[0m`);
            } catch (error) {
                this.writeln('Nota: El cambio de directorio es solo para este comando.');
            }
        }
    }
};
