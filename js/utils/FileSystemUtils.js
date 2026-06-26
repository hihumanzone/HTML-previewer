class FileSystemUtils {
    constructor(fileTypeUtils) {
        this.fileTypeUtils = fileTypeUtils;
    }

    isExternalAssetPath(path) {
        return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path || '');
    }

    splitPathSuffix(path) {
        const rawPath = String(path || '').trim();
        const suffixMatch = rawPath.match(/([?#].*)$/);
        return {
            path: suffixMatch ? rawPath.slice(0, -suffixMatch[1].length) : rawPath,
            suffix: suffixMatch ? suffixMatch[1] : ''
        };
    }

    safeDecodePath(path) {
        return String(path || '')
            .split('/')
            .map((segment) => {
                try {
                    return decodeURIComponent(segment);
                } catch (error) {
                    return segment;
                }
            })
            .join('/');
    }

    normalizePath(path) {
        const parts = this.safeDecodePath(path)
            .replace(/\\/g, '/')
            .replace(/^\/+/, '')
            .split('/');
        const normalizedParts = [];

        for (const part of parts) {
            if (!part || part === '.') continue;
            if (part === '..') {
                normalizedParts.pop();
                continue;
            }
            normalizedParts.push(part);
        }

        return normalizedParts.join('/');
    }

    normalizeRequestPath(path, currentFilePath = '') {
        if (typeof path !== 'string' || !path.trim() || this.isExternalAssetPath(path.trim())) {
            return '';
        }

        const { path: requestPath } = this.splitPathSuffix(path);
        const normalizedRequestPath = this.normalizePath(requestPath);
        if (!normalizedRequestPath) return '';

        if (requestPath.trim().startsWith('/')) {
            return normalizedRequestPath;
        }

        return currentFilePath
            ? this.resolvePath(currentFilePath, normalizedRequestPath)
            : normalizedRequestPath;
    }

    getBasename(path) {
        const normalizedPath = this.normalizePath(path);
        if (!normalizedPath) return '';
        return normalizedPath.includes('/')
            ? normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1)
            : normalizedPath;
    }

    getCandidatePaths(targetPath) {
        const normalizedTarget = this.normalizePath(targetPath);
        if (!normalizedTarget) return [];

        const candidates = [normalizedTarget];
        const parts = normalizedTarget.split('/');
        if (parts.length > 1) {
            for (let i = 1; i < parts.length - 1; i++) {
                candidates.push(parts.slice(i).join('/'));
            }
        }

        return Array.from(new Set(candidates));
    }

    getFileSystemEntries(fileSystem) {
        if (fileSystem instanceof Map) {
            return Array.from(fileSystem.entries());
        }
        if (fileSystem && typeof fileSystem === 'object') {
            return Object.entries(fileSystem);
        }
        return [];
    }

    findUniqueByBasename(entries, targetPath) {
        const targetBasename = this.getBasename(targetPath);
        if (!targetBasename) return null;

        const targetBasenameLower = targetBasename.toLowerCase();
        const matches = entries.filter(([filename]) => this.getBasename(filename).toLowerCase() === targetBasenameLower);

        return matches.length === 1
            ? { path: matches[0][0], file: matches[0][1] }
            : null;
    }

    /**
     * Resolves a relative path against a base path
     * @param {string} basePath - The base file path
     * @param {string} relativePath - The relative path to resolve
     * @returns {string} The resolved absolute path
     */
    resolvePath(basePath, relativePath) {
        const normalizedRelativePath = this.normalizePath(relativePath);
        if (!normalizedRelativePath) return '';

        if (String(relativePath || '').trim().startsWith('/')) {
            return normalizedRelativePath;
        }

        const normalizedBasePath = this.normalizePath(basePath);
        const baseDir = normalizedBasePath.includes('/')
            ? normalizedBasePath.substring(0, normalizedBasePath.lastIndexOf('/'))
            : '';

        const baseParts = baseDir ? baseDir.split('/') : [];
        const relativeParts = normalizedRelativePath.split('/');
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
    }

    findFileRecord(fileSystem, targetFilename, currentFilePath = '') {
        const targetPath = this.normalizeRequestPath(targetFilename, currentFilePath);
        if (!targetPath) return null;

        const entries = this.getFileSystemEntries(fileSystem);
        if (entries.length === 0) return null;

        const directCandidates = this.getCandidatePaths(targetPath);
        for (const candidate of directCandidates) {
            const exactMatch = fileSystem instanceof Map ? fileSystem.get(candidate) : fileSystem[candidate];
            if (exactMatch) {
                return { path: candidate, file: exactMatch };
            }
        }

        const lowerCandidates = new Set(directCandidates.map((candidate) => candidate.toLowerCase()));
        for (const [filename, file] of entries) {
            if (lowerCandidates.has(this.normalizePath(filename).toLowerCase())) {
                return { path: filename, file };
            }
        }

        if (targetPath.includes('/')) {
            const targetSuffix = `/${targetPath}`;
            const targetSuffixLower = targetSuffix.toLowerCase();
            for (const [filename, file] of entries) {
                const normalizedFilename = this.normalizePath(filename);
                if (normalizedFilename.endsWith(targetSuffix) || normalizedFilename.toLowerCase().endsWith(targetSuffixLower)) {
                    return { path: filename, file };
                }
            }
        }

        return this.findUniqueByBasename(entries, targetPath);
    }

    /**
     * Finds a file in the virtual file system
     * @param {Map} fileSystem - The virtual file system map
     * @param {string} targetFilename - The filename to find
     * @param {string} currentFilePath - The current file context for relative paths
     * @returns {Object|null} The file data or null if not found
     */
    findFile(fileSystem, targetFilename, currentFilePath = '') {
        return this.findFileRecord(fileSystem, targetFilename, currentFilePath)?.file || null;
    }

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
        const mimeType = this.fileTypeUtils.getMimeTypeFromFileType(fileData.type) || defaultMimeType;
        return `data:${mimeType};charset=utf-8,${encodeURIComponent(fileData.content)}`;
    }
}
