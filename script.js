/**
 * CodePreviewer
 * A self-contained module for a multi-panel HTML/CSS/JS code editor and previewer.
 */

const CodePreviewer = {
    // Application state
    state: {
        editors: {
            html: null,
            css: null,
            js: null,
        },
    },

    // Cached DOM elements
    dom: {},

    // Application constants
    constants: {
        EDITOR_IDS: {
            HTML: 'html-editor',
            CSS: 'css-editor',
            JS: 'js-editor',
        },
        CONTROL_IDS: {
            MODAL_BTN: 'preview-modal-btn',
            TAB_BTN: 'preview-tab-btn',
            CLEAR_CONSOLE_BTN: 'clear-console-btn',
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
        this.console.init(this.dom.consoleOutput, this.dom.clearConsoleBtn, this.dom.previewFrame);
    },

    /**
     * Queries and caches all necessary DOM elements for performance.
     */
    cacheDOMElements() {
        const { EDITOR_IDS, CONTROL_IDS, MODAL_IDS, CONSOLE_ID } = this.constants;
        this.dom = {
            htmlEditor: document.getElementById(EDITOR_IDS.HTML),
            cssEditor: document.getElementById(EDITOR_IDS.CSS),
            jsEditor: document.getElementById(EDITOR_IDS.JS),
            modalBtn: document.getElementById(CONTROL_IDS.MODAL_BTN),
            tabBtn: document.getElementById(CONTROL_IDS.TAB_BTN),
            clearConsoleBtn: document.getElementById(CONTROL_IDS.CLEAR_CONSOLE_BTN),
            modalOverlay: document.getElementById(MODAL_IDS.OVERLAY),
            previewFrame: document.getElementById(MODAL_IDS.FRAME),
            closeModalBtn: document.querySelector(MODAL_IDS.CLOSE_BTN),
            consoleOutput: document.getElementById(CONSOLE_ID),
        };
    },

    /**
     * Initializes CodeMirror instances for each panel.
     */
    initEditors() {
        const editorConfig = (mode) => ({
            lineNumbers: true,
            mode: mode,
            theme: 'dracula',
            autoCloseTags: mode === 'htmlmixed',
            lineWrapping: true,
        });

        this.state.editors.html = CodeMirror.fromTextArea(this.dom.htmlEditor, editorConfig('htmlmixed'));
        this.state.editors.css = CodeMirror.fromTextArea(this.dom.cssEditor, editorConfig('css'));
        this.state.editors.js = CodeMirror.fromTextArea(this.dom.jsEditor, editorConfig('javascript'));

        this.setDefaultContent();
    },
    
    /**
     * Sets initial content for the editors to provide a demo.
     */
    setDefaultContent() {
        const initialHTML = `<h1>Hello, World!</h1>\n<p>This is a test of the live previewer.</p>\n<button onclick="testFunction()">Run JS</button>`;
        const initialCSS = `body { \n  font-family: sans-serif; \n  padding: 2rem;\n  color: #333;\n}\nbutton {\n  padding: 8px 16px;\n  border-radius: 4px;\n  cursor: pointer;\n}`;
        const initialJS = `console.log("Preview initialized.");\n\nfunction testFunction() {\n  console.log("Button was clicked!");\n  // This will throw an error to test the console\n  try {\n    undefinedFunction();\n  } catch(e) {\n    console.error("Caught an error:", e.message);\n  }\n}`;
        
        this.state.editors.html.setValue(initialHTML);
        this.state.editors.css.setValue(initialCSS);
        this.state.editors.js.setValue(initialJS);
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
    },

    /**
     * Generates the complete HTML document for preview.
     * @returns {string} The full HTML string.
     */
    generatePreviewContent() {
        const html = this.state.editors.html.getValue();
        const css = this.state.editors.css.getValue();
        const js = this.state.editors.js.getValue();

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
