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
            SINGLE_MODE_RADIO: 'single-mode-radio',
            MULTI_MODE_RADIO: 'multi-mode-radio',
            ADD_FILE_BTN: 'add-file-btn',
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
        const { EDITOR_IDS, CONTROL_IDS, MODAL_IDS, CONSOLE_ID, CONTAINER_IDS } = this.constants;
        this.dom = {
            htmlEditor: document.getElementById(EDITOR_IDS.HTML),
            cssEditor: document.getElementById(EDITOR_IDS.CSS),
            jsEditor: document.getElementById(EDITOR_IDS.JS),
            singleFileEditor: document.getElementById(EDITOR_IDS.SINGLE_FILE),
            modalBtn: document.getElementById(CONTROL_IDS.MODAL_BTN),
            tabBtn: document.getElementById(CONTROL_IDS.TAB_BTN),
            clearConsoleBtn: document.getElementById(CONTROL_IDS.CLEAR_CONSOLE_BTN),
            singleModeRadio: document.getElementById(CONTROL_IDS.SINGLE_MODE_RADIO),
            multiModeRadio: document.getElementById(CONTROL_IDS.MULTI_MODE_RADIO),
            singleModeOption: document.querySelector('label[for="single-mode-radio"]') || this.getSafeParentElement(CONTROL_IDS.SINGLE_MODE_RADIO),
            multiModeOption: document.querySelector('label[for="multi-mode-radio"]') || this.getSafeParentElement(CONTROL_IDS.MULTI_MODE_RADIO),
            addFileBtn: document.getElementById(CONTROL_IDS.ADD_FILE_BTN),
            singleFileContainer: document.getElementById(CONTAINER_IDS.SINGLE_FILE),
            multiFileContainer: document.getElementById(CONTAINER_IDS.MULTI_FILE),
            modalOverlay: document.getElementById(MODAL_IDS.OVERLAY),
            previewFrame: document.getElementById(MODAL_IDS.FRAME),
            closeModalBtn: document.querySelector(MODAL_IDS.CLOSE_BTN),
            consoleOutput: document.getElementById(CONSOLE_ID),
            editorGrid: document.querySelector('.editor-grid'),
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

        const singleFileContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page</title>
    <style>
${initialCSS}
    </style>
</head>
<body>
    ${initialHTML}
    <script>
${initialJS}
    </script>
</body>
</html>`;
        
        if (this.state.editors.singleFile) {
            this.state.editors.singleFile.setValue(singleFileContent);
        }
    },

    bindEvents() {
        this.dom.modalBtn.addEventListener('click', () => this.renderPreview('modal'));
        this.dom.tabBtn.addEventListener('click', () => this.renderPreview('tab'));
        this.dom.closeModalBtn.addEventListener('click', () => this.toggleModal(false));
        this.dom.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.dom.modalOverlay) this.toggleModal(false);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.dom.modalOverlay.getAttribute('aria-hidden') === 'false') {
                this.toggleModal(false);
            }
        });

        this.dom.singleModeRadio.addEventListener('change', () => this.switchMode('single'));
        this.dom.multiModeRadio.addEventListener('change', () => this.switchMode('multi'));
        
        // Add click handlers for mode option cards
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

    // Detect if JavaScript code contains module syntax or if filename suggests module
    isModuleFile(content, filename) {
        // Check file extension for explicit module files
        if (filename && (filename.endsWith('.mjs') || filename.endsWith('.esm.js'))) {
            return true;
        }
        
        // Check content for import/export statements
        if (content) {
            const modulePatterns = [
                /^\s*import\s+/m,           // import statements
                /^\s*export\s+/m,           // export statements
                /import\s*\(/,              // dynamic imports
                /export\s*\{/,              // export destructuring
                /export\s+default\s+/,      // export default
                /export\s+\*/               // export all
            ];
            
            return modulePatterns.some(pattern => pattern.test(content));
        }
        
        return false;
    },

    // Auto-determine file type based on filename and content
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
                // Auto-detect if JS file should be a module
                return this.isModuleFile(content, filename) ? 'javascript-module' : 'javascript';
            case 'json':
                // Treat JSON as JavaScript for syntax highlighting
                return 'javascript';
            default:
                // For unknown extensions, try to detect based on content
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

    bindFilePanelEvents(panel) {
        const typeSelector = panel.querySelector('.file-type-selector');
        const removeBtn = panel.querySelector('.remove-file-btn');
        const fileNameInput = panel.querySelector('.file-name-input');
        const fileId = panel.dataset.fileId;
        
        // Auto-detect file type when filename changes
        if (fileNameInput) {
            fileNameInput.addEventListener('blur', (e) => {
                const filename = e.target.value;
                const fileInfo = this.state.files.find(f => f.id === fileId);
                
                if (fileInfo && typeSelector) {
                    const currentContent = fileInfo.editor.getValue();
                    const suggestedType = this.autoDetectFileType(filename, currentContent);
                    
                    // Auto-switch file type based on extension for all files
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
            // Remove the panel completely for all files (including default ones)
            panel.remove();
        }
        
        // Remove from files array and clear corresponding editor references
        this.state.files = this.state.files.filter(f => f.id !== fileId);
        
        // Clear references to default editors if they're being removed
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
        // All files with data-file-id should have visible delete buttons
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
            
            // Add existing panels to the files array if they have file IDs and aren't already tracked
            if (fileId && !this.state.files.find(f => f.id === fileId)) {
                let editor = null;
                
                // Map to the correct editor instance
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

    generatePreviewContent() {
        if (this.state.mode === 'single') {
            const singleFileContent = this.state.editors.singleFile ? this.state.editors.singleFile.getValue() : '';
            
            // Inject console capture script into single-file mode content
            const captureScript = this.console.getCaptureScript();
            
            // Look for the closing </head> tag and inject the script before it
            if (singleFileContent.includes('</head>')) {
                return singleFileContent.replace('</head>', captureScript + '\n</head>');
            } else {
                // If no </head> tag found, wrap the content with full HTML structure including console capture
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
        }
        
        let html = '';
        let css = '';
        let jsFiles = [];
        let moduleFiles = [];
        
        // Separate regular JS files and module files
        this.state.files.forEach(file => {
            const content = file.editor.getValue();
            if (file.type === 'html') {
                let htmlContent = content;
                
                // Extract only the body content from HTML files in multi-file mode
                // Look for the content between <body> and </body> tags (case insensitive)
                const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                if (bodyMatch) {
                    htmlContent = bodyMatch[1]; // Get just the body content
                } else {
                    // If no body tags found, check if this is a complete HTML document
                    // and try to extract content after the opening <body> tag
                    const bodyStartMatch = htmlContent.match(/<body[^>]*>([\s\S]*)/i);
                    if (bodyStartMatch) {
                        htmlContent = bodyStartMatch[1];
                        // Remove any trailing </body> and </html> tags
                        htmlContent = htmlContent.replace(/<\/body>\s*<\/html>\s*$/i, '');
                    }
                }
                
                // Always remove script/link tags that reference external files since we inline them
                htmlContent = htmlContent.replace(/<script[^>]*src\s*=\s*['"][^'"]*\.js['"][^>]*><\/script>/gi, '');
                htmlContent = htmlContent.replace(/<script[^>]*src\s*=\s*['"][^'"]*\.mjs['"][^>]*><\/script>/gi, '');
                htmlContent = htmlContent.replace(/<link[^>]*rel\s*=\s*['"]stylesheet['"][^>]*>/gi, '');
                
                html += '\n' + htmlContent;
            } else if (file.type === 'css') {
                css += '\n' + content;
            } else if (file.type === 'javascript') {
                jsFiles.push({
                    content: content,
                    filename: this.getFileNameFromPanel(file.id) || 'script.js'
                });
            } else if (file.type === 'javascript-module') {
                moduleFiles.push({
                    content: content,
                    filename: this.getFileNameFromPanel(file.id) || 'module.mjs'
                });
            }
        });

        // Create script tags
        let scriptTags = '';
        
        // Handle ES modules by combining them into a single module context
        if (moduleFiles.length > 0) {
            let combinedModuleContent = '// Combined ES Module\n';
            let globalFunctions = []; // Track functions to make globally available
            
            // Process each module to remove import/export statements and inline the code
            moduleFiles.forEach((file, index) => {
                let processedContent = file.content;
                
                // Remove import statements but preserve side-effect imports and dynamic imports
                // Remove named imports: import { name } from 'module'
                processedContent = processedContent.replace(/import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
                // Remove namespace imports: import * as name from 'module'
                processedContent = processedContent.replace(/import\s+\*\s+as\s+\w+\s+from\s*['"][^'"]+['"];?\s*\n?/g, '');
                // Remove default imports: import name from 'module'
                processedContent = processedContent.replace(/import\s+\w+\s+from\s*['"][^'"]+['"];?\s*\n?/g, '');
                // Keep side-effect imports: import 'module' - these should remain as they load external scripts
                // Keep dynamic imports: await import() - these should remain as they're runtime imports
                
                // Extract exported function names and convert exports to regular declarations
                processedContent = processedContent.replace(/export\s+function\s+(\w+)/g, (match, funcName) => {
                    globalFunctions.push(funcName);
                    return `function ${funcName}`;
                });
                processedContent = processedContent.replace(/export\s+const\s+(\w+)\s*=/g, 'const $1 =');
                processedContent = processedContent.replace(/export\s+let\s+(\w+)\s*=/g, 'let $1 =');
                processedContent = processedContent.replace(/export\s+var\s+(\w+)\s*=/g, 'var $1 =');
                processedContent = processedContent.replace(/export\s+\{[^}]+\};?\s*\n?/g, '');
                processedContent = processedContent.replace(/export\s+default\s+/g, '');
                
                // Also capture regular function declarations to make them globally available
                const functionMatches = processedContent.match(/function\s+(\w+)\s*\(/g);
                if (functionMatches) {
                    functionMatches.forEach(match => {
                        const funcName = match.match(/function\s+(\w+)\s*\(/)[1];
                        if (!globalFunctions.includes(funcName)) {
                            globalFunctions.push(funcName);
                        }
                    });
                }
                
                combinedModuleContent += `\n// === ${file.filename} ===\n${processedContent}\n`;
            });
            
            // Make functions globally available for inline event handlers
            if (globalFunctions.length > 0) {
                combinedModuleContent += `\n// Make functions globally available\n`;
                globalFunctions.forEach(funcName => {
                    combinedModuleContent += `if (typeof ${funcName} !== 'undefined') { window.${funcName} = ${funcName}; }\n`;
                });
            }
            
            if (combinedModuleContent.trim() !== '// Combined ES Module') {
                scriptTags += '<script type="module">\n' +
                    '    try {\n' +
                    '        ' + combinedModuleContent + '\n' +
                    '    } catch (err) {\n' +
                    '        console.error(\'Error in combined module:\', err);\n' +
                    '    }\n' +
                    '</script>\n';
            }
        }
        
        // Add regular JavaScript files
        if (jsFiles.length > 0) {
            const regularJS = jsFiles.map(file => {
                return `
                    // === ${file.filename} ===
                    try {
                        ${file.content}
                    } catch (err) {
                        console.error('Error in ${file.filename}:', err);
                    }
                `;
            }).join('\n');
            
            if (regularJS.trim()) {
                scriptTags += '<script>' + regularJS + '</script>\n';
            }
        }

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
            '    ' + scriptTags + '\n' +
            '</body>\n' +
            '</html>';
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
            
            // Sanitize and format the message content
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
