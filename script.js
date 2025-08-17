const CodePreviewer = {
    state: {
        mode: 'single',
        editors: {
            html: null,
            css: null,
            js: null,
            singleFile: null,
        },
        files: [],
        nextFileId: 4,
        codeModalEditor: null,
        mainHtmlFile: '',
        dragState: {
            draggedElement: null,
            draggedFileId: null,
            dropIndicator: null,
        },
    },

    dom: {},

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
            IMPORT_FILE_BTN: 'import-file-btn',
            IMPORT_ZIP_BTN: 'import-zip-btn',
            EXPORT_ZIP_BTN: 'export-zip-btn',
            MAIN_HTML_SELECT: 'main-html-select',
        },
        CONTAINER_IDS: {
            SINGLE_FILE: 'single-file-container',
            MULTI_FILE: 'multi-file-container',
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
            importFileBtn: document.getElementById(CONTROL_IDS.IMPORT_FILE_BTN),
            importZipBtn: document.getElementById(CONTROL_IDS.IMPORT_ZIP_BTN),
            exportZipBtn: document.getElementById(CONTROL_IDS.EXPORT_ZIP_BTN),
            mainHtmlSelect: document.getElementById(CONTROL_IDS.MAIN_HTML_SELECT),
            mainHtmlSelector: document.getElementById('main-html-selector'),
            singleFileContainer: document.getElementById(CONTAINER_IDS.SINGLE_FILE),
            multiFileContainer: document.getElementById(CONTAINER_IDS.MULTI_FILE),
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
        if (typeof CodeMirror === 'undefined') {
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
            this.state.editors.html = CodeMirror.fromTextArea(this.dom.htmlEditor, editorConfig('htmlmixed'));
        }
        if (this.dom.cssEditor) {
            this.state.editors.css = CodeMirror.fromTextArea(this.dom.cssEditor, editorConfig('css'));
        }
        if (this.dom.jsEditor) {
            this.state.editors.js = CodeMirror.fromTextArea(this.dom.jsEditor, editorConfig('javascript'));
        }
        if (this.dom.singleFileEditor) {
            this.state.editors.singleFile = CodeMirror.fromTextArea(this.dom.singleFileEditor, editorConfig('htmlmixed'));
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
        const panel = document.querySelector(`[data-file-id="${fileId}"]`);
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

    addNewFile() {
        const fileId = `file-${this.state.nextFileId++}`;
        const fileName = `newfile.html`;
        
        const panelHTML = `
            <div class="editor-panel" data-file-type="html" data-file-id="${fileId}" draggable="true">
                <div class="panel-header">
                    <div class="drag-handle" aria-label="Drag to reorder">⋮⋮</div>
                    <input type="text" class="file-name-input" value="${fileName}" aria-label="File name">
                    <select class="file-type-selector" aria-label="File type">
                        <option value="html" selected>HTML</option>
                        <option value="css">CSS</option>
                        <option value="javascript">JavaScript</option>
                        <option value="javascript-module">JavaScript Module</option>
                    </select>
                    <button class="remove-file-btn" aria-label="Remove file">&times;</button>
                </div>
                ${this.generateToolbarHTML('html')}
                <label for="${fileId}" class="sr-only">Code Editor</label>
                <div class="editor-wrapper">
                    <textarea id="${fileId}"></textarea>
                </div>
            </div>
        `;
        
        this.dom.editorGrid.insertAdjacentHTML('beforeend', panelHTML);
        
        const newTextarea = document.getElementById(fileId);
        let newEditor;
        
        if (typeof CodeMirror !== 'undefined') {
            newEditor = CodeMirror.fromTextArea(newTextarea, {
                lineNumbers: true,
                mode: 'htmlmixed',
                theme: 'dracula',
                autoCloseTags: true,
                lineWrapping: true,
            });
        } else {
            Object.assign(newTextarea.style, {
                fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5',
                resize: 'none', border: 'none', outline: 'none',
                background: '#282a36', color: '#f8f8f2', padding: '1rem',
                width: '100%', height: '400px'
            });
            
            newEditor = {
                setValue: (value) => newTextarea.value = value,
                getValue: () => newTextarea.value,
                refresh: () => {},
                setOption: () => {},
            };
        }
        
        this.state.files.push({
            id: fileId,
            editor: newEditor,
            type: 'html',
            fileName: fileName
        });
        
        this.bindFilePanelEvents(document.querySelector(`[data-file-id="${fileId}"]`));
        this.bindDragAndDropEvents(document.querySelector(`[data-file-id="${fileId}"]`));
        
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
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
        
        const fileTypeOptions = this.generateFileTypeOptions(fileType);
        
        const panelHTML = `
            <div class="editor-panel" data-file-type="${fileType}" data-file-id="${fileId}" draggable="true">
                <div class="panel-header">
                    <div class="drag-handle" aria-label="Drag to reorder">⋮⋮</div>
                    <input type="text" class="file-name-input" value="${fileName}" aria-label="File name">
                    <select class="file-type-selector" aria-label="File type">
                        ${fileTypeOptions}
                    </select>
                    <button class="remove-file-btn" aria-label="Remove file">&times;</button>
                </div>
                ${this.generateToolbarHTML(fileType)}
                <label for="${fileId}" class="sr-only">${this.getFileTypeLabel(fileType)}</label>
                <div class="editor-wrapper">
                    ${this.generateFileContentDisplay(fileId, fileType, content, isBinary)}
                </div>
            </div>
        `;
        
        this.dom.editorGrid.insertAdjacentHTML('beforeend', panelHTML);
        
        let newEditor;
        
        if (this.isEditableFileType(fileType)) {
            const newTextarea = document.getElementById(fileId);
            
            if (typeof CodeMirror !== 'undefined') {
                const mode = this.getCodeMirrorMode(fileType);
                
                newEditor = CodeMirror.fromTextArea(newTextarea, {
                    lineNumbers: true,
                    mode: mode,
                    theme: 'dracula',
                    autoCloseTags: fileType === 'html',
                    lineWrapping: true,
                    readOnly: isBinary ? 'nocursor' : false
                });
                
                if (!isBinary) {
                    newEditor.setValue(content);
                }
            } else {
                Object.assign(newTextarea.style, {
                    fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5',
                    resize: 'none', border: 'none', outline: 'none',
                    background: '#282a36', color: '#f8f8f2', padding: '1rem',
                    width: '100%', height: '400px'
                });
                
                newEditor = {
                    setValue: (value) => newTextarea.value = value,
                    getValue: () => newTextarea.value,
                    refresh: () => {},
                    setOption: () => {},
                };
                
                if (!isBinary) {
                    newEditor.setValue(content);
                }
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
        
        this.bindFilePanelEvents(document.querySelector(`[data-file-id="${fileId}"]`));
        this.bindDragAndDropEvents(document.querySelector(`[data-file-id="${fileId}"]`));
        
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
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
                        
                        if (typeof CodeMirror !== 'undefined' && fileInfo.editor.setOption) {
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
                    fileInfo.type = newType;
                    if (typeof CodeMirror !== 'undefined' && fileInfo.editor.setOption) {
                        const mode = newType === 'html' ? 'htmlmixed' : 
                                   newType === 'css' ? 'css' : 'javascript';
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

    removeFile(fileId) {
        const panel = document.querySelector(`[data-file-id="${fileId}"]`);
        if (panel) {
            panel.remove();
        }
        
        this.state.files = this.state.files.filter(f => f.id !== fileId);
        
        if (fileId === 'default-html') {
            this.state.editors.html = null;
        } else if (fileId === 'default-css') {
            this.state.editors.css = null;
        } else if (fileId === 'default-js') {
            this.state.editors.js = null;
        }
        
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
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
                        type: fileType
                    });
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

    resolvePath(basePath, relativePath) {
        if (relativePath.startsWith('/')) {
            return relativePath.substring(1);
        }
        
        const baseDir = basePath.includes('/') ? basePath.substring(0, basePath.lastIndexOf('/')) : '';
        
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

    findFileInSystem(fileSystem, targetFilename, currentFilePath = '') {
        if (currentFilePath) {
            targetFilename = this.resolvePath(currentFilePath, targetFilename);
        }
        
        const exactMatch = fileSystem.get(targetFilename);
        if (exactMatch) {
            return exactMatch;
        }
        
        const targetLower = targetFilename.toLowerCase();
        for (const [filename, file] of fileSystem) {
            if (filename.toLowerCase() === targetLower) {
                return file;
            }
        }
        
        return null;
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
        
        return htmlContent;
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

    assetReplacers: {
        replaceCSS(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<link([^>]*?)href\s*=\s*["']([^"']+\.css)["']([^>]*?)>/gi, (match, before, filename, after) => {
                const file = CodePreviewer.findFileInSystem(fileSystem, filename, currentFilePath);
                if (file && file.type === 'css') {
                    return `<style>${file.content}</style>`;
                }
                return match;
            });
        },

        replaceImages(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<img([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, before, filename, after) => {
                const file = CodePreviewer.findFileInSystem(fileSystem, filename, currentFilePath);
                if (file && (file.type === 'image' || file.type === 'svg')) {
                    const src = file.isBinary ? file.content : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(file.content)}`;
                    const newSrc = `src="${src}"`;
                    return match.replace(/src\s*=\s*["'][^"']*["']/i, newSrc);
                }
                return match;
            });
        },

        replaceVideoSources(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<video([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, before, filename, after) => {
                const file = CodePreviewer.findFileInSystem(fileSystem, filename, currentFilePath);
                if (file && file.type === 'video') {
                    const newSrc = `src="${file.content}"`;
                    return match.replace(/src\s*=\s*["'][^"']*["']/i, newSrc);
                }
                return match;
            });
        },

        replaceSourceElements(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<source([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, before, filename, after) => {
                const file = CodePreviewer.findFileInSystem(fileSystem, filename, currentFilePath);
                if (file && (file.type === 'video' || file.type === 'audio')) {
                    const newSrc = `src="${file.content}"`;
                    return match.replace(/src\s*=\s*["'][^"']*["']/i, newSrc);
                }
                return match;
            });
        },

        replaceAudioSources(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<audio([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, before, filename, after) => {
                const file = CodePreviewer.findFileInSystem(fileSystem, filename, currentFilePath);
                if (file && file.type === 'audio') {
                    const newSrc = `src="${file.content}"`;
                    return match.replace(/src\s*=\s*["'][^"']*["']/i, newSrc);
                }
                return match;
            });
        },

        replaceFavicons(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<link([^>]*?)href\s*=\s*["']([^"']+\.ico)["']([^>]*?)>/gi, (match, before, filename, after) => {
                const file = CodePreviewer.findFileInSystem(fileSystem, filename, currentFilePath);
                if (file && file.type === 'image') {
                    const newHref = `href="${file.content}"`;
                    return match.replace(/href\s*=\s*["'][^"']*["']/i, newHref);
                }
                return match;
            });
        },

        replaceDownloadLinks(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<a([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, before, filename, after) => {
                if (match.includes('download') || !filename.includes('://')) {
                    const file = CodePreviewer.findFileInSystem(fileSystem, filename, currentFilePath);
                    if (file) {
                        let href;
                        if (file.isBinary) {
                            href = file.content;
                        } else {
                            const mimeType = CodePreviewer.getMimeTypeFromFileType(file.type);
                            href = `data:${mimeType};charset=utf-8,${encodeURIComponent(file.content)}`;
                        }
                        const newHref = `href="${href}"`;
                        return match.replace(/href\s*=\s*["'][^"']*["']/i, newHref);
                    }
                }
                return match;
            });
        },

        replaceFontLinks(htmlContent, fileSystem, currentFilePath) {
            return htmlContent.replace(/<link([^>]*?)href\s*=\s*["']([^"']+\.(?:woff|woff2|ttf|otf|eot))["']([^>]*?)>/gi, (match, before, filename, after) => {
                const file = CodePreviewer.findFileInSystem(fileSystem, filename, currentFilePath);
                if (file && file.type === 'font') {
                    return `<link${before}href="${file.content}"${after}>`;
                }
                return match;
            });
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
                
                const file = CodePreviewer.findFileInSystem(fileSystem, filename, currentFilePath);
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

    console: {
        init(outputEl, clearBtn, previewFrame) {
            this.outputEl = outputEl;
            this.previewFrame = previewFrame;
            clearBtn.addEventListener('click', () => this.clear());
            window.addEventListener('message', (e) => this.handleMessage(e));
        },
        clear() {
            this.outputEl.innerHTML = '';
        },
        log(logData) {
            const el = document.createElement('div');
            el.className = `log-message log-type-${logData.level}`;
            
            const messageText = logData.message.map(arg => {
                if (typeof arg === 'object' && arg !== null) {
                    try { return JSON.stringify(arg, null, 2); } catch (e) { return 'Unserializable Object'; }
                }
                return String(arg);
            }).join(' ');

            el.textContent = `> ${messageText}`;
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
                    console.log("Virtual file system loaded:", Object.keys(virtualFileSystem));
                    const mainHtmlPath = "${mainHtmlPath}";
                `;
            } else {
                fileSystemScript = `
                    const virtualFileSystem = {};
                    const mainHtmlPath = "index.html";
                `;
            }
            
            return '<script>\n' +
                '(function() {\n' +
                fileSystemScript + '\n' +
                '    \n' +
                `    window.__currentExecutionContext = "${mainHtmlPath}";\n` +
                '    \n' +
                '    function resolvePath(basePath, relativePath) {\n' +
                '        if (relativePath.startsWith("/")) {\n' +
                '            return relativePath.substring(1);\n' +
                '        }\n' +
                '        \n' +
                '        const baseDir = basePath.includes("/") ? basePath.substring(0, basePath.lastIndexOf("/")) : "";\n' +
                '        const baseParts = baseDir ? baseDir.split("/") : [];\n' +
                '        const relativeParts = relativePath.split("/");\n' +
                '        const resultParts = [...baseParts];\n' +
                '        \n' +
                '        for (const part of relativeParts) {\n' +
                '            if (part === "..") {\n' +
                '                if (resultParts.length > 0) {\n' +
                '                    resultParts.pop();\n' +
                '                }\n' +
                '            } else if (part !== "." && part !== "") {\n' +
                '                resultParts.push(part);\n' +
                '            }\n' +
                '        }\n' +
                '        \n' +
                '        return resultParts.join("/");\n' +
                '    }\n' +
                '    \n' +
                '    function findFileInSystem(targetFilename, currentFilePath = "") {\n' +
                '        console.log("🔍 findFileInSystem called with:", { targetFilename, currentFilePath });\n' +
                '        if (currentFilePath) {\n' +
                '            const resolvedPath = resolvePath(currentFilePath, targetFilename);\n' +
                '            console.log("🔧 Path resolved from", targetFilename, "to", resolvedPath);\n' +
                '            targetFilename = resolvedPath;\n' +
                '        }\n' +
                '        \n' +
                '        const exactMatch = virtualFileSystem[targetFilename];\n' +
                '        if (exactMatch) {\n' +
                '            console.log("✅ Found exact match for:", targetFilename);\n' +
                '            return exactMatch;\n' +
                '        }\n' +
                '        \n' +
                '        const targetLower = targetFilename.toLowerCase();\n' +
                '        for (const [filename, file] of Object.entries(virtualFileSystem)) {\n' +
                '            if (filename.toLowerCase() === targetLower) {\n' +
                '                console.log("✅ Found case-insensitive match:", filename, "for", targetFilename);\n' +
                '                return file;\n' +
                '            }\n' +
                '        }\n' +
                '        \n' +
                '        console.log("❌ No match found for:", targetFilename);\n' +
                '        return null;\n' +
                '    }\n' +
                '    \n' +
                '    function getCurrentFilePath() {\n' +
                '        try {\n' +
                '            if (window.__currentExecutionContext) {\n' +
                '                return window.__currentExecutionContext;\n' +
                '            }\n' +
                '            return mainHtmlPath;\n' +
                '        } catch (e) {\n' +
                '            return mainHtmlPath;\n' +
                '        }\n' +
                '    }\n' +
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
                '    const originalAudio = window.Audio;\n' +
                '    window.Audio = function(src) {\n' +
                '        const audio = new originalAudio(src);\n' +
                '        \n' +
                '        function findSrcDescriptor(obj) {\n' +
                '            while (obj) {\n' +
                '                const descriptor = Object.getOwnPropertyDescriptor(obj, "src");\n' +
                '                if (descriptor && descriptor.set) {\n' +
                '                    return descriptor.set;\n' +
                '                }\n' +
                '                obj = Object.getPrototypeOf(obj);\n' +
                '            }\n' +
                '            return null;\n' +
                '        }\n' +
                '        \n' +
                '        const originalSrcSetter = findSrcDescriptor(HTMLAudioElement.prototype);\n' +
                '        \n' +
                '        if (originalSrcSetter) {\n' +
                '            Object.defineProperty(audio, "src", {\n' +
                '                get: function() {\n' +
                '                    return this._virtualSrc || this.getAttribute("src") || "";\n' +
                '                },\n' +
                '                set: function(value) {\n' +
                '                    if (this._settingSrc) return;\n' +
                '                    this._settingSrc = true;\n' +
                '                    \n' +
                '                    this._virtualSrc = value;\n' +
                '                    \n' +
                '                    if (value) {\n' +
                '                        const currentFilePath = getCurrentFilePath();\n' +
                '                        let targetPath = value.replace(/^\\.\\//, "");\n' +
                '                        console.log("🎵 Audio target path:", targetPath, "from context:", currentFilePath);\n' +
                '                        const fileData = findFileInSystem(targetPath, currentFilePath);\n' +
                '                        \n' +
                '                        if (fileData && fileData.type === "audio") {\n' +
                '                            if (fileData.isBinary && fileData.content.startsWith("data:")) {\n' +
                '                                originalSrcSetter.call(this, fileData.content);\n' +
                '                            } else {\n' +
                '                                const blob = new Blob([fileData.content], { type: "audio/mpeg" });\n' +
                '                                const blobUrl = URL.createObjectURL(blob);\n' +
                '                                originalSrcSetter.call(this, blobUrl);\n' +
                '                            }\n' +
                '                            this._settingSrc = false;\n' +
                '                            return;\n' +
                '                        }\n' +
                '                    }\n' +
                '                    \n' +
                '                    originalSrcSetter.call(this, value);\n' +
                '                    this._settingSrc = false;\n' +
                '                },\n' +
                '                configurable: true,\n' +
                '                enumerable: true\n' +
                '            });\n' +
                '        }\n' +
                '        \n' +
                '        if (src) {\n' +
                '            const currentFilePath = getCurrentFilePath();\n' +
                '            let targetPath = src.replace(/^\\.\\//, "");\n' +
                '            const fileData = findFileInSystem(targetPath, currentFilePath);\n' +
                '            \n' +
                '            if (fileData && fileData.type === "audio") {\n' +
                '                if (originalSrcSetter) {\n' +
                '                    if (fileData.isBinary && fileData.content.startsWith("data:")) {\n' +
                '                        originalSrcSetter.call(audio, fileData.content);\n' +
                '                    } else {\n' +
                '                        const blob = new Blob([fileData.content], { type: "audio/mpeg" });\n' +
                '                        const blobUrl = URL.createObjectURL(blob);\n' +
                '                        originalSrcSetter.call(audio, blobUrl);\n' +
                '                    }\n' +
                '                }\n' +
                '            }\n' +
                '        }\n' +
                '        \n' +
                '        return audio;\n' +
                '    };\n' +
                '    \n' +
                '    const originalImage = window.Image;\n' +
                '    window.Image = function(width, height) {\n' +
                '        const img = new originalImage(width, height);\n' +
                '        \n' +
                '        function findSrcDescriptor(obj) {\n' +
                '            while (obj) {\n' +
                '                const descriptor = Object.getOwnPropertyDescriptor(obj, "src");\n' +
                '                if (descriptor && descriptor.set) {\n' +
                '                    return descriptor.set;\n' +
                '                }\n' +
                '                obj = Object.getPrototypeOf(obj);\n' +
                '            }\n' +
                '            return null;\n' +
                '        }\n' +
                '        \n' +
                '        const originalSrcSetter = findSrcDescriptor(HTMLImageElement.prototype);\n' +
                '        \n' +
                '        if (originalSrcSetter) {\n' +
                '            Object.defineProperty(img, "src", {\n' +
                '                get: function() {\n' +
                '                    return this._virtualSrc || this.getAttribute("src") || "";\n' +
                '                },\n' +
                '                set: function(value) {\n' +
                '                    if (this._settingSrc) return;\n' +
                '                    this._settingSrc = true;\n' +
                '                    \n' +
                '                    this._virtualSrc = value;\n' +
                '                    \n' +
                '                    if (value) {\n' +
                '                        const currentFilePath = getCurrentFilePath();\n' +
                '                        let targetPath = value.replace(/^\\.\\//, "");\n' +
                '                        console.log("🖼️ Image target path:", targetPath);\n' +
                '                        console.log("🗂️ Available files:", Object.keys(virtualFileSystem));\n' +
                '                        console.log("📍 Current file path:", currentFilePath);\n' +
                '                        console.log("🔍 Window execution context:", window.__currentExecutionContext);\n' +
                '                        let fileData;\n' +
                '                        try {\n' +
                '                            console.log("🚀 About to call findFileInSystem");\n' +
                '                            fileData = findFileInSystem(targetPath, currentFilePath);\n' +
                '                            console.log("✅ findFileInSystem completed, result:", !!fileData);\n' +
                '                        } catch (error) {\n' +
                '                            console.error("❌ Error in findFileInSystem:", error);\n' +
                '                            fileData = null;\n' +
                '                        }\n' +
                '                        \n' +
                '                        if (fileData) {\n' +
                '                            const truncatedContent = fileData.content.length > 100 ? \n' +
                '                                fileData.content.substring(0, 50) + "..." + fileData.content.substring(fileData.content.length - 20) :\n' +
                '                                fileData.content;\n' +
                '                            console.log("📁 Image file data found:", {\n' +
                '                                content: truncatedContent,\n' +
                '                                type: fileData.type,\n' +
                '                                isBinary: fileData.isBinary,\n' +
                '                                fullContentLength: fileData.content.length\n' +
                '                            });\n' +
                '                            \n' +
                '                            window._debugInfo = window._debugInfo || [];\n' +
                '                            window._debugInfo.push({\n' +
                '                                timestamp: new Date().toISOString(),\n' +
                '                                targetPath,\n' +
                '                                fileData: {\n' +
                '                                    content: fileData.content,\n' +
                '                                    type: fileData.type,\n' +
                '                                    isBinary: fileData.isBinary\n' +
                '                                }\n' +
                '                            });\n' +
                '                            \n' +
                '                            if (!window._copyDebugDefined) {\n' +
                '                                window.copyDebugInfo = function() {\n' +
                '                                    const debugString = JSON.stringify(window._debugInfo, null, 2);\n' +
                '                                    navigator.clipboard.writeText(debugString).then(() => {\n' +
                '                                        console.log("📋 Debug info copied to clipboard!");\n' +
                '                                    }).catch(err => {\n' +
                '                                        console.log("📋 Debug info (copy manually):", debugString);\n' +
                '                                    });\n' +
                '                                };\n' +
                '                                window._copyDebugDefined = true;\n' +
                '                                console.log("🔧 Use copyDebugInfo() to copy full debug data to clipboard");\n' +
                '                            }\n' +
                '                        } else {\n' +
                '                            console.log("❌ Image file not found in virtual system");\n' +
                '                        }\n' +
                '                        \n' +
                '                        if (fileData && (fileData.type === "image" || fileData.type === "svg")) {\n' +
                '                            console.log("✅ Processing image file, type:", fileData.type, "isBinary:", fileData.isBinary);\n' +
                '                            if (fileData.isBinary && fileData.content.startsWith("data:")) {\n' +
                '                                console.log("📊 Using data URL directly for image");\n' +
                '                                originalSrcSetter.call(this, fileData.content);\n' +
                '                            } else if (fileData.type === "svg") {\n' +
                '                                console.log("🎨 Creating SVG data URL");\n' +
                '                                const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fileData.content)}`;\n' +
                '                                originalSrcSetter.call(this, svgDataUrl);\n' +
                '                            } else {\n' +
                '                                const blob = new Blob([fileData.content], { type: "image/png" });\n' +
                '                                const blobUrl = URL.createObjectURL(blob);\n' +
                '                                console.log("🗂️ Created blob URL for image:", blobUrl);\n' +
                '                                originalSrcSetter.call(this, blobUrl);\n' +
                '                            }\n' +
                '                            this._settingSrc = false;\n' +
                '                            return;\n' +
                '                        }\n' +
                '                    }\n' +
                '                    \n' +
                '                    console.log("🌐 Using original src setter for external URL:", value);\n' +
                '                    originalSrcSetter.call(this, value);\n' +
                '                    this._settingSrc = false;\n' +
                '                },\n' +
                '                configurable: true,\n' +
                '                enumerable: true\n' +
                '            });\n' +
                '        }\n' +
                '        \n' +
                '        return img;\n' +
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
                '    [\'log\', \'warn\', \'error\'].forEach(level => {\n' +
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
