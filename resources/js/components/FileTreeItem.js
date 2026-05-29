/**
 * Componente FileTreeItem
 * Renderiza items del árbol de archivos recursivamente
 */

Vue.component('file-tree-item', {
    props: {
        item: {
            type: Object,
            required: true
        },
        depth: {
            type: Number,
            default: 0
        }
    },
    
    data() {
        return {
            isExpanded: this.depth < 2 // Expandir primeros niveles por defecto
        };
    },
    
    computed: {
        icon() {
            if (this.item.isDirectory) {
                return this.isExpanded ? '📂' : '📁';
            }
            
            const ext = this.item.name.split('.').pop().toLowerCase();
            const icons = {
                lua: '📜',
                png: '🖼️',
                jpg: '🖼️',
                jpeg: '🖼️',
                svg: '🖼️',
                gif: '🖼️',
                txt: '📄',
                md: '📝',
                json: '{ }',
                xml: '< >',
                license: '📃'
            };
            
            return icons[ext] || '📄';
        },
        
        paddingLeft() {
            return (this.depth * 15 + 10) + 'px';
        }
    },
    
    methods: {
        toggleExpand() {
            if (this.item.isDirectory) {
                this.isExpanded = !this.isExpanded;
            } else {
                this.openFile();
            }
        },
        
        openFile() {
            this.$emit('open-file', this.item);
        },
        
        previewImage() {
            this.$emit('preview-image', this.item);
        },
        
        handleClick() {
            if (this.item.isDirectory) {
                this.toggleExpand();
            } else {
                const ext = this.item.name.split('.').pop().toLowerCase();
                if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'bmp', 'webp'].includes(ext)) {
                    this.previewImage();
                } else {
                    this.openFile();
                }
            }
        }
    },
    
    template: `
        <div class="file-tree-item">
            <div 
                class="file-tree-item-content" 
                @click="handleClick"
                :style="{ paddingLeft: paddingLeft }"
            >
                <span 
                    v-if="item.isDirectory" 
                    class="folder-arrow" 
                    :class="{ expanded: isExpanded }"
                >▶</span>
                <span v-else style="width: 10px;"></span>
                <span class="file-icon">{{ icon }}</span>
                <span class="file-name">{{ item.name }}</span>
            </div>
            
            <div v-if="item.isDirectory && isExpanded && item.children" class="file-tree-children">
                <file-tree-item
                    v-for="child in item.children"
                    :key="child.path"
                    :item="child"
                    :depth="depth + 1"
                    @open-file="$emit('open-file', $event)"
                    @preview-image="$emit('preview-image', $event)"
                ></file-tree-item>
            </div>
        </div>
    `
});
