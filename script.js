/**
 * CodePreviewer
 * A self-contained module for a multi-panel HTML/CSS/JS code editor and previewer.
 */

const CodePreviewer = {
    // Application state
    state: {
        mode: 'multi', // 'single' or 'multi'
        editors: {
            html: null,
            css: null,
            js: null,
            singleFile: null,
        },
        files: [], // For multi-file mode dynamic files
        nextFileId: 4, // Start from 4 since we have 3 default files
    },

    // Cached DOM elements
    dom: {},

    // Application constants
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

    /**
     * Initializes the application.
     */
    init() {
        this.cacheDOMElements();
        this.initEditors();
        this.bindEvents();
        this.initModeToggle();
        this.initExistingFilePanels();
        this.console.init(this.dom.consoleOutput, this.dom.clearConsoleBtn, this.dom.previewFrame);
    },

    /**
     * Queries and caches all necessary DOM elements for performance.
     */
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

    /**
     * Initializes CodeMirror instances for each panel.
     */
    initEditors() {
        // Check if CodeMirror is available
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

        // Initialize default editors
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

    /**
     * Fallback editor initialization when CodeMirror is not available.
     */
    initFallbackEditors() {
        // Create mock editors that work with regular textareas
        const createMockEditor = (textarea) => {
            if (!textarea) return null;
            
            // Style the textarea to look better
            textarea.style.fontFamily = 'monospace';
            textarea.style.fontSize = '14px';
            textarea.style.lineHeight = '1.5';
            textarea.style.resize = 'none';
            textarea.style.border = 'none';
            textarea.style.outline = 'none';
            textarea.style.background = '#282a36';
            textarea.style.color = '#f8f8f2';
            textarea.style.padding = '1rem';
            textarea.style.width = '100%';
            textarea.style.height = '400px';
            
            return {
                setValue: (value) => textarea.value = value,
                getValue: () => textarea.value,
                refresh: () => {}, // No-op for mock
            };
        };

        this.state.editors.html = createMockEditor(this.dom.htmlEditor);
        this.state.editors.css = createMockEditor(this.dom.cssEditor);
        this.state.editors.js = createMockEditor(this.dom.jsEditor);
        this.state.editors.singleFile = createMockEditor(this.dom.singleFileEditor);

        this.setDefaultContent();
    },
    
    /**
     * Sets initial content for the editors to provide a demo.
     */
    setDefaultContent() {
        const initialHTML = `<h1>Hello, World!</h1>\n<p>This is a test of the live previewer.</p>\n<button onclick="testFunction()">Run JS</button>`;
        const initialCSS = `body { \n  font-family: sans-serif; \n  padding: 2rem;\n  color: #333;\n}\nbutton {\n  padding: 8px 16px;\n  border-radius: 4px;\n  cursor: pointer;\n}`;
        const initialJS = `console.log("Preview initialized.");\n\nfunction testFunction() {\n  console.log("Button was clicked!");\n  // This will throw an error to test the console\n  try {\n    undefinedFunction();\n  } catch(e) {\n    console.error("Caught an error:", e.message);\n  }\n}`;
        
        // Set content for multi-file mode
        if (this.state.editors.html) {
            this.state.editors.html.setValue(initialHTML);
        }
        if (this.state.editors.css) {
            this.state.editors.css.setValue(initialCSS);
        }
        if (this.state.editors.js) {
            this.state.editors.js.setValue(initialJS);
        }

        // Set content for single-file mode
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

    /**
     * Binds all application event listeners.
     */
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

        // Mode switching events
        this.dom.singleModeRadio.addEventListener('change', () => this.switchMode('single'));
        this.dom.multiModeRadio.addEventListener('change', () => this.switchMode('multi'));
        
        // Add file button
        this.dom.addFileBtn.addEventListener('click', () => this.addNewFile());
    },

    /**
     * Initializes mode toggle functionality.
     */
    initModeToggle() {
        // Set initial mode based on radio button
        if (this.dom.multiModeRadio.checked) {
            this.switchMode('multi');
        } else if (this.dom.singleModeRadio.checked) {
            this.switchMode('single');
        }
    },

    /**
     * Switches between single-file and multi-file modes.
     * @param {string} mode - 'single' or 'multi'
     */
    switchMode(mode) {
        this.state.mode = mode;
        
        if (mode === 'single') {
            this.dom.singleFileContainer.style.display = 'flex';
            this.dom.multiFileContainer.style.display = 'none';
        } else {
            this.dom.singleFileContainer.style.display = 'none';
            this.dom.multiFileContainer.style.display = 'flex';
        }

        // Refresh CodeMirror instances when switching modes
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

    /**
     * Adds a new file to the multi-file editor.
     */
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
                    </select>
                    <button class="remove-file-btn" aria-label="Remove file">&times;</button>
                </div>
                <label for="${fileId}" class="sr-only">Code Editor</label>
                <textarea id="${fileId}"></textarea>
            </div>
        `;
        
        this.dom.editorGrid.insertAdjacentHTML('beforeend', panelHTML);
        
        // Initialize editor for the new textarea
        const newTextarea = document.getElementById(fileId);
        let newEditor;
        
        if (typeof CodeMirror !== 'undefined') {
            // Use CodeMirror if available
            newEditor = CodeMirror.fromTextArea(newTextarea, {
                lineNumbers: true,
                mode: 'htmlmixed',
                theme: 'dracula',
                autoCloseTags: true,
                lineWrapping: true,
            });
        } else {
            // Use fallback mock editor
            newTextarea.style.fontFamily = 'monospace';
            newTextarea.style.fontSize = '14px';
            newTextarea.style.lineHeight = '1.5';
            newTextarea.style.resize = 'none';
            newTextarea.style.border = 'none';
            newTextarea.style.outline = 'none';
            newTextarea.style.background = '#282a36';
            newTextarea.style.color = '#f8f8f2';
            newTextarea.style.padding = '1rem';
            newTextarea.style.width = '100%';
            newTextarea.style.height = '400px';
            
            newEditor = {
                setValue: (value) => newTextarea.value = value,
                getValue: () => newTextarea.value,
                refresh: () => {},
                setOption: () => {}, // No-op for mock
            };
        }
        
        // Store reference to the editor
        this.state.files.push({
            id: fileId,
            editor: newEditor,
            type: 'html'
        });
        
        // Bind events for the new panel
        this.bindFilePanelEvents(document.querySelector(`[data-file-id="${fileId}"]`));
        
        // Show remove buttons for all files if more than 3
        this.updateRemoveButtonsVisibility();
    },

    /**
     * Binds events for a file panel (file type change, remove, etc.).
     * @param {HTMLElement} panel - The panel element
     */
    bindFilePanelEvents(panel) {
        const typeSelector = panel.querySelector('.file-type-selector');
        const removeBtn = panel.querySelector('.remove-file-btn');
        const fileId = panel.dataset.fileId;
        
        if (typeSelector) {
            typeSelector.addEventListener('change', (e) => {
                const newType = e.target.value;
                panel.dataset.fileType = newType;
                
                // Update CodeMirror mode
                const fileInfo = this.state.files.find(f => f.id === fileId);
                if (fileInfo) {
                    fileInfo.type = newType;
                    if (typeof CodeMirror !== 'undefined' && fileInfo.editor.setOption) {
                        const mode = newType === 'html' ? 'htmlmixed' : newType === 'css' ? 'css' : 'javascript';
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
    },

    /**
     * Removes a file from the multi-file editor.
     * @param {string} fileId - The ID of the file to remove
     */
    removeFile(fileId) {
        const panel = document.querySelector(`[data-file-id="${fileId}"]`);
        if (panel) {
            panel.remove();
        }
        
        // Remove from state
        this.state.files = this.state.files.filter(f => f.id !== fileId);
        
        this.updateRemoveButtonsVisibility();
    },

    /**
     * Updates visibility of remove buttons based on file count.
     */
    updateRemoveButtonsVisibility() {
        const allPanels = document.querySelectorAll('.editor-panel');
        const showRemoveButtons = allPanels.length > 3;
        
        allPanels.forEach(panel => {
            const removeBtn = panel.querySelector('.remove-file-btn');
            if (removeBtn) {
                removeBtn.style.display = showRemoveButtons ? 'block' : 'none';
            }
        });
    },

    /**
     * Initializes events for existing file panels.
     */
    initExistingFilePanels() {
        const existingPanels = document.querySelectorAll('.editor-panel[data-file-type]');
        existingPanels.forEach(panel => {
            this.bindFilePanelEvents(panel);
        });
        this.updateRemoveButtonsVisibility();
    },

    /**
     * Generates the complete HTML document for preview.
     * @returns {string} The full HTML string.
     */
    generatePreviewContent() {
        if (this.state.mode === 'single') {
            // In single-file mode, return the content as-is
            return this.state.editors.singleFile ? this.state.editors.singleFile.getValue() : '';
        }
        
        // Multi-file mode - collect HTML, CSS, and JavaScript from all files
        let html = '';
        let css = '';
        let js = '';
        
        // Get content from default editors
        if (this.state.editors.html) {
            html += this.state.editors.html.getValue();
        }
        if (this.state.editors.css) {
            css += this.state.editors.css.getValue();
        }
        if (this.state.editors.js) {
            js += this.state.editors.js.getValue();
        }
        
        // Get content from dynamic files
        this.state.files.forEach(file => {
            const content = file.editor.getValue();
            if (file.type === 'html') {
                html += '\n' + content;
            } else if (file.type === 'css') {
                css += '\n' + content;
            } else if (file.type === 'javascript') {
                js += '\n' + content;
            }
        });

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Live Preview</title>
                ${this.console.getCaptureScript()}
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>
                    // Wrap user code in a try-catch block to handle syntax errors gracefully
                    try {
                        ${js}
                    } catch (err) {
                        console.error(err);
                    }
                </script>
            </body>
            </html>
        `;
    },

    /**
     * Renders the preview in the specified target.
     * @param {'modal' | 'tab'} target - The destination for the preview.
     */
    renderPreview(target) {
        const content = this.generatePreviewContent();
        
        if (target === 'modal') {
            this.console.clear();
            // Use srcdoc for security and efficiency in iframes
            this.dom.previewFrame.srcdoc = content;
            this.toggleModal(true);
        } else if (target === 'tab') {
            try {
                const blob = new Blob([content], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                // The browser will automatically revoke the URL when the tab is closed.
            } catch (e) {
                console.error("Failed to create or open new tab:", e);
            }
        }
    },

    /**
     * Shows or hides the preview modal with accessibility considerations.
     * @param {boolean} show - True to show, false to hide.
     */
    toggleModal(show) {
        this.dom.modalOverlay.setAttribute('aria-hidden', !show);
    },

    /**
     * Console-related functionalities.
     */
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
            // Auto-scroll to the bottom
            this.outputEl.scrollTop = this.outputEl.scrollHeight;
        },
        handleMessage(event) {
            // Security: Ensure the message is from our preview iframe and has the correct type
            const { CONSOLE_MESSAGE_TYPE } = CodePreviewer.constants;
            if (event.source === this.previewFrame.contentWindow && event.data.type === CONSOLE_MESSAGE_TYPE) {
                this.log(event.data);
            }
        },
        /**
         * Returns the script to be injected into the iframe to capture console logs and errors.
         * @returns {string} The script tag as a string.
         */
        getCaptureScript() {
            const MESSAGE_TYPE = CodePreviewer.constants.CONSOLE_MESSAGE_TYPE;
            return `
            <script>
                (function() {
                    const postLog = (level, args) => {
                        const formattedArgs = args.map(arg => {
                            if (arg instanceof Error) return { message: arg.message, stack: arg.stack };
                            try { return JSON.parse(JSON.stringify(arg)); } catch (e) { return 'Unserializable Object'; }
                        });
                        window.parent.postMessage({ type: '${MESSAGE_TYPE}', level, message: formattedArgs }, '*');
                    };
                    const originalConsole = { ...window.console };
                    ['log', 'warn', 'error'].forEach(level => {
                        window.console[level] = (...args) => {
                            postLog(level, Array.from(args));
                            originalConsole[level](...args);
                        };
                    });
                    window.onerror = (message, source, lineno, colno, error) => {
                        postLog('error', [message, 'at ' + source.split('/').pop() + ':' + lineno + ':' + colno]);
                        return true;
                    };
                    window.addEventListener('unhandledrejection', e => {
                        postLog('error', ['Unhandled promise rejection:', e.reason]);
                    });
                })();
            <\/script>`;
        },
    },
};

// Start the application once the DOM is ready
document.addEventListener('DOMContentLoaded', () => CodePreviewer.init());
