/**
 * File Type Utilities
 * Handles file type detection, MIME types, and file classification
 */

import {
    FILE_EXTENSIONS,
    MIME_TYPES,
    EXTENSION_MIME_MAP,
    BINARY_EXTENSIONS,
    EDITABLE_TYPES,
    PREVIEWABLE_TYPES,
    CODEMIRROR_MODES
} from './constants.js';

/**
 * Get file extension from filename
 * @param {string} filename - The filename to extract extension from
 * @returns {string} The lowercase file extension
 */
export function getExtension(filename) {
    return filename ? filename.split('.').pop().toLowerCase() : '';
}

/**
 * Determine file type from extension
 * @param {string} filename - The filename to check
 * @returns {string} The file type
 */
export function getTypeFromExtension(filename) {
    const extension = getExtension(filename);
    return FILE_EXTENSIONS[extension] || 'binary';
}

/**
 * Get MIME type from file extension
 * @param {string} extension - The file extension
 * @returns {string} The MIME type
 */
export function getMimeTypeFromExtension(extension) {
    return EXTENSION_MIME_MAP[extension] || 'application/octet-stream';
}

/**
 * Get MIME type from file type
 * @param {string} fileType - The file type
 * @returns {string} The MIME type
 */
export function getMimeTypeFromFileType(fileType) {
    return MIME_TYPES[fileType] || 'text/plain';
}

/**
 * Check if extension is binary
 * @param {string} extension - The file extension
 * @returns {boolean} True if binary extension
 */
export function isBinaryExtension(extension) {
    return BINARY_EXTENSIONS.includes(extension);
}

/**
 * Check if file is binary based on filename and MIME type
 * @param {string} filename - The filename to check
 * @param {string} mimeType - The MIME type
 * @returns {boolean} True if binary file
 */
export function isBinaryFile(filename, mimeType) {
    if (!filename) return false;
    
    const extension = getExtension(filename);
    
    if (isBinaryExtension(extension)) {
        return true;
    }
    
    if (mimeType) {
        if (mimeType === 'image/svg+xml') {
            return false;
        }
        
        return mimeType.startsWith('image/') || 
               mimeType.startsWith('audio/') || 
               mimeType.startsWith('video/') || 
               mimeType.startsWith('application/') ||
               mimeType.startsWith('font/');
    }
    
    return false;
}

/**
 * Check if file type is editable
 * @param {string} fileType - The file type
 * @returns {boolean} True if editable
 */
export function isEditableType(fileType) {
    return EDITABLE_TYPES.includes(fileType);
}

/**
 * Check if file type is previewable
 * @param {string} fileType - The file type
 * @returns {boolean} True if previewable
 */
export function isPreviewableType(fileType) {
    return PREVIEWABLE_TYPES.includes(fileType);
}

/**
 * Get CodeMirror mode for file type
 * @param {string} fileType - The file type
 * @returns {string} The CodeMirror mode
 */
export function getCodeMirrorMode(fileType) {
    return CODEMIRROR_MODES[fileType] || 'text';
}

/**
 * Detect file type from content
 * @param {string} content - The file content
 * @param {string} filename - The filename
 * @param {Function} isModuleFile - Function to check if file is a module
 * @returns {string} The detected file type
 */
export function detectTypeFromContent(content, filename, isModuleFile) {
    if (!content) return getTypeFromExtension(filename);
    
    if (/<\s*html/i.test(content)) return 'html';
    if (/^\s*[\.\#\@]|\s*\w+\s*\{/m.test(content)) return 'css';
    if (isModuleFile && isModuleFile(content, filename)) return 'javascript-module';
    
    return getTypeFromExtension(filename);
}
