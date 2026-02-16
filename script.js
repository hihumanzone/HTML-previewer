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
 * NOTE: Modular versions of utilities are available in the js/ directory
 * for reference and future migration to a modular architecture.
 */
const CodePreviewer = {
    // ============================================================================
    // APPLICATION STATE
    // ============================================================================
    state: {
        mode: 'multi',
        editors: {
            html: null,
            css: null,
            js: null,
        },
        files: [],
        folders: [],
        nextFileId: 4,
        nextFolderId: 1,
        expandedFolders: new Set(),
        openPanels: new Set(), // Track which file panels are currently open/visible
        savedFileStates: {}, // Track saved states for files: { fileId: { content: string, fileName: string } }
        modifiedFiles: new Set(),
        sidebarShowModifiedOnly: false,
        sidebarSearchQuery: '',
        selectedFileIds: new Set(),
        selectedFolderPaths: new Set(),
        codeModalEditor: null,
        currentCodeModalSource: null,
        activePanelId: 'default-html',
        autoFormatTimers: new Map(),
        formattingEditors: new Set(),
        mainHtmlFile: '',
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
        },
        CONTROL_IDS: {
            MODAL_BTN: 'preview-modal-btn',
            TAB_BTN: 'preview-tab-btn',
            CLEAR_CONSOLE_BTN: 'clear-console-btn',
            TOGGLE_CONSOLE_BTN: 'toggle-console-btn',
            ADD_FILE_BTN: 'add-file-btn',
            ADD_FOLDER_BTN: 'add-folder-btn',
            CLEAR_ALL_FILES_BTN: 'clear-all-files-btn',
            IMPORT_FILE_BTN: 'import-file-btn',
            IMPORT_FOLDER_BTN: 'import-folder-btn',
            IMPORT_ZIP_BTN: 'import-zip-btn',
            EXPORT_ZIP_BTN: 'export-zip-btn',
            MAIN_HTML_SELECT: 'main-html-select',
        },
        CONTAINER_IDS: {
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
            
            BINARY_EXTENSIONS: new Set([
                'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'tiff',
                'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma',
                'mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'm4v',
                'woff', 'woff2', 'ttf', 'otf', 'eot',
                'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                'zip', 'rar', '7z', 'tar', 'gz',
                'exe', 'dll', 'so', 'dylib'
            ]),
            
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
            },
            DEFAULT_EXTENSIONS: {
                'html': '.html', 'css': '.css',
                'javascript': '.js', 'javascript-module': '.js',
                'json': '.json', 'xml': '.xml', 'markdown': '.md',
                'svg': '.svg', 'text': '.txt'
            }
        }
    },

    // ============================================================================
    // FILE TYPE UTILITIES
    // ============================================================================
    fileTypeUtils: {
        BINARY_MIME_PREFIXES: ['image/', 'audio/', 'video/', 'application/', 'font/'],

        getExtension(filename) {
            return filename ? filename.split('.').pop().toLowerCase() : '';
        },

        getTypeFromExtension(filename) {
            const extension = this.getExtension(filename);
            return CodePreviewer.constants.FILE_TYPES.EXTENSIONS[extension] || 'binary';
        },

        getMimeTypeFromExtension(extension) {
            const normalizedExtension = extension?.toLowerCase();
            return CodePreviewer.constants.FILE_TYPES.EXTENSION_MIME_MAP[normalizedExtension] || 'application/octet-stream';
        },

        getMimeTypeFromFileType(fileType) {
            return CodePreviewer.constants.FILE_TYPES.MIME_TYPES[fileType] || 'text/plain';
        },

        isBinaryExtension(extension) {
            return CodePreviewer.constants.FILE_TYPES.BINARY_EXTENSIONS.has(extension?.toLowerCase());
        },

        hasBinaryMimePrefix(mimeType) {
            return this.BINARY_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix));
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

                return this.hasBinaryMimePrefix(mimeType);
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
        },

        /**
         * Generates JavaScript code for the fetch override (used in injected scripts)
         * Intercepts fetch requests to serve files from the virtual file system
         * @returns {string} JavaScript code for the fetch override
         */
        generateFetchOverrideCode() {
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
        },

        /**
         * Generates JavaScript code for the XMLHttpRequest override (used in injected scripts)
         * Intercepts XHR requests to serve files from the virtual file system
         * @returns {string} JavaScript code for the XMLHttpRequest override
         */
        generateXHROverrideCode() {
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
                            
                            xhr.dispatchEvent(new Event("readystatechange"));
                            xhr.dispatchEvent(new ProgressEvent("load"));
                            xhr.dispatchEvent(new ProgressEvent("loadend"));
                        } catch (e) {
                            xhr.dispatchEvent(new ProgressEvent("error"));
                            xhr.dispatchEvent(new ProgressEvent("loadend"));
                        }
                    }, 1);
                } catch (e) {
                    xhr.dispatchEvent(new ProgressEvent("error"));
                    xhr.dispatchEvent(new ProgressEvent("loadend"));
                }
                return;
            }
            
            return originalSend.call(this, data);
        };
        
        return xhr;
    };`;
        },

        /**
         * Generates JavaScript code for the Image constructor override (used in injected scripts)
         * Intercepts Image src assignments to serve images from the virtual file system
         * @returns {string} JavaScript code for the Image constructor override
         */
        generateImageOverrideCode() {
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
        },

        /**
         * Generates JavaScript code for the Audio constructor override (used in injected scripts)
         * Intercepts Audio src assignments to serve audio files from the virtual file system
         * @returns {string} JavaScript code for the Audio constructor override
         */
        generateAudioOverrideCode() {
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
        },

        /**
         * Generates JavaScript code for intercepting dynamic CSS url() property assignments
         * Resolves virtual file paths in style properties like backgroundImage
         * @returns {string} JavaScript code for the CSS URL override
         */
        generateCSSURLOverrideCode() {
            return `
    (function() {
        function resolveUrlsInValue(value) {
            if (typeof value !== 'string' || !value.includes('url(')) return value;
            return value.replace(/url\\(["']?([^"')]+)["']?\\)/g, function(match, url) {
                if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('//')) {
                    return match;
                }
                var currentFilePath = getCurrentFilePath();
                var targetPath = url.replace(/^\\.\\//,"");
                var fileData = findFileInSystem(targetPath, currentFilePath);
                if (fileData && (fileData.type === "image" || fileData.type === "svg")) {
                    var dataUrl = fileData.isBinary ? fileData.content :
                        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fileData.content);
                    return 'url("' + dataUrl + '")';
                }
                return match;
            });
        }
        var urlProps = new Set(['backgroundImage', 'background', 'listStyleImage', 'borderImage', 'borderImageSource', 'cursor', 'content',
            'background-image', 'list-style-image', 'border-image', 'border-image-source']);
        var origSetProperty = CSSStyleDeclaration.prototype.setProperty;
        CSSStyleDeclaration.prototype.setProperty = function(prop, value, priority) {
            if (urlProps.has(prop)) value = resolveUrlsInValue(value);
            return origSetProperty.call(this, prop, value, priority);
        };
        var styleDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
        if (styleDesc && styleDesc.get) {
            var origStyleGet = styleDesc.get;
            var proxyCache = new WeakMap();
            Object.defineProperty(HTMLElement.prototype, 'style', {
                get: function() {
                    var realStyle = origStyleGet.call(this);
                    if (proxyCache.has(realStyle)) return proxyCache.get(realStyle);
                    var proxy = new Proxy(realStyle, {
                        set: function(target, prop, value) {
                            if (typeof prop === 'string' && urlProps.has(prop)) {
                                value = resolveUrlsInValue(value);
                            }
                            target[prop] = value;
                            return true;
                        },
                        get: function(target, prop) {
                            var val = target[prop];
                            if (typeof val === 'function') return val.bind(target);
                            return val;
                        }
                    });
                    proxyCache.set(realStyle, proxy);
                    return proxy;
                },
                set: styleDesc.set,
                enumerable: styleDesc.enumerable,
                configurable: true
            });
        }
    })();`;
        },

        /**
         * Generates JavaScript code for intercepting .src on existing DOM image/audio elements
         * Ensures elements created via HTML (not via new Image()/new Audio()) also resolve virtual paths
         * @returns {string} JavaScript code for the element src override
         */
        generateElementSrcOverrideCode() {
            return `
    (function() {
        function overrideSrcProperty(proto, typeCheck) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, 'src');
            if (!descriptor || !descriptor.set) return;
            const origSet = descriptor.set;
            const origGet = descriptor.get;
            Object.defineProperty(proto, 'src', {
                set: function(value) {
                    if (typeof value === 'string' && value && !value.startsWith('data:') && !value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('blob:') && !value.startsWith('//')) {
                        const currentFilePath = getCurrentFilePath();
                        const targetPath = value.replace(/^\\.\\//,"");
                        const fileData = findFileInSystem(targetPath, currentFilePath);
                        if (fileData && typeCheck(fileData)) {
                            const resolved = fileData.isBinary ? fileData.content :
                                (fileData.type === "svg" ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fileData.content) : fileData.content);
                            origSet.call(this, resolved);
                            return;
                        }
                    }
                    origSet.call(this, value);
                },
                get: origGet ? function() { return origGet.call(this); } : undefined,
                enumerable: descriptor.enumerable,
                configurable: true
            });
        }
        overrideSrcProperty(HTMLImageElement.prototype, function(f) { return f.type === "image" || f.type === "svg"; });
        overrideSrcProperty(HTMLAudioElement.prototype, function(f) { return f.type === "audio"; });
        overrideSrcProperty(HTMLVideoElement.prototype, function(f) { return f.type === "video"; });
        overrideSrcProperty(HTMLSourceElement.prototype, function(f) { return f.type === "audio" || f.type === "video" || f.type === "image"; });
    })();`;
        },

        /**
         * Generates JavaScript code for console capture and error handling (used in injected scripts)
         * Overrides console methods to post messages to the parent window and captures errors
         * @param {string} messageType - The message type identifier for postMessage communication
         * @returns {string} JavaScript code for console capture
         */
        generateConsoleOverrideCode(messageType) {
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
        if (message === 'Script error.' && !source) return true;
        postLog('error', [message, 'at ' + (source ? source.split('/').pop() : '(unknown)') + ':' + lineno + ':' + colno]);
        return true;
    };
    window.addEventListener('unhandledrejection', e => {
        postLog('error', ['Unhandled promise rejection:', e.reason]);
    });`;
        }
    },

    // ============================================================================
    // APPLICATION INITIALIZATION AND LIFECYCLE
    // ============================================================================
    
    init() {
        this.cacheDOMElements();
        this.initEditors();
        this.bindEvents();
        this.bindFileTreeEvents();
        this.initExistingFilePanels();
        this.ensureDefaultContentFile();
        this.console.init(this.dom.consoleOutput, this.dom.clearConsoleBtn, this.dom.previewFrame);
        this.updatePreviewActionButtons();
    },

    cacheDOMElements() {
        const { EDITOR_IDS, CONTROL_IDS, MODAL_IDS, CONSOLE_ID, MODAL_CONSOLE_PANEL_ID, CONTAINER_IDS } = this.constants;
        this.dom = {
            htmlEditor: document.getElementById(EDITOR_IDS.HTML),
            cssEditor: document.getElementById(EDITOR_IDS.CSS),
            jsEditor: document.getElementById(EDITOR_IDS.JS),
            modalBtn: document.getElementById(CONTROL_IDS.MODAL_BTN),
            tabBtn: document.getElementById(CONTROL_IDS.TAB_BTN),
            clearConsoleBtn: document.getElementById(CONTROL_IDS.CLEAR_CONSOLE_BTN),
            toggleConsoleBtn: document.getElementById(CONTROL_IDS.TOGGLE_CONSOLE_BTN),
            addFileBtn: document.getElementById(CONTROL_IDS.ADD_FILE_BTN),
            addFolderBtn: document.getElementById(CONTROL_IDS.ADD_FOLDER_BTN),
            clearAllFilesBtn: document.getElementById(CONTROL_IDS.CLEAR_ALL_FILES_BTN),
            importFileBtn: document.getElementById(CONTROL_IDS.IMPORT_FILE_BTN),
            importFolderBtn: document.getElementById(CONTROL_IDS.IMPORT_FOLDER_BTN),
            importZipBtn: document.getElementById(CONTROL_IDS.IMPORT_ZIP_BTN),
            exportZipBtn: document.getElementById(CONTROL_IDS.EXPORT_ZIP_BTN),
            mainHtmlSelect: document.getElementById(CONTROL_IDS.MAIN_HTML_SELECT),
            mainHtmlSelector: document.getElementById('main-html-selector'),
            mainHtmlDropdown: document.getElementById('main-html-dropdown'),
            mainHtmlDropdownTrigger: document.getElementById('main-html-dropdown-trigger'),
            mainHtmlDropdownList: document.getElementById('main-html-dropdown-list'),
            multiFileContainer: document.getElementById(CONTAINER_IDS.MULTI_FILE),
            fileTreeContainer: document.getElementById(CONTAINER_IDS.FILE_TREE),
            modalOverlay: document.getElementById(MODAL_IDS.OVERLAY),
            previewFrame: document.getElementById(MODAL_IDS.FRAME),
            closeModalBtn: document.querySelector('.modal-header .close-btn'),
            consoleOutput: document.getElementById(CONSOLE_ID),
            modalConsolePanel: document.getElementById(MODAL_CONSOLE_PANEL_ID),
            editorGrid: document.querySelector('.editor-grid'),
            formatCodeBtn: document.getElementById('format-code-btn'),
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

    escapeHtmlAttribute(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    hasHtmlFiles() {
        return this.state.files.some(file => file.type === 'html');
    },

    getPreviewAvailability() {
        const hasHtml = this.hasHtmlFiles();
        return {
            allowed: hasHtml,
            reason: hasHtml ? '' : 'Add at least one HTML file to preview.'
        };
    },

    updatePreviewActionButtons() {
        const availability = this.getPreviewAvailability();
        const disabled = !availability.allowed;

        if (this.dom.modalBtn) {
            this.dom.modalBtn.disabled = false;
            this.dom.modalBtn.setAttribute('aria-disabled', String(disabled));
            this.dom.modalBtn.classList.toggle('button-disabled-state', disabled);
            this.dom.modalBtn.title = disabled ? availability.reason : 'Open preview in modal';
        }
        if (this.dom.tabBtn) {
            this.dom.tabBtn.disabled = false;
            this.dom.tabBtn.setAttribute('aria-disabled', String(disabled));
            this.dom.tabBtn.classList.toggle('button-disabled-state', disabled);
            this.dom.tabBtn.title = disabled ? availability.reason : 'Open preview in new tab';
        }
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

        this.setDefaultContent();
    },
    getDefaultSiteFiles() {
        return {
            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hello Site</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <h1>Hello World</h1>

  <main id="content">Loading content...</main>

  <button id="logBtn">Test Console Logs</button>

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="script.js" defer></script>
</body>
</html>`,
            css: `body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
  background: #f5f5f5;
}

h1 {
  margin-bottom: 1rem;
}

#content {
  background: #fff;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

button {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 4px;
  background: #222;
  color: white;
  cursor: pointer;
}

button:hover {
  opacity: 0.85;
}`,
            js: `const contentEl = document.getElementById("content");
const logBtn = document.getElementById("logBtn");

// Load markdown
async function loadMarkdown() {
  try {
    const res = await fetch("content.md");
    const text = await res.text();
    contentEl.innerHTML = marked.parse(text);
  } catch (err) {
    console.error("Failed to load markdown:", err);
    if (contentEl) {
      contentEl.textContent = "Error loading content.";
    }
  }
}

// Console logging test
function testLogs() {
  console.log("Normal log");
  console.info("Info log");
  console.warn("Warning log");
  console.error("Error log");
}

if (logBtn) {
  logBtn.addEventListener("click", testLogs);
}
if (contentEl && typeof marked !== "undefined") {
  loadMarkdown();
}`,
            markdown: `# Markdown Content

This content is loaded from a markdown file.

- Simple
- Clean
- Working`
        };
    },

    setDefaultContent() {
        const defaultSiteFiles = this.getDefaultSiteFiles();

        if (this.state.editors.html) {
            this.state.editors.html.setValue(defaultSiteFiles.html);
        }
        if (this.state.editors.css) {
            this.state.editors.css.setValue(defaultSiteFiles.css);
        }
        if (this.state.editors.js) {
            this.state.editors.js.setValue(defaultSiteFiles.js);
        }
    },

    ensureDefaultContentFile() {
        const hasContentMd = this.state.files.some(file => {
            const filename = this.getFileNameFromPanel(file.id) || file.fileName;
            return filename === 'content.md';
        });

        if (hasContentMd) return;

        const fileId = `file-${this.state.nextFileId++}`;
        const fileName = 'content.md';
        const content = this.getDefaultSiteFiles().markdown;

        this.createFilePanel(fileId, fileName, 'markdown', content, false);

        const textarea = document.getElementById(fileId);
        const editor = this.createEditorForTextarea(textarea, 'markdown');
        editor.setValue(content);

        this.state.files.push({
            id: fileId,
            editor,
            type: 'markdown',
            fileName,
        });

        this.initFileSavedState(fileId, content, fileName);
        this.setupEditorChangeListener(fileId, editor);
        this.state.openPanels.add(fileId);

        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (panel) {
            this.bindFilePanelEvents(panel);
        }

        this.refreshPanelAndFileTreeUI();
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
            const activePanel = this.getActiveEditorPanel();

            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.renderPreview('modal');
            }

            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'f' && activePanel) {
                e.preventDefault();
                this.openPanelSearch(activePanel);
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e' && activePanel) {
                e.preventDefault();
                this.expandCode(activePanel);
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
                const codeModal = document.getElementById('code-modal');
                if (codeModal && codeModal.getAttribute('aria-hidden') === 'false') {
                    e.preventDefault();
                    this.formatCodeModalEditor();
                } else if (activePanel) {
                    e.preventDefault();
                    this.formatPanelCode(activePanel, false);
                }
            }

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
        
        if (this.dom.formatCodeBtn) {
            this.dom.formatCodeBtn.addEventListener('click', () => this.formatCodeModalEditor());
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

        this.dom.addFileBtn.addEventListener('click', () => this.addNewFile());
        if (this.dom.addFolderBtn) {
            this.dom.addFolderBtn.addEventListener('click', () => this.addNewFolder());
        }
        if (this.dom.clearAllFilesBtn) {
            this.dom.clearAllFilesBtn.addEventListener('click', () => this.clearAllFiles());
        }
        this.dom.importFileBtn.addEventListener('click', () => this.importFile());
        if (this.dom.importFolderBtn) {
            this.dom.importFolderBtn.addEventListener('click', () => this.importFolder());
        }
        this.dom.importZipBtn.addEventListener('click', () => this.importZip());
        this.dom.exportZipBtn.addEventListener('click', () => this.exportZip());
        this.setupMainHtmlDropdownEvents();

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.file-type-dropdown')) {
                this.closeAllFileTypeDropdowns();
            }
        });

        window.addEventListener('resize', () => {
            this.updatePanelMoveButtonDirections();
            this.updateCodeModalHeaderAndButtons();
        });

    },

    isMobileViewport() {
        return window.matchMedia('(max-width: 768px)').matches;
    },

    updateCodeModalHeaderAndButtons(fileName = null) {
        const modalTitle = document.getElementById('code-modal-title');
        const isMobile = this.isMobileViewport();
        const resolvedFileName = fileName
            || this.state.currentCodeModalSource?.querySelector('.file-name-input')?.value
            || 'Code';

        if (modalTitle) {
            modalTitle.textContent = isMobile ? resolvedFileName : `Code View - ${resolvedFileName}`;
        }

        if (this.dom.formatCodeBtn) {
            this.dom.formatCodeBtn.textContent = isMobile ? '✨' : '✨ Format';
        }

        if (this.dom.saveCodeBtn) {
            this.dom.saveCodeBtn.textContent = isMobile ? '💾' : '💾 Save';
        }
    },

    updatePanelMoveButtonDirections() {
        const isMobile = this.isMobileViewport();
        document.querySelectorAll('.move-panel-btn').forEach((button) => {
            const direction = button.dataset.direction;
            if (direction === 'left') {
                button.textContent = isMobile ? '↑' : '←';
                button.setAttribute('aria-label', isMobile ? 'Move panel up' : 'Move panel left');
                button.title = isMobile ? 'Move up' : 'Move left';
            } else if (direction === 'right') {
                button.textContent = isMobile ? '↓' : '→';
                button.setAttribute('aria-label', isMobile ? 'Move panel down' : 'Move panel right');
                button.title = isMobile ? 'Move down' : 'Move right';
            }
        });
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
     * Create a folder path after validating/sanitizing folder name
     * @param {string} folderName - The raw folder name
     * @param {string} [parentPath=''] - Optional parent path
     * @returns {string|null} The created path or null if invalid/duplicate
     */
    createFolderPath(folderName, parentPath = '') {
        const sanitizedName = (folderName || '').trim().replace(/[<>:"|?*]/g, '');
        if (!sanitizedName) return null;

        const fullPath = parentPath ? `${parentPath}/${sanitizedName}` : sanitizedName;
        const existingFolder = this.state.folders.find(f => f.path === fullPath);
        if (existingFolder) {
            this.showNotification(`Folder "${fullPath}" already exists.`, 'error');
            return null;
        }

        const folderId = `folder-${this.state.nextFolderId++}`;
        this.state.folders.push({ id: folderId, path: fullPath });
        this.state.expandedFolders.add(fullPath);
        this.renderFileTree();
        this.showNotification(`Folder "${fullPath}" created.`, 'success');

        return fullPath;
    },

    /**
     * Add a new folder
     */
    async addNewFolder() {
        const folderName = await this.showPromptDialog('New Folder', 'Enter folder name:');
        if (!folderName) return;
        this.createFolderPath(folderName);
    },

    /**
     * Add a new file within a specific folder
     * @param {string} folderPath - The folder path to add the file in
     */
    addFileToFolder(folderPath) {
        this.addNewFile(folderPath);
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
     * Get all file IDs inside a folder path (including nested subfolders)
     * @param {string} folderPath - The folder path
     * @returns {string[]} Matching file IDs
     */
    getFileIdsInFolder(folderPath) {
        const folderPrefix = `${folderPath}/`;
        return this.state.files
            .filter(file => {
                const filename = this.getFileNameFromPanel(file.id) || file.fileName || '';
                return filename.startsWith(folderPrefix);
            })
            .map(file => file.id);
    },

    /**
     * Toggle open state for all file panels in a folder
     * @param {string} folderPath - Folder whose files should be toggled
     */
    toggleFolderPanels(folderPath) {
        const fileIds = this.getFileIdsInFolder(folderPath);
        if (fileIds.length === 0) return;

        const areAllOpen = fileIds.every(fileId => this.state.openPanels.has(fileId));

        if (areAllOpen) {
            fileIds.forEach(fileId => this.closePanel(fileId));
            return;
        }

        fileIds.forEach(fileId => this.openPanel(fileId));
    },

    /**
     * Resolve selected files + selected folders to unique file IDs
     * @returns {string[]} Unique selected file IDs
     */
    getSelectedFileIdsIncludingFolders() {
        const fileIds = new Set(this.state.selectedFileIds);

        this.state.selectedFolderPaths.forEach(folderPath => {
            this.getFileIdsInFolder(folderPath).forEach(fileId => fileIds.add(fileId));
        });

        return Array.from(fileIds);
    },

    /**
     * Clear sidebar selections for files and folders
     */
    clearSidebarSelection() {
        this.state.selectedFileIds.clear();
        this.state.selectedFolderPaths.clear();
    },

    /**
     * Render the file tree sidebar
     */
    renderFileTree() {
        if (!this.dom.fileTreeContainer) return;

        const tree = this.buildFolderTree();

        // Prune selections for files that no longer exist
        const existingIds = new Set(this.state.files.map(f => f.id));
        this.state.selectedFileIds.forEach((id) => {
            if (!existingIds.has(id)) this.state.selectedFileIds.delete(id);
        });

        const existingFolderPaths = new Set(this.state.folders.map(folder => folder.path));
        this.state.selectedFolderPaths.forEach((folderPath) => {
            if (!existingFolderPaths.has(folderPath)) this.state.selectedFolderPaths.delete(folderPath);
        });

        const treeHtml = this.renderFolderContents(tree, '');
        const hasSelection = this.state.selectedFileIds.size > 0 || this.state.selectedFolderPaths.size > 0;

        this.dom.fileTreeContainer.innerHTML = `
            <div class="file-tree-toolbar">
                <input type="search" class="file-tree-search-input" placeholder="Search files..." value="${this.escapeHtmlAttribute(this.state.sidebarSearchQuery)}" aria-label="Search files in sidebar">
                <div class="file-tree-toolbar-actions">
                    <button class="tree-toolbar-btn clear-selection-btn" title="Clear selection" ${hasSelection ? '' : 'disabled'}>Clear</button>
                    <button class="tree-toolbar-btn open-selected-btn" title="Open selected files/folders" ${hasSelection ? '' : 'disabled'}>Open</button>
                    <button class="tree-toolbar-btn close-selected-btn" title="Close selected files/folders" ${hasSelection ? '' : 'disabled'}>Close</button>
                    <button class="tree-toolbar-btn delete-selected-btn" title="Delete selected files/folders" ${hasSelection ? '' : 'disabled'}>Delete</button>
                </div>
            </div>
            <div class="file-tree-content">
                ${treeHtml || '<div class="file-tree-empty">No files to show.</div>'}
            </div>
        `;
    },

    /**
     * Recursively render folder contents
     * @param {Object} node - Current tree node
     * @param {string} currentPath - Current path being rendered
     * @returns {string} HTML string
     */
    renderFolderContents(node, currentPath) {
        let html = '';
        const query = this.state.sidebarSearchQuery;

        // Render subfolders first
        const sortedFolders = Object.keys(node.children).sort();
        sortedFolders.forEach(folderName => {
            const folder = node.children[folderName];
            const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            const isExpanded = this.state.expandedFolders.has(folderPath);
            const isFolderSelected = this.state.selectedFolderPaths.has(folderPath);
            const childHtml = this.renderFolderContents(folder, folderPath);
            const folderFileIds = this.getFileIdsInFolder(folderPath);
            const folderHasFiles = folderFileIds.length > 0;
            const areAllFolderPanelsOpen = folderHasFiles && folderFileIds.every(fileId => this.state.openPanels.has(fileId));
            const toggleFolderPanelsLabel = areAllFolderPanelsOpen
                ? 'Collapse all file panels in folder'
                : 'Expand all file panels in folder';
            const toggleFolderPanelsIcon = areAllFolderPanelsOpen ? '📁−' : '📂+';

            html += `
                <div class="tree-folder ${isExpanded ? 'expanded' : ''} ${isFolderSelected ? 'folder-selected-in-sidebar' : ''}" data-folder-path="${folderPath}">
                    <div class="tree-folder-header">
                        <input type="checkbox" class="tree-folder-checkbox" aria-label="Select folder ${this.escapeHtmlAttribute(folderPath)}" ${isFolderSelected ? 'checked' : ''}>
                        <span class="folder-icon">${isExpanded ? '📂' : '📁'}</span>
                        <span class="folder-name">${folderName}</span>
                        <div class="folder-actions">
                            <button class="toggle-folder-panels-btn" title="${toggleFolderPanelsLabel}" aria-label="${toggleFolderPanelsLabel}" ${folderHasFiles ? '' : 'disabled'}>${toggleFolderPanelsIcon}</button>
                            <button class="add-file-to-folder-btn" title="Add file to folder">+</button>
                            <button class="add-subfolder-btn" title="Add subfolder">📁+</button>
                            <button class="delete-folder-btn" title="Delete folder">🗑️</button>
                        </div>
                    </div>
                    <div class="tree-folder-contents" style="display: ${isExpanded ? 'block' : 'none'}">
                        ${childHtml}
                    </div>
                </div>
            `;
        });

        // Render files
        node.files.forEach(file => {
            const isModified = this.state.modifiedFiles.has(file.id);
            const isSelected = this.state.selectedFileIds.has(file.id);
            const filename = (file.displayName || '').toLowerCase();
            if (query && !filename.includes(query)) {
                return;
            }

            const fileIcon = this.getFileIcon(file.type);
            const isOpen = this.state.openPanels.has(file.id);
            const openClass = isOpen ? 'file-open' : '';
            const modifiedClass = isModified ? 'file-modified' : '';
            const selectedClass = isSelected ? 'file-selected-in-sidebar' : '';
            html += `
                <div class="tree-file ${openClass} ${modifiedClass} ${selectedClass}" data-file-id="${file.id}">
                    <input type="checkbox" class="tree-file-checkbox" aria-label="Select file ${this.escapeHtmlAttribute(file.displayName)}" ${isSelected ? 'checked' : ''}>
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
     * Bind click events for file tree elements using event delegation
     */
    bindFileTreeEvents() {
        if (!this.dom.fileTreeContainer) return;
        
        // Use a single delegated listener on the container
        this.dom.fileTreeContainer.addEventListener('input', (e) => {
            const target = e.target;
            if (target.classList.contains('file-tree-search-input')) {
                this.state.sidebarSearchQuery = target.value.trim().toLowerCase();
                this.renderFileTree();
                return;
            }

            if (target.classList.contains('tree-file-checkbox')) {
                const fileEl = target.closest('.tree-file');
                if (!fileEl) return;
                const fileId = fileEl.dataset.fileId;
                if (target.checked) {
                    this.state.selectedFileIds.add(fileId);
                } else {
                    this.state.selectedFileIds.delete(fileId);
                }
                this.renderFileTree();
                return;
            }

            if (target.classList.contains('tree-folder-checkbox')) {
                const folderEl = target.closest('.tree-folder');
                if (!folderEl) return;
                const folderPath = folderEl.dataset.folderPath;
                if (target.checked) {
                    this.state.selectedFolderPaths.add(folderPath);
                } else {
                    this.state.selectedFolderPaths.delete(folderPath);
                }
                this.renderFileTree();
            }
        });

        this.dom.fileTreeContainer.addEventListener('click', async (e) => {
            const target = e.target;

            if (target.closest('.file-tree-search-input')) {
                return;
            }


            if (target.closest('.clear-selection-btn')) {
                this.clearSidebarSelection();
                this.renderFileTree();
                return;
            }

            if (target.closest('.open-selected-btn')) {
                this.getSelectedFileIdsIncludingFolders().forEach((id) => this.openPanel(id));
                return;
            }

            if (target.closest('.close-selected-btn')) {
                this.getSelectedFileIdsIncludingFolders().forEach((id) => this.closePanel(id));
                return;
            }

            if (target.closest('.delete-selected-btn')) {
                const selectedFolderPaths = Array.from(this.state.selectedFolderPaths);
                const selectedFileIds = this.getSelectedFileIdsIncludingFolders();
                if (selectedFolderPaths.length === 0 && selectedFileIds.length === 0) return;

                const confirmed = await this.showConfirmDialog(`Delete ${selectedFileIds.length} file(s) and ${selectedFolderPaths.length} folder(s)? This cannot be undone.`);
                if (confirmed) {
                    selectedFolderPaths
                        .sort((a, b) => b.length - a.length)
                        .forEach((folderPath) => this.deleteFolder(folderPath));

                    const selectedFolderSet = new Set(selectedFolderPaths);
                    selectedFileIds
                        .filter((fileId) => {
                            const fileName = this.getFileNameFromPanel(fileId) || this.state.files.find(f => f.id === fileId)?.fileName || '';
                            return !Array.from(selectedFolderSet).some(folderPath => fileName.startsWith(`${folderPath}/`));
                        })
                        .forEach((id) => this.deleteFile(id));

                    this.clearSidebarSelection();
                    this.renderFileTree();
                }
                return;
            }

            if (target.closest('.toggle-modified-filter-btn')) {
                this.state.sidebarShowModifiedOnly = !this.state.sidebarShowModifiedOnly;
                this.renderFileTree();
                return;
            }
            
            // Add file to folder
            if (target.closest('.toggle-folder-panels-btn')) {
                e.stopPropagation();
                const folderPath = target.closest('.tree-folder').dataset.folderPath;
                this.toggleFolderPanels(folderPath);
                return;
            }

            // Add file to folder
            if (target.closest('.add-file-to-folder-btn')) {
                e.stopPropagation();
                const folderPath = target.closest('.tree-folder').dataset.folderPath;
                this.addFileToFolder(folderPath);
                return;
            }
            
            // Add subfolder
            if (target.closest('.add-subfolder-btn')) {
                e.stopPropagation();
                const parentPath = target.closest('.tree-folder').dataset.folderPath;
                const folderName = await this.showPromptDialog('New Subfolder', 'Enter folder name:');
                if (folderName) {
                    this.createFolderPath(folderName, parentPath);
                }
                return;
            }
            
            // Delete folder
            if (target.closest('.delete-folder-btn')) {
                e.stopPropagation();
                const folderPath = target.closest('.tree-folder').dataset.folderPath;
                const confirmed = await this.showConfirmDialog(`Delete folder "${folderPath}" and all its contents?`);
                if (confirmed) {
                    this.deleteFolder(folderPath);
                }
                return;
            }
            
            // Folder header click (toggle expansion) — only if not clicking an action button
            const folderHeader = target.closest('.tree-folder-header');
            if (folderHeader && !target.closest('.folder-actions') && !target.closest('.tree-folder-checkbox')) {
                const folderPath = folderHeader.closest('.tree-folder').dataset.folderPath;
                this.toggleFolder(folderPath);
                return;
            }
            
            // File actions
            if (target.closest('.tree-file-checkbox') || target.closest('.tree-folder-checkbox')) {
                e.stopPropagation();
                return;
            }

            const fileEl = target.closest('.tree-file');
            if (!fileEl) return;
            const fileId = fileEl.dataset.fileId;
            
            // Open file button
            if (target.closest('.open-file-btn')) {
                e.stopPropagation();
                this.openPanel(fileId);
                return;
            }
            
            // Delete file button
            if (target.closest('.delete-file-btn')) {
                e.stopPropagation();
                const fileName = this.getFileNameFromPanel(fileId) || 'this file';
                const confirmed = await this.showConfirmDialog(`Delete "${fileName}"? This cannot be undone.`);
                if (confirmed) {
                    this.deleteFile(fileId);
                }
                return;
            }
            
            // Click on file row (not on action buttons) to open
            if (!target.closest('.file-actions')) {
                this.openPanel(fileId);
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
        this.state.selectedFolderPaths.forEach(selectedPath => {
            if (selectedPath === folderPath || selectedPath.startsWith(folderPath + '/')) {
                this.state.selectedFolderPaths.delete(selectedPath);
            }
        });
        filesToRemove.forEach(file => this.state.selectedFileIds.delete(file.id));
        this.refreshPanelAndFileTreeUI();
    },

    addNewFile(folderPath) {
        const fileId = `file-${this.state.nextFileId++}`;
        const fileName = folderPath ? `${folderPath}/newfile.html` : 'newfile.html';
        const content = '';
        
        this.createFilePanel(fileId, fileName, 'html', content, false);
        
        const newTextarea = document.getElementById(fileId);
        const newEditor = this.createEditorForTextarea(newTextarea, 'html');
        
        this.state.files.push({
            id: fileId,
            editor: newEditor,
            type: 'html',
            fileName: fileName
        });
        
        // Initialize saved state and set up change listener
        this.initFileSavedState(fileId, content, fileName);
        this.setupEditorChangeListener(fileId, newEditor);
        
        // Mark panel as open
        this.state.openPanels.add(fileId);
        
        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        this.bindFilePanelEvents(panel);
        
        this.refreshPanelAndFileTreeUI();
    },

    /**
     * Create and show a modal dialog with custom content and buttons
     * @private
     * @param {Object} config - Dialog configuration
     * @param {string} config.title - Dialog title
     * @param {string|HTMLElement} config.body - Dialog body content (string or DOM element)
     * @param {Array<{text: string, action: string, className: string}>} config.buttons - Button configurations
     * @returns {Promise<string>} - Resolves with the clicked button's action value
     */
    _showDialog({title, body, buttons}) {
        return new Promise((resolve) => {
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'conflict-dialog-overlay';
            
            // Create dialog container
            const dialog = document.createElement('div');
            dialog.className = 'conflict-dialog';
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            dialog.setAttribute('tabindex', '-1');
            
            // Create header
            const header = document.createElement('div');
            header.className = 'conflict-dialog-header';
            const h3 = document.createElement('h3');
            h3.textContent = title;
            header.appendChild(h3);
            dialog.appendChild(header);
            
            // Create body
            const bodyElement = document.createElement('div');
            bodyElement.className = 'conflict-dialog-body';
            if (typeof body === 'string') {
                const p = document.createElement('p');
                p.textContent = body;
                bodyElement.appendChild(p);
            } else {
                bodyElement.appendChild(body);
            }
            dialog.appendChild(bodyElement);
            
            // Create buttons
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'conflict-dialog-buttons';
            const buttonElements = [];
            const closeDialog = (action) => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                resolve(action);
            };

            buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = `conflict-btn ${btn.className}`;
                button.textContent = btn.text;
                button.dataset.action = btn.action;
                button.addEventListener('click', () => closeDialog(btn.action));
                buttonsContainer.appendChild(button);
                buttonElements.push(button);
            });

            const getConfirmAction = () => {
                const preferred = ['confirm', 'replace', 'replace-all', 'submit'];
                const found = preferred.find(action => buttonElements.some(button => button.dataset.action === action));
                return found || buttonElements[0]?.dataset.action || 'cancel';
            };

            const getCancelAction = () => {
                const preferred = ['cancel', 'skip', 'skip-all'];
                const found = preferred.find(action => buttonElements.some(button => button.dataset.action === action));
                return found || buttonElements[buttonElements.length - 1]?.dataset.action || 'cancel';
            };

            dialog.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    closeDialog(getConfirmAction());
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeDialog(getCancelAction());
                }
            });

            dialog.appendChild(buttonsContainer);
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const preferredFocusButton = buttonElements.find(button => ['confirm', 'replace', 'replace-all'].includes(button.dataset.action)) || buttonElements[0];
            if (preferredFocusButton) {
                preferredFocusButton.focus();
            } else {
                dialog.focus();
            }
        });
    },

    /**
     * Show a dialog to resolve file conflicts during import
     * @param {string} fileName - Name of the conflicting file
     * @returns {Promise<string>} - 'replace', 'skip', 'replace-all', or 'skip-all'
     */
    showFileConflictDialog(fileName) {
        // Create body with safe text content
        const bodyContent = document.createElement('div');
        const p1 = document.createElement('p');
        p1.textContent = `A file named "${fileName}" already exists.`;
        const p2 = document.createElement('p');
        p2.textContent = 'What would you like to do?';
        bodyContent.appendChild(p1);
        bodyContent.appendChild(p2);
        
        return this._showDialog({
            title: 'File Conflict',
            body: bodyContent,
            buttons: [
                {text: 'Replace', action: 'replace', className: 'conflict-replace'},
                {text: 'Skip', action: 'skip', className: 'conflict-skip'},
                {text: 'Replace All', action: 'replace-all', className: 'conflict-replace-all'},
                {text: 'Skip All', action: 'skip-all', className: 'conflict-skip-all'}
            ]
        });
    },

    /**
     * Show a confirmation dialog
     * @param {string} message - The confirmation message
     * @returns {Promise<boolean>} - True if confirmed, false if cancelled
     */
    async showConfirmDialog(message) {
        const action = await this._showDialog({
            title: 'Confirmation',
            body: message,
            buttons: [
                {text: 'Cancel', action: 'cancel', className: 'conflict-skip'},
                {text: 'Confirm', action: 'confirm', className: 'conflict-replace'}
            ]
        });
        return action === 'confirm';
    },


    /**
     * Show an input dialog (custom replacement for browser prompt)
     * @param {string} title - Dialog title
     * @param {string} message - Prompt message
     * @param {string} [defaultValue=''] - Initial input value
     * @returns {Promise<string|null>} Entered value, or null if cancelled
     */
    async showPromptDialog(title, message, defaultValue = '') {
        const bodyContent = document.createElement('div');

        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        bodyContent.appendChild(messageEl);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'conflict-input';
        input.value = defaultValue;
        input.setAttribute('aria-label', message);
        bodyContent.appendChild(input);

        let resolveResult = null;
        const action = await new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'conflict-dialog-overlay';

            const dialog = document.createElement('div');
            dialog.className = 'conflict-dialog';

            const header = document.createElement('div');
            header.className = 'conflict-dialog-header';
            const h3 = document.createElement('h3');
            h3.textContent = title;
            header.appendChild(h3);

            const body = document.createElement('div');
            body.className = 'conflict-dialog-body';
            body.appendChild(bodyContent);

            const buttons = document.createElement('div');
            buttons.className = 'conflict-dialog-buttons';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'conflict-btn conflict-skip';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve('cancel');
            });

            const submitBtn = document.createElement('button');
            submitBtn.className = 'conflict-btn conflict-replace';
            submitBtn.textContent = 'Create';
            submitBtn.addEventListener('click', () => {
                resolveResult = input.value;
                document.body.removeChild(overlay);
                resolve('submit');
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitBtn.click();
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelBtn.click();
                }
            });

            buttons.appendChild(cancelBtn);
            buttons.appendChild(submitBtn);
            dialog.appendChild(header);
            dialog.appendChild(body);
            dialog.appendChild(buttons);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            setTimeout(() => {
                input.focus();
                input.select();
            }, 0);
        });

        if (action !== 'submit') {
            return null;
        }

        return resolveResult;
    },

    /**
     * Handle file conflict resolution during import.
     * This method uses a shared `resolution` object to remember user preferences
     * across multiple calls (e.g., 'replace-all' or 'skip-all') so that subsequent
     * conflicts are resolved automatically without re-prompting.
     * @param {string} fileName - Name of the file being imported
     * @param {Object} resolution - Shared state object: { action: string|null }. The `action`
     *   property is updated by this method when the user chooses 'replace-all' or 'skip-all'.
     * @returns {Promise<string>} 'imported' if the file should be imported, 'skipped' if it should be skipped
     */
    async _resolveImportConflict(fileName, resolution) {
        const existingFilenames = this.getExistingFilenames();
        if (!existingFilenames.includes(fileName)) {
            return 'imported';
        }
        
        let action = resolution.action;
        
        if (!action || (action !== 'replace-all' && action !== 'skip-all')) {
            action = await this.showFileConflictDialog(fileName);
            if (action === 'replace-all' || action === 'skip-all') {
                resolution.action = action;
            }
        }
        
        if (action === 'skip' || action === 'skip-all') {
            return 'skipped';
        }
        
        if (action === 'replace' || action === 'replace-all') {
            const existingFile = this.state.files.find(f => f.fileName === fileName);
            if (existingFile) {
                this.deleteFile(existingFile.id);
            }
        }
        
        return 'imported';
    },

    /**
     * Show an import summary notification
     * @param {number} importedCount - Number of files imported
     * @param {number} skippedCount - Number of files skipped
     * @param {string} [successMessage] - Custom success message for single-source imports
     */
    _showImportSummary(importedCount, skippedCount, successMessage) {
        if (importedCount > 0 && skippedCount > 0) {
            this.showNotification(`Imported ${importedCount} file(s), skipped ${skippedCount} file(s)`, 'success');
        } else if (importedCount > 0) {
            this.showNotification(successMessage || `Successfully imported ${importedCount} file(s)`, 'success');
        } else if (skippedCount > 0) {
            this.showNotification(`Skipped ${skippedCount} file(s)`, 'info');
        }
    },

    /**
     * Create a hidden file input, trigger it, and call back with selected files
     * @param {string} accept - File accept attribute
     * @param {boolean} multiple - Whether multiple files are allowed
     * @param {Function} onFiles - Async callback receiving the FileList
     */
    _openFilePicker(accept, multiple, onFiles, options = {}) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = accept;
        fileInput.multiple = multiple;
        if (options.directory) {
            fileInput.setAttribute('webkitdirectory', '');
            fileInput.setAttribute('directory', '');
        }
        fileInput.style.display = 'none';
        
        const cleanup = () => {
            if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
            }
        };
        
        fileInput.addEventListener('change', async (event) => {
            try {
                await onFiles(event.target.files);
            } catch (error) {
                console.error('Error processing files:', error);
                this.showNotification('Error processing files. Please try again.', 'error');
            }
            cleanup();
        });
        
        fileInput.addEventListener('cancel', cleanup);
        
        window.addEventListener('focus', () => {
            setTimeout(() => {
                if (document.body.contains(fileInput)) {
                    cleanup();
                }
            }, 100);
        }, { once: true });
        
        document.body.appendChild(fileInput);
        fileInput.click();
    },

    async _importFiles(fileList, getFileName, successMessage, options = {}) {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        const shouldShowProgress = options.showProgress || files.length > 8;
        const progress = shouldShowProgress
            ? this.showProgressNotification(options.progressMessage || 'Importing files…', {
                total: files.length,
                type: 'info'
            })
            : null;

        const resolution = { action: null };
        let importedCount = 0;
        let skippedCount = 0;
        let processedCount = 0;

        for (const file of files) {
            processedCount++;
            const targetFileName = getFileName(file);
            if (progress) {
                progress.update({
                    current: processedCount,
                    message: `Importing ${processedCount}/${files.length}: ${targetFileName || file.name}`
                });
            }

            if (!targetFileName) {
                skippedCount++;
                continue;
            }

            const result = await this._resolveImportConflict(targetFileName, resolution);
            if (result === 'skipped') {
                skippedCount++;
                continue;
            }

            const fileData = await this.readFileContent(file);
            const detectedType = this.autoDetectFileType(targetFileName, fileData.isBinary ? null : fileData.content, file.type);
            this.addNewFileWithContent(targetFileName, detectedType, fileData.content, fileData.isBinary);
            importedCount++;
        }

        if (progress) {
            progress.complete('Import complete.');
        }

        this._showImportSummary(importedCount, skippedCount, successMessage);
    },

    importFile() {
        this._openFilePicker('*/*', true, async (fileList) => {
            await this._importFiles(fileList, (file) => file.name);
        });
    },

    importFolder() {
        this._openFilePicker('*/*', true, async (fileList) => {
            await this._importFiles(
                fileList,
                (file) => file.webkitRelativePath || file.name,
                'Successfully imported folder files',
                {
                    showProgress: true,
                    progressMessage: 'Importing folder contents…'
                }
            );
        }, { directory: true });
    },

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
                content: e.target.result,
                isBinary: this.fileTypeUtils.isBinaryFile(file.name, file.type)
            });
            reader.onerror = (e) => reject(e);
            
            if (this.fileTypeUtils.isBinaryFile(file.name, file.type)) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
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
        
        // Initialize saved state and set up change listener
        this.initFileSavedState(fileId, content, fileName);
        this.setupEditorChangeListener(fileId, newEditor);
        
        // Mark panel as open
        this.state.openPanels.add(fileId);
        
        this.bindFilePanelEvents(document.querySelector(`.editor-panel[data-file-id="${fileId}"]`));
        
        this.refreshPanelAndFileTreeUI();
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

    getFileTypeChoices() {
        return [
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
    },

    getFileTypeChoiceLabel(fileType) {
        const choice = this.getFileTypeChoices().find(type => type.value === fileType);
        return choice ? choice.label : 'Text';
    },

    generateFileTypeOptions(selectedType) {
        return this.getFileTypeChoices().map(type =>
            `<option value="${type.value}" ${selectedType === type.value ? 'selected' : ''}>${type.label}</option>`
        ).join('');
    },

    generateFileTypeDropdownOptions(selectedType) {
        return this.getFileTypeChoices().map(type => {
            const selectedClass = selectedType === type.value ? ' is-selected' : '';
            const selectedState = selectedType === type.value ? 'true' : 'false';
            return `<li role="option" aria-selected="${selectedState}"><button type="button" class="file-type-dropdown-option${selectedClass}" data-value="${this.escapeHtmlAttribute(type.value)}">${this.escapeHtml(type.label)}</button></li>`;
        }).join('');
    },

    createFilePanel(fileId, fileName, fileType, content, isBinary) {
        const fileTypeOptions = this.generateFileTypeOptions(fileType);
        const fileTypeDropdownOptions = this.generateFileTypeDropdownOptions(fileType);
        const escapedFileName = this.escapeHtmlAttribute(fileName);
        
        const panelHTML = `
            <div class="editor-panel" data-file-type="${fileType}" data-file-id="${fileId}">
                <div class="panel-header">
                    <div class="panel-move-controls" aria-label="Move panel">
                    <button class="move-panel-btn" data-direction="left" aria-label="Move panel left" title="Move left">←</button>
                    <button class="move-panel-btn" data-direction="right" aria-label="Move panel right" title="Move right">→</button>
                </div>
                    <input type="text" class="file-name-input" value="${escapedFileName}" aria-label="File name">
                    <div class="file-type-dropdown" data-file-type-dropdown>
                        <button type="button" class="file-type-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">${this.escapeHtml(this.getFileTypeChoiceLabel(fileType))}</button>
                        <ul class="file-type-dropdown-list" role="listbox" tabindex="-1" hidden>
                            ${fileTypeDropdownOptions}
                        </ul>
                        <select class="file-type-selector visually-hidden-select" aria-label="File type">
                            ${fileTypeOptions}
                        </select>
                    </div>
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
        const supportsFormatting = this.supportsFormattingForType(fileType);
        const hasExpandPreview = this.hasExpandPreview(fileType);
        
        let toolbarHTML = '<div class="editor-toolbar">';
        
        if (isEditable) {
            toolbarHTML += this.htmlGenerators.toolbarButton('🗑️', 'Clear', 'clear-btn', 'Clear content', 'Clear');
            toolbarHTML += this.htmlGenerators.toolbarButton('📋', 'Paste', 'paste-btn', 'Paste from clipboard', 'Paste');
            toolbarHTML += this.htmlGenerators.toolbarButton('📄', 'Copy', 'copy-btn', 'Copy to clipboard', 'Copy');
            toolbarHTML += this.htmlGenerators.toolbarButton('🔎', 'Search', 'search-btn', 'Search in file', 'Search in file');
            if (supportsFormatting) {
                toolbarHTML += this.htmlGenerators.toolbarButton('✨', 'Format', 'format-btn', 'Format code', 'Format code');
            }
        }
        
        if (hasExpandPreview) {
            const expandLabel = isEditable ? "Expand code view" : "View media";
            const expandTitle = isEditable ? "Expand" : "View";
            toolbarHTML += this.htmlGenerators.toolbarButton('🔍', expandTitle, 'expand-btn', expandLabel, expandTitle);
        }
        
        toolbarHTML += this.htmlGenerators.toolbarButton('💾', 'Export', 'export-btn', 'Export file', 'Export');
        toolbarHTML += this.htmlGenerators.toolbarButton('📁', 'Collapse', 'collapse-btn', 'Collapse/Expand editor', 'Collapse/Expand');

        toolbarHTML += '</div>';

        if (isEditable) {
            toolbarHTML += `
                <div class="panel-search" hidden>
                    <input type="search" class="panel-search-input" placeholder="Search in this file" aria-label="Search in this file">
                    <button class="panel-search-next-btn" aria-label="Find next match" title="Find next">Next</button>
                    <button class="panel-search-close-btn" aria-label="Close search" title="Close search">✕</button>
                </div>
            `;
        }

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

    supportsFormattingForType(fileType) {
        return ['html', 'css', 'javascript', 'javascript-module', 'json', 'xml', 'svg'].includes(fileType);
    },

    updateCodeModalFormattingAction(fileType) {
        if (!this.dom.formatCodeBtn) return;

        const supportsFormatting = this.supportsFormattingForType(fileType);
        this.dom.formatCodeBtn.hidden = !supportsFormatting;
        this.dom.formatCodeBtn.disabled = !supportsFormatting;
    },

    getCodeMirrorMode(fileType) {
        return this.fileTypeUtils.getCodeMirrorMode(fileType);
    },

    updateToolbarForFileType(panel, newType) {
        const existingToolbar = panel.querySelector('.editor-toolbar');
        if (existingToolbar) {
            existingToolbar.remove();
        }

        const existingSearch = panel.querySelector('.panel-search');
        if (existingSearch) {
            existingSearch.remove();
        }
        
        const panelHeader = panel.querySelector('.panel-header');
        const newToolbarHTML = this.generateToolbarHTML(newType);
        panelHeader.insertAdjacentHTML('afterend', newToolbarHTML);
        
        this.bindToolbarEvents(panel);
    },

    closeAllFileTypeDropdowns(exceptPanel = null) {
        document.querySelectorAll('.editor-panel .file-type-dropdown').forEach((dropdown) => {
            if (exceptPanel && exceptPanel.contains(dropdown)) {
                return;
            }
            const trigger = dropdown.querySelector('.file-type-dropdown-trigger');
            const list = dropdown.querySelector('.file-type-dropdown-list');
            if (trigger && list) {
                trigger.setAttribute('aria-expanded', 'false');
                list.hidden = true;
            }
        });
    },

    updatePanelFileTypeDropdownUI(panel, fileType) {
        const typeSelector = panel.querySelector('.file-type-selector');
        const trigger = panel.querySelector('.file-type-dropdown-trigger');
        const options = panel.querySelectorAll('.file-type-dropdown-option');
        if (typeSelector) {
            typeSelector.value = fileType;
        }
        if (trigger) {
            trigger.textContent = this.getFileTypeChoiceLabel(fileType);
        }
        options.forEach((option) => {
            const isSelected = option.dataset.value === fileType;
            option.classList.toggle('is-selected', isSelected);
            const listItem = option.closest('li');
            if (listItem) {
                listItem.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            }
        });
    },

    applyFileTypeChange(panel, fileId, newType) {
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

        this.updatePanelFileTypeDropdownUI(panel, newType);
        this.updateToolbarForFileType(panel, newType);
        this.updateMainHtmlSelector();
        this.renderFileTree();
        this.updatePreviewActionButtons();
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
                        this.applyFileTypeChange(panel, fileId, suggestedType);
                    } else {
                        // Update file tree and main HTML selector when filename changes
                        this.renderFileTree();
                        this.updateMainHtmlSelector();
                    }
                    
                    // Check for unsaved changes and update UI
                    this.checkFileModified(fileId, panel);
                }
            });
            
            // Also listen for input changes to detect unsaved filename changes
            fileNameInput.addEventListener('input', () => {
                this.checkFileModified(fileId, panel);
            });
        }
        
        const fileTypeDropdown = panel.querySelector('.file-type-dropdown');
        const fileTypeTrigger = panel.querySelector('.file-type-dropdown-trigger');
        const fileTypeDropdownList = panel.querySelector('.file-type-dropdown-list');

        if (typeSelector) {
            typeSelector.addEventListener('change', (e) => {
                this.applyFileTypeChange(panel, fileId, e.target.value);
            });
        }

        if (fileTypeDropdown && fileTypeTrigger && fileTypeDropdownList) {
            fileTypeTrigger.addEventListener('click', () => {
                const isOpen = fileTypeTrigger.getAttribute('aria-expanded') === 'true';
                this.closeAllFileTypeDropdowns(panel);
                fileTypeTrigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
                fileTypeDropdownList.hidden = isOpen;
            });

            fileTypeDropdownList.addEventListener('click', (event) => {
                const option = event.target.closest('.file-type-dropdown-option');
                if (!option) return;
                this.applyFileTypeChange(panel, fileId, option.dataset.value);
                this.closeAllFileTypeDropdowns();
            });

            fileTypeTrigger.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.closeAllFileTypeDropdowns(panel);
                    fileTypeTrigger.setAttribute('aria-expanded', 'true');
                    fileTypeDropdownList.hidden = false;
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.closeAllFileTypeDropdowns();
                }
            });

            this.updatePanelFileTypeDropdownUI(panel, panel.dataset.fileType || typeSelector?.value || 'text');
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.closePanel(fileId);
            });
        }

        const moveButtons = panel.querySelectorAll('.move-panel-btn');
        moveButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.movePanel(panel, button.dataset.direction);
            });
        });

        panel.addEventListener('pointerdown', () => this.setActiveEditorPanel(panel));

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
     * Initialize the saved state for a file (call when file is first created or opened)
     * @param {string} fileId - The file ID
     * @param {string} content - The initial content
     * @param {string} fileName - The initial file name
     */
    initFileSavedState(fileId, content, fileName) {
        this.state.savedFileStates[fileId] = {
            content: content || '',
            fileName: fileName || ''
        };
    },

    /**
     * Check if a file has been modified from its saved state
     * @param {string} fileId - The file ID
     * @param {HTMLElement} panel - The panel element (optional, will be found if not provided)
     * @returns {boolean} True if the file has unsaved changes
     */
    checkFileModified(fileId, panel = null) {
        if (!panel) {
            panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        }
        if (!panel) return false;
        
        const fileInfo = this.state.files.find(f => f.id === fileId);
        if (!fileInfo) return false;
        
        const savedState = this.state.savedFileStates[fileId];
        const fileNameInput = panel.querySelector('.file-name-input');
        const currentFileName = fileNameInput ? fileNameInput.value : '';
        const currentContent = (fileInfo.editor && fileInfo.editor.getValue) ? fileInfo.editor.getValue() : '';
        
        let isModified = false;
        
        if (savedState) {
            isModified = currentContent !== savedState.content || currentFileName !== savedState.fileName;
        } else {
            // Initialize saved state if it doesn't exist (for files created before tracking was added)
            this.initFileSavedState(fileId, currentContent, currentFileName);
        }
        
        // Update UI to show/hide apply/discard buttons
        this.updateModifiedIndicator(panel, isModified, fileId);
        
        return isModified;
    },

    /**
     * Update the modified indicator and show/hide apply/discard buttons
     * @param {HTMLElement} panel - The panel element
     * @param {boolean} isModified - Whether the file has unsaved changes
     * @param {string} fileId - The file ID
     */
    updateModifiedIndicator(panel, isModified, fileId) {
        // Add or remove modified class from panel
        panel.classList.toggle('file-modified', isModified);
        
        // Update file name input to show modified indicator
        const fileNameInput = panel.querySelector('.file-name-input');
        if (fileNameInput) {
            fileNameInput.classList.toggle('modified', isModified);
        }
        
        // Show/hide apply and discard buttons in toolbar
        const toolbar = panel.querySelector('.editor-toolbar');
        if (!toolbar) return;
        
        let applyBtn = toolbar.querySelector('.apply-changes-btn');
        let discardBtn = toolbar.querySelector('.discard-changes-btn');
        
        if (isModified) {
            // Create buttons if they don't exist
            if (!applyBtn) {
                applyBtn = document.createElement('button');
                applyBtn.className = 'toolbar-btn apply-changes-btn';
                applyBtn.setAttribute('aria-label', 'Apply changes');
                applyBtn.setAttribute('title', 'Apply changes');
                applyBtn.innerHTML = '<span class="btn-icon">✓</span> Apply';
                applyBtn.addEventListener('click', () => this.applyFileChanges(fileId));
                toolbar.insertBefore(applyBtn, toolbar.firstChild);
            }
            
            if (!discardBtn) {
                discardBtn = document.createElement('button');
                discardBtn.className = 'toolbar-btn discard-changes-btn';
                discardBtn.setAttribute('aria-label', 'Discard changes');
                discardBtn.setAttribute('title', 'Discard changes');
                discardBtn.innerHTML = '<span class="btn-icon">✕</span> Discard';
                discardBtn.addEventListener('click', () => this.discardFileChanges(fileId));
                toolbar.insertBefore(discardBtn, applyBtn.nextSibling);
            }
            
            applyBtn.style.display = '';
            discardBtn.style.display = '';
        } else {
            // Hide buttons if they exist
            if (applyBtn) applyBtn.style.display = 'none';
            if (discardBtn) discardBtn.style.display = 'none';
        }
        
        if (isModified) {
            this.state.modifiedFiles.add(fileId);
        } else {
            this.state.modifiedFiles.delete(fileId);
        this.state.selectedFileIds.delete(fileId);
        }

        // Update the file tree to show modified indicator
        this.updateFileTreeModifiedState(fileId, isModified);
    },

    /**
     * Update the file tree to show a modified indicator for a file
     * @param {string} fileId - The file ID
     * @param {boolean} isModified - Whether the file is modified
     */
    updateFileTreeModifiedState(fileId, isModified) {
        const treeFile = this.dom.fileTreeContainer?.querySelector(`.tree-file[data-file-id="${fileId}"]`);
        if (treeFile) {
            treeFile.classList.toggle('file-modified', isModified);
        }
    },

    /**
     * Apply changes to a file (save the current state)
     * @param {string} fileId - The file ID
     */
    applyFileChanges(fileId) {
        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (!panel) return;
        
        const fileInfo = this.state.files.find(f => f.id === fileId);
        if (!fileInfo) return;
        
        const fileNameInput = panel.querySelector('.file-name-input');
        const currentFileName = fileNameInput ? fileNameInput.value : '';
        const currentContent = fileInfo.editor ? fileInfo.editor.getValue() : '';
        
        // Update saved state
        this.state.savedFileStates[fileId] = {
            content: currentContent,
            fileName: currentFileName
        };
        
        // Update file info
        fileInfo.fileName = currentFileName;
        
        // Update UI
        this.checkFileModified(fileId, panel);
        this.renderFileTree();
        this.updateMainHtmlSelector();
        
        this.showNotification('Changes applied successfully', 'success');
    },

    /**
     * Discard changes to a file (revert to saved state)
     * @param {string} fileId - The file ID
     */
    discardFileChanges(fileId) {
        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (!panel) return;
        
        const fileInfo = this.state.files.find(f => f.id === fileId);
        if (!fileInfo) return;
        
        const savedState = this.state.savedFileStates[fileId];
        if (!savedState) return;
        
        // Revert file name
        const fileNameInput = panel.querySelector('.file-name-input');
        if (fileNameInput) {
            fileNameInput.value = savedState.fileName;
        }
        
        // Revert content
        if (fileInfo.editor && fileInfo.editor.setValue) {
            fileInfo.editor.setValue(savedState.content);
        }
        
        // Update file info
        fileInfo.fileName = savedState.fileName;
        
        // Update UI
        this.checkFileModified(fileId, panel);
        this.renderFileTree();
        this.updateMainHtmlSelector();
        
        this.showNotification('Changes discarded', 'info');
    },

    /**
     * Set up content change listeners for a file editor
     * @param {string} fileId - The file ID
     * @param {Object} editor - The CodeMirror editor instance
     */
    setupEditorChangeListener(fileId, editor) {
        if (!editor || !editor.on) return;

        editor.on('change', (_cm, changeObj) => {
            const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
            this.checkFileModified(fileId, panel);

            const fileInfo = this.state.files.find(f => f.id === fileId);
            const fileType = fileInfo ? fileInfo.type : panel?.dataset.fileType;
            if (!fileType || !this.isEditableFileType(fileType)) return;
            if (this.state.formattingEditors.has(fileId)) return;

            const origin = changeObj && changeObj.origin ? changeObj.origin : '';
            const isUserInput = ['+input', '+delete', 'paste', 'cut'].includes(origin);
            if (!isUserInput) return;

            this.scheduleAutoFormat(fileId, editor, fileType);
        });
    },

    /**
     * Close a file panel (hide it) - does NOT delete the file
     * @param {string} fileId - The file ID to close
     */

    clearPendingAutoFormat(fileId) {
        const timer = this.state.autoFormatTimers.get(fileId);
        if (timer) {
            clearTimeout(timer);
            this.state.autoFormatTimers.delete(fileId);
        }
        this.state.formattingEditors.delete(fileId);
    },

    closePanel(fileId) {
        // Use .editor-panel selector to avoid matching tree-file elements
        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (panel) {
            this.clearPendingAutoFormat(fileId);
            panel.style.display = 'none';
            this.state.openPanels.delete(fileId);
            this.renderFileTree();
            this.updatePanelMoveButtonsVisibility();
            this.updatePreviewActionButtons();
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
        this.updatePanelMoveButtonsVisibility();
        this.updatePreviewActionButtons();
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

        this.clearPendingAutoFormat(fileId);
        
        this.state.files = this.state.files.filter(f => f.id !== fileId);
        this.state.openPanels.delete(fileId);
        
        // Clean up saved state
        delete this.state.savedFileStates[fileId];
        this.state.modifiedFiles.delete(fileId);
        this.state.selectedFileIds.delete(fileId);
        
        if (fileId === 'default-html') {
            this.state.editors.html = null;
        } else if (fileId === 'default-css') {
            this.state.editors.css = null;
        } else if (fileId === 'default-js') {
            this.state.editors.js = null;
        }
        
        this.refreshPanelAndFileTreeUI();
    },

    refreshPanelAndFileTreeUI() {
        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
        this.renderFileTree();
        this.updatePanelMoveButtonsVisibility();
        this.updatePreviewActionButtons();
    },

    async clearAllFiles() {
        // Check if there are any files to clear
        if (this.state.files.length === 0) {
            this.showNotification('No files to clear', 'info');
            return;
        }

        // Confirm with the user using custom dialog
        const fileCount = this.state.files.length;
        const confirmed = await this.showConfirmDialog(
            `Are you sure you want to delete all ${fileCount} file(s)? This action cannot be undone.`
        );
        
        if (!confirmed) {
            return;
        }

        // Close all open panels first
        const allFileIds = [...this.state.files.map(f => f.id)];
        allFileIds.forEach(fileId => {
            const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
            if (panel) {
                panel.remove();
            }
        });

        // Clear pending auto-format timers
        this.state.files.forEach(file => this.clearPendingAutoFormat(file.id));

        // Clear the files array
        this.state.files = [];
        this.state.openPanels.clear();
        this.state.savedFileStates = {};
        this.state.modifiedFiles.clear();
        this.state.selectedFileIds.clear();
        this.state.selectedFolderPaths.clear();

        // Clear default editors
        this.state.editors.html = null;
        this.state.editors.css = null;
        this.state.editors.js = null;

        // Clear folders and expanded folders
        this.state.folders = [];
        this.state.expandedFolders.clear();

        // Reset the next file ID
        this.state.nextFileId = 1;

        // Update UI
        this.refreshPanelAndFileTreeUI();

        this.showNotification('All files cleared successfully', 'success');
    },

    updatePanelMoveButtonsVisibility() {
        const allPanels = Array.from(document.querySelectorAll('.editor-panel[data-file-id]'));
        const visiblePanels = allPanels.filter(panel => window.getComputedStyle(panel).display !== 'none');

        allPanels.forEach((panel) => {
            const leftBtn = panel.querySelector('.move-panel-btn[data-direction="left"]');
            const rightBtn = panel.querySelector('.move-panel-btn[data-direction="right"]');

            if (leftBtn) leftBtn.hidden = true;
            if (rightBtn) rightBtn.hidden = true;
        });

        visiblePanels.forEach((panel, index) => {
            const leftBtn = panel.querySelector('.move-panel-btn[data-direction="left"]');
            const rightBtn = panel.querySelector('.move-panel-btn[data-direction="right"]');

            if (leftBtn) {
                leftBtn.hidden = index === 0;
            }
            if (rightBtn) {
                rightBtn.hidden = index === visiblePanels.length - 1;
            }
        });

        this.updatePanelMoveButtonDirections();
    },

    updateRemoveButtonsVisibility() {
        const allPanels = document.querySelectorAll('.editor-panel[data-file-id]');
        const actualPanels = Array.from(allPanels);
        
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
                    
                    // Initialize saved state for existing files
                    const content = editor.getValue ? editor.getValue() : '';
                    this.initFileSavedState(fileId, content, fileName);
                    this.setupEditorChangeListener(fileId, editor);
                }
            }
            
            this.bindFilePanelEvents(panel);
            });
        this.refreshPanelAndFileTreeUI();
        this.getActiveEditorPanel();
    },

    bindToolbarEvents(panel) {
        const clearBtn = panel.querySelector('.clear-btn');
        const pasteBtn = panel.querySelector('.paste-btn');
        const copyBtn = panel.querySelector('.copy-btn');
        const formatBtn = panel.querySelector('.format-btn');
        const expandBtn = panel.querySelector('.expand-btn');
        const exportBtn = panel.querySelector('.export-btn');
        const collapseBtn = panel.querySelector('.collapse-btn');
        const { searchBtn, searchInput, searchNextBtn, searchCloseBtn } = this.getPanelSearchElements(panel);
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.clearEditor(panel);
            });
        }
        
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.pasteFromClipboard(panel);
            });
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.copyToClipboard(panel);
            });
        }

        if (formatBtn) {
            formatBtn.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.formatPanelCode(panel, false);
            });
        }
        
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.expandCode(panel);
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.exportFile(panel);
            });
        }
        
        if (collapseBtn) {
            collapseBtn.setAttribute('aria-expanded', 'true');
            collapseBtn.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.toggleEditorCollapse(panel);
            });
        }

        if (searchBtn) {
            searchBtn.setAttribute('aria-expanded', 'false');
            searchBtn.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.togglePanelSearch(panel);
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchInPanel(panel, searchInput.value, false));
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchInPanel(panel, searchInput.value, true);
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closePanelSearch(panel);
                }
            });
        }

        if (searchNextBtn && searchInput) {
            searchNextBtn.addEventListener('click', () => this.searchInPanel(panel, searchInput.value, true));
        }

        if (searchCloseBtn) {
            searchCloseBtn.addEventListener('click', () => this.closePanelSearch(panel));
        }
    },

    setActiveEditorPanel(panel) {
        if (!panel || !panel.dataset.fileId) return;
        this.state.activePanelId = panel.dataset.fileId;
        document.querySelectorAll('.editor-panel.is-active').forEach((active) => {
            if (active !== panel) active.classList.remove('is-active');
        });
        panel.classList.add('is-active');
    },

    getActiveEditorPanel() {
        if (this.state.activePanelId) {
            const panel = document.querySelector(`.editor-panel[data-file-id="${this.state.activePanelId}"]`);
            if (panel) return panel;
        }

        const fallback = document.querySelector('.editor-panel[data-file-id]');
        if (fallback) {
            this.setActiveEditorPanel(fallback);
        }
        return fallback;
    },

    openPanelSearch(panel) {
        const { searchContainer } = this.getPanelSearchElements(panel);
        if (!searchContainer) return;
        this.setPanelSearchActive(panel, true);
    },


    formatPanelCode(panel, isAutomatic = false) {
        if (!panel) return false;

        const fileId = panel.dataset.fileId;
        const fileType = panel.dataset.fileType;
        const editor = this.getEditorFromPanel(panel);
        if (!fileId || !editor || !this.isEditableFileType(fileType) || !this.supportsFormattingForType(fileType)) return false;

        return this.formatEditorContent(fileId, editor, fileType, {
            isAutomatic,
            silent: isAutomatic,
            preserveCursor: true,
        });
    },

    scheduleAutoFormat(fileId, editor, fileType) {
        if (!fileId || !editor || !this.isEditableFileType(fileType) || !this.supportsFormattingForType(fileType)) return;

        const existingTimer = this.state.autoFormatTimers.get(fileId);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(() => {
            this.state.autoFormatTimers.delete(fileId);
            this.formatEditorContent(fileId, editor, fileType, {
                isAutomatic: true,
                silent: true,
                preserveCursor: true,
            });
        }, 900);

        this.state.autoFormatTimers.set(fileId, timer);
    },

    formatEditorContent(fileId, editor, fileType, options = {}) {
        if (!editor || !editor.getValue || !editor.setValue) return false;
        if (this.state.formattingEditors.has(fileId)) return false;

        const currentContent = editor.getValue();
        if (!currentContent || currentContent.length > 150000) return false;

        const formattedContent = this.formatCodeByType(currentContent, fileType);
        if (!formattedContent || formattedContent === currentContent) return false;

        let cursorIndex = null;
        if (options.preserveCursor && editor.getCursor && editor.indexFromPos && editor.posFromIndex) {
            cursorIndex = editor.indexFromPos(editor.getCursor());
        }

        this.state.formattingEditors.add(fileId);

        try {
            editor.setValue(formattedContent);

            if (cursorIndex !== null && editor.posFromIndex && editor.setCursor) {
                const safeIndex = Math.min(cursorIndex, formattedContent.length);
                editor.setCursor(editor.posFromIndex(safeIndex));
            }

            if (!options.silent && !options.isAutomatic) {
                this.showNotification('Code formatted', 'success');
            }

            const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
            this.checkFileModified(fileId, panel);
            return true;
        } catch (error) {
            console.error('Code formatting failed:', error);
            if (!options.silent) {
                this.showNotification('Unable to format code', 'error');
            }
            return false;
        } finally {
            setTimeout(() => this.state.formattingEditors.delete(fileId), 0);
        }
    },

    formatCodeByType(content, fileType) {
        try {
            if (fileType === 'json') {
                return JSON.stringify(JSON.parse(content), null, 2);
            }

            if ((fileType === 'javascript' || fileType === 'javascript-module') && typeof window.js_beautify === 'function') {
                return window.js_beautify(content, { indent_size: 2, preserve_newlines: true });
            }

            if (fileType === 'css' && typeof window.css_beautify === 'function') {
                return window.css_beautify(content, { indent_size: 2 });
            }

            if ((fileType === 'html' || fileType === 'xml' || fileType === 'svg') && typeof window.html_beautify === 'function') {
                return window.html_beautify(content, { indent_size: 2, wrap_line_length: 120 });
            }

            if (fileType === 'markdown' || fileType === 'text') {
                return content
                    .split('\n')
                    .map(line => line.replace(/[ \t]+$/g, ''))
                    .join('\n');
            }
        } catch (error) {
            console.warn('formatCodeByType failed for', fileType, error);
            return content;
        }

        return content;
    },

    getPanelSearchElements(panel) {
        return {
            searchContainer: panel.querySelector('.panel-search'),
            searchBtn: panel.querySelector('.search-btn'),
            searchInput: panel.querySelector('.panel-search-input'),
            searchNextBtn: panel.querySelector('.panel-search-next-btn'),
            searchCloseBtn: panel.querySelector('.panel-search-close-btn'),
        };
    },

    setPanelSearchActive(panel, isActive) {
        const { searchContainer, searchBtn, searchInput } = this.getPanelSearchElements(panel);
        if (!searchContainer || !searchInput) return;

        if (isActive) {
            searchContainer.removeAttribute('hidden');
            panel.classList.add('search-active');
            if (searchBtn) {
                searchBtn.classList.add('active');
                searchBtn.setAttribute('aria-expanded', 'true');
            }
            searchInput.focus();
            searchInput.select();
            return;
        }

        searchInput.value = '';
        searchInput.classList.remove('no-match');
        searchContainer.setAttribute('hidden', 'hidden');
        panel.classList.remove('search-active');
        if (searchBtn) {
            searchBtn.classList.remove('active');
            searchBtn.setAttribute('aria-expanded', 'false');
        }
    },

    togglePanelSearch(panel) {
        const { searchContainer } = this.getPanelSearchElements(panel);
        if (!searchContainer) return;

        const willOpen = searchContainer.hasAttribute('hidden');
        this.setPanelSearchActive(panel, willOpen);
    },

    closePanelSearch(panel) {
        this.setPanelSearchActive(panel, false);
    },

    getSearchStartIndex(editor, findNext) {
        if (!findNext || !editor?.getCursor || !editor?.indexFromPos) {
            return 0;
        }

        try {
            return editor.indexFromPos(editor.getCursor()) + 1;
        } catch (_e) {
            return 0;
        }
    },

    selectEditorSearchMatch(editor, matchIndex, queryLength) {
        if (editor.posFromIndex && editor.setSelection) {
            const from = editor.posFromIndex(matchIndex);
            const to = editor.posFromIndex(matchIndex + queryLength);
            editor.setSelection(from, to);
            if (editor.scrollIntoView) {
                editor.scrollIntoView({ from, to }, 100);
            }
            if (editor.focus) {
                editor.focus();
            }
            return true;
        }

        if (typeof editor.selectionStart === 'number' && typeof editor.setSelectionRange === 'function') {
            editor.focus();
            editor.setSelectionRange(matchIndex, matchIndex + queryLength);
            return true;
        }

        return false;
    },

    searchInPanel(panel, query, findNext = false) {
        const editor = this.getEditorFromPanel(panel);
        const { searchInput } = this.getPanelSearchElements(panel);
        const trimmedQuery = (query || '').trim();

        if (searchInput) {
            searchInput.classList.remove('no-match');
        }

        if (!editor || !trimmedQuery) return;

        const content = editor.getValue ? editor.getValue() : '';
        if (!content) return;

        const lowerContent = content.toLowerCase();
        const lowerQuery = trimmedQuery.toLowerCase();
        const startIndex = this.getSearchStartIndex(editor, findNext);

        let matchIndex = lowerContent.indexOf(lowerQuery, startIndex);
        if (matchIndex === -1 && startIndex > 0) {
            matchIndex = lowerContent.indexOf(lowerQuery);
        }

        if (matchIndex === -1) {
            if (searchInput) {
                searchInput.classList.add('no-match');
            }
            this.showNotification(`No match found for "${trimmedQuery}"`, 'info');
            return;
        }

        this.selectEditorSearchMatch(editor, matchIndex, trimmedQuery.length);
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

            const fileNameInput = panel.querySelector('.file-name-input');
            const fileType = panel.dataset.fileType;
            
            if (fileNameInput && fileNameInput.value.trim()) {
                fileName = fileNameInput.value.trim();
            } else {
                fileName = 'untitled' + (this.constants.FILE_TYPES.DEFAULT_EXTENSIONS[fileType] || '.txt');
            }

            mimeType = this.fileTypeUtils.getMimeTypeFromFileType(fileType) || 'text/plain';

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

        const fileNameInput = panel.querySelector('.file-name-input');
        
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
            this.setActiveEditorPanel(sourcePanel);
            this.updateCodeModalFormattingAction(sourcePanel?.dataset.fileType || 'text');

            this.updateCodeModalHeaderAndButtons(fileName);

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
                        extraKeys: {
                            'Ctrl-S': () => this.saveCodeModal(false),
                            'Cmd-S': () => this.saveCodeModal(false),
                        },
                    });
                } else {
                    this.state.codeModalEditor.setOption('mode', language);
                    this.state.codeModalEditor.setOption('readOnly', false);
                }

                this.state.codeModalEditor.setValue(content);
                this.state.codeModalEditor.focus();
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
                editorTextarea.focus();
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


    formatCodeModalEditor() {
        try {
            if (!this.state.currentCodeModalSource) return;

            const sourceFileType = this.state.currentCodeModalSource.dataset.fileType || 'text';
            if (!this.supportsFormattingForType(sourceFileType)) return;
            let currentContent = '';

            if (window.CodeMirror && this.state.codeModalEditor) {
                currentContent = this.state.codeModalEditor.getValue();
            } else {
                const editorTextarea = document.getElementById('code-modal-editor');
                currentContent = editorTextarea ? editorTextarea.value : '';
            }

            const formattedContent = this.formatCodeByType(currentContent, sourceFileType);
            if (!formattedContent || formattedContent === currentContent) return;

            if (window.CodeMirror && this.state.codeModalEditor) {
                this.state.codeModalEditor.setValue(formattedContent);
                this.state.codeModalEditor.focus();
            } else {
                const editorTextarea = document.getElementById('code-modal-editor');
                if (editorTextarea) {
                    editorTextarea.value = formattedContent;
                    editorTextarea.focus();
                }
            }

            this.showNotification('Code formatted', 'success');
        } catch (error) {
            console.error('Error formatting code modal content:', error);
            this.showNotification('Unable to format code', 'error');
        }
    },

    saveCodeModal(closeAfterSave = true) {
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

            if (closeAfterSave) {
                this.closeCodeModal();
            } else {
                this.showNotification('Changes applied', 'success');
            }
        } catch (error) {
            console.error('Error saving code from modal:', error);
        }
    },

    toggleEditorCollapse(panel) {
        const collapseBtn = panel.querySelector('.collapse-btn');
        const toolbarButtons = panel.querySelectorAll('.editor-toolbar .toolbar-btn:not(.collapse-btn)');

        if (!collapseBtn) return;

        const isCollapsed = panel.classList.contains('toolbar-collapsed');
        const willCollapse = !isCollapsed;

        panel.classList.toggle('toolbar-collapsed', willCollapse);
        collapseBtn.classList.toggle('collapsed', willCollapse);
        collapseBtn.setAttribute('aria-expanded', willCollapse ? 'false' : 'true');
        collapseBtn.innerHTML = willCollapse
            ? '<span class="btn-icon">📂</span> Actions'
            : '<span class="btn-icon">📁</span> Collapse';

        toolbarButtons.forEach((btn) => {
            btn.hidden = willCollapse;
        });

        if (willCollapse) {
            this.closePanelSearch(panel);
        }
    },

    getEditorFromPanel(panel) {
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

    showProgressNotification(message, options = {}) {
        return this.notificationSystem.showProgress(message, options);
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
            const file = this.fileSystemUtils.findFile(fileSystem, fileName, currentFilePath);
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
            const file = this.fileSystemUtils.findFile(fileSystem, filename, currentFilePath);
            if (file && (file.type === 'image' || file.type === 'svg')) {
                const src = file.isBinary ? file.content : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(file.content)}`;
                return `background-image: url("${src}")`;
            }
            return match;
        });
        
        cssContent = cssContent.replace(/@font-face\s*{[^}]*src\s*:\s*url\s*\(\s*["']?([^"')]+)["']?\s*\)[^}]*}/gi, (match, filename) => {
            const file = this.fileSystemUtils.findFile(fileSystem, filename, currentFilePath);
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
            '    <title>Preview</title>\n' +
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
        return this.generateMultiFilePreview();
    },

    renderPreview(target) {
        const availability = this.getPreviewAvailability();
        if (!availability.allowed) {
            this.showNotification('No HTML file found. Import or create an HTML file to preview.', 'warn');
            this.updatePreviewActionButtons();
            return;
        }

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
                this.showNotification('Preview opened in a new tab.', 'success');
            } catch (e) {
                console.error("Failed to create or open new tab:", e);
                this.showNotification('Unable to open preview tab. Check popup settings and try again.', 'error');
            }
        }
    },

    toggleModal(show) {
        this.dom.modalOverlay.setAttribute('aria-hidden', !show);
        if (show) {
            this.dom.modalConsolePanel.classList.add('hidden');
            this.dom.toggleConsoleBtn.classList.remove('active');
            this.dom.toggleConsoleBtn.textContent = '📋 Console';
        } else {
            // Clean up when closing the modal
            // Completely remove and recreate the iframe to ensure full cleanup
            // This stops all scripts, event listeners, and timers running in the iframe
            const iframe = this.dom.previewFrame;
            const parent = iframe.parentNode;
            iframe.removeAttribute('srcdoc');
            iframe.src = 'about:blank';
            const newIframe = iframe.cloneNode(false);
            newIframe.removeAttribute('srcdoc');
            newIframe.src = 'about:blank';
            parent.replaceChild(newIframe, iframe);
            
            // Update the reference to the new iframe
            this.dom.previewFrame = newIframe;
            this.console.previewFrame = newIframe;
            
            // Clear console
            this.console.clear();
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

    movePanel(panel, direction) {
        const parent = panel?.parentNode;
        if (!parent) return;

        const panels = Array.from(parent.querySelectorAll('.editor-panel[data-file-id]'));
        const currentIndex = panels.indexOf(panel);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= panels.length) {
            return;
        }

        const targetPanel = panels[targetIndex];
        if (!targetPanel) return;

        if (direction === 'left') {
            parent.insertBefore(panel, targetPanel);
        } else {
            parent.insertBefore(targetPanel, panel);
        }

        this.updateFilesOrder();
    },

    updateFilesOrder() {
        const panels = Array.from(document.querySelectorAll('.editor-panel[data-file-id]'));
        const newFilesOrder = [];
        
        panels.forEach(panel => {
            const fileId = panel.dataset.fileId;
            const fileInfo = this.state.files.find(f => f.id === fileId);
            if (fileInfo) {
                newFilesOrder.push(fileInfo);
            }
        });
        
        this.state.files = newFilesOrder;
        this.updatePanelMoveButtonsVisibility();
    },

    async exportZip() {
        if (this.state.files.length === 0) {
            this.showNotification('Nothing to export. Add files before exporting a ZIP.', 'warn');
            return;
        }

        const progress = this.showProgressNotification('Preparing ZIP export…', {
            type: 'info',
            total: Math.max(this.state.files.length, 1)
        });

        try {
            if (typeof JSZip === 'undefined') {
                progress.fail('ZIP export failed: JSZip library not available.');
                this.showNotification('JSZip library not available', 'error');
                return;
            }
            
            const zip = new JSZip();
            
            this.state.files.forEach((file, index) => {
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

                progress.update({
                    current: index + 1,
                    message: `Adding ${index + 1}/${this.state.files.length}: ${filename}`
                });
            });
            
            progress.update({ message: 'Generating ZIP archive…' });
            const blob = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'project.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            progress.complete('ZIP export complete.');
            this.showNotification('Project exported as ZIP successfully!', 'success');
            
        } catch (error) {
            console.error('Error exporting ZIP:', error);
            progress.fail('ZIP export failed.');
            this.showNotification('Failed to export project as ZIP', 'error');
        }
    },
    
    async importZip() {
        if (typeof JSZip === 'undefined') {
            this.showNotification('JSZip library not available', 'error');
            return;
        }
        
        this._openFilePicker('.zip', false, async (fileList) => {
            const file = fileList[0];
            if (!file) return;

            let progress = null;
            
            try {
                const zip = await JSZip.loadAsync(file);
                const zipEntries = Object.entries(zip.files).filter(([, zipEntry]) => !zipEntry.dir);
                progress = this.showProgressNotification('Reading ZIP contents…', {
                    total: Math.max(zipEntries.length, 1),
                    type: 'info'
                });
                
                const resolution = { action: null };
                let importedCount = 0;
                let skippedCount = 0;
                let processedCount = 0;

                for (const [relativePath, zipEntry] of zipEntries) {
                    processedCount++;
                    progress.update({
                        current: processedCount,
                        message: `Importing ${processedCount}/${zipEntries.length}: ${relativePath}`
                    });
                    
                    const result = await this._resolveImportConflict(relativePath, resolution);
                    if (result === 'skipped') {
                        skippedCount++;
                        continue;
                    }
                    
                    const extension = relativePath.split('.').pop().toLowerCase();
                    const isBinary = this.fileTypeUtils.isBinaryFile(relativePath, '');
                    let content;
                    
                    if (isBinary) {
                        const base64Content = await zipEntry.async('base64');
                        const mimeType = this.fileTypeUtils.getMimeTypeFromExtension(extension);
                        content = `data:${mimeType};base64,${base64Content}`;
                    } else {
                        content = await zipEntry.async('string');
                    }
                    
                    const fileType = this.fileTypeUtils.getTypeFromExtension(extension);
                    this.addNewFileWithContent(relativePath, fileType, content, isBinary);
                    importedCount++;
                }
                progress.complete('ZIP import complete.');
                
                this._showImportSummary(importedCount, skippedCount, 'ZIP project imported successfully!');
                
            } catch (error) {
                console.error('Error processing ZIP file:', error);
                if (progress) progress.fail('ZIP import failed.');
                this.showNotification('Failed to import ZIP file', 'error');
            }
        });
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
            const safeFileName = CodePreviewer.escapeHtmlAttribute(fileName);
            const safeContent = CodePreviewer.escapeHtmlAttribute(content);
            const containers = {
                image: `<div class="media-preview-container">
                    <img src="${safeContent}" alt="${safeFileName}">
                </div>`,
                audio: `<div class="media-preview-container">
                    <h3>${safeFileName}</h3>
                    <audio controls>
                        <source src="${safeContent}">
                        Your browser does not support the audio element.
                    </audio>
                </div>`,
                video: `<div class="media-preview-container">
                    <h3>${safeFileName}</h3>
                    <video controls>
                        <source src="${safeContent}">
                        Your browser does not support the video element.
                    </video>
                </div>`,
                pdf: `<div class="media-preview-container">
                    <h3>${safeFileName}</h3>
                    <object data="${safeContent}" type="application/pdf">
                        <p>PDF failed to load. <a href="${safeContent}" target="_blank">Open in new tab</a></p>
                    </object>
                </div>`,
                svg: (content, fileName, isBinary) => {
                    const svgDataUrl = isBinary ? content : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
                    const safeSvgUrl = CodePreviewer.escapeHtmlAttribute(svgDataUrl);
                    return `<div class="media-preview-container">
                        <h3>${safeFileName}</h3>
                        <img src="${safeSvgUrl}" alt="${safeFileName}">
                    </div>`;
                },
                default: `<div class="media-preview-container">
                    <h3>${safeFileName}</h3>
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
        container: null,
        progressId: 0,

        getContainer() {
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'notification-container';
                document.body.appendChild(this.container);
            }
            return this.container;
        },

        show(message, type = 'info') {
            const container = this.getContainer();

            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-header">
                    <span class="notification-message">${CodePreviewer.escapeHtml(message)}</span>
                    <button class="notification-close-btn" aria-label="Close notification" title="Close">✕</button>
                </div>
            `;

            container.appendChild(notification);

            const closeBtn = notification.querySelector('.notification-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => dismiss());
            }

            const dismiss = () => {
                if (notification.classList.contains('notification-hiding')) return;
                notification.classList.add('notification-hiding');
                notification.addEventListener('animationend', () => {
                    notification.remove();
                }, { once: true });
            };

            setTimeout(dismiss, 3000);
        },

        showProgress(message, { type = 'info', total = 100 } = {}) {
            const container = this.getContainer();
            const notification = document.createElement('div');
            notification.className = `notification notification-${type} notification-progress`;
            notification.dataset.progressId = String(++this.progressId);

            notification.innerHTML = `
                <div class="notification-header">
                    <span class="notification-message">${CodePreviewer.escapeHtml(message)}</span>
                    <button class="notification-close-btn" aria-label="Close notification" title="Close">✕</button>
                </div>
                <div class="notification-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${Math.max(total, 1)}" aria-valuenow="0">
                    <div class="notification-progress-fill"></div>
                </div>
            `;

            container.appendChild(notification);

            const messageEl = notification.querySelector('.notification-message');
            const progressBar = notification.querySelector('.notification-progress-track');
            const progressFill = notification.querySelector('.notification-progress-fill');
            const closeBtn = notification.querySelector('.notification-close-btn');
            const maxValue = Math.max(total, 1);
            let currentValue = 0;

            const dismiss = () => {
                if (notification.classList.contains('notification-hiding')) return;
                notification.classList.add('notification-hiding');
                notification.addEventListener('animationend', () => notification.remove(), { once: true });
            };

            if (closeBtn) {
                closeBtn.addEventListener('click', () => dismiss());
            }

            const update = ({ current, message: nextMessage, type: nextType } = {}) => {
                if (typeof current === 'number') {
                    currentValue = Math.max(0, Math.min(current, maxValue));
                    const percentage = (currentValue / maxValue) * 100;
                    progressFill.style.width = `${percentage}%`;
                    progressBar.setAttribute('aria-valuenow', String(currentValue));
                }
                if (typeof nextMessage === 'string' && messageEl) {
                    messageEl.textContent = nextMessage;
                }
                if (typeof nextType === 'string') {
                    notification.classList.remove('notification-info', 'notification-success', 'notification-warn', 'notification-error');
                    notification.classList.add(`notification-${nextType}`);
                }
            };

            update({ current: 0, message });

            return {
                update,
                complete: (doneMessage = 'Completed') => {
                    update({ current: maxValue, message: doneMessage, type: 'success' });
                    setTimeout(dismiss, 1200);
                },
                fail: (errorMessage = 'Failed') => {
                    update({ message: errorMessage, type: 'error' });
                    setTimeout(dismiss, 3000);
                },
                dismiss
            };
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
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.ico)["']([^>]*?)>/gi,
                types: ['image'],
                replace: (file, match) => match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${file.content}"`)
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

    setupMainHtmlDropdownEvents() {
        if (!this.dom.mainHtmlDropdownTrigger || !this.dom.mainHtmlDropdownList || !this.dom.mainHtmlDropdown) return;

        this.dom.mainHtmlDropdownTrigger.addEventListener('click', () => {
            this.toggleMainHtmlDropdown();
        });

        this.dom.mainHtmlDropdownList.addEventListener('click', (event) => {
            const optionButton = event.target.closest('.main-html-dropdown-option');
            if (!optionButton) return;
            this.selectMainHtmlOption(optionButton.dataset.value || '');
        });

        document.addEventListener('click', (event) => {
            if (!this.dom.mainHtmlDropdown.contains(event.target)) {
                this.closeMainHtmlDropdown();
            }
        });

        this.dom.mainHtmlDropdownTrigger.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.openMainHtmlDropdown();
            }
        });

        this.dom.mainHtmlDropdownList.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.closeMainHtmlDropdown(true);
            }
        });
    },

    toggleMainHtmlDropdown() {
        if (!this.dom.mainHtmlDropdownList || !this.dom.mainHtmlDropdownTrigger) return;
        const isOpen = this.dom.mainHtmlDropdownTrigger.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
            this.closeMainHtmlDropdown(true);
        } else {
            this.openMainHtmlDropdown();
        }
    },

    openMainHtmlDropdown() {
        if (!this.dom.mainHtmlDropdownList || !this.dom.mainHtmlDropdownTrigger) return;
        this.dom.mainHtmlDropdownList.hidden = false;
        this.dom.mainHtmlDropdownTrigger.setAttribute('aria-expanded', 'true');
    },

    closeMainHtmlDropdown(focusTrigger = false) {
        if (!this.dom.mainHtmlDropdownList || !this.dom.mainHtmlDropdownTrigger) return;
        this.dom.mainHtmlDropdownList.hidden = true;
        this.dom.mainHtmlDropdownTrigger.setAttribute('aria-expanded', 'false');
        if (focusTrigger) {
            this.dom.mainHtmlDropdownTrigger.focus();
        }
    },

    selectMainHtmlOption(fileId) {
        this.state.mainHtmlFile = fileId;
        if (this.dom.mainHtmlSelect) {
            this.dom.mainHtmlSelect.value = fileId;
        }
        this.updateMainHtmlSelector();
        this.closeMainHtmlDropdown(true);
    },

    updateMainHtmlSelector() {
        const htmlFiles = this.state.files.filter(f => f.type === 'html');

        if (htmlFiles.length <= 1) {
            this.dom.mainHtmlSelector.style.display = 'none';
            this.closeMainHtmlDropdown();
            return;
        }

        this.dom.mainHtmlSelector.style.display = 'flex';
        this.dom.mainHtmlSelect.innerHTML = '<option value="">Auto-detect</option>';

        const options = [{ value: '', label: 'Auto-detect' }];

        htmlFiles.forEach(file => {
            const fileName = this.getFileNameFromPanel(file.id) || `file_${file.id}`;
            const option = document.createElement('option');
            option.value = file.id;
            option.textContent = fileName;
            this.dom.mainHtmlSelect.appendChild(option);
            options.push({ value: file.id, label: fileName });
        });

        const selectedValue = options.some(o => o.value === this.state.mainHtmlFile) ? this.state.mainHtmlFile : '';
        this.state.mainHtmlFile = selectedValue;
        this.dom.mainHtmlSelect.value = selectedValue;

        if (this.dom.mainHtmlDropdownList) {
            this.dom.mainHtmlDropdownList.innerHTML = options.map((option) => {
                const selectedClass = option.value === selectedValue ? ' is-selected' : '';
                const checked = option.value === selectedValue ? 'true' : 'false';
                return `<li role="option" aria-selected="${checked}"><button type="button" class="main-html-dropdown-option${selectedClass}" data-value="${this.escapeHtmlAttribute(option.value)}">${this.escapeHtml(option.label)}</button></li>`;
            }).join('');
        }

        if (this.dom.mainHtmlDropdownTrigger) {
            const selectedOption = options.find(option => option.value === selectedValue) || options[0];
            this.dom.mainHtmlDropdownTrigger.textContent = selectedOption.label;
        }
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
                const bytes = new TextEncoder().encode(jsonString);
                const binaryChars = new Array(bytes.length);
                for (let i = 0; i < bytes.length; i++) binaryChars[i] = String.fromCharCode(bytes[i]);
                const base64Data = btoa(binaryChars.join(''));
                fileSystemScript = `
                    const virtualFileSystemData = "${base64Data}";
                    const rawBytes = atob(virtualFileSystemData);
                    const bytes = new Uint8Array(rawBytes.length);
                    for (let i = 0; i < rawBytes.length; i++) bytes[i] = rawBytes.charCodeAt(i);
                    const virtualFileSystem = JSON.parse(new TextDecoder().decode(bytes));
                    const mainHtmlPath = "${mainHtmlPath}";
                `;
            } else {
                fileSystemScript = `
                    const virtualFileSystem = {};
                    const mainHtmlPath = "index.html";
                `;
            }
            
            // Use the centralized code generators from fileSystemUtils
            const fsUtils = CodePreviewer.fileSystemUtils;
            const resolvePathCode = fsUtils.generateResolvePathCode();
            const findFileCode = fsUtils.generateFindFileCode();
            const getCurrentFilePathCode = fsUtils.generateGetCurrentFilePathCode();
            const fetchOverrideCode = fsUtils.generateFetchOverrideCode();
            const xhrOverrideCode = fsUtils.generateXHROverrideCode();
            const imageOverrideCode = fsUtils.generateImageOverrideCode();
            const audioOverrideCode = fsUtils.generateAudioOverrideCode();
            const cssURLOverrideCode = fsUtils.generateCSSURLOverrideCode();
            const elementSrcOverrideCode = fsUtils.generateElementSrcOverrideCode();
            const consoleOverrideCode = fsUtils.generateConsoleOverrideCode(MESSAGE_TYPE);
            
            return `<script>
(function() {
    ${fileSystemScript}
    ${resolvePathCode}
    ${findFileCode}
    ${getCurrentFilePathCode}
    ${fetchOverrideCode}
    ${xhrOverrideCode}
    ${imageOverrideCode}
    ${audioOverrideCode}
    ${cssURLOverrideCode}
    ${elementSrcOverrideCode}
    ${consoleOverrideCode}
})();
</script>`;
        },
    },
};

document.addEventListener('DOMContentLoaded', () => CodePreviewer.init());
