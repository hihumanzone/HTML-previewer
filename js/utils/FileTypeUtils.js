class FileTypeUtils {
    constructor(constants) {
        this.constants = constants;
        this.BINARY_MIME_PREFIXES = ['image/', 'audio/', 'video/', 'application/', 'font/'];
        this.JS_MIME_TYPES = new Set(['text/javascript', 'application/javascript', 'application/x-javascript', 'text/ecmascript', 'application/ecmascript']);
        this.MODULE_FILENAME_SUFFIXES = ['.mjs', '.esm.js', '.module.js'];
    }

    getBaseName(filename) {
        if (typeof filename !== 'string') return '';

        const normalizedPath = filename.trim().replace(/\\/g, '/');
        if (!normalizedPath) return '';

        const pathSegments = normalizedPath.split('/');
        return (pathSegments.pop() || '').toLowerCase();
    }

    getExtension(filename) {
        const baseName = this.getBaseName(filename);
        if (!baseName || baseName === '.' || baseName === '..') return '';

        const lastDotIndex = baseName.lastIndexOf('.');
        if (lastDotIndex === -1) return '';
        if (lastDotIndex === 0) return baseName.slice(1).toLowerCase();

        return baseName.slice(lastDotIndex + 1).toLowerCase();
    }

    normalizeMimeType(mimeType) {
        if (!mimeType || typeof mimeType !== 'string') return '';
        return mimeType.toLowerCase().split(';')[0].trim();
    }

    getTypeFromExtension(filename) {
        const extension = this.getExtension(filename);
        return this.constants.EXTENSIONS[extension] || 'binary';
    }

    getMimeTypeFromExtension(extension) {
        const normalizedExtension = extension?.toLowerCase();
        return this.constants.EXTENSION_MIME_MAP[normalizedExtension] || 'application/octet-stream';
    }

    getMimeTypeFromFileType(fileType) {
        return this.constants.MIME_TYPES[fileType] || 'text/plain';
    }

    getTypeFromMimeType(mimeType) {
        const normalizedMimeType = this.normalizeMimeType(mimeType);
        if (!normalizedMimeType) return null;
        if (this.JS_MIME_TYPES.has(normalizedMimeType)) return 'javascript';
        if (normalizedMimeType === 'text/html') return 'html';
        if (normalizedMimeType === 'text/css') return 'css';
        if (normalizedMimeType === 'application/json' || normalizedMimeType.endsWith('+json')) return 'json';
        if (normalizedMimeType === 'application/xml' || normalizedMimeType === 'text/xml') return 'xml';
        if (normalizedMimeType === 'text/markdown') return 'markdown';
        if (normalizedMimeType === 'image/svg+xml') return 'svg';
        if (normalizedMimeType.startsWith('image/')) return 'image';
        if (normalizedMimeType.startsWith('audio/')) return 'audio';
        if (normalizedMimeType.startsWith('video/')) return 'video';
        if (normalizedMimeType.startsWith('font/')) return 'font';
        if (normalizedMimeType === 'application/pdf') return 'pdf';
        if (normalizedMimeType.startsWith('text/')) return 'text';
        return null;
    }

    hasBinaryMimePrefix(mimeType) {
        return this.BINARY_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix));
    }

    isBinaryExtension(extension) {
        return this.constants.BINARY_EXTENSIONS.has(extension?.toLowerCase());
    }

    isJavaScriptMimeType(mimeType) {
        return this.JS_MIME_TYPES.has(this.normalizeMimeType(mimeType));
    }

    hasModuleFilenameHint(filename) {
        if (!filename || typeof filename !== 'string') return false;
        const lowerName = filename.toLowerCase();
        return this.MODULE_FILENAME_SUFFIXES.some(suffix => lowerName.endsWith(suffix));
    }

    hasModuleMimeHint(mimeType) {
        return typeof mimeType === 'string' && /(?:^|;)\s*module(?:\s*=\s*(?:1|true))?\s*(?:;|$)/i.test(mimeType);
    }

    isJavaScriptModule(content, filename, mimeType) {
        if (this.hasModuleFilenameHint(filename) || this.hasModuleMimeHint(mimeType)) {
            return true;
        }

        if (!content || typeof content !== 'string') {
            return false;
        }

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

    detectJavaScriptType(content, filename, mimeType) {
        return this.isJavaScriptModule(content, filename, mimeType) ? 'javascript-module' : 'javascript';
    }

    isBinaryFile(filename, mimeType) {
        if (!filename) return false;

        const extension = this.getExtension(filename);
        if (this.isBinaryExtension(extension)) {
            return true;
        }

        const normalizedMimeType = this.normalizeMimeType(mimeType);
        if (!normalizedMimeType) return false;

        if (normalizedMimeType === 'image/svg+xml' || normalizedMimeType === 'application/json' || normalizedMimeType.endsWith('+json')) {
            return false;
        }

        return this.hasBinaryMimePrefix(normalizedMimeType);
    }

    isEditableType(fileType) {
        return this.constants.EDITABLE_TYPES.includes(fileType);
    }

    isPreviewableType(fileType) {
        return this.constants.PREVIEWABLE_TYPES.includes(fileType);
    }

    getCodeMirrorMode(fileType) {
        return this.constants.CODEMIRROR_MODES[fileType] || 'text';
    }

    detectTypeFromContent(content, filename, mimeType = '') {
        const extensionType = this.getTypeFromExtension(filename);
        if (!content) {
            if (extensionType === 'javascript' || extensionType === 'javascript-module') {
                return this.detectJavaScriptType(content, filename, mimeType);
            }
            return extensionType;
        }

        if (/<\s*html/i.test(content)) return 'html';
        if (this.isJavaScriptModule(content, filename, mimeType)) return 'javascript-module';
        if (/^\s*[\.\#\@]|\s*\w+\s*\{/m.test(content)) return 'css';
        if (extensionType === 'javascript' || extensionType === 'javascript-module') {
            return this.detectJavaScriptType(content, filename, mimeType);
        }

        return extensionType;
    }

    detectFileType(filename, content, mimeType) {
        if (!filename) return 'text';

        const extensionType = this.getTypeFromExtension(filename);
        const mimeTypeType = this.getTypeFromMimeType(mimeType);

        if (this.isBinaryExtension(this.getExtension(filename))) {
            return extensionType === 'binary' && mimeTypeType ? mimeTypeType : extensionType;
        }

        if (mimeTypeType && mimeTypeType !== 'javascript') {
            return mimeTypeType;
        }

        if (mimeTypeType === 'javascript') {
            return this.detectJavaScriptType(content, filename, mimeType);
        }

        return this.detectTypeFromContent(content, filename, mimeType);
    }
}
