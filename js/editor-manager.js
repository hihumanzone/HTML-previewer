/**
 * Editor Manager
 * Handles initialization and management of CodeMirror editors
 */

import { getCodeMirrorMode } from './file-type-utils.js';

/**
 * Default content for new editors
 */
const DEFAULT_CONTENT = {
    html: `<h1>Hello, World!</h1>\n<p>This is a test of the code previewer.</p>\n<button onclick="testFunction()">Run JS</button>`,
    css: `body { \n  font-family: sans-serif; \n  padding: 2rem;\n  color: #333;\n}\nbutton {\n  padding: 8px 16px;\n  border-radius: 4px;\n  cursor: pointer;\n}`,
    js: `console.log("Preview initialized.");\n\nfunction testFunction() {\n  console.log("Button was clicked!");\n  try {\n    undefinedFunction();\n  } catch(e) {\n    console.error("Caught an error:", e.message);\n  }\n}`
};

/**
 * Create CodeMirror editor configuration
 * @param {string} mode - CodeMirror mode
 * @returns {Object} Editor configuration
 */
function createEditorConfig(mode) {
    return {
        lineNumbers: true,
        mode: mode,
        theme: 'dracula',
        autoCloseTags: mode === 'htmlmixed',
        lineWrapping: true,
    };
}

/**
 * Create a mock editor for fallback when CodeMirror is not available
 * @param {HTMLTextAreaElement} textarea - Textarea element
 * @returns {Object|null} Mock editor object
 */
function createMockEditor(textarea) {
    if (!textarea) return null;
    
    Object.assign(textarea.style, {
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.5',
        resize: 'none',
        border: 'none',
        outline: 'none',
        background: '#282a36',
        color: '#f8f8f2',
        padding: '1rem',
        width: '100%',
        height: '400px'
    });
    
    return {
        setValue: (value) => textarea.value = value,
        getValue: () => textarea.value,
        refresh: () => {},
    };
}

/**
 * Initialize editors for the application
 * @param {Object} dom - DOM elements
 * @returns {Object} Editor instances
 */
export function initEditors(dom) {
    const editors = {
        html: null,
        css: null,
        js: null,
    };

    if (typeof window.CodeMirror === 'undefined') {
        console.warn('CodeMirror not available, using fallback textarea editors');
        editors.html = createMockEditor(dom.htmlEditor);
        editors.css = createMockEditor(dom.cssEditor);
        editors.js = createMockEditor(dom.jsEditor);
    } else {
        if (dom.htmlEditor) {
            editors.html = window.CodeMirror.fromTextArea(dom.htmlEditor, createEditorConfig('htmlmixed'));
        }
        if (dom.cssEditor) {
            editors.css = window.CodeMirror.fromTextArea(dom.cssEditor, createEditorConfig('css'));
        }
        if (dom.jsEditor) {
            editors.js = window.CodeMirror.fromTextArea(dom.jsEditor, createEditorConfig('javascript'));
        }
    }

    setDefaultContent(editors);
    return editors;
}

/**
 * Set default content in editors
 * @param {Object} editors - Editor instances
 */
function setDefaultContent(editors) {
    if (editors.html) {
        editors.html.setValue(DEFAULT_CONTENT.html);
    }
    if (editors.css) {
        editors.css.setValue(DEFAULT_CONTENT.css);
    }
    if (editors.js) {
        editors.js.setValue(DEFAULT_CONTENT.js);
    }
}

/**
 * Create editor for a specific file type
 * @param {HTMLTextAreaElement} textarea - Textarea element
 * @param {string} fileType - File type
 * @param {boolean} isBinary - Whether file is binary
 * @returns {Object} Editor instance
 */
export function createEditorForTextarea(textarea, fileType, isBinary = false) {
    if (!textarea) return null;
    
    if (isBinary) {
        return createMockEditor(textarea);
    }
    
    const mode = getCodeMirrorMode(fileType);
    
    if (typeof window.CodeMirror !== 'undefined') {
        return window.CodeMirror.fromTextArea(textarea, createEditorConfig(mode));
    }
    
    return createMockEditor(textarea);
}

/**
 * Refresh all editors
 * @param {Object} editors - Editor instances
 */
export function refreshEditors(editors) {
    setTimeout(() => {
        Object.values(editors).forEach(editor => {
            if (editor && editor.refresh) editor.refresh();
        });
    }, 100);
}
