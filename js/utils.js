/**
 * General utility functions
 */

/**
 * Check if content/filename indicates a JavaScript module
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @returns {boolean} True if module file
 */
export function isModuleFile(content, filename) {
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
}

/**
 * Get safe parent element
 * @param {string} elementId - Element ID
 * @returns {Element|null} Parent element or null
 */
export function getSafeParentElement(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.parentElement : null;
}

/**
 * Detect file type from content
 * @param {string} content - File content
 * @param {string} filename - Filename  
 * @returns {string} Detected file type
 */
export function detectFileTypeFromContent(content, filename, getTypeFromExtension) {
    if (!content) return getTypeFromExtension(filename);
    
    if (/<\s*html/i.test(content)) return 'html';
    if (/^\s*[\.\#\@]|\s*\w+\s*\{/m.test(content)) return 'css';
    if (isModuleFile(content, filename)) return 'javascript-module';
    
    return getTypeFromExtension(filename);
}
