/**
 * File System Utilities Module
 * 
 * Handles virtual file system operations, path resolution, and file lookup
 * for the multi-file preview system.
 * 
 * @module file-system-utils
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
    
    // MIME type mapping for common file types
    const mimeTypes = {
        'html': 'text/html',
        'css': 'text/css',
        'javascript': 'text/javascript',
        'javascript-module': 'text/javascript',
        'json': 'application/json',
        'xml': 'application/xml',
        'text': 'text/plain',
        'markdown': 'text/markdown'
    };
    
    const mimeType = mimeTypes[fileData.type] || defaultMimeType;
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
