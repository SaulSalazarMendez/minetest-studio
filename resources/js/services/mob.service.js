/**
 * Servicio de Mobs
 * Maneja la creación y gestión de mobs para Minetest
 */

const MobService = {
    /**
     * Estructura base de un mob usando mobs_redo
     */
    mobTemplate: {
        initLua: `-- {{name}} - {{description}}
-- Generado por Minetest Studio

local modpath = minetest.get_modpath(minetest.get_current_modname())

-- Registrar el mob usando mobs:register_mob
mobs:register_mob("{{modname}}:{{entity_name}}", {
    hp_min = 20,
    hp_max = 100,
    armor_groups = {fleshy = 100},
    attack_type = "dogfight",
    damage = 5,
    reach = 2,
    max_damage = 50,
    view_range = 15,
    walk_velocity = 2,
    run_velocity = 5,
    jump_height = 3,
    collisionbox = {-0.3, 0.0, -0.3, 0.3, 1.7, 0.3},
    visual = "mesh",
    mesh = "{{mesh_file}}",
    textures = {{textures}},
    makes_footstep_sound = true,
    sounds = {
        random = function()
            return {
                name = "{{sound_name}}",
                gain = 0.3,
                max_hear_distance = 20,
            }
        end,
    },
    water_damage = 0,
    lava_damage = 0,
    light_damage = 0,
    fear_height = 4,
    fall_speed = -5,
    spawn_on = {{spawn_nodes}},
    spawn_arbitrary = false,
    
    -- IA del mob
    do_custom = function(self, dtime)
        -- Lógica personalizada aquí
    end,
    
    -- Al morir
    on_death = function(self, killer)
        -- Drops o efectos al morir
    end,
    
    -- Al atacar
    on_punch = function(self, puncher, time_from_last_punch, tool_capabilities, dir, damage)
        -- Lógica al ser golpeado
    end,
    
    -- Al interactuar
    on_rightclick = function(self, clicker)
        -- Domesticar o criar
    end,
})

-- Registrar spawn natural
if minetest.global_exists("mobs") and mobs.spawn then
    mobs:spawn({
        name = "{{modname}}:{{entity_name}}",
        chance = 10000,
        min_ambient = 0,
        max_ambient = 7,
        min_light = 0,
        interval = 60,
    })
end

-- Registrar huevo (opcional)
-- mobs:egg("{{modname}}:{{entity_name}}")

minetest.log("action", "[{{modname}}] {{entity_name}} registrado correctamente")
`,

        descriptionTXT: `{{name}}
{{description}}

Este mob fue creado con Minetest Studio.

Requisitos:
- Minetest 5.0+
- mobs_redo API

Instalación:
1. Copia esta carpeta en tu directorio de mods
2. Activa el mod en world.mt o desde el menú de mods
`,

        licenseTXT: `Copyright (c) {{year}} {{author}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`
    },

    /**
     * Escanea la carpeta de mods en busca de mobs existentes
     * @param {string} modsPath - Ruta de la carpeta mods
     * @returns {Promise<Array>} Lista de mobs encontrados
     */
    async scanMobs(modsPath) {
        const mobs = [];
        
        try {
            const entries = await Neutralino.fs.readDirectory(modsPath);
            
            for (const entry of entries) {
                if (entry.startsWith('.')) continue;
                
                const mobPath = modsPath + '/' + entry;
                const isDir = await Neutralino.fs.isDirectory(mobPath);
                
                if (isDir) {
                    // Verificar si es un mod de mob (tiene init.lua)
                    const initPath = mobPath + '/init.lua';
                    const hasInit = await Neutralino.fs.isFile(initPath);
                    
                    if (hasInit) {
                        // Leer init.lua para detectar si registra un mob
                        const content = await Neutralino.fs.readFile(initPath);
                        const isMob = content && (
                            content.includes('mobs:register_mob') ||
                            content.includes('mobs:redo') ||
                            content.includes('eternium')
                        );
                        
                        if (isMob) {
                            mobs.push({
                                name: entry,
                                path: mobPath,
                                type: 'mob'
                            });
                        } else {
                            // Podría ser un mod relacionado
                            mobs.push({
                                name: entry,
                                path: mobPath,
                                type: 'mod'
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error al escanear mobs:', error);
        }
        
        return mobs;
    },

    /**
     * Crea un nuevo mob con la estructura estándar
     * @param {string} basePath - Ruta base (mods/mobs/)
     * @param {string} name - Nombre del mob
     * @param {string} description - Descripción
     * @param {object} options - Opciones adicionales
     * @returns {Promise<boolean>} True si se creó correctamente
     */
    async createMob(basePath, name, description, options = {}) {
        try {
            const modName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            const entityName = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
            const mobPath = basePath + '/' + modName;
            
            // Crear carpetas
            const folders = [
                mobPath,
                mobPath + '/textures',
                mobPath + '/sounds',
                mobPath + '/models',
                mobPath + '/locale'
            ];
            
            for (const folder of folders) {
                const exists = await Neutralino.fs.isDirectory(folder);
                if (!exists) {
                    await Neutralino.fs.createDirectory(folder);
                }
            }
            
            // Generar archivos
            const year = new Date().getFullYear();
            const author = options.author || 'Unknown';
            
            // init.lua
            let initContent = this.mobTemplate.initLua
                .replace(/\{\{name\}\}/g, name)
                .replace(/\{\{description\}\}/g, description)
                .replace(/\{\{modname\}\}/g, modName)
                .replace(/\{\{entity_name\}\}/g, entityName)
                .replace(/\{\{mesh_file\}\}/g, `${modName}.obj`)
                .replace(/\{\{textures\}\}/g, `{"${modName}.png"}`)
                .replace(/\{\{sound_name\}\}/g, `${modName}_sound`)
                .replace(/\{\{spawn_nodes\}\}/g, '{"default:dirt_with_grass", "default:grass_1"}');
            
            await Neutralino.fs.writeFile(mobPath + '/init.lua', initContent);
            
            // description.txt
            let descContent = this.mobTemplate.descriptionTXT
                .replace(/\{\{name\}\}/g, name)
                .replace(/\{\{description\}\}/g, description);
            
            await Neutralino.fs.writeFile(mobPath + '/description.txt', descContent);
            
            // license.txt
            let licenseContent = this.mobTemplate.licenseTXT
                .replace(/\{\{year\}\}/g, year.toString())
                .replace(/\{\{author\}\}/g, author);
            
            await Neutralino.fs.writeFile(mobPath + '/license.txt', licenseContent);
            
            // .gitignore
            const gitignore = `*.blend
*.bak
*.tmp
Thumbs.db
.DS_Store
`;
            await Neutralino.fs.writeFile(mobPath + '/.gitignore', gitignore);
            
            // README.md
            const readme = `# ${name}

${description}

## Requisitos

- Minetest 5.0+
- [mobs_redo](https://github.com/Minetest-for-Humans/mobs_redo)

## Instalación

1. Extrae o clona este repositorio en tu carpeta \`mods/\`
2. Activa el mod en tu mundo (editar \`world.mt\` o desde el menú)
   \`\`\`
   load_mod_${modName} = true
   \`\`\`

## Uso

El mob aparecerá naturalmente en el mundo. También puedes usar el comando:

\`\`\`
/giveitem ${modName}:${entityName}_spawn_egg
\`\`\`

## Licencia

Ver \`license.txt\`
`;
            await Neutralino.fs.writeFile(mobPath + '/README.md', readme);
            
            // Textura placeholder (PNG base64 mínimo)
            // En producción, esto debería ser una textura real
            const placeholderInfo = `Coloca tu textura ${modName}.png aquí
Dimensiones recomendadas: 64x64 o 128x128
Formato: PNG con canal alpha
`;
            await Neutralino.fs.writeFile(mobPath + '/textures/README.txt', placeholderInfo);
            
            return true;
        } catch (error) {
            console.error('Error al crear mob:', error);
            return false;
        }
    },

    /**
     * Valida el nombre de un mob
     * @param {string} name - Nombre a validar
     * @returns {object} { valid: boolean, message: string }
     */
    validateMobName(name) {
        if (!name || name.trim().length === 0) {
            return { valid: false, message: 'El nombre no puede estar vacío' };
        }
        
        if (name.length > 50) {
            return { valid: false, message: 'El nombre es demasiado largo (máx 50 caracteres)' };
        }
        
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
            return { valid: false, message: 'El nombre debe comenzar con una letra y solo contener letras, números y guiones bajos' };
        }
        
        return { valid: true, message: '' };
    },

    /**
     * Obtiene la plantilla de código para diferentes elementos de mob
     * @param {string} type - Tipo de plantilla (attack, death, spawn, etc.)
     * @returns {string} Código de plantilla
     */
    getSnippet(type) {
        const snippets = {
            attack: `on_punch = function(self, puncher, time_from_last_punch, tool_capabilities, dir, damage)
    -- ${type} lógica
    mobs:anim_stop(self)
    mobs:anim_start(self, "punch")
end,`,
            
            death: `on_death = function(self, killer)
    -- ${type} lógica
    local drops = {
        {"default:feather", 1, 3},
        {"farm:meat_raw", 0, 2},
    }
    mobs:drop_items(self.pos, drops)
end,`,
            
            spawn: `mobs:spawn({
    name = "${'modname'}:${'entity_name'}",
    chance = 10000,
    min_ambient = 0,
    max_ambient = 7,
    min_light = 0,
    interval = 60,
})`,
            
            rightclick: `on_rightclick = function(self, clicker)
    -- Domesticar o criar
    local item = clicker:get_wielded_item()
    if item:get_name() == "farm:wheat" then
        item:take_item()
        clicker:set_wielded_item(item)
        self.tamed = true
        self.owner = clicker:get_player_name()
    end
end,`,
            
            custom: `do_custom = function(self, dtime)
    -- Lógica personalizada que se ejecuta cada tick
    -- self.object, self.pos, self.health, etc.
end,`
        };
        
        return snippets[type] || '';
    }
};
