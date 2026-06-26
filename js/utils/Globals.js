/**
 * HTML Code Previewer
 * 
 * Main application object containing all functionality for the HTML/CSS/JS previewer.
 * 
 * STRUCTURE:
 * - state: Application state (editors, files, mode, panel/order state)
 * - dom: Cached DOM elements
 * - constants: Configuration constants (IDs, file types, MIME types)
 * - fileTypeUtils: File type detection and handling utilities
 * - fileSystemUtils: Virtual file system runtime operations (path resolution, file lookup, data URLs)
 * - previewScriptGenerator: Code-generation utilities — produces JS strings injected into the preview iframe
 * - init(): Application initialization
 * - Editor Management: initEditors(), createEditorForTextarea(), etc.
 * - File Management: addNewFile(), importFile(), exportFile(), etc.
 * - Preview Management: renderPreview(), toggleModal(), etc.
 * - UI Management: eventManager.bindAll(), switchMode(), etc.
 * - htmlGenerators: HTML generation utilities
 * - notificationSystem: Toast notifications
 * - assetReplacers: Asset path replacement for multi-file projects
 * - consoleBridge: Console capture and logging
 * 
 */
const SVG_ICONS = {
    // UI Action Icons
    settings: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/><circle cx="5" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="8" r="1.5" fill="currentColor"/><circle cx="7" cy="12" r="1.5" fill="currentColor"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10l-1 10H4L3 4z"/><path d="M1 4h14"/><path d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4"/><line x1="6.5" y1="7" x2="6.5" y2="11"/><line x1="9.5" y1="7" x2="9.5" y2="11"/></svg>',
    package: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1L14 4v8l-6 3L2 12V4l6-3z"/><path d="M8 8v7"/><path d="M2 4l6 4 6-4"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v8h-13v-10z"/></svg>',
    folderOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v2"/><path d="M1.5 13.5l2-6h12l-2 6h-12z"/><line x1="1.5" y1="3.5" x2="1.5" y2="13.5"/></svg>',
    folderTabs: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v8h-13v-10z"/><path d="M5 3.5V1.5h4v2"/></svg>',
    clipboard: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2.5" width="10" height="12" rx="1"/><path d="M5.5 2.5V2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v.5"/><line x1="5.5" y1="7" x2="10.5" y2="7"/><line x1="5.5" y1="9.5" x2="10.5" y2="9.5"/><line x1="5.5" y1="12" x2="8.5" y2="12"/></svg>',
    document: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14.5" y2="14.5"/></svg>',
    format: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="3.5" x2="10" y2="3.5"/><line x1="4.5" y1="7" x2="13.5" y2="7"/><line x1="4.5" y1="10.5" x2="11.5" y2="10.5"/><line x1="2" y1="10.5" x2="2" y2="13.5"/><path d="M13 9.5C13.25 10.75 13.75 11.25 15 11.5C13.75 11.75 13.25 12.25 13 13.5C12.75 12.25 12.25 11.75 11 11.5C12.25 11.25 12.75 10.75 13 9.5Z" fill="currentColor" stroke="none"/></svg>',
    expand: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="10,2 14,2 14,6"/><polyline points="6,14 2,14 2,10"/><line x1="14" y1="2" x2="9.5" y2="6.5"/><line x1="2" y1="14" x2="6.5" y2="9.5"/></svg>',
    save: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5h9.5L14 4v10.5H2V1.5z"/><rect x="4.5" y="1.5" width="5" height="4"/><rect x="4.5" y="9.5" width="7" height="5"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>',
    dock: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2" width="13" height="12" rx="1"/><line x1="10" y1="2" x2="10" y2="14"/></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3v4H9"/><path d="M3 13v-4h4"/><path d="M4.1 6.1A5 5 0 0 1 13 7"/><path d="M11.9 9.9A5 5 0 0 1 3 9"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>',
    pencil: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z"/></svg>',
    move: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="8" x2="14" y2="8"/><polyline points="10,4 14,8 10,12"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8.5 6.5,12 13,4"/></svg>',
    checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><polyline points="5,8.5 7,10.5 11,5.5"/></svg>',
    xCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><line x1="5.5" y1="5.5" x2="10.5" y2="10.5"/><line x1="10.5" y1="5.5" x2="5.5" y2="10.5"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><line x1="8" y1="7.5" x2="8" y2="11.5"/><circle cx="8" cy="5" r="0.75" fill="currentColor" stroke="none"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5L1 14h14L8 1.5z"/><line x1="8" y1="6" x2="8" y2="10"/><circle cx="8" cy="12" r="0.75" fill="currentColor" stroke="none"/></svg>',
    folderPlus: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v8h-13v-10z"/><line x1="8" y1="7.5" x2="8" y2="11.5"/><line x1="6" y1="9.5" x2="10" y2="9.5"/></svg>',
    folderMinus: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v8h-13v-10z"/><line x1="6" y1="9.5" x2="10" y2="9.5"/></svg>',
    // File Type Icons
    fileHtml: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="3" ry="6.5"/><path d="M1.5 8h13"/></svg>',
    fileCss: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 14l-1-4 3-2-3-2 1-4"/><circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="12"/><path d="M10 12a2 2 0 1 0 4 0"/></svg>',
    fileJs: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,4 1.5,8 4,12"/><polyline points="12,4 14.5,8 12,12"/></svg>',
    fileJson: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2c-2 0-2 2-2 3v1.5c0 1-1 1.5-1.5 1.5 .5 0 1.5.5 1.5 1.5V11c0 1 0 3 2 3"/><path d="M11 2c2 0 2 2 2 3v1.5c0 1 1 1.5 1.5 1.5-.5 0-1.5.5-1.5 1.5V11c0 1 0 3-2 3"/></svg>',
    fileXml: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/><polyline points="6,9 5,11 6,13"/><polyline points="10,9 11,11 10,13"/></svg>',
    fileMarkdown: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/><path d="M6.5 9v4h1v-2.5L9 12l1.5-1.5V13h1V9"/></svg>',
    fileText: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/><line x1="6" y1="8" x2="11" y2="8"/><line x1="6" y1="10.5" x2="11" y2="10.5"/><line x1="6" y1="13" x2="9" y2="13"/></svg>',
    fileImage: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2" width="13" height="12" rx="1"/><circle cx="5" cy="5.5" r="1.5"/><path d="M1.5 12l4-4 3 3 2-2 4 4"/></svg>',
    fileAudio: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6v4h3l4 3V3L5 6H2z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5"/><path d="M12.5 3.5a6 6 0 0 1 0 9"/></svg>',
    fileVideo: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="3" width="13" height="10" rx="1"/><path d="M6 6.5v3l3-1.5-3-1.5z"/></svg>',
    fileFont: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14l4-12 4 12"/><line x1="5.5" y1="10" x2="10.5" y2="10"/><line x1="3" y1="14" x2="5" y2="14"/><line x1="11" y1="14" x2="13" y2="14"/></svg>',
    filePdf: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/><path d="M6 9h1.5a1.25 1.25 0 0 0 0-2.5H6v6"/></svg>',
    fileBinary: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1L14 4v8l-6 3L2 12V4l6-3z"/><path d="M8 8v7"/><path d="M2 4l6 4 6-4"/></svg>',
};

// ============================================================================
// STANDALONE UTILITY FUNCTIONS
// Pure functions with no dependency on CodePreviewer instance.
// ============================================================================

const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const base64ToUint8Array = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const formatFileSize = (bytes) => {
    const normalized = Number.isFinite(bytes) && bytes >= 0 ? bytes : 0;
    if (normalized < 1024) return `${normalized} B`;
    const units = ['KB', 'MB', 'GB'];
    let size = normalized;
    let unitIndex = -1;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    const roundedSize = size >= 10 ? Math.round(size) : Math.round(size * 10) / 10;
    return `${roundedSize} ${units[unitIndex]}`;
};

const getLineCount = (content) => {
    return content.length === 0 ? 1 : content.split(/\r\n|\r|\n/).length;
};

function createMockEditor(textarea, fontSize) {
    if (!textarea) return null;
    Object.assign(textarea.style, {
        fontFamily: 'monospace', fontSize: `${fontSize}px`, lineHeight: '1.5',
        resize: 'none', border: 'none', outline: 'none',
        background: '#282a36', color: '#f8f8f2', padding: '1rem',
        width: '100%', height: '400px'
    });
    return {
        setValue: (value) => { textarea.value = value; },
        getValue: () => textarea.value,
        refresh: () => {},
        setOption: () => {},
        on: (eventName, handler) => {
            if (eventName !== 'change' || !handler) return;
            if (textarea.__changeListener) {
                textarea.removeEventListener('input', textarea.__changeListener);
            }
            textarea.__changeListener = () => handler(null, { origin: '+input' });
            textarea.addEventListener('input', textarea.__changeListener);
        },
    };
}

function findNextMatch(content, query, startIndex) {
    if (!content || !query) return -1;
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let matchIndex = lowerContent.indexOf(lowerQuery, startIndex);
    if (matchIndex === -1 && startIndex > 0) {
        matchIndex = lowerContent.indexOf(lowerQuery);
    }
    return matchIndex;
}

/**
 * Recursively freezes an object and all its nested objects.
 * @param {Object} obj - The object to deep-freeze
 * @returns {Object} The frozen object
 */
const deepFreeze = (obj) => {
    Object.freeze(obj);
    Object.values(obj).forEach(val => {
        if (val && typeof val === 'object' && !Object.isFrozen(val)) {
            deepFreeze(val);
        }
    });
    return obj;
};


/**
 * Handles preview rendering concerns such as debouncing and runtime fallback UI.
 */