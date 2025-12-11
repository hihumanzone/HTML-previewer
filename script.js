/**
 * HTML Live Code Previewer
 * 
 * Main application object containing all functionality for the HTML/CSS/JS previewer.
 * 
 * STRUCTURE:
 * - state: Application state (editors, files, mode, drag state)
 * - dom: Cached DOM elements
 * - constants: Configuration constants (IDs, file types, MIME types)
 * - fileTypeUtils: File type detection and handling utilities
 * - fileSystemUtils: Virtual file system operations, path resolution, file lookup
 * - init(): Application initialization
 * - Editor Management: initEditors(), createEditorForTextarea(), etc.
 * - File Management: addNewFile(), importFile(), exportFile(), etc.
 * - Preview Management: renderPreview(), toggleModal(), etc.
 * - UI Management: bindEvents(), switchMode(), etc.
 * - htmlGenerators: HTML generation utilities
 * - notificationSystem: Toast notifications
 * - assetReplacers: Asset path replacement for multi-file projects
 * - console: Console capture and logging
 * 
 * NOTE: Modular versions of utilities are available in the js/ directory.
 * See REFACTORING.md for migration path to modular architecture.
 */
const CodePreviewer = {
    // ============================================================================
    // APPLICATION STATE
    // ============================================================================
    state: {
        mode: 'single',
        editors: {
            html: null,
            css: null,
            js: null,
            singleFile: null,
        },
        files: [],
        folders: [],
        nextFileId: 4,
        nextFolderId: 1,
        expandedFolders: new Set(),
        openPanels: new Set(), // Track which file panels are currently open/visible
        codeModalEditor: null,
        mainHtmlFile: '',
        dragState: {
            draggedElement: null,
            draggedFileId: null,
            dropIndicator: null,
        },
    },

    // ============================================================================
    // DOM ELEMENTS CACHE
    // ============================================================================
    dom: {},

    // ============================================================================
    // CONSTANTS AND CONFIGURATION
    // ============================================================================
    constants: {
        EDITOR_IDS: {
            HTML: 'html-editor',
            CSS: 'css-editor',
            JS: 'js-editor',
            SINGLE_FILE: 'single-file-editor',
        },
        CONTROL_IDS: {
            MODAL_BTN: 'preview-modal-btn',
            TAB_BTN: 'preview-tab-btn',
            CLEAR_CONSOLE_BTN: 'clear-console-btn',
            TOGGLE_CONSOLE_BTN: 'toggle-console-btn',
            SINGLE_MODE_RADIO: 'single-mode-radio',
            MULTI_MODE_RADIO: 'multi-mode-radio',
            ADD_FILE_BTN: 'add-file-btn',
            ADD_FOLDER_BTN: 'add-folder-btn',
            IMPORT_FILE_BTN: 'import-file-btn',
            IMPORT_ZIP_BTN: 'import-zip-btn',
            EXPORT_ZIP_BTN: 'export-zip-btn',
            MAIN_HTML_SELECT: 'main-html-select',
        },
        CONTAINER_IDS: {
            SINGLE_FILE: 'single-file-container',
            MULTI_FILE: 'multi-file-container',
            FILE_TREE: 'file-tree-container',
        },
        MODAL_IDS: {
            OVERLAY: 'preview-modal',
            FRAME: 'preview-frame',
            CLOSE_BTN: '.close-btn',
        },
        CONSOLE_ID: 'console-output',
        MODAL_CONSOLE_PANEL_ID: 'modal-console-panel',
        CONSOLE_MESSAGE_TYPE: 'console',
        
        FILE_TYPES: {
            EXTENSIONS: {
                'html': 'html', 'htm': 'html', 'xhtml': 'html',
                'css': 'css', 'scss': 'css', 'sass': 'css', 'less': 'css',
                'js': 'javascript', 'jsx': 'javascript', 'ts': 'javascript', 'tsx': 'javascript',
                'mjs': 'javascript-module', 'esm': 'javascript-module',
                'json': 'json',
                'xml': 'xml',
                'md': 'markdown', 'markdown': 'markdown',
                'txt': 'text',
                'svg': 'svg',
                'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 
                'webp': 'image', 'bmp': 'image', 'ico': 'image', 'tiff': 'image',
                'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio', 'm4a': 'audio', 
                'aac': 'audio', 'flac': 'audio', 'wma': 'audio',
                'mp4': 'video', 'webm': 'video', 'mov': 'video', 'avi': 'video', 
                'mkv': 'video', 'wmv': 'video', 'flv': 'video', 'm4v': 'video',
                'woff': 'font', 'woff2': 'font', 'ttf': 'font', 'otf': 'font', 'eot': 'font',
                'pdf': 'pdf'
            },
            
            MIME_TYPES: {
                'html': 'text/html',
                'css': 'text/css',
                'javascript': 'text/javascript',
                'javascript-module': 'text/javascript',
                'json': 'application/json',
                'xml': 'application/xml',
                'markdown': 'text/markdown',
                'text': 'text/plain',
                'svg': 'image/svg+xml',
                'image': 'image/png',
                'audio': 'audio/mpeg',
                'video': 'video/mp4',
                'font': 'font/woff2',
                'pdf': 'application/pdf',
                'binary': 'application/octet-stream'
            },
            
            EXTENSION_MIME_MAP: {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
                'webp': 'image/webp', 'bmp': 'image/bmp', 'ico': 'image/x-icon', 'svg': 'image/svg+xml',
                'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg', 'm4a': 'audio/mp4',
                'aac': 'audio/aac', 'flac': 'audio/flac', 'wma': 'audio/x-ms-wma',
                'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime',
                'avi': 'video/x-msvideo', 'mkv': 'video/x-matroska', 'wmv': 'video/x-ms-wmv',
                'flv': 'video/x-flv', 'm4v': 'video/mp4',
                'woff': 'font/woff', 'woff2': 'font/woff2', 'ttf': 'font/ttf', 'otf': 'font/otf',
                'eot': 'application/vnd.ms-fontobject',
                'pdf': 'application/pdf',
                'txt': 'text/plain', 'html': 'text/html', 'css': 'text/css', 'js': 'text/javascript',
                'json': 'application/json', 'xml': 'application/xml'
            },
            
            BINARY_EXTENSIONS: [
                'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'tiff',
                'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma',
                'mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'm4v',
                'woff', 'woff2', 'ttf', 'otf', 'eot',
                'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                'zip', 'rar', '7z', 'tar', 'gz',
                'exe', 'dll', 'so', 'dylib'
            ],
            
            EDITABLE_TYPES: ['html', 'css', 'javascript', 'javascript-module', 'json', 'xml', 'markdown', 'text', 'svg'],
            PREVIEWABLE_TYPES: ['html', 'css', 'javascript', 'javascript-module', 'json', 'xml', 'markdown', 'text', 'svg', 'image', 'audio', 'video', 'pdf'],
            CODEMIRROR_MODES: {
                'html': 'htmlmixed',
                'css': 'css',
                'javascript': 'javascript',
                'javascript-module': 'javascript',
                'json': 'javascript',
                'xml': 'xml',
                'markdown': 'markdown',
                'text': 'text',
                'svg': 'xml'
            }
        }
    },

    // ============================================================================
    // FILE TYPE UTILITIES
    // ============================================================================
    fileTypeUtils: {
        getExtension(filename) {
            return filename ? filename.split('.').pop().toLowerCase() : '';
        },

        getTypeFromExtension(filename) {
            const extension = this.getExtension(filename);
            return CodePreviewer.constants.FILE_TYPES.EXTENSIONS[extension] || 'binary';
        },

        getMimeTypeFromExtension(extension) {
            return CodePreviewer.constants.FILE_TYPES.EXTENSION_MIME_MAP[extension] || 'application/octet-stream';
        },

        getMimeTypeFromFileType(fileType) {
            return CodePreviewer.constants.FILE_TYPES.MIME_TYPES[fileType] || 'text/plain';
        },

        isBinaryExtension(extension) {
            return CodePreviewer.constants.FILE_TYPES.BINARY_EXTENSIONS.includes(extension);
        },

        isBinaryFile(filename, mimeType) {
            if (!filename) return false;
            
            const extension = this.getExtension(filename);
            
            if (this.isBinaryExtension(extension)) {
                return true;
            }
            
            if (mimeType) {
                if (mimeType === 'image/svg+xml') {
                    return false;
                }
                
                return mimeType.startsWith('image/') || 
                       mimeType.startsWith('audio/') || 
                       mimeType.startsWith('video/') || 
                       mimeType.startsWith('application/') ||
                       mimeType.startsWith('font/');
            }
            
            return false;
        },

        isEditableType(fileType) {
            return CodePreviewer.constants.FILE_TYPES.EDITABLE_TYPES.includes(fileType);
        },

        isPreviewableType(fileType) {
            return CodePreviewer.constants.FILE_TYPES.PREVIEWABLE_TYPES.includes(fileType);
        },

        getCodeMirrorMode(fileType) {
            return CodePreviewer.constants.FILE_TYPES.CODEMIRROR_MODES[fileType] || 'text';
        },

        detectTypeFromContent(content, filename) {
            if (!content) return this.getTypeFromExtension(filename);
            
            if (/<\s*html/i.test(content)) return 'html';
            if (/^\s*[\.\#\@]|\s*\w+\s*\{/m.test(content)) return 'css';
            if (CodePreviewer.isModuleFile(content, filename)) return 'javascript-module';
            
            return this.getTypeFromExtension(filename);
        }
    },

    // ============================================================================
    // FILE SYSTEM UTILITIES
    // Handles virtual file system operations, path resolution, and file lookup
    // ============================================================================
    fileSystemUtils: {
        /**
         * Resolves a relative path against a base path
         * @param {string} basePath - The base file path
         * @param {string} relativePath - The relative path to resolve
         * @returns {string} The resolved absolute path
         */
        resolvePath(basePath, relativePath) {
            // Absolute paths start fresh
            if (relativePath.startsWith('/')) {
                return relativePath.substring(1);
            }
            
            // Get directory portion of base path
            const baseDir = basePath.includes('/') 
                ? basePath.substring(0, basePath.lastIndexOf('/')) 
                : '';
            
            const baseParts = baseDir ? baseDir.split('/') : [];
            const relativeParts = relativePath.split('/');
            const resultParts = [...baseParts];
            
            for (const part of relativeParts) {
                if (part === '..') {
                    if (resultParts.length > 0) {
                        resultParts.pop();
                    }
                } else if (part !== '.' && part !== '') {
                    resultParts.push(part);
                }
            }
            
            return resultParts.join('/');
        },

        /**
         * Finds a file in the virtual file system
         * @param {Map} fileSystem - The virtual file system map
         * @param {string} targetFilename - The filename to find
         * @param {string} currentFilePath - The current file context for relative paths
         * @returns {Object|null} The file data or null if not found
         */
        findFile(fileSystem, targetFilename, currentFilePath = '') {
            // Resolve relative path if we have context
            if (currentFilePath) {
                targetFilename = this.resolvePath(currentFilePath, targetFilename);
            }
            
            // Try exact match first
            const exactMatch = fileSystem.get(targetFilename);
            if (exactMatch) {
                return exactMatch;
            }
            
            // Try case-insensitive match
            const targetLower = targetFilename.toLowerCase();
            for (const [filename, file] of fileSystem) {
                if (filename.toLowerCase() === targetLower) {
                    return file;
                }
            }
            
            return null;
        },

        /**
         * Checks if a file type matches any of the allowed types
         * @param {string} fileType - The file type to check
         * @param {string[]} allowedTypes - Array of allowed type strings
         * @returns {boolean} True if the file type matches
         */
        isMatchingType(fileType, allowedTypes) {
            return allowedTypes.includes(fileType);
        },

        /**
         * Gets a data URL for a file (handles both binary and text files)
         * @param {Object} fileData - The file data object
         * @param {string} defaultMimeType - Default MIME type for non-binary files
         * @returns {string} The data URL or content
         */
        getFileDataUrl(fileData, defaultMimeType = 'text/plain') {
            if (fileData.isBinary) {
                return fileData.content;
            }
            
            // Handle SVG specially
            if (fileData.type === 'svg') {
                return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fileData.content)}`;
            }
            
            // For other text files, create a proper data URL
            const mimeType = CodePreviewer.fileTypeUtils.getMimeTypeFromFileType(fileData.type) || defaultMimeType;
            return `data:${mimeType};charset=utf-8,${encodeURIComponent(fileData.content)}`;
        },

        /**
         * Generates JavaScript code for path resolution (used in injected scripts)
         * @returns {string} JavaScript code for the resolvePath function
         */
        generateResolvePathCode() {
            return `
    function resolvePath(basePath, relativePath) {
        if (relativePath.startsWith("/")) {
            return relativePath.substring(1);
        }
        const baseDir = basePath.includes("/") ? basePath.substring(0, basePath.lastIndexOf("/")) : "";
        const baseParts = baseDir ? baseDir.split("/") : [];
        const relativeParts = relativePath.split("/");
        const resultParts = [...baseParts];
        for (const part of relativeParts) {
            if (part === "..") {
                if (resultParts.length > 0) resultParts.pop();
            } else if (part !== "." && part !== "") {
                resultParts.push(part);
            }
        }
        return resultParts.join("/");
    }`;
        },

        /**
         * Generates JavaScript code for file lookup (used in injected scripts)
         * @returns {string} JavaScript code for the findFileInSystem function
         */
        generateFindFileCode() {
            return `
    function findFileInSystem(targetFilename, currentFilePath = "") {
        if (currentFilePath) {
            targetFilename = resolvePath(currentFilePath, targetFilename);
        }
        const exactMatch = virtualFileSystem[targetFilename];
        if (exactMatch) return exactMatch;
        const targetLower = targetFilename.toLowerCase();
        for (const [filename, file] of Object.entries(virtualFileSystem)) {
            if (filename.toLowerCase() === targetLower) return file;
        }
        return null;
    }`;
        },

        /**
         * Generates JavaScript code for getting current file path (used in injected scripts)
         * @returns {string} JavaScript code for the getCurrentFilePath function
         */
        generateGetCurrentFilePathCode() {
            return `
    function getCurrentFilePath() {
        try {
            if (window.__currentExecutionContext) return window.__currentExecutionContext;
            return mainHtmlPath;
        } catch (e) {
            return mainHtmlPath;
        }
    }`;
        }
    },

    // ============================================================================
    // APPLICATION INITIALIZATION AND LIFECYCLE
    // ============================================================================
    
    init() {
        this.cacheDOMElements();
        this.initEditors();
        this.bindEvents();
        this.initModeToggle();
        this.initExistingFilePanels();
        this.console.init(this.dom.consoleOutput, this.dom.clearConsoleBtn, this.dom.previewFrame);
    },

    cacheDOMElements() {
        const { EDITOR_IDS, CONTROL_IDS, MODAL_IDS, CONSOLE_ID, MODAL_CONSOLE_PANEL_ID, CONTAINER_IDS } = this.constants;
        this.dom = {
            htmlEditor: document.getElementById(EDITOR_IDS.HTML),
            cssEditor: document.getElementById(EDITOR_IDS.CSS),
            jsEditor: document.getElementById(EDITOR_IDS.JS),
            singleFileEditor: document.getElementById(EDITOR_IDS.SINGLE_FILE),
            modalBtn: document.getElementById(CONTROL_IDS.MODAL_BTN),
            tabBtn: document.getElementById(CONTROL_IDS.TAB_BTN),
            clearConsoleBtn: document.getElementById(CONTROL_IDS.CLEAR_CONSOLE_BTN),
            toggleConsoleBtn: document.getElementById(CONTROL_IDS.TOGGLE_CONSOLE_BTN),
            singleModeRadio: document.getElementById(CONTROL_IDS.SINGLE_MODE_RADIO),
            multiModeRadio: document.getElementById(CONTROL_IDS.MULTI_MODE_RADIO),
            singleModeOption: document.querySelector('label[for="single-mode-radio"]') || this.getSafeParentElement(CONTROL_IDS.SINGLE_MODE_RADIO),
            multiModeOption: document.querySelector('label[for="multi-mode-radio"]') || this.getSafeParentElement(CONTROL_IDS.MULTI_MODE_RADIO),
            addFileBtn: document.getElementById(CONTROL_IDS.ADD_FILE_BTN),
            addFolderBtn: document.getElementById(CONTROL_IDS.ADD_FOLDER_BTN),
            importFileBtn: document.getElementById(CONTROL_IDS.IMPORT_FILE_BTN),
            importZipBtn: document.getElementById(CONTROL_IDS.IMPORT_ZIP_BTN),
            exportZipBtn: document.getElementById(CONTROL_IDS.EXPORT_ZIP_BTN),
            mainHtmlSelect: document.getElementById(CONTROL_IDS.MAIN_HTML_SELECT),
            mainHtmlSelector: document.getElementById('main-html-selector'),
            singleFileContainer: document.getElementById(CONTAINER_IDS.SINGLE_FILE),
            multiFileContainer: document.getElementById(CONTAINER_IDS.MULTI_FILE),
            fileTreeContainer: document.getElementById(CONTAINER_IDS.FILE_TREE),
            modalOverlay: document.getElementById(MODAL_IDS.OVERLAY),
            previewFrame: document.getElementById(MODAL_IDS.FRAME),
            closeModalBtn: document.querySelector('.modal-header .close-btn'),
            consoleOutput: document.getElementById(CONSOLE_ID),
            modalConsolePanel: document.getElementById(MODAL_CONSOLE_PANEL_ID),
            editorGrid: document.querySelector('.editor-grid'),
            saveCodeBtn: document.getElementById('save-code-btn'),
            mediaModal: document.getElementById('media-modal'),
            mediaModalContent: document.getElementById('media-modal-content'),
            mediaModalTitle: document.getElementById('media-modal-title'),
        };
    },

    getSafeParentElement(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.parentElement : null;
    },

    initEditors() {
        if (typeof window.CodeMirror === 'undefined') {
            console.warn('CodeMirror not available, using fallback textarea editors');
            this.initFallbackEditors();
            return;
        }

        const editorConfig = (mode) => ({
            lineNumbers: true,
            mode: mode,
            theme: 'dracula',
            autoCloseTags: mode === 'htmlmixed',
            lineWrapping: true,
        });

        if (this.dom.htmlEditor) {
            this.state.editors.html = window.CodeMirror.fromTextArea(this.dom.htmlEditor, editorConfig('htmlmixed'));
        }
        if (this.dom.cssEditor) {
            this.state.editors.css = window.CodeMirror.fromTextArea(this.dom.cssEditor, editorConfig('css'));
        }
        if (this.dom.jsEditor) {
            this.state.editors.js = window.CodeMirror.fromTextArea(this.dom.jsEditor, editorConfig('javascript'));
        }
        if (this.dom.singleFileEditor) {
            this.state.editors.singleFile = window.CodeMirror.fromTextArea(this.dom.singleFileEditor, editorConfig('htmlmixed'));
        }

        this.setDefaultContent();
    },

    initFallbackEditors() {
        const createMockEditor = (textarea) => {
            if (!textarea) return null;
            
            Object.assign(textarea.style, {
                fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5',
                resize: 'none', border: 'none', outline: 'none',
                background: '#282a36', color: '#f8f8f2', padding: '1rem',
                width: '100%', height: '400px'
            });
            
            return {
                setValue: (value) => textarea.value = value,
                getValue: () => textarea.value,
                refresh: () => {},
            };
        };

        this.state.editors.html = createMockEditor(this.dom.htmlEditor);
        this.state.editors.css = createMockEditor(this.dom.cssEditor);
        this.state.editors.js = createMockEditor(this.dom.jsEditor);
        this.state.editors.singleFile = createMockEditor(this.dom.singleFileEditor);

        this.setDefaultContent();
    },
    
    setDefaultContent() {
        const initialHTML = `<h1>Hello, World!</h1>\n<p>This is a test of the live previewer.</p>\n<button onclick="testFunction()">Run JS</button>`;
        const initialCSS = `body { \n  font-family: sans-serif; \n  padding: 2rem;\n  color: #333;\n}\nbutton {\n  padding: 8px 16px;\n  border-radius: 4px;\n  cursor: pointer;\n}`;
        const initialJS = `console.log("Preview initialized.");\n\nfunction testFunction() {\n  console.log("Button was clicked!");\n  try {\n    undefinedFunction();\n  } catch(e) {\n    console.error("Caught an error:", e.message);\n  }\n}`;
        
        if (this.state.editors.html) {
            this.state.editors.html.setValue(initialHTML);
        }
        if (this.state.editors.css) {
            this.state.editors.css.setValue(initialCSS);
        }
        if (this.state.editors.js) {
            this.state.editors.js.setValue(initialJS);
        }

        const singleFileContent = '<!DOCTYPE html>\n' +
            '<html lang="en">\n' +
            '<head>\n' +
            '    <meta charset="UTF-8">\n' +
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '    <title>My Page</title>\n' +
            '    <style>\n' +
            initialCSS + '\n' +
            '    </style>\n' +
            '</head>\n' +
            '<body>\n' +
            '    ' + initialHTML + '\n' +
            '    <script>\n' +
            initialJS + '\n' +
            '    </script>\n' +
            '</body>\n' +
            '</html>';
        
        if (this.state.editors.singleFile) {
            this.state.editors.singleFile.setValue(singleFileContent);
        }
    },

    bindEvents() {
        this.dom.modalBtn.addEventListener('click', () => this.renderPreview('modal'));
        this.dom.tabBtn.addEventListener('click', () => this.renderPreview('tab'));
        this.dom.closeModalBtn.addEventListener('click', () => this.toggleModal(false));
        this.dom.toggleConsoleBtn.addEventListener('click', () => this.toggleConsole());
        this.dom.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.dom.modalOverlay) this.toggleModal(false);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.dom.modalOverlay.getAttribute('aria-hidden') === 'false') {
                this.toggleModal(false);
            }
            if (e.key === 'Escape') {
                const codeModal = document.getElementById('code-modal');
                if (codeModal && codeModal.getAttribute('aria-hidden') === 'false') {
                    this.closeCodeModal();
                }
                const mediaModal = document.getElementById('media-modal');
                if (mediaModal && mediaModal.getAttribute('aria-hidden') === 'false') {
                    this.closeMediaModal();
                }
            }
        });

        const codeModal = document.getElementById('code-modal');
        const codeModalCloseBtn = codeModal?.querySelector('.close-btn');
        
        if (codeModalCloseBtn) {
            codeModalCloseBtn.addEventListener('click', () => this.closeCodeModal());
        }
        
        if (this.dom.saveCodeBtn) {
            this.dom.saveCodeBtn.addEventListener('click', () => this.saveCodeModal());
        }
        
        if (codeModal) {
            codeModal.addEventListener('click', (e) => {
                if (e.target === codeModal) this.closeCodeModal();
            });
        }

        const mediaModal = document.getElementById('media-modal');
        const mediaModalCloseBtn = mediaModal?.querySelector('.close-btn');
        
        if (mediaModalCloseBtn) {
            mediaModalCloseBtn.addEventListener('click', () => this.closeMediaModal());
        }
        
        if (mediaModal) {
            mediaModal.addEventListener('click', (e) => {
                if (e.target === mediaModal) this.closeMediaModal();
            });
        }

        this.dom.singleModeRadio.addEventListener('change', () => this.switchMode('single'));
        this.dom.multiModeRadio.addEventListener('change', () => this.switchMode('multi'));
        
        this.dom.singleModeOption.addEventListener('click', (e) => {
            e.preventDefault();
            this.dom.singleModeRadio.checked = true;
            this.switchMode('single');
        });
        this.dom.multiModeOption.addEventListener('click', (e) => {
            e.preventDefault();
            this.dom.multiModeRadio.checked = true;
            this.switchMode('multi');
        });
        
        this.dom.addFileBtn.addEventListener('click', () => this.addNewFile());
        if (this.dom.addFolderBtn) {
            this.dom.addFolderBtn.addEventListener('click', () => this.addNewFolder());
        }
        this.dom.importFileBtn.addEventListener('click', () => this.importFile());
        this.dom.importZipBtn.addEventListener('click', () => this.importZip());
        this.dom.exportZipBtn.addEventListener('click', () => this.exportZip());
        this.dom.mainHtmlSelect.addEventListener('change', (e) => {
            this.state.mainHtmlFile = e.target.value;
        });
    },

    initModeToggle() {
        if (this.dom.singleModeRadio.checked) {
            this.switchMode('single');
        } else if (this.dom.multiModeRadio.checked) {
            this.switchMode('multi');
        }
    },

    switchMode(mode) {
        this.state.mode = mode;
        
        if (mode === 'single') {
            this.dom.singleFileContainer.style.display = 'flex';
            this.dom.multiFileContainer.style.display = 'none';
        } else {
            this.dom.singleFileContainer.style.display = 'none';
            this.dom.multiFileContainer.style.display = 'flex';
            this.renderFileTree();
        }

        setTimeout(() => {
            if (mode === 'single' && this.state.editors.singleFile) {
                this.state.editors.singleFile.refresh();
            } else {
                Object.values(this.state.editors).forEach(editor => {
                    if (editor && editor.refresh) editor.refresh();
                });
            }
        }, 100);
    },

    isModuleFile(content, filename) {
        if (filename && (filename.endsWith('.mjs') || filename.endsWith('.esm.js'))) {
            return true;
        }
        
        if (content) {
            const modulePatterns = [
                /^\s*import\s+/m,
                /^\s*export\s+/m,
                /import\s*\(/,
                /export\s*\{/,
                /export\s+default\s+/,
                /export\s+\*/
            ];
            
            return modulePatterns.some(pattern => pattern.test(content));
        }
        
        return false;
    },

    autoDetectFileType(filename, content, mimeType) {
        if (!filename) return 'text';
        
        const extension = this.fileTypeUtils.getExtension(filename);
        
        if (this.fileTypeUtils.isBinaryExtension(extension) || (mimeType && mimeType.startsWith('image/') && mimeType !== 'image/svg+xml')) {
            return extension === 'svg' ? 'svg' : this.fileTypeUtils.getTypeFromExtension(filename);
        }
        
        if (mimeType && (mimeType.startsWith('audio/') || mimeType.startsWith('video/') || mimeType.startsWith('font/') || mimeType === 'application/pdf')) {
            return this.fileTypeUtils.getTypeFromExtension(filename);
        }
        
        return this.fileTypeUtils.detectTypeFromContent(content, filename);
    },

    getFileNameFromPanel(fileId) {
        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (panel) {
            const nameInput = panel.querySelector('.file-name-input');
            return nameInput ? nameInput.value : null;
        }
        return null;
    },

    getExistingFilenames() {
        const filenames = [];
        this.state.files.forEach(file => {
            const filename = this.getFileNameFromPanel(file.id);
            if (filename) {
                filenames.push(filename);
            }
        });
        return filenames;
    },

    /**
     * Get the folder path from a full file path
     * @param {string} path - Full file path like "src/components/Button.js"
     * @returns {string} Folder path like "src/components" or "" for root
     */
    getFolderFromPath(path) {
        if (!path || !path.includes('/')) return '';
        return path.substring(0, path.lastIndexOf('/'));
    },

    /**
     * Get the filename from a full file path
     * @param {string} path - Full file path like "src/components/Button.js"
     * @returns {string} Just the filename like "Button.js"
     */
    getFilenameFromPath(path) {
        if (!path) return 'unnamed';
        if (!path.includes('/')) return path;
        return path.substring(path.lastIndexOf('/') + 1);
    },

    /**
     * Build a folder tree structure from files
     * @returns {Object} Nested folder structure
     */
    buildFolderTree() {
        const tree = { name: '', children: {}, files: [] };
        
        // Add all folders from state
        this.state.folders.forEach(folder => {
            const parts = folder.path.split('/').filter(p => p);
            let current = tree;
            parts.forEach(part => {
                if (!current.children[part]) {
                    current.children[part] = { name: part, children: {}, files: [], expanded: this.state.expandedFolders.has(folder.path) };
                }
                current = current.children[part];
            });
        });
        
        // Add files to their respective folders
        this.state.files.forEach(file => {
            const filename = this.getFileNameFromPanel(file.id) || file.fileName || 'unnamed';
            const folderPath = this.getFolderFromPath(filename);
            const justFilename = this.getFilenameFromPath(filename);
            
            if (folderPath) {
                const parts = folderPath.split('/').filter(p => p);
                let current = tree;
                parts.forEach(part => {
                    if (!current.children[part]) {
                        current.children[part] = { name: part, children: {}, files: [], expanded: this.state.expandedFolders.has(folderPath) };
                    }
                    current = current.children[part];
                });
                current.files.push({ ...file, displayName: justFilename });
            } else {
                tree.files.push({ ...file, displayName: justFilename });
            }
        });
        
        return tree;
    },

    /**
     * Add a new folder
     */
    addNewFolder() {
        const folderName = prompt('Enter folder name:');
        if (!folderName || folderName.trim() === '') return;
        
        const sanitizedName = folderName.trim().replace(/[<>:"|?*]/g, '');
        
        // Check if folder already exists
        const existingFolder = this.state.folders.find(f => f.path === sanitizedName);
        if (existingFolder) {
            this.showNotification(`Folder "${sanitizedName}" already exists.`, 'error');
            return;
        }
        
        const folderId = `folder-${this.state.nextFolderId++}`;
        this.state.folders.push({
            id: folderId,
            path: sanitizedName
        });
        
        this.state.expandedFolders.add(sanitizedName);
        this.renderFileTree();
        this.showNotification(`Folder "${sanitizedName}" created.`, 'success');
    },

    /**
     * Add a new file within a specific folder
     * @param {string} folderPath - The folder path to add the file in
     */
    addFileToFolder(folderPath) {
        const fileId = `file-${this.state.nextFileId++}`;
        const fileName = folderPath ? `${folderPath}/newfile.html` : 'newfile.html';
        
        this.createFilePanel(fileId, fileName, 'html', '', false);
        
        const newTextarea = document.getElementById(fileId);
        const newEditor = this.createEditorForTextarea(newTextarea, 'html');
        
        this.state.files.push({
            id: fileId,
            editor: newEditor,
            type: 'html',
            fileName: fileName
        });
        
        // Mark panel as open
        this.state.openPanels.add(fileId);
        
        this.bindFilePanelEvents(document.querySelector(`.editor-panel[data-file-id="${fileId}"]`));
        this.bindDragAndDropEvents(document.querySelector(`.editor-panel[data-file-id="${fileId}"]`));
        
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
        this.renderFileTree();
    },

    /**
     * Toggle folder expansion
     * @param {string} folderPath - The folder path to toggle
     */
    toggleFolder(folderPath) {
        if (this.state.expandedFolders.has(folderPath)) {
            this.state.expandedFolders.delete(folderPath);
        } else {
            this.state.expandedFolders.add(folderPath);
        }
        this.renderFileTree();
    },

    /**
     * Render the file tree sidebar
     */
    renderFileTree() {
        if (!this.dom.fileTreeContainer) return;
        
        const tree = this.buildFolderTree();
        const html = this.renderFolderContents(tree, '');
        this.dom.fileTreeContainer.innerHTML = html;
        
        // Bind click events for folders and files
        this.bindFileTreeEvents();
    },

    /**
     * Recursively render folder contents
     * @param {Object} node - Current tree node
     * @param {string} currentPath - Current path being rendered
     * @returns {string} HTML string
     */
    renderFolderContents(node, currentPath) {
        let html = '';
        
        // Render subfolders first
        const sortedFolders = Object.keys(node.children).sort();
        sortedFolders.forEach(folderName => {
            const folder = node.children[folderName];
            const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            const isExpanded = this.state.expandedFolders.has(folderPath);
            
            html += `
                <div class="tree-folder ${isExpanded ? 'expanded' : ''}" data-folder-path="${folderPath}">
                    <div class="tree-folder-header">
                        <span class="folder-icon">${isExpanded ? '📂' : '📁'}</span>
                        <span class="folder-name">${folderName}</span>
                        <div class="folder-actions">
                            <button class="add-file-to-folder-btn" title="Add file to folder">+</button>
                            <button class="add-subfolder-btn" title="Add subfolder">📁+</button>
                            <button class="delete-folder-btn" title="Delete folder">🗑️</button>
                        </div>
                    </div>
                    <div class="tree-folder-contents" style="display: ${isExpanded ? 'block' : 'none'}">
                        ${this.renderFolderContents(folder, folderPath)}
                    </div>
                </div>
            `;
        });
        
        // Render files
        node.files.forEach(file => {
            const fileIcon = this.getFileIcon(file.type);
            const isOpen = this.state.openPanels.has(file.id);
            const openClass = isOpen ? 'file-open' : '';
            html += `
                <div class="tree-file ${openClass}" data-file-id="${file.id}">
                    <span class="file-icon">${fileIcon}</span>
                    <span class="file-name">${file.displayName}</span>
                    <div class="file-actions">
                        <button class="open-file-btn" title="${isOpen ? 'Focus file' : 'Open file'}" aria-label="${isOpen ? 'Focus file' : 'Open file'}">${isOpen ? '👁️' : '📝'}</button>
                        <button class="delete-file-btn" title="Delete file" aria-label="Delete file">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        return html;
    },

    /**
     * Get the appropriate icon for a file type
     * @param {string} fileType - The file type
     * @returns {string} Emoji icon
     */
    getFileIcon(fileType) {
        const icons = {
            'html': '🌐',
            'css': '🎨',
            'javascript': '📜',
            'javascript-module': '📦',
            'json': '📋',
            'xml': '📄',
            'markdown': '📝',
            'text': '📃',
            'svg': '🖼️',
            'image': '🖼️',
            'audio': '🔊',
            'video': '🎬',
            'font': '🔤',
            'pdf': '📕',
            'binary': '📦'
        };
        return icons[fileType] || '📄';
    },

    /**
     * Bind click events for file tree elements
     */
    bindFileTreeEvents() {
        if (!this.dom.fileTreeContainer) return;
        
        // Folder header clicks (toggle expansion)
        this.dom.fileTreeContainer.querySelectorAll('.tree-folder-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.folder-actions')) return;
                const folderPath = header.closest('.tree-folder').dataset.folderPath;
                this.toggleFolder(folderPath);
            });
        });
        
        // Add file to folder
        this.dom.fileTreeContainer.querySelectorAll('.add-file-to-folder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderPath = btn.closest('.tree-folder').dataset.folderPath;
                this.addFileToFolder(folderPath);
            });
        });
        
        // Add subfolder
        this.dom.fileTreeContainer.querySelectorAll('.add-subfolder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const parentPath = btn.closest('.tree-folder').dataset.folderPath;
                const folderName = prompt('Enter folder name:');
                if (folderName && folderName.trim()) {
                    const newPath = `${parentPath}/${folderName.trim().replace(/[<>:"|?*]/g, '')}`;
                    const folderId = `folder-${this.state.nextFolderId++}`;
                    this.state.folders.push({ id: folderId, path: newPath });
                    this.state.expandedFolders.add(newPath);
                    this.renderFileTree();
                }
            });
        });
        
        // Delete folder
        this.dom.fileTreeContainer.querySelectorAll('.delete-folder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderPath = btn.closest('.tree-folder').dataset.folderPath;
                if (confirm(`Delete folder "${folderPath}" and all its contents?`)) {
                    this.deleteFolder(folderPath);
                }
            });
        });
        
        // Open/focus file (clicking on file row or open button)
        this.dom.fileTreeContainer.querySelectorAll('.tree-file').forEach(fileEl => {
            const fileId = fileEl.dataset.fileId;
            
            // Click on file row to open
            fileEl.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.file-actions')) return;
                this.openPanel(fileId);
            });
            
            // Open file button
            const openBtn = fileEl.querySelector('.open-file-btn');
            if (openBtn) {
                openBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openPanel(fileId);
                });
            }
            
            // Delete file button
            const deleteBtn = fileEl.querySelector('.delete-file-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const fileName = this.getFileNameFromPanel(fileId) || 'this file';
                    if (confirm(`Delete "${fileName}"? This cannot be undone.`)) {
                        this.deleteFile(fileId);
                    }
                });
            }
        });
    },

    /**
     * Delete a folder and all its contents
     * @param {string} folderPath - The folder path to delete
     */
    deleteFolder(folderPath) {
        // Remove folder from state
        this.state.folders = this.state.folders.filter(f => 
            f.path !== folderPath && !f.path.startsWith(folderPath + '/')
        );
        
        // Remove files in folder
        const filesToRemove = this.state.files.filter(file => {
            const filename = this.getFileNameFromPanel(file.id) || file.fileName;
            return filename.startsWith(folderPath + '/');
        });
        
        filesToRemove.forEach(file => {
            const panel = document.querySelector(`.editor-panel[data-file-id="${file.id}"]`);
            if (panel) panel.remove();
            this.state.openPanels.delete(file.id);
        });
        
        this.state.files = this.state.files.filter(file => {
            const filename = this.getFileNameFromPanel(file.id) || file.fileName;
            return !filename.startsWith(folderPath + '/');
        });
        
        this.state.expandedFolders.delete(folderPath);
        this.renderFileTree();
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
    },

    /**
     * Select and scroll to a file in the editor
     * @param {string} fileId - The file ID to select
     * @deprecated Use openPanel() instead
     */
    selectFileInEditor(fileId) {
        this.openPanel(fileId);
    },

    addNewFile() {
        const fileId = `file-${this.state.nextFileId++}`;
        const fileName = `newfile.html`;
        
        this.createFilePanel(fileId, fileName, 'html', '', false);
        
        const newTextarea = document.getElementById(fileId);
        const newEditor = this.createEditorForTextarea(newTextarea, 'html');
        
        this.state.files.push({
            id: fileId,
            editor: newEditor,
            type: 'html',
            fileName: fileName
        });
        
        // Mark panel as open
        this.state.openPanels.add(fileId);
        
        this.bindFilePanelEvents(document.querySelector(`.editor-panel[data-file-id="${fileId}"]`));
        this.bindDragAndDropEvents(document.querySelector(`.editor-panel[data-file-id="${fileId}"]`));
        
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
        this.renderFileTree();
    },

    importFile() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '*/*';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        
        const cleanup = () => {
            if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
            }
        };
        
        fileInput.addEventListener('change', async (event) => {
            const files = Array.from(event.target.files);
            if (files.length === 0) {
                cleanup();
                return;
            }
            
            try {
                for (const file of files) {
                    const existingFilenames = this.getExistingFilenames();
                    if (existingFilenames.includes(file.name)) {
                        this.showNotification(`A file named "${file.name}" already exists. Please rename the existing file first or choose a different file.`, 'error');
                        continue;
                    }
                    
                    const fileData = await this.readFileContent(file);
                    
                    const detectedType = this.autoDetectFileType(file.name, fileData.isBinary ? null : fileData.content, file.type);
                    
                    this.addNewFileWithContent(file.name, detectedType, fileData.content, fileData.isBinary);
                }
                
                if (files.length > 1) {
                    this.showNotification(`Successfully imported ${files.length} files`, 'success');
                }
                
            } catch (error) {
                console.error('Error importing file:', error);
                alert('Error importing file. Please try again.');
            }
            
            cleanup();
        });
        
        fileInput.addEventListener('cancel', cleanup);
        
        const focusHandler = () => {
            setTimeout(() => {
                if (document.body.contains(fileInput)) {
                    cleanup();
                }
            }, 100);
        };
        
        window.addEventListener('focus', focusHandler, { once: true });
        
        document.body.appendChild(fileInput);
        fileInput.click();
    },

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
                content: e.target.result,
                isBinary: this.isBinaryFile(file.name, file.type)
            });
            reader.onerror = (e) => reject(e);
            
            if (this.isBinaryFile(file.name, file.type)) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    },

    isBinaryFile(filename, mimeType) {
        return this.fileTypeUtils.isBinaryFile(filename, mimeType);
    },

    addNewFileWithContent(fileName, fileType, content, isBinary = false) {
        const fileId = `file-${this.state.nextFileId++}`;
        
        // Automatically create folder if file has path
        const folderPath = this.getFolderFromPath(fileName);
        if (folderPath) {
            this.ensureFolderExists(folderPath);
        }
        
        this.createFilePanel(fileId, fileName, fileType, content, isBinary);
        
        let newEditor;
        
        if (this.isEditableFileType(fileType)) {
            const newTextarea = document.getElementById(fileId);
            newEditor = this.createEditorForTextarea(newTextarea, fileType, isBinary);
            
            if (!isBinary && content) {
                newEditor.setValue(content);
            }
        } else {
            newEditor = {
                setValue: () => {},
                getValue: () => content,
                refresh: () => {},
                setOption: () => {},
            };
        }
        
        this.state.files.push({
            id: fileId,
            editor: newEditor,
            type: fileType,
            content: content,
            isBinary: isBinary,
            fileName: fileName
        });
        
        // Mark panel as open
        this.state.openPanels.add(fileId);
        
        this.bindFilePanelEvents(document.querySelector(`.editor-panel[data-file-id="${fileId}"]`));
        this.bindDragAndDropEvents(document.querySelector(`.editor-panel[data-file-id="${fileId}"]`));
        
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
        this.renderFileTree();
    },

    /**
     * Ensure a folder path exists, creating it if necessary
     * @param {string} folderPath - The folder path to ensure exists
     */
    ensureFolderExists(folderPath) {
        if (!folderPath) return;
        
        const parts = folderPath.split('/').filter(p => p);
        let currentPath = '';
        
        parts.forEach(part => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const existingFolder = this.state.folders.find(f => f.path === currentPath);
            if (!existingFolder) {
                const folderId = `folder-${this.state.nextFolderId++}`;
                this.state.folders.push({ id: folderId, path: currentPath });
                this.state.expandedFolders.add(currentPath);
            }
        });
    },

    generateFileTypeOptions(selectedType) {
        const fileTypes = [
            { value: 'html', label: 'HTML' },
            { value: 'css', label: 'CSS' },
            { value: 'javascript', label: 'JavaScript' },
            { value: 'javascript-module', label: 'JavaScript Module' },
            { value: 'json', label: 'JSON' },
            { value: 'xml', label: 'XML' },
            { value: 'markdown', label: 'Markdown' },
            { value: 'text', label: 'Text' },
            { value: 'svg', label: 'SVG' },
            { value: 'image', label: 'Image' },
            { value: 'audio', label: 'Audio' },
            { value: 'video', label: 'Video' },
            { value: 'font', label: 'Font' },
            { value: 'pdf', label: 'PDF' },
            { value: 'binary', label: 'Binary' }
        ];
        
        return fileTypes.map(type => 
            `<option value="${type.value}" ${selectedType === type.value ? 'selected' : ''}>${type.label}</option>`
        ).join('');
    },

    createFilePanel(fileId, fileName, fileType, content, isBinary) {
        const fileTypeOptions = this.generateFileTypeOptions(fileType);
        
        const panelHTML = `
            <div class="editor-panel" data-file-type="${fileType}" data-file-id="${fileId}" draggable="true">
                <div class="panel-header">
                    <div class="drag-handle" aria-label="Drag to reorder">⋮⋮</div>
                    <input type="text" class="file-name-input" value="${fileName}" aria-label="File name">
                    <select class="file-type-selector" aria-label="File type">
                        ${fileTypeOptions}
                    </select>
                    <button class="remove-file-btn" aria-label="Close panel" title="Close panel (file stays in sidebar)">&times;</button>
                </div>
                ${this.generateToolbarHTML(fileType)}
                <label for="${fileId}" class="sr-only">${this.getFileTypeLabel(fileType)}</label>
                <div class="editor-wrapper">
                    ${this.generateFileContentDisplay(fileId, fileType, content, isBinary)}
                </div>
            </div>
        `;
        
        this.dom.editorGrid.insertAdjacentHTML('beforeend', panelHTML);
    },

    createEditorForTextarea(textarea, fileType, isBinary = false) {
        if (typeof window.CodeMirror !== 'undefined' && textarea) {
            const mode = this.getCodeMirrorMode(fileType);
            
            return window.CodeMirror.fromTextArea(textarea, {
                lineNumbers: true,
                mode: mode,
                theme: 'dracula',
                autoCloseTags: fileType === 'html',
                lineWrapping: true,
                readOnly: isBinary ? 'nocursor' : false
            });
        } else if (textarea) {
            Object.assign(textarea.style, {
                fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5',
                resize: 'none', border: 'none', outline: 'none',
                background: '#282a36', color: '#f8f8f2', padding: '1rem',
                width: '100%', height: '400px'
            });
            
            return {
                setValue: (value) => textarea.value = value,
                getValue: () => textarea.value,
                refresh: () => {},
                setOption: () => {},
            };
        }
        
        return null;
    },

    generateToolbarHTML(fileType) {
        const isEditable = this.isEditableFileType(fileType);
        const hasExpandPreview = this.hasExpandPreview(fileType);
        
        let toolbarHTML = '<div class="editor-toolbar">';
        
        if (isEditable) {
            toolbarHTML += this.htmlGenerators.toolbarButton('🗑️', 'Clear', 'clear-btn', 'Clear content', 'Clear');
            toolbarHTML += this.htmlGenerators.toolbarButton('📋', 'Paste', 'paste-btn', 'Paste from clipboard', 'Paste');
            toolbarHTML += this.htmlGenerators.toolbarButton('📄', 'Copy', 'copy-btn', 'Copy to clipboard', 'Copy');
        }
        
        if (hasExpandPreview) {
            const expandLabel = isEditable ? "Expand code view" : "View media";
            const expandTitle = isEditable ? "Expand" : "View";
            toolbarHTML += this.htmlGenerators.toolbarButton('🔍', expandTitle, 'expand-btn', expandLabel, expandTitle);
        }
        
        toolbarHTML += this.htmlGenerators.toolbarButton('💾', 'Export', 'export-btn', 'Export file', 'Export');
        toolbarHTML += this.htmlGenerators.toolbarButton('📁', 'Collapse', 'collapse-btn', 'Collapse/Expand editor', 'Collapse/Expand');
        
        toolbarHTML += '</div>';
        return toolbarHTML;
    },

    hasExpandPreview(fileType) {
        return this.fileTypeUtils.isPreviewableType(fileType);
    },

    getFileTypeLabel(fileType) {
        return `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} ${this.isEditableFileType(fileType) ? 'Editor' : 'Viewer'}`;
    },

    generateFileContentDisplay(fileId, fileType, content, isBinary) {
        if (this.isEditableFileType(fileType)) {
            return `<textarea id="${fileId}"></textarea>`;
        }
        
        return this.htmlGenerators.filePreview(fileType, content);
    },

    isEditableFileType(fileType) {
        return this.fileTypeUtils.isEditableType(fileType);
    },

    getCodeMirrorMode(fileType) {
        return this.fileTypeUtils.getCodeMirrorMode(fileType);
    },

    updateToolbarForFileType(panel, newType) {
        const existingToolbar = panel.querySelector('.editor-toolbar');
        if (existingToolbar) {
            existingToolbar.remove();
        }
        
        const panelHeader = panel.querySelector('.panel-header');
        const newToolbarHTML = this.generateToolbarHTML(newType);
        panelHeader.insertAdjacentHTML('afterend', newToolbarHTML);
        
        this.bindToolbarEvents(panel);
    },

    bindFilePanelEvents(panel) {
        const typeSelector = panel.querySelector('.file-type-selector');
        const removeBtn = panel.querySelector('.remove-file-btn');
        const fileNameInput = panel.querySelector('.file-name-input');
        const fileId = panel.dataset.fileId;
        
        if (fileNameInput) {
            fileNameInput.addEventListener('blur', (e) => {
                const filename = e.target.value;
                const fileInfo = this.state.files.find(f => f.id === fileId);
                
                if (fileInfo && typeSelector) {
                    const currentContent = fileInfo.editor.getValue();
                    const suggestedType = this.autoDetectFileType(filename, currentContent);
                    
                    if (suggestedType !== typeSelector.value) {
                        typeSelector.value = suggestedType;
                        panel.dataset.fileType = suggestedType;
                        fileInfo.type = suggestedType;
                        
                        if (typeof window.CodeMirror !== 'undefined' && fileInfo.editor.setOption) {
                            const mode = suggestedType === 'html' ? 'htmlmixed' : 
                                       suggestedType === 'css' ? 'css' : 'javascript';
                            fileInfo.editor.setOption('mode', mode);
                            fileInfo.editor.setOption('autoCloseTags', suggestedType === 'html');
                        }
                    }
                }
            });
        }
        
        if (typeSelector) {
            typeSelector.addEventListener('change', (e) => {
                const newType = e.target.value;
                panel.dataset.fileType = newType;
                
                const fileInfo = this.state.files.find(f => f.id === fileId);
                if (fileInfo) {
                    const oldType = fileInfo.type;
                    fileInfo.type = newType;
                    
                    const oldIsEditable = this.isEditableFileType(oldType);
                    const newIsEditable = this.isEditableFileType(newType);
                    
                    if (oldIsEditable !== newIsEditable) {
                        const editorWrapper = panel.querySelector('.editor-wrapper');
                        if (editorWrapper) {
                            const currentContent = fileInfo.editor ? fileInfo.editor.getValue() : '';
                            const newContent = this.generateFileContentDisplay(fileId, newType, currentContent, false);
                            editorWrapper.innerHTML = newContent;
                            
                            this.createEditorForFileType(fileInfo, fileId, newType, currentContent);
                        }
                    } else if (newIsEditable && typeof window.CodeMirror !== 'undefined' && fileInfo.editor.setOption) {
                        const mode = this.getCodeMirrorMode(newType);
                        fileInfo.editor.setOption('mode', mode);
                        fileInfo.editor.setOption('autoCloseTags', newType === 'html');
                    }
                }
                
                this.updateToolbarForFileType(panel, newType);
            });
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeFile(fileId);
            });
        }

        this.bindToolbarEvents(panel);
    },

    createEditorForFileType(fileInfo, fileId, fileType, content) {
        if (this.isEditableFileType(fileType)) {
            const newTextarea = document.getElementById(fileId);
            fileInfo.editor = this.createEditorForTextarea(newTextarea, fileType);
            
            if (content) {
                fileInfo.editor.setValue(content);
            }
        } else {
            fileInfo.editor = {
                setValue: () => {},
                getValue: () => content || '',
                refresh: () => {},
                setOption: () => {},
            };
            
            fileInfo.content = content || '';
        }
    },

    /**
     * Close a file panel (hide it) - does NOT delete the file
     * @param {string} fileId - The file ID to close
     */
    closePanel(fileId) {
        // Use .editor-panel selector to avoid matching tree-file elements
        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (panel) {
            panel.style.display = 'none';
            this.state.openPanels.delete(fileId);
            this.renderFileTree();
        }
    },

    /**
     * Open a file panel (show it) or create it if it doesn't exist
     * @param {string} fileId - The file ID to open
     */
    openPanel(fileId) {
        // Use .editor-panel selector to avoid matching tree-file elements
        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (panel) {
            panel.style.display = '';  // Reset to default (flex from CSS)
            this.state.openPanels.add(fileId);
            
            // Refresh editor if needed
            const file = this.state.files.find(f => f.id === fileId);
            if (file && file.editor && file.editor.refresh) {
                setTimeout(() => file.editor.refresh(), 100);
            }
            
            // Scroll to panel
            panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            panel.classList.add('file-selected');
            setTimeout(() => panel.classList.remove('file-selected'), 2000);
        }
        this.renderFileTree();
    },

    /**
     * Delete a file completely (remove from state and DOM)
     * @param {string} fileId - The file ID to delete
     */
    deleteFile(fileId) {
        // Use .editor-panel selector to avoid matching tree-file elements
        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (panel) {
            panel.remove();
        }
        
        this.state.files = this.state.files.filter(f => f.id !== fileId);
        this.state.openPanels.delete(fileId);
        
        if (fileId === 'default-html') {
            this.state.editors.html = null;
        } else if (fileId === 'default-css') {
            this.state.editors.css = null;
        } else if (fileId === 'default-js') {
            this.state.editors.js = null;
        }
        
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
        this.renderFileTree();
    },

    /**
     * @deprecated Use closePanel() instead - this now calls closePanel for backwards compatibility
     */
    removeFile(fileId) {
        // Changed to close panel instead of delete
        this.closePanel(fileId);
    },

    updateRemoveButtonsVisibility() {
        const allPanels = document.querySelectorAll('.editor-panel[data-file-id]');
        const actualPanels = Array.from(allPanels).filter(panel => !panel.classList.contains('drag-clone'));
        
        actualPanels.forEach(panel => {
            const removeBtn = panel.querySelector('.remove-file-btn');
            if (removeBtn) {
                removeBtn.style.display = 'block';
            }
        });
    },

    initExistingFilePanels() {
        const existingPanels = document.querySelectorAll('.editor-panel[data-file-type]');
        existingPanels.forEach(panel => {
            const fileId = panel.dataset.fileId;
            const fileType = panel.dataset.fileType;
            const nameInput = panel.querySelector('.file-name-input');
            const fileName = nameInput ? nameInput.value : null;
            
            if (fileId && !this.state.files.find(f => f.id === fileId)) {
                let editor = null;
                
                if (fileId === 'default-html') {
                    editor = this.state.editors.html;
                } else if (fileId === 'default-css') {
                    editor = this.state.editors.css;
                } else if (fileId === 'default-js') {
                    editor = this.state.editors.js;
                }
                
                if (editor) {
                    this.state.files.push({
                        id: fileId,
                        editor: editor,
                        type: fileType,
                        fileName: fileName
                    });
                    // Mark panel as open
                    this.state.openPanels.add(fileId);
                }
            }
            
            this.bindFilePanelEvents(panel);
            this.bindDragAndDropEvents(panel);
        });
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
        
        const singleFilePanel = document.querySelector('#single-file-container .editor-panel');
        if (singleFilePanel) {
            this.bindToolbarEvents(singleFilePanel);
        }
    },

    bindToolbarEvents(panel) {
        const clearBtn = panel.querySelector('.clear-btn');
        const pasteBtn = panel.querySelector('.paste-btn');
        const copyBtn = panel.querySelector('.copy-btn');
        const expandBtn = panel.querySelector('.expand-btn');
        const exportBtn = panel.querySelector('.export-btn');
        const collapseBtn = panel.querySelector('.collapse-btn');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearEditor(panel));
        }
        
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => this.pasteFromClipboard(panel));
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard(panel));
        }
        
        if (expandBtn) {
            expandBtn.addEventListener('click', () => this.expandCode(panel));
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportFile(panel));
        }
        
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => this.toggleEditorCollapse(panel));
        }
    },

    clearEditor(panel) {
        const editor = this.getEditorFromPanel(panel);
        if (editor) {
            editor.setValue('');
        }
    },

    async pasteFromClipboard(panel) {
        try {
            const text = await navigator.clipboard.readText();
            const editor = this.getEditorFromPanel(panel);
            if (editor) {
                editor.setValue(text);
            }
        } catch (error) {
            console.warn('Failed to paste from clipboard:', error);
            this.showNotification('Unable to paste from clipboard. Please paste manually (Ctrl+V).', 'warn');
        }
    },

    async copyToClipboard(panel) {
        try {
            const editor = this.getEditorFromPanel(panel);
            if (editor) {
                const content = editor.getValue();
                await navigator.clipboard.writeText(content);
                this.showNotification('Content copied to clipboard!', 'success');
            }
        } catch (error) {
            console.warn('Failed to copy to clipboard:', error);
            this.showNotification('Unable to copy to clipboard. Please copy manually (Ctrl+C).', 'warn');
        }
    },

    exportFile(panel) {
        try {
            const editor = this.getEditorFromPanel(panel);
            if (!editor) return;

            const content = editor.getValue();
            let fileName = 'untitled.txt';
            let mimeType = 'text/plain';

            if (panel.closest('#single-file-container')) {
                fileName = 'index.html';
                mimeType = 'text/html';
            } else {
                const fileNameInput = panel.querySelector('.file-name-input');
                const fileType = panel.dataset.fileType;
                
                if (fileNameInput && fileNameInput.value.trim()) {
                    fileName = fileNameInput.value.trim();
                } else {
                    switch (fileType) {
                        case 'html':
                            fileName = 'untitled.html';
                            break;
                        case 'css':
                            fileName = 'untitled.css';
                            break;
                        case 'javascript':
                        case 'javascript-module':
                            fileName = 'untitled.js';
                            break;
                        default:
                            fileName = 'untitled.txt';
                    }
                }

                switch (fileType) {
                    case 'html':
                        mimeType = 'text/html';
                        break;
                    case 'css':
                        mimeType = 'text/css';
                        break;
                    case 'javascript':
                    case 'javascript-module':
                        mimeType = 'text/javascript';
                        break;
                    default:
                        mimeType = 'text/plain';
                }
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = fileName;
            downloadLink.style.display = 'none';
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            URL.revokeObjectURL(url);
            
            this.showNotification(`File "${fileName}" downloaded successfully!`, 'success');
        } catch (error) {
            console.error('Failed to export file:', error);
            this.showNotification('Unable to export file. Please try again.', 'error');
        }
    },

    expandCode(panel) {
        const fileId = panel.dataset.fileId;
        const fileType = panel.dataset.fileType;
        
        if (!this.isEditableFileType(fileType)) {
            this.showMediaPreview(panel);
            return;
        }
        
        const editor = this.getEditorFromPanel(panel);
        if (!editor) return;

        const content = editor.getValue();
        let fileName = 'Code';
        let language = 'text';

        if (panel.closest('#single-file-container')) {
            fileName = 'Complete HTML Document';
            language = 'htmlmixed';
        } else {
            const fileNameInput = panel.querySelector('.file-name-input');
            const fileType = panel.dataset.fileType;
            
            if (fileNameInput) {
                fileName = fileNameInput.value || 'Untitled';
            }
            
            if (fileType === 'html') {
                language = 'htmlmixed';
            } else if (fileType === 'css') {
                language = 'css';
            } else if (fileType === 'javascript' || fileType === 'javascript-module') {
                language = 'javascript';
            }
        }

        this.openCodeModal(content, fileName, language, panel);
    },

    showMediaPreview(panel) {
        const fileId = panel.dataset.fileId;
        const fileType = panel.dataset.fileType;
        const fileNameInput = panel.querySelector('.file-name-input');
        const fileName = fileNameInput ? fileNameInput.value : 'Media File';
        
        const fileInfo = this.state.files.find(f => f.id === fileId);
        if (!fileInfo) {
            console.error('File info not found for media preview');
            return;
        }
        
        let previewContent = '';
        
        if (fileType === 'svg') {
            previewContent = this.htmlGenerators.mediaPreviewContent('svg', fileInfo.content, fileName, fileInfo.isBinary);
        } else {
            previewContent = this.htmlGenerators.mediaPreviewContent(fileType, fileInfo.content, fileName);
        }
        
        this.openMediaModal(fileName, previewContent);
    },

    openMediaModal(fileName, content) {
        if (!this.dom.mediaModal || !this.dom.mediaModalContent || !this.dom.mediaModalTitle) {
            console.error('Media modal elements not found');
            return;
        }
        
        this.dom.mediaModalTitle.textContent = `${fileName}`;
        this.dom.mediaModalContent.innerHTML = content;
        
        this.dom.mediaModal.style.display = 'flex';
        this.dom.mediaModal.setAttribute('aria-hidden', 'false');
    },

    closeMediaModal() {
        if (this.dom.mediaModal) {
            this.dom.mediaModal.style.display = 'none';
            this.dom.mediaModal.setAttribute('aria-hidden', 'true');
        }
        if (this.dom.mediaModalContent) {
            this.dom.mediaModalContent.innerHTML = '';
        }
    },

    openCodeModal(content, fileName, language, sourcePanel) {
        try {
            const modal = document.getElementById('code-modal');
            const modalTitle = document.getElementById('code-modal-title');
            const editorTextarea = document.getElementById('code-modal-editor');

            if (!modal || !modalTitle || !editorTextarea) {
                console.error('Code modal elements not found');
                return;
            }

            this.state.currentCodeModalSource = sourcePanel;

            modalTitle.textContent = `Code View - ${fileName}`;

            if (window.CodeMirror) {
                if (!this.state.codeModalEditor) {
                    this.state.codeModalEditor = window.CodeMirror.fromTextArea(editorTextarea, {
                        lineNumbers: true,
                        mode: language,
                        theme: 'dracula',
                        readOnly: false,
                        lineWrapping: true,
                        autoCloseTags: true,
                        viewportMargin: Infinity,
                    });
                } else {
                    this.state.codeModalEditor.setOption('mode', language);
                    this.state.codeModalEditor.setOption('readOnly', false);
                }

                this.state.codeModalEditor.setValue(content);
            } else {
                editorTextarea.value = content;
                editorTextarea.readOnly = false;
                editorTextarea.style.display = 'block';
                editorTextarea.style.width = '100%';
                editorTextarea.style.height = '100%';
                editorTextarea.style.fontFamily = 'monospace';
                editorTextarea.style.fontSize = '14px';
                editorTextarea.style.border = 'none';
                editorTextarea.style.outline = 'none';
                editorTextarea.style.padding = '10px';
                editorTextarea.style.backgroundColor = '#282a36';
                editorTextarea.style.color = '#f8f8f2';
                editorTextarea.style.resize = 'none';
            }

            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');

            if (window.CodeMirror && this.state.codeModalEditor) {
                setTimeout(() => {
                    this.state.codeModalEditor.refresh();
                }, 100);
            }
        } catch (error) {
            console.error('Error in openCodeModal:', error);
        }
    },

    closeCodeModal() {
        const modal = document.getElementById('code-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
        this.state.currentCodeModalSource = null;
    },

    saveCodeModal() {
        try {
            if (!this.state.currentCodeModalSource) {
                console.error('No source panel reference found for saving');
                return;
            }

            let content = '';
            
            if (window.CodeMirror && this.state.codeModalEditor) {
                content = this.state.codeModalEditor.getValue();
            } else {
                const editorTextarea = document.getElementById('code-modal-editor');
                content = editorTextarea.value;
            }

            const sourceEditor = this.getEditorFromPanel(this.state.currentCodeModalSource);
            if (sourceEditor) {
                sourceEditor.setValue(content);
                
                if (sourceEditor.refresh) {
                    setTimeout(() => {
                        sourceEditor.refresh();
                    }, 100);
                }
            }

            this.closeCodeModal();
        } catch (error) {
            console.error('Error saving code from modal:', error);
        }
    },

    toggleEditorCollapse(panel) {
        const editorWrapper = panel.querySelector('.editor-wrapper');
        const collapseBtn = panel.querySelector('.collapse-btn');
        
        if (editorWrapper && collapseBtn) {
            const isCollapsed = editorWrapper.classList.contains('collapsed');
            
            if (isCollapsed) {
                editorWrapper.classList.remove('collapsed');
                collapseBtn.classList.remove('collapsed');
                collapseBtn.innerHTML = '<span class="btn-icon">📁</span> Collapse';
                
                setTimeout(() => {
                    const editor = this.getEditorFromPanel(panel);
                    if (editor && editor.refresh) {
                        editor.refresh();
                    }
                }, 100);
            } else {
                editorWrapper.classList.add('collapsed');
                collapseBtn.classList.add('collapsed');
                collapseBtn.innerHTML = '<span class="btn-icon">📂</span> Expand';
            }
        }
    },

    getEditorFromPanel(panel) {
        if (panel.closest('#single-file-container')) {
            return this.state.editors.singleFile;
        }
        
        const textarea = panel.querySelector('textarea');
        if (textarea) {
            const textareaId = textarea.id;
            if (textareaId === 'html-editor') return this.state.editors.html;
            if (textareaId === 'css-editor') return this.state.editors.css;
            if (textareaId === 'js-editor') return this.state.editors.js;
        }
        
        const fileId = panel.dataset.fileId;
        if (fileId) {
            const fileInfo = this.state.files.find(f => f.id === fileId);
            return fileInfo ? fileInfo.editor : null;
        }
        
        return null;
    },

    showNotification(message, type = 'info') {
        this.notificationSystem.show(message, type);
    },

    generateSingleFilePreview() {
        const singleFileContent = this.state.editors.singleFile ? this.state.editors.singleFile.getValue() : '';
        const captureScript = this.console.getCaptureScript(null, 'index.html');
        
        if (singleFileContent.includes('</head>')) {
            return singleFileContent.replace('</head>', captureScript + '\n</head>');
        } else {
            return '<!DOCTYPE html>\n' +
                '<html lang="en">\n' +
                '<head>\n' +
                '    <meta charset="UTF-8">\n' +
                '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
                '    <title>Live Preview</title>\n' +
                '    ' + captureScript + '\n' +
                '</head>\n' +
                '<body>\n' +
                '    ' + singleFileContent + '\n' +
                '</body>\n' +
                '</html>';
        }
    },

    extractHTMLContent(content) {
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            return bodyMatch[1];
        } else {
            const bodyStartMatch = content.match(/<body[^>]*>([\s\S]*)/i);
            if (bodyStartMatch) {
                let htmlContent = bodyStartMatch[1];
                htmlContent = htmlContent.replace(/<\/body>\s*<\/html>\s*$/i, '');
                return htmlContent;
            }
        }
        return content;
    },

    isFullHTMLDocument(content) {
        const hasDoctype = /<!doctype\s+html/i.test(content);
        const hasHtmlTag = /<html[^>]*>/i.test(content);
        const hasHeadTag = /<head[^>]*>/i.test(content);
        const hasBodyTag = /<body[^>]*>/i.test(content);
        
        return (hasDoctype && hasHtmlTag) || (hasHtmlTag && hasHeadTag && hasBodyTag);
    },

    extractStylesFromHTML(content) {
        const styles = [];
        let remainingContent = content;
        
        remainingContent = remainingContent.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, styleContent) => {
            styles.push(styleContent);
            return '';
        });
        
        return {
            styles: styles.join('\n'),
            contentWithoutStyles: remainingContent
        };
    },

    processHTMLScripts(htmlContent, jsFiles, moduleFiles, currentFilePath = 'index.html') {
        htmlContent = htmlContent.replace(/<script(?:\s+type\s*=\s*['"](?:text\/javascript|application\/javascript)['"])?[^>]*>([\s\S]*?)<\/script>/gi, (match, scriptContent) => {
            if (this.isModuleFile(scriptContent)) {
                moduleFiles.push({
                    content: scriptContent,
                    filename: currentFilePath.replace(/\.(html?)$/, '-inline-module.mjs')
                });
            } else {
                jsFiles.push({
                    content: scriptContent,
                    filename: currentFilePath.replace(/\.(html?)$/, '-inline-script.js')
                });
            }
            return '';
        });
        
        htmlContent = htmlContent.replace(/<script[^>]*src\s*=\s*['"][^'"]*\.js['"][^>]*><\/script>/gi, '');
        htmlContent = htmlContent.replace(/<script[^>]*src\s*=\s*['"][^'"]*\.mjs['"][^>]*><\/script>/gi, '');
        htmlContent = htmlContent.replace(/<link[^>]*rel\s*=\s*['"]stylesheet['"][^>]*>/gi, '');
        
        return htmlContent;
    },

    collectFileContents() {
        let html = '';
        let css = '';
        let jsFiles = [];
        let moduleFiles = [];
        
        this.state.files.forEach(file => {
            const content = file.editor.getValue();
            if (file.type === 'html') {
                const { styles, contentWithoutStyles } = this.extractStylesFromHTML(content);
                if (styles) {
                    css += '\n' + styles;
                }
                
                const filename = this.getFileNameFromPanel(file.id) || 'index.html';
                let htmlContent = this.extractHTMLContent(contentWithoutStyles);
                htmlContent = this.processHTMLScripts(htmlContent, jsFiles, moduleFiles, filename);
                html += '\n' + htmlContent;
            } else if (file.type === 'css') {
                css += '\n' + content;
            } else if (file.type === 'javascript') {
                const filename = this.getFileNameFromPanel(file.id) || 'script.js';
                if (this.isModuleFile(content, filename)) {
                    moduleFiles.push({
                        content: content,
                        filename: filename
                    });
                } else {
                    jsFiles.push({
                        content: content,
                        filename: filename
                    });
                }
            } else if (file.type === 'javascript-module') {
                moduleFiles.push({
                    content: content,
                    filename: this.getFileNameFromPanel(file.id) || 'module.mjs'
                });
            }
        });

        return { html, css, jsFiles, moduleFiles };
    },

    detectFullDocumentMode() {
        return this.state.files.some(file => 
            file.type === 'html' && this.isFullHTMLDocument(file.editor.getValue())
        );
    },

    createVirtualFileSystem() {
        const fileSystem = new Map();
        
        this.state.files.forEach(file => {
            const currentFilename = this.getFileNameFromPanel(file.id);
            const originalFilename = file.fileName;
            
            if (currentFilename && file.editor) {
                const fileData = {
                    content: file.content || file.editor.getValue(),
                    type: file.type,
                    isBinary: file.isBinary || false
                };
                
                fileSystem.set(currentFilename, fileData);
                
                if (originalFilename && originalFilename !== currentFilename) {
                    fileSystem.set(originalFilename, fileData);
                }
            }
        });
        
        return fileSystem;
    },

    getMimeTypeFromFileType(fileType) {
        return this.fileTypeUtils.getMimeTypeFromFileType(fileType);
    },

    /**
     * Resolves a relative path - delegates to fileSystemUtils
     * @deprecated Use fileSystemUtils.resolvePath() directly
     */
    resolvePath(basePath, relativePath) {
        return this.fileSystemUtils.resolvePath(basePath, relativePath);
    },

    /**
     * Finds a file in the virtual file system - delegates to fileSystemUtils
     * @deprecated Use fileSystemUtils.findFile() directly
     */
    findFileInSystem(fileSystem, targetFilename, currentFilePath = '') {
        return this.fileSystemUtils.findFile(fileSystem, targetFilename, currentFilePath);
    },

    extractWorkerFileNames(htmlContent) {
        const workerMatches = htmlContent.match(/new\s+Worker\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi) || [];
        return workerMatches.map(match => {
            const fileMatch = match.match(/new\s+Worker\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/i);
            return fileMatch ? fileMatch[1] : null;
        }).filter(Boolean);
    },

    createWorkerScript(workerFileNames, fileSystem, currentFilePath = '') {
        if (workerFileNames.length === 0) return '';
        
        let script = '<script>\n';
        workerFileNames.forEach(fileName => {
            const file = this.findFileInSystem(fileSystem, fileName, currentFilePath);
            if (file && (file.type === 'javascript' || file.type === 'javascript-module')) {
                const blobVar = 'workerBlob_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
                const urlVar = 'workerUrl_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
                script += `const ${blobVar} = new Blob([${JSON.stringify(file.content)}], { type: 'application/javascript' });\n`;
                script += `const ${urlVar} = URL.createObjectURL(${blobVar});\n`;
            }
        });
        return script + '</script>\n';
    },

    replaceWorkerCalls(htmlContent, workerFileNames) {
        workerFileNames.forEach(fileName => {
            const urlVar = 'workerUrl_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
            const regex = new RegExp(`new\\s+Worker\\s*\\(\\s*['"\`]${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\s*\\)`, 'gi');
            htmlContent = htmlContent.replace(regex, `new Worker(${urlVar})`);
        });
        return htmlContent;
    },

    replaceAssetReferences(htmlContent, fileSystem, currentFilePath = '') {
        htmlContent = this.assetReplacers.replaceCSS(htmlContent, fileSystem, currentFilePath);
        htmlContent = this.assetReplacers.replaceImages(htmlContent, fileSystem, currentFilePath);
        htmlContent = this.assetReplacers.replaceVideoSources(htmlContent, fileSystem, currentFilePath);
        htmlContent = this.assetReplacers.replaceSourceElements(htmlContent, fileSystem, currentFilePath);
        htmlContent = this.assetReplacers.replaceAudioSources(htmlContent, fileSystem, currentFilePath);
        htmlContent = this.assetReplacers.replaceFavicons(htmlContent, fileSystem, currentFilePath);
        htmlContent = this.assetReplacers.replaceDownloadLinks(htmlContent, fileSystem, currentFilePath);
        htmlContent = this.assetReplacers.replaceFontLinks(htmlContent, fileSystem, currentFilePath);
        htmlContent = this.assetReplacers.replaceStyleTags(htmlContent, fileSystem, currentFilePath);
        
        const workerFileNames = this.extractWorkerFileNames(htmlContent);
        if (workerFileNames.length > 0) {
            const workerScript = this.createWorkerScript(workerFileNames, fileSystem, currentFilePath);
            htmlContent = this.replaceWorkerCalls(htmlContent, workerFileNames);
            
            if (htmlContent.includes('</head>')) {
                htmlContent = htmlContent.replace('</head>', workerScript + '</head>');
            } else if (htmlContent.includes('<head>')) {
                htmlContent = htmlContent.replace('<head>', '<head>\n' + workerScript);
            } else {
                htmlContent = htmlContent.replace(/<html[^>]*>/i, '$&\n<head>\n' + workerScript + '\n</head>');
            }
        }
        
        const workerFileSet = new Set(workerFileNames);
        htmlContent = this.assetReplacers.replaceScriptTags(htmlContent, fileSystem, currentFilePath, workerFileSet);
        htmlContent = this.ensureInlineModuleScripts(htmlContent);
        
        return htmlContent;
    },

    ensureInlineModuleScripts(htmlContent) {
        return htmlContent.replace(/<script([^>]*?)>([\s\S]*?)<\/script>/gi, (match, attrs, scriptContent) => {
            if (/src\s*=\s*["'][^"']*["']/i.test(attrs)) return match;
            if (/type\s*=\s*["']module["']/i.test(attrs)) return match;
            
            if (this.isModuleFile(scriptContent)) {
                const updatedAttrs = /type\s*=/.test(attrs)
                    ? attrs.replace(/type\s*=\s*["'][^"']*["']/i, ' type="module"')
                    : `${attrs} type="module"`;
                return `<script${updatedAttrs}>${scriptContent}</script>`;
            }
            
            return match;
        });
    },

    replaceCSSAssetReferences(cssContent, fileSystem, currentFilePath = '') {
        cssContent = cssContent.replace(/background-image\s*:\s*url\s*\(\s*["']?([^"')]+)["']?\s*\)/gi, (match, filename) => {
            const file = this.findFileInSystem(fileSystem, filename, currentFilePath);
            if (file && (file.type === 'image' || file.type === 'svg')) {
                const src = file.isBinary ? file.content : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(file.content)}`;
                return `background-image: url("${src}")`;
            }
            return match;
        });
        
        cssContent = cssContent.replace(/@font-face\s*{[^}]*src\s*:\s*url\s*\(\s*["']?([^"')]+)["']?\s*\)[^}]*}/gi, (match, filename) => {
            const file = this.findFileInSystem(fileSystem, filename, currentFilePath);
            if (file && file.type === 'font') {
                return match.replace(filename, file.content);
            }
            return match;
        });
        
        return cssContent;
    },

    generateFullDocumentPreview() {
        const mainHtmlFile = this.getMainHtmlFile();
        
        if (!mainHtmlFile || !this.isFullHTMLDocument(mainHtmlFile.editor.getValue())) {
            return this.generateMultiFilePreview();
        }
        
        const fileSystem = this.createVirtualFileSystem();
        const mainHtmlPath = this.getFileNameFromPanel(mainHtmlFile.id) || 'index.html';
        let processedHtml = this.replaceAssetReferences(mainHtmlFile.editor.getValue(), fileSystem, mainHtmlPath);
        
        return this.injectConsoleScript(processedHtml, fileSystem, mainHtmlPath);
    },

    injectConsoleScript(htmlContent, fileSystem = null, mainHtmlPath = 'index.html') {
        const captureScript = this.console.getCaptureScript(fileSystem, mainHtmlPath);
        
        if (htmlContent.includes('</head>')) {
            return htmlContent.replace('</head>', captureScript + '\n</head>');
        } else if (htmlContent.includes('<head>')) {
            return htmlContent.replace('<head>', '<head>\n' + captureScript);
        } else {
            return htmlContent.replace(/<html[^>]*>/i, '$&\n<head>\n' + captureScript + '\n</head>');
        }
    },

    processModuleFiles(moduleFiles, currentFilePath = 'index.html') {
        if (moduleFiles.length === 0) return '';

        let combinedModuleContent = '';
        let globalFunctions = [];
        
        moduleFiles.forEach((file, index) => {
            let processedContent = file.content;
            
            const filePathContext = `window.__currentExecutionContext = "${file.filename}";\n`;
            
            processedContent = processedContent.replace(/import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
            processedContent = processedContent.replace(/import\s+\*\s+as\s+\w+\s+from\s*['"][^'"]+['"];?\s*\n?/g, '');
            processedContent = processedContent.replace(/import\s+\w+\s+from\s*['"][^'"]+['"];?\s*\n?/g, '');
            
            processedContent = processedContent.replace(/export\s+function\s+(\w+)/g, (match, funcName) => {
                globalFunctions.push(funcName);
                return `function ${funcName}`;
            });
            processedContent = processedContent.replace(/export\s+const\s+(\w+)\s*=/g, 'const $1 =');
            processedContent = processedContent.replace(/export\s+let\s+(\w+)\s*=/g, 'let $1 =');
            processedContent = processedContent.replace(/export\s+var\s+(\w+)\s*=/g, 'var $1 =');
            processedContent = processedContent.replace(/export\s+\{[^}]+\};?\s*\n?/g, '');
            processedContent = processedContent.replace(/export\s+default\s+/g, '');
            
            const functionMatches = processedContent.match(/function\s+(\w+)\s*\(/g);
            if (functionMatches) {
                functionMatches.forEach(match => {
                    const funcName = match.match(/function\s+(\w+)\s*\(/)[1];
                    if (!globalFunctions.includes(funcName)) {
                        globalFunctions.push(funcName);
                    }
                });
            }
            
            combinedModuleContent += '\n' + filePathContext + processedContent + '\n';
        });
        
        if (globalFunctions.length > 0) {
            combinedModuleContent += '\n';
            globalFunctions.forEach(funcName => {
                combinedModuleContent += 'if (typeof ' + funcName + ' !== \'undefined\') { window.' + funcName + ' = ' + funcName + '; }\n';
            });
        }
        
        if (combinedModuleContent.trim() !== '') {
            return '<script type="module">\n' + combinedModuleContent + '\n</script>\n';
        }
        
        return '';
    },

    processJavaScriptFiles(jsFiles, currentFilePath = 'index.html') {
        if (jsFiles.length === 0) return '';

        const regularJS = jsFiles.map(file => {
            const filePathContext = `window.__currentExecutionContext = "${file.filename}";\n`;
            return filePathContext +
                   'try {\n' +
                   file.content + '\n' +
                   '} catch (err) {\n' +
                   '    console.error(\'Error in ' + file.filename + ':\', err);\n' +
                   '}\n';
        }).join('\n');
        
        if (regularJS.trim()) {
            return '<script>\n' + regularJS + '</script>\n';
        }
        
        return '';
    },

    processWebWorkers(html, jsFiles) {
        const workerFileNames = this.extractWorkerFileNames(html);
        if (workerFileNames.length === 0) {
            return { processedHtml: html, workerScript: '' };
        }
        
        let processedHtml = html;
        let workerScript = '<script>\n';
        
        workerFileNames.forEach(fileName => {
            const workerFileIndex = jsFiles.findIndex(jsFile => 
                jsFile.filename === fileName || 
                jsFile.filename.toLowerCase() === fileName.toLowerCase()
            );
            
            if (workerFileIndex !== -1) {
                const workerFile = jsFiles[workerFileIndex];
                const blobVar = 'workerBlob_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
                const urlVar = 'workerUrl_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
                
                workerScript += `const ${blobVar} = new Blob([${JSON.stringify(workerFile.content)}], { type: 'application/javascript' });\n`;
                workerScript += `const ${urlVar} = URL.createObjectURL(${blobVar});\n`;
                
                const regex = new RegExp(`new\\s+Worker\\s*\\(\\s*['"\`]${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\s*\\)`, 'gi');
                processedHtml = processedHtml.replace(regex, `new Worker(${urlVar})`);
                
                jsFiles.splice(workerFileIndex, 1);
            }
        });
        
        workerScript += '</script>\n';
        
        return { 
            processedHtml: processedHtml, 
            workerScript: workerFileNames.length > 0 ? workerScript : '' 
        };
    },

    generateMultiFilePreview() {
        if (this.detectFullDocumentMode()) {
            return this.generateFullDocumentPreview();
        }
        
        const { html, css, jsFiles, moduleFiles } = this.collectFileContents();
        
        const { processedHtml, workerScript } = this.processWebWorkers(html, jsFiles);
        
        const fileSystem = this.createVirtualFileSystem();
        const mainHtmlFile = this.getMainHtmlFile();
        const mainHtmlPath = mainHtmlFile ? (this.getFileNameFromPanel(mainHtmlFile.id) || 'index.html') : 'index.html';
        const htmlWithAssets = this.replaceAssetReferences(processedHtml, fileSystem, mainHtmlPath);
        
        const moduleScript = this.processModuleFiles(moduleFiles, mainHtmlPath);
        const jsScript = this.processJavaScriptFiles(jsFiles, mainHtmlPath);

        return '<!DOCTYPE html>\n' +
            '<html lang="en">\n' +
            '<head>\n' +
            '    <meta charset="UTF-8">\n' +
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '    <title>Live Preview</title>\n' +
            '    ' + this.console.getCaptureScript(fileSystem, mainHtmlPath) + '\n' +
            '    ' + workerScript + '\n' +
            '    <style>' + css + '</style>\n' +
            '</head>\n' +
            '<body>\n' +
            '    ' + htmlWithAssets + '\n' +
            '    ' + moduleScript + '\n' +
            '    ' + jsScript + '\n' +
            '</body>\n' +
            '</html>';
    },

    generatePreviewContent() {
        if (this.state.mode === 'single') {
            return this.generateSingleFilePreview();
        }
        return this.generateMultiFilePreview();
    },

    renderPreview(target) {
        const content = this.generatePreviewContent();
        
        if (target === 'modal') {
            this.console.clear();
            this.dom.previewFrame.srcdoc = content;
            this.toggleModal(true);
        } else if (target === 'tab') {
            try {
                const blob = new Blob([content], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            } catch (e) {
                console.error("Failed to create or open new tab:", e);
            }
        }
    },

    toggleModal(show) {
        this.dom.modalOverlay.setAttribute('aria-hidden', !show);
        if (show) {
            this.dom.modalConsolePanel.classList.add('hidden');
            this.dom.toggleConsoleBtn.classList.remove('active');
            this.dom.toggleConsoleBtn.textContent = '📋 Console';
        }
    },

    toggleConsole() {
        const isHidden = this.dom.modalConsolePanel.classList.contains('hidden');
        
        if (isHidden) {
            this.dom.modalConsolePanel.classList.remove('hidden');
            this.dom.toggleConsoleBtn.classList.add('active');
            this.dom.toggleConsoleBtn.textContent = '📋 Hide Console';
        } else {
            this.dom.modalConsolePanel.classList.add('hidden');
            this.dom.toggleConsoleBtn.classList.remove('active');
            this.dom.toggleConsoleBtn.textContent = '📋 Console';
        }
    },

    bindDragAndDropEvents(panel) {
        const dragHandle = panel.querySelector('.drag-handle');
        const fileId = panel.dataset.fileId;
        
        let touchStartY = 0;
        let touchStartX = 0;
        let isDragging = false;
        let dragClone = null;
        let lastTargetPanel = null;
        
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', (e) => {
                panel.draggable = true;
            });
            
            dragHandle.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                touchStartY = touch.clientY;
                touchStartX = touch.clientX;
                isDragging = false;
                lastTargetPanel = null;
                
                const startDragThreshold = 10;
                let startDrag = false;
                
                const touchMoveHandler = (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const deltaY = Math.abs(touch.clientY - touchStartY);
                    const deltaX = Math.abs(touch.clientX - touchStartX);
                    
                    if (!startDrag && (deltaY > startDragThreshold || deltaX > startDragThreshold)) {
                        startDrag = true;
                        isDragging = true;
                        
                        panel.classList.add('dragging');
                        this.state.dragState.draggedElement = panel;
                        this.state.dragState.draggedFileId = fileId;
                        
                        dragClone = panel.cloneNode(true);
                        dragClone.removeAttribute('data-file-id');
                        dragClone.style.position = 'fixed';
                        dragClone.style.pointerEvents = 'none';
                        dragClone.style.zIndex = '10000';
                        dragClone.style.opacity = '0.8';
                        dragClone.style.transform = 'rotate(5deg)';
                        dragClone.classList.add('drag-clone');
                        document.body.appendChild(dragClone);
                    }
                    
                    if (isDragging && dragClone) {
                        dragClone.style.left = (touch.clientX - 50) + 'px';
                        dragClone.style.top = (touch.clientY - 50) + 'px';
                        
                        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                        const targetPanel = elementBelow?.closest('.editor-panel[data-file-id]');
                        
                        if (targetPanel !== lastTargetPanel) {
                            if (targetPanel && targetPanel !== panel) {
                                this.showDropIndicator(targetPanel, { clientY: touch.clientY });
                            } else {
                                this.removeDragIndicators();
                            }
                            lastTargetPanel = targetPanel;
                        }
                    }
                };
                
                const touchEndHandler = (e) => {
                    e.preventDefault();
                    
                    if (isDragging) {
                        const touch = e.changedTouches[0];
                        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                        const targetPanel = elementBelow?.closest('.editor-panel[data-file-id]');
                        
                        if (targetPanel && targetPanel !== panel) {
                            this.reorderPanels(panel, targetPanel, { clientY: touch.clientY });
                        }
                        
                        panel.classList.remove('dragging');
                        this.removeDragIndicators();
                        this.state.dragState.draggedElement = null;
                        this.state.dragState.draggedFileId = null;
                        
                        if (dragClone) {
                            document.body.removeChild(dragClone);
                            dragClone = null;
                        }
                        
                        this.cleanupOrphanedDragClones();
                    }
                    
                    isDragging = false;
                    document.removeEventListener('touchmove', touchMoveHandler);
                    document.removeEventListener('touchend', touchEndHandler);
                };
                
                document.addEventListener('touchmove', touchMoveHandler, { passive: false });
                document.addEventListener('touchend', touchEndHandler, { passive: false });
            }, { passive: false });
        }
        
        panel.addEventListener('dragstart', (e) => {
            this.state.dragState.draggedElement = panel;
            this.state.dragState.draggedFileId = fileId;
            panel.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', panel.outerHTML);
        });
        
        panel.addEventListener('dragend', (e) => {
            panel.classList.remove('dragging');
            this.removeDragIndicators();
            this.state.dragState.draggedElement = null;
            this.state.dragState.draggedFileId = null;
            this.cleanupOrphanedDragClones();
        });
        
        panel.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (this.state.dragState.draggedElement && this.state.dragState.draggedElement !== panel) {
                this.showDropIndicator(panel, e);
            }
        });
        
        panel.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.state.dragState.draggedElement && this.state.dragState.draggedElement !== panel) {
                this.reorderPanels(this.state.dragState.draggedElement, panel, e);
            }
            
            this.removeDragIndicators();
        });
    },
    
    showDropIndicator(targetPanel, event) {
        this.removeDragIndicators();
        
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        this.state.dragState.dropIndicator = indicator;
        
        const rect = targetPanel.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        
        if (event.clientY < midY) {
            targetPanel.parentNode.insertBefore(indicator, targetPanel);
        } else {
            targetPanel.parentNode.insertBefore(indicator, targetPanel.nextSibling);
        }
    },
    
    removeDragIndicators() {
        const indicators = document.querySelectorAll('.drop-indicator');
        indicators.forEach(indicator => indicator.remove());
        this.state.dragState.dropIndicator = null;
    },
    
    cleanupOrphanedDragClones() {
        const orphanedClones = document.querySelectorAll('.drag-clone');
        orphanedClones.forEach(clone => {
            if (clone.parentNode) {
                clone.parentNode.removeChild(clone);
            }
        });
    },

    reorderPanels(draggedPanel, targetPanel, event) {
        const rect = targetPanel.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertBefore = event.clientY < midY;
        
        if (insertBefore) {
            targetPanel.parentNode.insertBefore(draggedPanel, targetPanel);
        } else {
            targetPanel.parentNode.insertBefore(draggedPanel, targetPanel.nextSibling);
        }
        
        this.updateFilesOrder();
    },
    
    updateFilesOrder() {
        const panels = Array.from(document.querySelectorAll('.editor-panel[data-file-id]'))
            .filter(panel => !panel.classList.contains('drag-clone'));
        const newFilesOrder = [];
        
        panels.forEach(panel => {
            const fileId = panel.dataset.fileId;
            const fileInfo = this.state.files.find(f => f.id === fileId);
            if (fileInfo) {
                newFilesOrder.push(fileInfo);
            }
        });
        
        this.state.files = newFilesOrder;
    },

    async exportZip() {
        try {
            if (typeof JSZip === 'undefined') {
                this.showNotification('JSZip library not available', 'error');
                return;
            }
            
            const zip = new JSZip();
            
            this.state.files.forEach(file => {
                const filename = this.getFileNameFromPanel(file.id) || `file_${file.id}`;
                let content = file.content || file.editor.getValue();
                
                if (filename.includes('/')) {
                    const pathParts = filename.split('/');
                    const fileName = pathParts.pop();
                    const folderPath = pathParts.join('/');
                    
                    let currentFolder = zip;
                    pathParts.forEach(folderName => {
                        currentFolder = currentFolder.folder(folderName);
                    });
                    
                    if (file.isBinary && content.startsWith('data:')) {
                        const base64Content = content.split(',')[1];
                        currentFolder.file(fileName, base64Content, {base64: true});
                    } else {
                        currentFolder.file(fileName, content);
                    }
                } else {
                    if (file.isBinary && content.startsWith('data:')) {
                        const base64Content = content.split(',')[1];
                        zip.file(filename, base64Content, {base64: true});
                    } else {
                        zip.file(filename, content);
                    }
                }
            });
            
            const blob = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'project.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            this.showNotification('Project exported as ZIP successfully!', 'success');
            
        } catch (error) {
            console.error('Error exporting ZIP:', error);
            this.showNotification('Failed to export project as ZIP', 'error');
        }
    },
    
    async importZip() {
        try {
            if (typeof JSZip === 'undefined') {
                this.showNotification('JSZip library not available', 'error');
                return;
            }
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.zip';
            fileInput.style.display = 'none';
            
            const cleanup = () => {
                if (document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
            };
            
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    cleanup();
                    return;
                }
                
                try {
                    const zip = await JSZip.loadAsync(file);
                    
                    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
                        if (zipEntry.dir) continue;
                        
                        let content;
                        let isBinary = false;
                        
                        const extension = relativePath.split('.').pop().toLowerCase();
                        isBinary = this.isBinaryFile(relativePath, '');
                        
                        if (isBinary) {
                            const base64Content = await zipEntry.async('base64');
                            const mimeType = this.getMimeTypeFromExtension(extension);
                            content = `data:${mimeType};base64,${base64Content}`;
                        } else {
                            content = await zipEntry.async('string');
                        }
                        
                        const fileType = this.getFileTypeFromExtension(extension);
                        
                        const fileName = relativePath;
                        
                        const existingFilenames = this.getExistingFilenames();
                        if (existingFilenames.includes(fileName)) {
                            this.showNotification(`File '${fileName}' already exists, skipping...`, 'warn');
                            continue;
                        }
                        
                        this.addNewFileWithContent(fileName, fileType, content, isBinary);
                    }
                    
                    this.showNotification('ZIP project imported successfully!', 'success');
                    
                } catch (error) {
                    console.error('Error processing ZIP file:', error);
                    this.showNotification('Failed to import ZIP file', 'error');
                }
                
                cleanup();
            });
            
            fileInput.addEventListener('cancel', cleanup);
            
            const focusHandler = () => {
                setTimeout(() => {
                    if (document.body.contains(fileInput)) {
                        cleanup();
                    }
                }, 100);
            };
            
            window.addEventListener('focus', focusHandler, { once: true });
            
            document.body.appendChild(fileInput);
            fileInput.click();
            
        } catch (error) {
            console.error('Error importing ZIP:', error);
            this.showNotification('Failed to import ZIP file', 'error');
        }
    },
    
    getMimeTypeFromExtension(extension) {
        return this.fileTypeUtils.getMimeTypeFromExtension(extension);
    },
    
    getFileTypeFromExtension(extension) {
        return this.fileTypeUtils.getTypeFromExtension(extension);
    },

    // ============================================================================
    // HTML GENERATION UTILITIES
    // ============================================================================
    htmlGenerators: {
        toolbarButton(icon, text, className, ariaLabel, title) {
            return `<button class="toolbar-btn ${className}" aria-label="${ariaLabel}" title="${title}">
                <span class="btn-icon">${icon}</span> ${text}
            </button>`;
        },

        fileTypeOption(value, label, selected = false) {
            return `<option value="${value}" ${selected ? 'selected' : ''}>${label}</option>`;
        },

        filePreview(type, content, fileName = '') {
            const previews = {
                image: `<div class="file-preview image-preview">
                    <img src="${content}" alt="Preview" style="max-width: 100%; max-height: 400px;">
                </div>`,
                audio: `<div class="file-preview audio-preview">
                    <audio controls style="width: 100%;">
                        <source src="${content}">
                        Your browser does not support the audio element.
                    </audio>
                </div>`,
                video: `<div class="file-preview video-preview">
                    <video controls style="max-width: 100%; max-height: 400px;">
                        <source src="${content}">
                        Your browser does not support the video element.
                    </video>
                </div>`,
                pdf: `<div class="file-preview pdf-preview">
                    <object data="${content}" type="application/pdf" style="width: 100%; height: 400px;">
                        <p>PDF failed to load. <a href="${content}" target="_blank">Open in new tab</a></p>
                    </object>
                </div>`,
                default: `<div class="file-preview binary-preview">
                    <p>📁 Binary file: Cannot display content</p>
                    <p>File can be referenced in HTML code</p>
                </div>`
            };
            return previews[type] || previews.default;
        },

        mediaPreviewContent(type, content, fileName) {
            const containers = {
                image: `<div class="media-preview-container">
                    <img src="${content}" alt="${fileName}">
                </div>`,
                audio: `<div class="media-preview-container">
                    <h3>${fileName}</h3>
                    <audio controls>
                        <source src="${content}">
                        Your browser does not support the audio element.
                    </audio>
                </div>`,
                video: `<div class="media-preview-container">
                    <h3>${fileName}</h3>
                    <video controls>
                        <source src="${content}">
                        Your browser does not support the video element.
                    </video>
                </div>`,
                pdf: `<div class="media-preview-container">
                    <h3>${fileName}</h3>
                    <object data="${content}" type="application/pdf">
                        <p>PDF failed to load. <a href="${content}" target="_blank">Open in new tab</a></p>
                    </object>
                </div>`,
                svg: (content, fileName, isBinary) => {
                    const svgDataUrl = isBinary ? content : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
                    return `<div class="media-preview-container">
                        <h3>${fileName}</h3>
                        <img src="${svgDataUrl}" alt="${fileName}">
                    </div>`;
                },
                default: `<div class="media-preview-container">
                    <h3>${fileName}</h3>
                    <p>Preview not available for this file type.</p>
                </div>`
            };
            return typeof containers[type] === 'function' ? containers[type](content, fileName) : (containers[type] || containers.default);
        }
    },

    // ============================================================================
    // NOTIFICATION SYSTEM
    // ============================================================================
    notificationSystem: {
        show(message, type = 'info') {
            let notification = document.getElementById('notification');
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'notification';
                notification.style.cssText = `
                    position: fixed; top: 20px; right: 20px; background: var(--secondary-color);
                    color: var(--primary-color); padding: 1rem; border-radius: 8px;
                    border: 1px solid var(--border-color); z-index: 2000; opacity: 0;
                    transform: translateX(100%); transition: all 0.3s ease; max-width: 300px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                document.body.appendChild(notification);
            }
            
            notification.textContent = message;
            notification.className = `notification-${type}`;
            
            const colors = {
                success: { border: 'var(--accent-color)', bg: 'rgba(137, 180, 250, 0.1)' },
                warn: { border: 'var(--warn-color)', bg: 'rgba(250, 179, 135, 0.1)' },
                error: { border: 'var(--error-color)', bg: 'rgba(243, 139, 168, 0.1)' }
            };
            
            if (colors[type]) {
                notification.style.borderColor = colors[type].border;
                notification.style.background = colors[type].bg;
            }
            
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
            }, 3000);
        }
    },

    // ============================================================================
    // ASSET REPLACEMENT UTILITIES
    // Consolidated utilities for replacing file references in HTML/CSS with
    // virtual file system content
    // ============================================================================
    assetReplacers: {
        /**
         * Configuration for different asset replacement patterns
         * Each entry defines: regex pattern, allowed file types, and replacement strategy
         */
        REPLACEMENT_CONFIGS: {
            css: {
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.css)["']([^>]*?)>/gi,
                types: ['css'],
                replace: (file) => `<style>${file.content}</style>`
            },
            images: {
                pattern: /<img([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['image', 'svg'],
                replace: (file, match) => {
                    const src = CodePreviewer.fileSystemUtils.getFileDataUrl(file, 'image/png');
                    return match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${src}"`);
                }
            },
            video: {
                pattern: /<video([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['video'],
                replace: (file, match) => match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${file.content}"`)
            },
            source: {
                pattern: /<source([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['video', 'audio'],
                replace: (file, match) => match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${file.content}"`)
            },
            audio: {
                pattern: /<audio([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['audio'],
                replace: (file, match) => match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${file.content}"`)
            },
            favicon: {
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.(?:ico|png|svg))["']([^>]*?)>/gi,
                types: ['image', 'svg'],
                replace: (file, match) => {
                    const href = CodePreviewer.fileSystemUtils.getFileDataUrl(file, 'image/png');
                    return match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${href}"`);
                }
            },
            font: {
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.(?:woff|woff2|ttf|otf|eot))["']([^>]*?)>/gi,
                types: ['font'],
                replace: (file, match, before, filename, after) => `<link${before}href="${file.content}"${after}>`
            }
        },

        /**
         * Generic replacement handler using configuration
         * @param {string} htmlContent - The HTML content to process
         * @param {Map} fileSystem - The virtual file system
         * @param {string} currentFilePath - Current file path for relative resolution
         * @param {Object} config - Replacement configuration object
         * @returns {string} Processed HTML content
         */
        applyReplacement(htmlContent, fileSystem, currentFilePath, config) {
            return htmlContent.replace(config.pattern, (match, before, filename, after) => {
                const file = CodePreviewer.fileSystemUtils.findFile(fileSystem, filename, currentFilePath);
                if (file && CodePreviewer.fileSystemUtils.isMatchingType(file.type, config.types)) {
                    return config.replace(file, match, before, filename, after);
                }
                return match;
            });
        },

        replaceCSS(htmlContent, fileSystem, currentFilePath) {
            return this.applyReplacement(htmlContent, fileSystem, currentFilePath, this.REPLACEMENT_CONFIGS.css);
        },

        replaceImages(htmlContent, fileSystem, currentFilePath) {
            return this.applyReplacement(htmlContent, fileSystem, currentFilePath, this.REPLACEMENT_CONFIGS.images);
        },

        replaceVideoSources(htmlContent, fileSystem, currentFilePath) {
            return this.applyReplacement(htmlContent, fileSystem, currentFilePath, this.REPLACEMENT_CONFIGS.video);
        },

        replaceSourceElements(htmlContent, fileSystem, currentFilePath) {
            return this.applyReplacement(htmlContent, fileSystem, currentFilePath, this.REPLACEMENT_CONFIGS.source);
        },

        replaceAudioSources(htmlContent, fileSystem, currentFilePath) {
            return this.applyReplacement(htmlContent, fileSystem, currentFilePath, this.REPLACEMENT_CONFIGS.audio);
        },

        replaceFavicons(htmlContent, fileSystem, currentFilePath) {
            return this.applyReplacement(htmlContent, fileSystem, currentFilePath, this.REPLACEMENT_CONFIGS.favicon);
        },

        replaceDownloadLinks(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<a([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, before, filename, after) => {
                if (match.includes('download') || !filename.includes('://')) {
                    const file = CodePreviewer.fileSystemUtils.findFile(fileSystem, filename, currentFilePath);
                    if (file) {
                        const href = file.isBinary 
                            ? file.content 
                            : CodePreviewer.fileSystemUtils.getFileDataUrl(file);
                        return match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${href}"`);
                    }
                }
                return match;
            });
        },

        replaceFontLinks(htmlContent, fileSystem, currentFilePath) {
            return this.applyReplacement(htmlContent, fileSystem, currentFilePath, this.REPLACEMENT_CONFIGS.font);
        },

        replaceStyleTags(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
                const updatedCSS = CodePreviewer.replaceCSSAssetReferences(cssContent, fileSystem, currentFilePath);
                return match.replace(cssContent, updatedCSS);
            });
        },

        replaceScriptTags(htmlContent, fileSystem, currentFilePath, workerFileSet) {
            return htmlContent.replace(/<script([^>]*?)src\s*=\s*["']([^"']+\.(?:js|mjs))["']([^>]*?)><\/script>/gi, (match, before, filename, after) => {
                if (workerFileSet.has(filename)) {
                    return '';
                }
                
                const file = CodePreviewer.fileSystemUtils.findFile(fileSystem, filename, currentFilePath);
                if (file && (file.type === 'javascript' || file.type === 'javascript-module')) {
                    const scriptType = file.type === 'javascript-module' ? ' type="module"' : '';
                    return `<script${scriptType}>${file.content}</script>`;
                }
                return match;
            });
        }
    },

    updateMainHtmlSelector() {
        const htmlFiles = this.state.files.filter(f => f.type === 'html');
        
        if (htmlFiles.length <= 1) {
            this.dom.mainHtmlSelector.style.display = 'none';
            return;
        }
        
        this.dom.mainHtmlSelector.style.display = 'flex';
        
        this.dom.mainHtmlSelect.innerHTML = '<option value="">Auto-detect</option>';
        
        htmlFiles.forEach(file => {
            const fileName = this.getFileNameFromPanel(file.id) || `file_${file.id}`;
            const option = document.createElement('option');
            option.value = file.id;
            option.textContent = fileName;
            
            if (this.state.mainHtmlFile === file.id) {
                option.selected = true;
            }
            
            this.dom.mainHtmlSelect.appendChild(option);
        });
    },
    
    getMainHtmlFile() {
        if (this.state.mainHtmlFile) {
            const file = this.state.files.find(f => f.id === this.state.mainHtmlFile && f.type === 'html');
            if (file) {
                return file;
            }
        }
        
        const htmlFiles = this.state.files.filter(f => f.type === 'html');
        
        const indexFile = htmlFiles.find(f => {
            const fileName = this.getFileNameFromPanel(f.id) || '';
            return fileName.toLowerCase().includes('index.html');
        });
        
        if (indexFile) return indexFile;
        
        const fullDocFile = htmlFiles.find(f => this.isFullHTMLDocument(f.editor.getValue()));
        if (fullDocFile) return fullDocFile;
        
        return htmlFiles[0] || null;
    },

    // ============================================================================
    // CONSOLE CAPTURE AND LOGGING
    // ============================================================================
    console: {
        logCounts: { log: 0, warn: 0, error: 0, info: 0 },
        filters: { log: true, warn: true, error: true, info: true },
        
        /**
         * Configuration constants for console behavior
         * @property {number} OBJECT_COLLAPSE_THRESHOLD - Character count threshold for collapsing JSON objects into expandable details
         * @property {number} COPY_FEEDBACK_DURATION - Duration in milliseconds to show copy success/failure feedback
         */
        OBJECT_COLLAPSE_THRESHOLD: 100,
        COPY_FEEDBACK_DURATION: 1000,
        
        init(outputEl, clearBtn, previewFrame) {
            this.outputEl = outputEl;
            this.previewFrame = previewFrame;
            clearBtn.addEventListener('click', () => this.clear());
            window.addEventListener('message', (e) => this.handleMessage(e));
            this.initFilterButtons();
        },
        
        initFilterButtons() {
            const consoleHeader = this.outputEl.parentElement.querySelector('.console-header');
            if (!consoleHeader) return;
            
            // Create filter container
            const filterContainer = document.createElement('div');
            filterContainer.className = 'console-filters';
            filterContainer.innerHTML = `
                <button class="console-filter-btn active" data-filter="log" title="Show logs">
                    <span class="filter-icon">📝</span>
                    <span class="filter-count" data-count="log">0</span>
                </button>
                <button class="console-filter-btn active" data-filter="info" title="Show info">
                    <span class="filter-icon">ℹ️</span>
                    <span class="filter-count" data-count="info">0</span>
                </button>
                <button class="console-filter-btn active" data-filter="warn" title="Show warnings">
                    <span class="filter-icon">⚠️</span>
                    <span class="filter-count" data-count="warn">0</span>
                </button>
                <button class="console-filter-btn active" data-filter="error" title="Show errors">
                    <span class="filter-icon">❌</span>
                    <span class="filter-count" data-count="error">0</span>
                </button>
            `;
            
            // Insert before clear button
            const clearButton = consoleHeader.querySelector('.clear-btn');
            if (clearButton) {
                consoleHeader.insertBefore(filterContainer, clearButton);
            } else {
                consoleHeader.appendChild(filterContainer);
            }
            
            // Add filter click handlers
            filterContainer.querySelectorAll('.console-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const filterType = btn.dataset.filter;
                    this.filters[filterType] = !this.filters[filterType];
                    btn.classList.toggle('active', this.filters[filterType]);
                    this.applyFilters();
                });
            });
        },
        
        applyFilters() {
            const messages = this.outputEl.querySelectorAll('.log-message');
            messages.forEach(msg => {
                const types = ['log', 'info', 'warn', 'error'];
                for (const type of types) {
                    if (msg.classList.contains(`log-type-${type}`)) {
                        msg.style.display = this.filters[type] ? '' : 'none';
                        break;
                    }
                }
            });
        },
        
        updateFilterCounts() {
            Object.keys(this.logCounts).forEach(type => {
                const countEl = document.querySelector(`.filter-count[data-count="${type}"]`);
                if (countEl) {
                    countEl.textContent = this.logCounts[type];
                    countEl.classList.toggle('has-count', this.logCounts[type] > 0);
                }
            });
        },
        
        clear() {
            this.outputEl.innerHTML = '';
            this.logCounts = { log: 0, warn: 0, error: 0, info: 0 };
            this.updateFilterCounts();
        },
        
        formatValue(arg) {
            if (arg === null) return '<span class="console-null">null</span>';
            if (arg === undefined) return '<span class="console-undefined">undefined</span>';
            if (typeof arg === 'boolean') return `<span class="console-boolean">${arg}</span>`;
            if (typeof arg === 'number') return `<span class="console-number">${arg}</span>`;
            if (typeof arg === 'string') return this.escapeHtml(arg);
            if (typeof arg === 'object' && arg !== null) {
                try {
                    const json = JSON.stringify(arg, null, 2);
                    const isLarge = json.length > this.OBJECT_COLLAPSE_THRESHOLD || json.includes('\n');
                    if (isLarge) {
                        return `<details class="console-object"><summary>${Array.isArray(arg) ? `Array(${arg.length})` : 'Object'}</summary><pre>${this.escapeHtml(json)}</pre></details>`;
                    }
                    return `<span class="console-object-inline">${this.escapeHtml(json)}</span>`;
                } catch (e) {
                    return '<span class="console-error">[Unserializable Object]</span>';
                }
            }
            return String(arg);
        },
        
        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        
        getIcon(level) {
            const icons = {
                log: '📝',
                info: 'ℹ️',
                warn: '⚠️',
                error: '❌'
            };
            return icons[level] || '📝';
        },
        
        getTimestamp() {
            const now = new Date();
            return now.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                fractionalSecondDigits: 3
            });
        },
        
        log(logData) {
            const level = logData.level || 'log';
            this.logCounts[level] = (this.logCounts[level] || 0) + 1;
            this.updateFilterCounts();
            
            const el = document.createElement('div');
            el.className = `log-message log-type-${level}`;
            
            // Apply current filter
            if (!this.filters[level]) {
                el.style.display = 'none';
            }
            
            const messageContent = logData.message.map(arg => this.formatValue(arg)).join(' ');
            
            el.innerHTML = `
                <span class="log-icon" aria-hidden="true">${this.getIcon(level)}</span>
                <span class="log-timestamp">${this.getTimestamp()}</span>
                <span class="log-content">${messageContent}</span>
                <button class="log-copy-btn" title="Copy message" aria-label="Copy message to clipboard">📋</button>
            `;
            
            // Add copy functionality with accessibility support
            const copyBtn = el.querySelector('.log-copy-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = logData.message.map(arg => {
                    if (typeof arg === 'object') {
                        try { return JSON.stringify(arg, null, 2); } catch (e) { return String(arg); }
                    }
                    return String(arg);
                }).join(' ');
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.textContent = '✅';
                    copyBtn.setAttribute('aria-label', 'Copied to clipboard');
                    setTimeout(() => {
                        copyBtn.textContent = '📋';
                        copyBtn.setAttribute('aria-label', 'Copy message to clipboard');
                    }, this.COPY_FEEDBACK_DURATION);
                }).catch(() => {
                    copyBtn.textContent = '❌';
                    copyBtn.setAttribute('aria-label', 'Failed to copy');
                    setTimeout(() => {
                        copyBtn.textContent = '📋';
                        copyBtn.setAttribute('aria-label', 'Copy message to clipboard');
                    }, this.COPY_FEEDBACK_DURATION);
                });
            });
            
            this.outputEl.appendChild(el);
            this.outputEl.scrollTop = this.outputEl.scrollHeight;
        },
        
        handleMessage(event) {
            const { CONSOLE_MESSAGE_TYPE } = CodePreviewer.constants;
            if (event.source === this.previewFrame.contentWindow && event.data.type === CONSOLE_MESSAGE_TYPE) {
                this.log(event.data);
            }
        },
        getCaptureScript(fileSystem = null, mainHtmlPath = 'index.html') {
            const MESSAGE_TYPE = CodePreviewer.constants.CONSOLE_MESSAGE_TYPE;
            
            // Generate file system initialization script
            let fileSystemScript = '';
            if (fileSystem && fileSystem instanceof Map) {
                const fileObj = {};
                fileSystem.forEach((fileData, filename) => {
                    fileObj[filename] = {
                        content: fileData.content,
                        type: fileData.type,
                        isBinary: fileData.isBinary || false
                    };
                });
                const jsonString = JSON.stringify(fileObj);
                const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
                fileSystemScript = `
                    const virtualFileSystemData = "${base64Data}";
                    const virtualFileSystem = JSON.parse(decodeURIComponent(escape(atob(virtualFileSystemData))));
                    const mainHtmlPath = "${mainHtmlPath}";
                `;
            } else {
                fileSystemScript = `
                    const virtualFileSystem = {};
                    const mainHtmlPath = "index.html";
                `;
            }
            
            // Use the centralized code generators from fileSystemUtils
            const resolvePathCode = CodePreviewer.fileSystemUtils.generateResolvePathCode();
            const findFileCode = CodePreviewer.fileSystemUtils.generateFindFileCode();
            const getCurrentFilePathCode = CodePreviewer.fileSystemUtils.generateGetCurrentFilePathCode();
            
            return '<script>\n' +
                '(function() {\n' +
                fileSystemScript + '\n' +
                '    ' + resolvePathCode + '\n' +
                '    ' + findFileCode + '\n' +
                '    ' + getCurrentFilePathCode + '\n' +
                '    \n' +
                '    const originalFetch = window.fetch;\n' +
                '    window.fetch = function(input, init) {\n' +
                '        let url = input;\n' +
                '        if (typeof input === "object" && input.url) {\n' +
                '            url = input.url;\n' +
                '        }\n' +
                '        \n' +
                '        const currentFilePath = getCurrentFilePath();\n' +
                '        let targetPath = url.replace(/^\\.\\//, "");\n' +
                '        const fileData = findFileInSystem(targetPath, currentFilePath);\n' +
                '        \n' +
                '        if (fileData) {\n' +
                '            const response = {\n' +
                '                ok: true,\n' +
                '                status: 200,\n' +
                '                statusText: "OK",\n' +
                '                headers: new Headers({\n' +
                '                    "Content-Type": fileData.type === "json" ? "application/json" : \n' +
                '                                   fileData.type === "html" ? "text/html" :\n' +
                '                                   fileData.type === "css" ? "text/css" :\n' +
                '                                   fileData.type === "javascript" ? "text/javascript" :\n' +
                '                                   fileData.type === "xml" ? "application/xml" :\n' +
                '                                   "text/plain"\n' +
                '                }),\n' +
                '                url: url,\n' +
                '                text: () => Promise.resolve(fileData.content),\n' +
                '                json: () => {\n' +
                '                    try {\n' +
                '                        return Promise.resolve(JSON.parse(fileData.content));\n' +
                '                    } catch (e) {\n' +
                '                        return Promise.reject(new Error("Invalid JSON"));\n' +
                '                    }\n' +
                '                },\n' +
                '                blob: () => {\n' +
                '                    if (fileData.isBinary && fileData.content.startsWith("data:")) {\n' +
                '                        const [header, base64] = fileData.content.split(",");\n' +
                '                        const mimeType = header.match(/data:([^;]+)/)[1];\n' +
                '                        const byteCharacters = atob(base64);\n' +
                '                        const byteNumbers = new Array(byteCharacters.length);\n' +
                '                        for (let i = 0; i < byteCharacters.length; i++) {\n' +
                '                            byteNumbers[i] = byteCharacters.charCodeAt(i);\n' +
                '                        }\n' +
                '                        const byteArray = new Uint8Array(byteNumbers);\n' +
                '                        return Promise.resolve(new Blob([byteArray], { type: mimeType }));\n' +
                '                    } else {\n' +
                '                        return Promise.resolve(new Blob([fileData.content], { type: "text/plain" }));\n' +
                '                    }\n' +
                '                },\n' +
                '                arrayBuffer: () => {\n' +
                '                    if (fileData.isBinary && fileData.content.startsWith("data:")) {\n' +
                '                        const [header, base64] = fileData.content.split(",");\n' +
                '                        const byteCharacters = atob(base64);\n' +
                '                        const byteNumbers = new Array(byteCharacters.length);\n' +
                '                        for (let i = 0; i < byteCharacters.length; i++) {\n' +
                '                            byteNumbers[i] = byteCharacters.charCodeAt(i);\n' +
                '                        }\n' +
                '                        return Promise.resolve(new Uint8Array(byteNumbers).buffer);\n' +
                '                    } else {\n' +
                '                        const encoder = new TextEncoder();\n' +
                '                        return Promise.resolve(encoder.encode(fileData.content).buffer);\n' +
                '                    }\n' +
                '                }\n' +
                '            };\n' +
                '            \n' +
                '            return Promise.resolve(response);\n' +
                '        }\n' +
                '        \n' +
                '        return originalFetch.apply(this, arguments);\n' +
                '    };\n' +
                '    \n' +
                '    // Override XMLHttpRequest to handle virtual file system (for Phaser.js and other libraries)\n' +
                '    const OriginalXMLHttpRequest = window.XMLHttpRequest;\n' +
                '    window.XMLHttpRequest = function() {\n' +
                '        const xhr = new OriginalXMLHttpRequest();\n' +
                '        const originalOpen = xhr.open;\n' +
                '        const originalSend = xhr.send;\n' +
                '        \n' +
                '        let isVirtualRequest = false;\n' +
                '        let virtualFileData = null;\n' +
                '        \n' +
                '        xhr.open = function(method, url, async, user, password) {\n' +
                '            try {\n' +
                '                if (method.toUpperCase() === "GET") {\n' +
                '                    const currentFilePath = getCurrentFilePath();\n' +
                '                    let targetPath = url.replace(/^\\.\\//, "");\n' +
                '                    const fileData = findFileInSystem(targetPath, currentFilePath);\n' +
                '                    \n' +
                '                    if (fileData) {\n' +
                '                        // Handle virtual file system request\n' +
                '                        isVirtualRequest = true;\n' +
                '                        virtualFileData = fileData;\n' +
                '                        // Do not call original open for virtual requests\n' +
                '                        return;\n' +
                '                    }\n' +
                '                }\n' +
                '                \n' +
                '                // Handle normal requests\n' +
                '                isVirtualRequest = false;\n' +
                '                virtualFileData = null;\n' +
                '                return originalOpen.call(this, method, url, async, user, password);\n' +
                '            } catch (e) {\n' +
                '                // Fallback to normal request on any error\n' +
                '                isVirtualRequest = false;\n' +
                '                virtualFileData = null;\n' +
                '                return originalOpen.call(this, method, url, async, user, password);\n' +
                '            }\n' +
                '        };\n' +
                '        \n' +
                '        xhr.send = function(data) {\n' +
                '            if (isVirtualRequest && virtualFileData) {\n' +
                '                try {\n' +
                '                    // Simulate successful response for virtual files\n' +
                '                    setTimeout(() => {\n' +
                '                        try {\n' +
                '                            // Set response properties\n' +
                '                            Object.defineProperty(xhr, "readyState", { value: 4, configurable: true });\n' +
                '                            Object.defineProperty(xhr, "status", { value: 200, configurable: true });\n' +
                '                            Object.defineProperty(xhr, "statusText", { value: "OK", configurable: true });\n' +
                '                            \n' +
                '                            // Set response content\n' +
                '                            if (virtualFileData.isBinary && virtualFileData.content.startsWith("data:")) {\n' +
                '                                // For binary files (images, audio, etc.)\n' +
                '                                if (xhr.responseType === "arraybuffer") {\n' +
                '                                    // Convert data URL to ArrayBuffer\n' +
                '                                    const [header, base64] = virtualFileData.content.split(",");\n' +
                '                                    const byteCharacters = atob(base64);\n' +
                '                                    const byteNumbers = new Array(byteCharacters.length);\n' +
                '                                    for (let i = 0; i < byteCharacters.length; i++) {\n' +
                '                                        byteNumbers[i] = byteCharacters.charCodeAt(i);\n' +
                '                                    }\n' +
                '                                    Object.defineProperty(xhr, "response", { value: new Uint8Array(byteNumbers).buffer, configurable: true });\n' +
                '                                } else {\n' +
                '                                    // Return data URL for other response types\n' +
                '                                    Object.defineProperty(xhr, "response", { value: virtualFileData.content, configurable: true });\n' +
                '                                    Object.defineProperty(xhr, "responseText", { value: virtualFileData.content, configurable: true });\n' +
                '                                }\n' +
                '                            } else {\n' +
                '                                // For text files\n' +
                '                                Object.defineProperty(xhr, "responseText", { value: virtualFileData.content, configurable: true });\n' +
                '                                Object.defineProperty(xhr, "response", { value: virtualFileData.content, configurable: true });\n' +
                '                            }\n' +
                '                            \n' +
                '                            // Set headers\n' +
                '                            xhr.getResponseHeader = function(name) {\n' +
                '                                const lowerName = name.toLowerCase();\n' +
                '                                if (lowerName === "content-type") {\n' +
                '                                    const typeMap = {\n' +
                '                                        "image": "image/png",\n' +
                '                                        "audio": "audio/mpeg",\n' +
                '                                        "video": "video/mp4",\n' +
                '                                        "json": "application/json",\n' +
                '                                        "css": "text/css",\n' +
                '                                        "javascript": "text/javascript",\n' +
                '                                        "html": "text/html"\n' +
                '                                    };\n' +
                '                                    return typeMap[virtualFileData.type] || "text/plain";\n' +
                '                                }\n' +
                '                                return null;\n' +
                '                            };\n' +
                '                            \n' +
                '                            xhr.getAllResponseHeaders = function() {\n' +
                '                                const contentType = xhr.getResponseHeader("content-type");\n' +
                '                                return `content-type: ${contentType}\\r\\n`;\n' +
                '                            };\n' +
                '                            \n' +
                '                            // Trigger events\n' +
                '                            if (xhr.onreadystatechange) {\n' +
                '                                xhr.onreadystatechange();\n' +
                '                            }\n' +
                '                            if (xhr.onload) {\n' +
                '                                xhr.onload();\n' +
                '                            }\n' +
                '                        } catch (e) {\n' +
                '                            // Handle error in response simulation\n' +
                '                            if (xhr.onerror) {\n' +
                '                                xhr.onerror();\n' +
                '                            }\n' +
                '                        }\n' +
                '                    }, 1);\n' +
                '                } catch (e) {\n' +
                '                    // Handle error in virtual request\n' +
                '                    if (xhr.onerror) {\n' +
                '                        xhr.onerror();\n' +
                '                    }\n' +
                '                }\n' +
                '                return;\n' +
                '            }\n' +
                '            \n' +
                '            // Handle normal requests\n' +
                '            return originalSend.call(this, data);\n' +
                '        };\n' +
                '        \n' +
                '        return xhr;\n' +
                '    };\n' +
                '    \n' +
                '    // Override Image constructor to handle virtual file system\n' +
                '    const OriginalImage = window.Image;\n' +
                '    window.Image = function() {\n' +
                '        const img = new OriginalImage();\n' +
                '        \n' +
                '        let _originalSrc = "";\n' +
                '        let _resolvedSrc = "";\n' +
                '        \n' +
                '        Object.defineProperty(img, "src", {\n' +
                '            get: function() {\n' +
                '                return _resolvedSrc || _originalSrc;\n' +
                '            },\n' +
                '            set: function(value) {\n' +
                '                _originalSrc = value;\n' +
                '                \n' +
                '                const currentFilePath = getCurrentFilePath();\n' +
                '                let targetPath = value.replace(/^\\.\\//, "");\n' +
                '                const fileData = findFileInSystem(targetPath, currentFilePath);\n' +
                '                \n' +
                '                if (fileData && (fileData.type === "image" || fileData.type === "svg")) {\n' +
                '                    const dataUrl = fileData.isBinary ? fileData.content : \n' +
                '                                   `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fileData.content)}`;\n' +
                '                    _resolvedSrc = dataUrl;\n' +
                '                    img.setAttribute("src", dataUrl);\n' +
                '                } else {\n' +
                '                    _resolvedSrc = value;\n' +
                '                    img.setAttribute("src", value);\n' +
                '                }\n' +
                '            },\n' +
                '            enumerable: true,\n' +
                '            configurable: true\n' +
                '        });\n' +
                '        \n' +
                '        return img;\n' +
                '    };\n' +
                '    \n' +
                '    // Override Audio constructor to handle virtual file system\n' +
                '    const OriginalAudio = window.Audio;\n' +
                '    window.Audio = function(src) {\n' +
                '        const audio = new OriginalAudio();\n' +
                '        \n' +
                '        let _originalSrc = "";\n' +
                '        let _resolvedSrc = "";\n' +
                '        \n' +
                '        Object.defineProperty(audio, "src", {\n' +
                '            get: function() {\n' +
                '                return _resolvedSrc || _originalSrc;\n' +
                '            },\n' +
                '            set: function(value) {\n' +
                '                _originalSrc = value;\n' +
                '                \n' +
                '                const currentFilePath = getCurrentFilePath();\n' +
                '                let targetPath = value.replace(/^\\.\\//, "");\n' +
                '                const fileData = findFileInSystem(targetPath, currentFilePath);\n' +
                '                \n' +
                '                if (fileData && fileData.type === "audio") {\n' +
                '                    _resolvedSrc = fileData.content;\n' +
                '                    audio.setAttribute("src", fileData.content);\n' +
                '                } else {\n' +
                '                    _resolvedSrc = value;\n' +
                '                    audio.setAttribute("src", value);\n' +
                '                }\n' +
                '            },\n' +
                '            enumerable: true,\n' +
                '            configurable: true\n' +
                '        });\n' +
                '        \n' +
                '        // Handle constructor with src parameter\n' +
                '        if (src !== undefined) {\n' +
                '            audio.src = src;\n' +
                '        }\n' +
                '        \n' +
                '        return audio;\n' +
                '    };\n' +
                '    \n' +
                '    const postLog = (level, args) => {\n' +
                '        const formattedArgs = args.map(arg => {\n' +
                '            if (arg instanceof Error) return { message: arg.message, stack: arg.stack };\n' +
                '            try { return JSON.parse(JSON.stringify(arg)); } catch (e) { return \'Unserializable Object\'; }\n' +
                '        });\n' +
                '        window.parent.postMessage({ type: \'' + MESSAGE_TYPE + '\', level, message: formattedArgs }, \'*\');\n' +
                '    };\n' +
                '    const originalConsole = { ...window.console };\n' +
                '    [\'log\', \'info\', \'warn\', \'error\'].forEach(level => {\n' +
                '        window.console[level] = (...args) => {\n' +
                '            postLog(level, Array.from(args));\n' +
                '            originalConsole[level](...args);\n' +
                '        };\n' +
                '    });\n' +
                '    window.onerror = (message, source, lineno, colno, error) => {\n' +
                '        postLog(\'error\', [message, \'at \' + source.split(\'/\').pop() + \':\' + lineno + \':\' + colno]);\n' +
                '        return true;\n' +
                '    };\n' +
                '    window.addEventListener(\'unhandledrejection\', e => {\n' +
                '        postLog(\'error\', [\'Unhandled promise rejection:\', e.reason]);\n' +
                '    });\n' +
                '})();\n' +
                '</script>';
        },
    },
};

document.addEventListener('DOMContentLoaded', () => CodePreviewer.init());
