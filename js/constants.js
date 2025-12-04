/**
 * Application Constants
 * Central location for all constant values used throughout the application
 */

export const EDITOR_IDS = {
    HTML: 'html-editor',
    CSS: 'css-editor',
    JS: 'js-editor',
    SINGLE_FILE: 'single-file-editor',
};

export const CONTROL_IDS = {
    MODAL_BTN: 'preview-modal-btn',
    TAB_BTN: 'preview-tab-btn',
    CLEAR_CONSOLE_BTN: 'clear-console-btn',
    TOGGLE_CONSOLE_BTN: 'toggle-console-btn',
    SINGLE_MODE_RADIO: 'single-mode-radio',
    MULTI_MODE_RADIO: 'multi-mode-radio',
    ADD_FILE_BTN: 'add-file-btn',
    ADD_FOLDER_BTN: 'add-folder-btn',
    IMPORT_FILE_BTN: 'import-file-btn',
    IMPORT_ZIP_BTN: 'import-zip-btn',
    EXPORT_ZIP_BTN: 'export-zip-btn',
    MAIN_HTML_SELECT: 'main-html-select',
};

export const CONTAINER_IDS = {
    SINGLE_FILE: 'single-file-container',
    MULTI_FILE: 'multi-file-container',
    FILE_TREE: 'file-tree-container',
};

export const MODAL_IDS = {
    OVERLAY: 'preview-modal',
    FRAME: 'preview-frame',
    CLOSE_BTN: '.close-btn',
};

export const CONSOLE_ID = 'console-output';
export const MODAL_CONSOLE_PANEL_ID = 'modal-console-panel';
export const CONSOLE_MESSAGE_TYPE = 'console';

export const FILE_EXTENSIONS = {
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
};

export const MIME_TYPES = {
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
};

export const EXTENSION_MIME_MAP = {
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
};

export const BINARY_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'tiff',
    'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma',
    'mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'm4v',
    'woff', 'woff2', 'ttf', 'otf', 'eot',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'rar', '7z', 'tar', 'gz',
    'exe', 'dll', 'so', 'dylib'
];

export const EDITABLE_TYPES = ['html', 'css', 'javascript', 'javascript-module', 'json', 'xml', 'markdown', 'text', 'svg'];
export const PREVIEWABLE_TYPES = ['html', 'css', 'javascript', 'javascript-module', 'json', 'xml', 'markdown', 'text', 'svg', 'image', 'audio', 'video', 'pdf'];

export const CODEMIRROR_MODES = {
    'html': 'htmlmixed',
    'css': 'css',
    'javascript': 'javascript',
    'javascript-module': 'javascript',
    'json': 'javascript',
    'xml': 'xml',
    'markdown': 'markdown',
    'text': 'text',
    'svg': 'xml'
};
