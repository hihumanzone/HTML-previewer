/**
 * Editor Manager
 * Handles initialization and management of CodeMirror editors
 */

import { getCodeMirrorMode } from './file-type-utils.js';

/**
 * Default content for new editors
 */
const DEFAULT_CONTENT = {
    html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Hello Site</title>\n  <link rel="stylesheet" href="styles.css" />\n</head>\n<body>\n\n  <h1>Hello World</h1>\n\n  <main id="content">Loading content...</main>\n\n  <button id="logBtn">Test Console Logs</button>\n\n  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>\n  <script src="script.js" defer></script>\n</body>\n</html>`,
    css: `body {\n  font-family: system-ui, sans-serif;\n  margin: 2rem;\n  background: #f5f5f5;\n}\n\nh1 {\n  margin-bottom: 1rem;\n}\n\n#content {\n  background: #fff;\n  padding: 1rem;\n  border-radius: 6px;\n  margin-bottom: 1rem;\n}\n\nbutton {\n  padding: 0.6rem 1rem;\n  border: none;\n  border-radius: 4px;\n  background: #222;\n  color: white;\n  cursor: pointer;\n}\n\nbutton:hover {\n  opacity: 0.85;\n}`,
    js: `const contentEl = document.getElementById("content");\nconst logBtn = document.getElementById("logBtn");\n\n// Load markdown\nasync function loadMarkdown() {\n  try {\n    const res = await fetch("content.md");\n    const text = await res.text();\n    contentEl.innerHTML = marked.parse(text);\n  } catch (err) {\n    console.error("Failed to load markdown:", err);\n    contentEl.textContent = "Error loading content.";\n  }\n}\n\n// Console logging test\nfunction testLogs() {\n  console.log("Normal log");\n  console.info("Info log");\n  console.warn("Warning log");\n  console.error("Error log");\n}\n\nlogBtn.addEventListener("click", testLogs);\nloadMarkdown();`
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
