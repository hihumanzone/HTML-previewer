/**
 * File System Utilities Module
 * 
 * Handles virtual file system operations, path resolution, and file lookup
 * for the multi-file preview system.
 * 
 * @module file-system-utils
 * 
 * @note This standalone module mirrors the embedded `fileSystemUtils` object in script.js.
 * The embedded version is the authoritative implementation used by the application.
 * This module is provided for:
 * - Future ES6 module migration
 * - Independent testing
 * - Documentation reference
 * 
 * When the embedded version differs (e.g., MIME type handling), the embedded version
 * delegates to the application's constants for consistency.
 */

/**
 * Resolves a relative path against a base path
 * Handles '..' for parent directory and '.' for current directory
 * 
 * @param {string} basePath - The base file path (e.g., 'src/components/Button.js')
 * @param {string} relativePath - The relative path to resolve (e.g., '../utils/helper.js')
 * @returns {string} The resolved absolute path (e.g., 'src/utils/helper.js')
 * 
 * @example
 * resolvePath('src/components/Button.js', '../utils/helper.js')
 * // Returns: 'src/utils/helper.js'
 * 
 * @example
 * resolvePath('index.html', './styles/main.css')
 * // Returns: 'styles/main.css'
 */
export function resolvePath(basePath, relativePath) {
    // Absolute paths start fresh (remove leading slash)
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
            // Go up one directory
            if (resultParts.length > 0) {
                resultParts.pop();
            }
        } else if (part !== '.' && part !== '') {
            // Add non-empty, non-current-directory parts
            resultParts.push(part);
        }
    }
    
    return resultParts.join('/');
}

/**
 * Finds a file in the virtual file system
 * Supports both exact matches and case-insensitive fallback
 * 
 * @param {Map<string, Object>} fileSystem - The virtual file system Map
 * @param {string} targetFilename - The filename to find
 * @param {string} [currentFilePath=''] - The current file context for relative path resolution
 * @returns {Object|null} The file data object or null if not found
 * 
 * @example
 * const fileSystem = new Map([['styles/main.css', { content: '...', type: 'css' }]]);
 * findFile(fileSystem, './main.css', 'styles/index.html')
 * // Returns: { content: '...', type: 'css' }
 */
export function findFile(fileSystem, targetFilename, currentFilePath = '') {
    // Resolve relative path if we have context
    if (currentFilePath) {
        targetFilename = resolvePath(currentFilePath, targetFilename);
    }
    
    // Try exact match first
    const exactMatch = fileSystem.get(targetFilename);
    if (exactMatch) {
        return exactMatch;
    }
    
    // Try case-insensitive match as fallback
    const targetLower = targetFilename.toLowerCase();
    for (const [filename, file] of fileSystem) {
        if (filename.toLowerCase() === targetLower) {
            return file;
        }
    }
    
    return null;
}

/**
 * Checks if a file type matches any of the allowed types
 * 
 * @param {string} fileType - The file type to check (e.g., 'image', 'css', 'javascript')
 * @param {string[]} allowedTypes - Array of allowed type strings
 * @returns {boolean} True if the file type matches any allowed type
 * 
 * @example
 * isMatchingType('image', ['image', 'svg'])
 * // Returns: true
 */
export function isMatchingType(fileType, allowedTypes) {
    return allowedTypes.includes(fileType);
}

/**
 * Gets a data URL for a file (handles both binary and text files)
 * 
 * @param {Object} fileData - The file data object with content, type, and isBinary properties
 * @param {string} [defaultMimeType='text/plain'] - Default MIME type for non-binary files
 * @returns {string} The data URL or original content for binary files
 * 
 * @example
 * getFileDataUrl({ content: '<svg>...</svg>', type: 'svg', isBinary: false })
 * // Returns: 'data:image/svg+xml;charset=utf-8,...'
 * 
 * @note When used with the full application, prefer using the embedded fileSystemUtils
 * in script.js which delegates to constants.js for MIME types. This standalone version
 * includes a fallback MIME type mapping for independent module usage.
 */
export function getFileDataUrl(fileData, defaultMimeType = 'text/plain') {
    // Binary files already have data URLs
    if (fileData.isBinary) {
        return fileData.content;
    }
    
    // Handle SVG specially
    if (fileData.type === 'svg') {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fileData.content)}`;
    }
    
    // Fallback MIME type mapping for standalone usage
    // When used with the full app, the embedded version delegates to constants.js
    const FALLBACK_MIME_TYPES = {
        'html': 'text/html',
        'css': 'text/css',
        'javascript': 'text/javascript',
        'javascript-module': 'text/javascript',
        'json': 'application/json',
        'xml': 'application/xml',
        'text': 'text/plain',
        'markdown': 'text/markdown'
    };
    
    const mimeType = FALLBACK_MIME_TYPES[fileData.type] || defaultMimeType;
    return `data:${mimeType};charset=utf-8,${encodeURIComponent(fileData.content)}`;
}

/**
 * Generates JavaScript code string for path resolution (for injection into iframes)
 * This is used in the capture script to enable runtime file resolution
 * 
 * @returns {string} JavaScript function code as a string
 */
export function generateResolvePathCode() {
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
}

/**
 * Generates JavaScript code string for file lookup (for injection into iframes)
 * 
 * @returns {string} JavaScript function code as a string
 */
export function generateFindFileCode() {
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
}

/**
 * Generates JavaScript code string for getting current file path (for injection into iframes)
 * 
 * @returns {string} JavaScript function code as a string
 */
export function generateGetCurrentFilePathCode() {
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

/**
 * Generates JavaScript code string for the fetch override (for injection into iframes)
 * Intercepts fetch requests to serve files from the virtual file system
 * 
 * @returns {string} JavaScript code as a string
 */
export function generateFetchOverrideCode() {
    return `
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        let url = input;
        if (typeof input === "object" && input.url) {
            url = input.url;
        }
        
        const currentFilePath = getCurrentFilePath();
        let targetPath = url.replace(/^\\.\\//,"");
        const fileData = findFileInSystem(targetPath, currentFilePath);
        
        if (fileData) {
            const response = {
                ok: true,
                status: 200,
                statusText: "OK",
                headers: new Headers({
                    "Content-Type": fileData.type === "json" ? "application/json" : 
                                   fileData.type === "html" ? "text/html" :
                                   fileData.type === "css" ? "text/css" :
                                   fileData.type === "javascript" ? "text/javascript" :
                                   fileData.type === "xml" ? "application/xml" :
                                   "text/plain"
                }),
                url: url,
                text: () => Promise.resolve(fileData.content),
                json: () => {
                    try {
                        return Promise.resolve(JSON.parse(fileData.content));
                    } catch (e) {
                        return Promise.reject(new Error("Invalid JSON"));
                    }
                },
                blob: () => {
                    if (fileData.isBinary && fileData.content.startsWith("data:")) {
                        const [header, base64] = fileData.content.split(",");
                        const mimeType = header.match(/data:([^;]+)/)[1];
                        const byteCharacters = atob(base64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        return Promise.resolve(new Blob([byteArray], { type: mimeType }));
                    } else {
                        return Promise.resolve(new Blob([fileData.content], { type: "text/plain" }));
                    }
                },
                arrayBuffer: () => {
                    if (fileData.isBinary && fileData.content.startsWith("data:")) {
                        const [header, base64] = fileData.content.split(",");
                        const byteCharacters = atob(base64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        return Promise.resolve(new Uint8Array(byteNumbers).buffer);
                    } else {
                        const encoder = new TextEncoder();
                        return Promise.resolve(encoder.encode(fileData.content).buffer);
                    }
                }
            };
            
            return Promise.resolve(response);
        }
        
        return originalFetch.apply(this, arguments);
    };`;
}

/**
 * Generates JavaScript code string for the XMLHttpRequest override (for injection into iframes)
 * Intercepts XHR requests to serve files from the virtual file system
 * 
 * @returns {string} JavaScript code as a string
 */
export function generateXHROverrideCode() {
    return `
    const OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new OriginalXMLHttpRequest();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        let isVirtualRequest = false;
        let virtualFileData = null;
        
        xhr.open = function(method, url, async, user, password) {
            try {
                if (method.toUpperCase() === "GET") {
                    const currentFilePath = getCurrentFilePath();
                    let targetPath = url.replace(/^\\.\\//,"");
                    const fileData = findFileInSystem(targetPath, currentFilePath);
                    
                    if (fileData) {
                        isVirtualRequest = true;
                        virtualFileData = fileData;
                        xhr.setRequestHeader = function() {};
                        xhr.overrideMimeType = function() {};
                        return;
                    }
                }
                
                isVirtualRequest = false;
                virtualFileData = null;
                return originalOpen.call(this, method, url, async, user, password);
            } catch (e) {
                isVirtualRequest = false;
                virtualFileData = null;
                return originalOpen.call(this, method, url, async, user, password);
            }
        };
        
        xhr.send = function(data) {
            if (isVirtualRequest && virtualFileData) {
                try {
                    setTimeout(() => {
                        try {
                            Object.defineProperty(xhr, "readyState", { value: 4, configurable: true });
                            Object.defineProperty(xhr, "status", { value: 200, configurable: true });
                            Object.defineProperty(xhr, "statusText", { value: "OK", configurable: true });
                            
                            if (virtualFileData.isBinary && virtualFileData.content.startsWith("data:")) {
                                if (xhr.responseType === "arraybuffer") {
                                    const [header, base64] = virtualFileData.content.split(",");
                                    const byteCharacters = atob(base64);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    Object.defineProperty(xhr, "response", { value: new Uint8Array(byteNumbers).buffer, configurable: true });
                                } else if (xhr.responseType === "blob") {
                                    const [header, base64] = virtualFileData.content.split(",");
                                    const mimeType = header.match(/data:([^;]+)/)[1];
                                    const byteCharacters = atob(base64);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    Object.defineProperty(xhr, "response", { value: new Blob([byteArray], { type: mimeType }), configurable: true });
                                } else {
                                    Object.defineProperty(xhr, "response", { value: virtualFileData.content, configurable: true });
                                    Object.defineProperty(xhr, "responseText", { value: virtualFileData.content, configurable: true });
                                }
                            } else {
                                Object.defineProperty(xhr, "responseText", { value: virtualFileData.content, configurable: true });
                                Object.defineProperty(xhr, "response", { value: virtualFileData.content, configurable: true });
                            }
                            
                            xhr.getResponseHeader = function(name) {
                                const lowerName = name.toLowerCase();
                                if (lowerName === "content-type") {
                                    const typeMap = {
                                        "image": "image/png",
                                        "audio": "audio/mpeg",
                                        "video": "video/mp4",
                                        "json": "application/json",
                                        "css": "text/css",
                                        "javascript": "text/javascript",
                                        "html": "text/html"
                                    };
                                    return typeMap[virtualFileData.type] || "text/plain";
                                }
                                return null;
                            };
                            
                            xhr.getAllResponseHeaders = function() {
                                const contentType = xhr.getResponseHeader("content-type");
                                return "content-type: " + contentType + "\\r\\n";
                            };
                            
                            if (xhr.onreadystatechange) {
                                xhr.onreadystatechange();
                            }
                            if (xhr.onload) {
                                xhr.onload();
                            }
                        } catch (e) {
                            if (xhr.onerror) {
                                xhr.onerror();
                            }
                        }
                    }, 1);
                } catch (e) {
                    if (xhr.onerror) {
                        xhr.onerror();
                    }
                }
                return;
            }
            
            return originalSend.call(this, data);
        };
        
        return xhr;
    };`;
}

/**
 * Generates JavaScript code string for the Image constructor override (for injection into iframes)
 * Intercepts Image src assignments to serve images from the virtual file system
 * 
 * @returns {string} JavaScript code as a string
 */
export function generateImageOverrideCode() {
    return `
    const OriginalImage = window.Image;
    window.Image = function() {
        const img = new OriginalImage();
        
        let _originalSrc = "";
        let _resolvedSrc = "";
        
        Object.defineProperty(img, "src", {
            get: function() {
                return _resolvedSrc || _originalSrc;
            },
            set: function(value) {
                _originalSrc = value;
                
                const currentFilePath = getCurrentFilePath();
                let targetPath = value.replace(/^\\.\\//,"");
                const fileData = findFileInSystem(targetPath, currentFilePath);
                
                if (fileData && (fileData.type === "image" || fileData.type === "svg")) {
                    const dataUrl = fileData.isBinary ? fileData.content : 
                                   "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fileData.content);
                    _resolvedSrc = dataUrl;
                    img.setAttribute("src", dataUrl);
                } else {
                    _resolvedSrc = value;
                    img.setAttribute("src", value);
                }
            },
            enumerable: true,
            configurable: true
        });
        
        return img;
    };`;
}

/**
 * Generates JavaScript code string for the Audio constructor override (for injection into iframes)
 * Intercepts Audio src assignments to serve audio files from the virtual file system
 * 
 * @returns {string} JavaScript code as a string
 */
export function generateAudioOverrideCode() {
    return `
    const OriginalAudio = window.Audio;
    window.Audio = function(src) {
        const audio = new OriginalAudio();
        
        let _originalSrc = "";
        let _resolvedSrc = "";
        
        Object.defineProperty(audio, "src", {
            get: function() {
                return _resolvedSrc || _originalSrc;
            },
            set: function(value) {
                _originalSrc = value;
                
                const currentFilePath = getCurrentFilePath();
                let targetPath = value.replace(/^\\.\\//,"");
                const fileData = findFileInSystem(targetPath, currentFilePath);
                
                if (fileData && fileData.type === "audio") {
                    _resolvedSrc = fileData.content;
                    audio.setAttribute("src", fileData.content);
                } else {
                    _resolvedSrc = value;
                    audio.setAttribute("src", value);
                }
            },
            enumerable: true,
            configurable: true
        });
        
        if (src !== undefined) {
            audio.src = src;
        }
        
        return audio;
    };`;
}

/**
 * Generates JavaScript code string for console capture and error handling (for injection into iframes)
 * Overrides console methods to post messages to the parent window and captures errors
 * 
 * @param {string} messageType - The message type identifier for postMessage communication
 * @returns {string} JavaScript code as a string
 */
export function generateConsoleOverrideCode(messageType) {
    return `
    const postLog = (level, args) => {
        const formattedArgs = args.map(arg => {
            if (arg instanceof Error) return { message: arg.message, stack: arg.stack };
            try { return JSON.parse(JSON.stringify(arg)); } catch (e) { return 'Unserializable Object'; }
        });
        window.parent.postMessage({ type: '${messageType}', level, message: formattedArgs }, '*');
    };
    const originalConsole = { ...window.console };
    ['log', 'info', 'warn', 'error'].forEach(level => {
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
    });`;
}

/**
 * Creates a virtual file system Map from an array of file objects
 * 
 * @param {Array<Object>} files - Array of file objects with id, editor, type, fileName properties
 * @param {Function} getFileNameFromPanel - Function to get current filename from panel
 * @returns {Map<string, Object>} Virtual file system Map
 */
export function createVirtualFileSystem(files, getFileNameFromPanel) {
    const fileSystem = new Map();
    
    files.forEach(file => {
        const currentFilename = getFileNameFromPanel(file.id);
        const originalFilename = file.fileName;
        
        if (currentFilename && file.editor) {
            const fileData = {
                content: file.content || file.editor.getValue(),
                type: file.type,
                isBinary: file.isBinary || false
            };
            
            // Store under current filename
            fileSystem.set(currentFilename, fileData);
            
            // Also store under original filename if different (for imports)
            if (originalFilename && originalFilename !== currentFilename) {
                fileSystem.set(originalFilename, fileData);
            }
        }
    });
    
    return fileSystem;
}
