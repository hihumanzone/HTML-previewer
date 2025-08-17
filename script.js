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
            singleFileContainer: document.getElementById(CONTAINER_IDS.SINGLE_FILE),
            multiFileContainer: document.getElementById(CONTAINER_IDS.MULTI_FILE),
            modalOverlay: document.getElementById(MODAL_IDS.OVERLAY),
            previewFrame: document.getElementById(MODAL_IDS.FRAME),
            closeModalBtn: document.querySelector('.modal-header .close-btn'),
            consoleOutput: document.getElementById(CONSOLE_ID),
            modalConsolePanel: document.getElementById(MODAL_CONSOLE_PANEL_ID),
            editorGrid: document.querySelector('.editor-grid'),
            saveCodeBtn: document.getElementById('save-code-btn'),
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

    autoDetectFileType(filename, content) {
        if (!filename) return 'javascript';
        
        const extension = filename.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'html':
            case 'htm':
            case 'xhtml':
                return 'html';
            case 'css':
            case 'scss':
            case 'sass':
            case 'less':
                return 'css';
            case 'mjs':
            case 'esm':
                return 'javascript-module';
            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
                return this.isModuleFile(content, filename) ? 'javascript-module' : 'javascript';
            case 'json':
                return 'javascript';
            default:
                if (content) {
                    if (/<\s*html/i.test(content)) return 'html';
                    if (/^\s*[\.\#\@]|\s*\w+\s*\{/m.test(content)) return 'css';
                    if (this.isModuleFile(content, filename)) return 'javascript-module';
                }
                return 'javascript';
        }
    },

    getFileNameFromPanel(fileId) {
        const panel = document.querySelector(`[data-file-id="${fileId}"]`);
        if (panel) {
            const nameInput = panel.querySelector('.file-name-input');
            return nameInput ? nameInput.value : null;
        }
        return null;
    },

    addNewFile() {
        const fileId = `file-${this.state.nextFileId++}`;
        const fileName = `newfile.html`;
        
        const panelHTML = `
            <div class="editor-panel" data-file-type="html" data-file-id="${fileId}">
                <div class="panel-header">
                    <input type="text" class="file-name-input" value="${fileName}" aria-label="File name">
                    <select class="file-type-selector" aria-label="File type">
                        <option value="html" selected>HTML</option>
                        <option value="css">CSS</option>
                        <option value="javascript">JavaScript</option>
                        <option value="javascript-module">JavaScript Module</option>
                    </select>
                    <button class="remove-file-btn" aria-label="Remove file">&times;</button>
                </div>
                <div class="editor-toolbar">
                    <button class="toolbar-btn clear-btn" aria-label="Clear content" title="Clear">
                        <span class="btn-icon">🗑️</span> Clear
                    </button>
                    <button class="toolbar-btn paste-btn" aria-label="Paste from clipboard" title="Paste">
                        <span class="btn-icon">📋</span> Paste
                    </button>
                    <button class="toolbar-btn copy-btn" aria-label="Copy to clipboard" title="Copy">
                        <span class="btn-icon">📄</span> Copy
                    </button>
                    <button class="toolbar-btn expand-btn" aria-label="Expand code view" title="Expand">
                        <span class="btn-icon">🔍</span> Expand
                    </button>
                    <button class="toolbar-btn export-btn" aria-label="Export file" title="Export">
                        <span class="btn-icon">💾</span> Export
                    </button>
                    <button class="toolbar-btn collapse-btn" aria-label="Collapse/Expand editor" title="Collapse/Expand">
                        <span class="btn-icon">📁</span> Collapse
                    </button>
                </div>
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
            type: 'html'
        });
        
        this.bindFilePanelEvents(document.querySelector(`[data-file-id="${fileId}"]`));
        
        this.updateRemoveButtonsVisibility();
    },

    importFile() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.html,.htm,.css,.js,.mjs,.jsx,.ts,.tsx';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const content = await this.readFileContent(file);
                
                const detectedType = this.autoDetectFileType(file.name, content);
                
                this.addNewFileWithContent(file.name, detectedType, content);
                
            } catch (error) {
                console.error('Error importing file:', error);
                alert('Error importing file. Please try again.');
            }
            
            document.body.removeChild(fileInput);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
    },

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    addNewFileWithContent(fileName, fileType, content) {
        const fileId = `file-${this.state.nextFileId++}`;
        
        const panelHTML = `
            <div class="editor-panel" data-file-type="${fileType}" data-file-id="${fileId}">
                <div class="panel-header">
                    <input type="text" class="file-name-input" value="${fileName}" aria-label="File name">
                    <select class="file-type-selector" aria-label="File type">
                        <option value="html" ${fileType === 'html' ? 'selected' : ''}>HTML</option>
                        <option value="css" ${fileType === 'css' ? 'selected' : ''}>CSS</option>
                        <option value="javascript" ${fileType === 'javascript' ? 'selected' : ''}>JavaScript</option>
                        <option value="javascript-module" ${fileType === 'javascript-module' ? 'selected' : ''}>JavaScript Module</option>
                    </select>
                    <button class="remove-file-btn" aria-label="Remove file">&times;</button>
                </div>
                <div class="editor-toolbar">
                    <button class="toolbar-btn clear-btn" aria-label="Clear content" title="Clear">
                        <span class="btn-icon">🗑️</span> Clear
                    </button>
                    <button class="toolbar-btn paste-btn" aria-label="Paste from clipboard" title="Paste">
                        <span class="btn-icon">📋</span> Paste
                    </button>
                    <button class="toolbar-btn copy-btn" aria-label="Copy to clipboard" title="Copy">
                        <span class="btn-icon">📄</span> Copy
                    </button>
                    <button class="toolbar-btn expand-btn" aria-label="Expand code view" title="Expand">
                        <span class="btn-icon">🔍</span> Expand
                    </button>
                    <button class="toolbar-btn export-btn" aria-label="Export file" title="Export">
                        <span class="btn-icon">💾</span> Export
                    </button>
                    <button class="toolbar-btn collapse-btn" aria-label="Collapse/Expand editor" title="Collapse/Expand">
                        <span class="btn-icon">📁</span> Collapse
                    </button>
                </div>
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
            const mode = fileType === 'html' ? 'htmlmixed' : 
                       fileType === 'css' ? 'css' : 'javascript';
            
            newEditor = CodeMirror.fromTextArea(newTextarea, {
                lineNumbers: true,
                mode: mode,
                theme: 'dracula',
                autoCloseTags: fileType === 'html',
                lineWrapping: true,
            });
            
            newEditor.setValue(content);
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
            
            newEditor.setValue(content);
        }
        
        this.state.files.push({
            id: fileId,
            editor: newEditor,
            type: fileType
        });
        
        this.bindFilePanelEvents(document.querySelector(`[data-file-id="${fileId}"]`));
        
        this.updateRemoveButtonsVisibility();
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
    },

    updateRemoveButtonsVisibility() {
        const allPanels = document.querySelectorAll('.editor-panel[data-file-id]');
        
        allPanels.forEach(panel => {
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
        });
        this.updateRemoveButtonsVisibility();
        
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
                        readOnly: false, // Make editable
                        lineWrapping: true,
                        autoCloseTags: true,
                        viewportMargin: Infinity,
                    });
                } else {
                    this.state.codeModalEditor.setOption('mode', language);
                    this.state.codeModalEditor.setOption('readOnly', false); // Make editable
                }

                this.state.codeModalEditor.setValue(content);
            } else {
                editorTextarea.value = content;
                editorTextarea.readOnly = false; // Make editable
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
    },

    generateSingleFilePreview() {
        const singleFileContent = this.state.editors.singleFile ? this.state.editors.singleFile.getValue() : '';
        const captureScript = this.console.getCaptureScript();
        
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

    processHTMLScripts(htmlContent, jsFiles, moduleFiles) {
        htmlContent = htmlContent.replace(/<script(?:\s+type\s*=\s*['"](?:text\/javascript|application\/javascript)['"])?[^>]*>([\s\S]*?)<\/script>/gi, (match, scriptContent) => {
            if (this.isModuleFile(scriptContent)) {
                moduleFiles.push({
                    content: scriptContent,
                    filename: 'inline-module.mjs'
                });
            } else {
                jsFiles.push({
                    content: scriptContent,
                    filename: 'inline-script.js'
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
                
                let htmlContent = this.extractHTMLContent(contentWithoutStyles);
                htmlContent = this.processHTMLScripts(htmlContent, jsFiles, moduleFiles);
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
            const filename = this.getFileNameFromPanel(file.id);
            if (filename && file.editor) {
                fileSystem.set(filename, {
                    content: file.editor.getValue(),
                    type: file.type
                });
            }
        });
        
        return fileSystem;
    },

    findFileInSystem(fileSystem, targetFilename) {
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

    replaceAssetReferences(htmlContent, fileSystem) {
        htmlContent = htmlContent.replace(/<link([^>]*?)href\s*=\s*["']([^"']+\.css)["']([^>]*?)>/gi, (match, before, filename, after) => {
            const file = this.findFileInSystem(fileSystem, filename);
            if (file && file.type === 'css') {
                return `<style>${file.content}</style>`;
            }
            return match;
        });
        
        htmlContent = htmlContent.replace(/<script([^>]*?)src\s*=\s*["']([^"']+\.(?:js|mjs))["']([^>]*?)><\/script>/gi, (match, before, filename, after) => {
            const file = this.findFileInSystem(fileSystem, filename);
            if (file && (file.type === 'javascript' || file.type === 'javascript-module')) {
                const scriptType = file.type === 'javascript-module' ? ' type="module"' : '';
                return `<script${scriptType}>${file.content}</script>`;
            }
            return match;
        });
        
        return htmlContent;
    },

    generateFullDocumentPreview() {
        const mainHtmlFile = this.state.files.find(file => 
            file.type === 'html' && this.isFullHTMLDocument(file.editor.getValue())
        );
        
        if (!mainHtmlFile) {
            return this.generateMultiFilePreview();
        }
        
        const fileSystem = this.createVirtualFileSystem();
        let processedHtml = this.replaceAssetReferences(mainHtmlFile.editor.getValue(), fileSystem);
        
        return this.injectConsoleScript(processedHtml);
    },

    injectConsoleScript(htmlContent) {
        const captureScript = this.console.getCaptureScript();
        
        if (htmlContent.includes('</head>')) {
            return htmlContent.replace('</head>', captureScript + '\n</head>');
        } else if (htmlContent.includes('<head>')) {
            return htmlContent.replace('<head>', '<head>\n' + captureScript);
        } else {
            return htmlContent.replace(/<html[^>]*>/i, '$&\n<head>\n' + captureScript + '\n</head>');
        }
    },

    processModuleFiles(moduleFiles) {
        if (moduleFiles.length === 0) return '';

        let combinedModuleContent = '';
        let globalFunctions = [];
        
        moduleFiles.forEach((file, index) => {
            let processedContent = file.content;
            
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
            
            combinedModuleContent += '\n' + processedContent + '\n';
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

    processJavaScriptFiles(jsFiles) {
        if (jsFiles.length === 0) return '';

        const regularJS = jsFiles.map(file => {
            return 'try {\n' +
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

    generateMultiFilePreview() {
        if (this.detectFullDocumentMode()) {
            return this.generateFullDocumentPreview();
        }
        
        const { html, css, jsFiles, moduleFiles } = this.collectFileContents();
        const moduleScript = this.processModuleFiles(moduleFiles);
        const jsScript = this.processJavaScriptFiles(jsFiles);

        return '<!DOCTYPE html>\n' +
            '<html lang="en">\n' +
            '<head>\n' +
            '    <meta charset="UTF-8">\n' +
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '    <title>Live Preview</title>\n' +
            '    ' + this.console.getCaptureScript() + '\n' +
            '    <style>' + css + '</style>\n' +
            '</head>\n' +
            '<body>\n' +
            '    ' + html + '\n' +
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
        getCaptureScript() {
            const MESSAGE_TYPE = CodePreviewer.constants.CONSOLE_MESSAGE_TYPE;
            return '<script>\n' +
                '(function() {\n' +
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
