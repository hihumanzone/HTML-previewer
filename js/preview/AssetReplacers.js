class AssetReplacers {
    constructor(app) {
        this.app = app;
        this._replacementConfigs = {
            css: {
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.css)["']([^>]*?)>/gi,
                types: ['css'],
                replace: (file, match, before, filename, after, currentFilePath, resolvedPath, fileSystem) => {
                    const cssPath = resolvedPath || filename;
                    return `<style>${this.app.replaceCSSAssetReferences(file.content, fileSystem, cssPath)}</style>`;
                },
                onMissing: (match, before, filename, after, currentFilePath) => {
                    if (this.isExternalAssetPath(filename)) {
                        return match;
                    }
                    return this.createMissingAssetConsoleScript('Stylesheet', filename, currentFilePath, {
                        deferUntilDomReady: true,
                    });
                }
            },
            images: {
                pattern: /<img([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['image', 'svg'],
                replace: (file, match) => {
                    const src = this.app.getPreviewAssetUrl(file, 'image/png');
                    return match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${src}"`);
                }
            },
            video: {
                pattern: /<video([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['video'],
                replace: (file, match) => match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${this.app.getPreviewAssetUrl(file, 'video/mp4')}"`)
            },
            source: {
                pattern: /<source([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['video', 'audio'],
                replace: (file, match) => match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${this.app.getPreviewAssetUrl(file, 'application/octet-stream')}"`)
            },
            audio: {
                pattern: /<audio([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['audio'],
                replace: (file, match) => match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${this.app.getPreviewAssetUrl(file, 'audio/mpeg')}"`)
            },
            favicon: {
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.ico)["']([^>]*?)>/gi,
                types: ['image'],
                replace: (file, match) => match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${this.app.getPreviewAssetUrl(file, 'image/x-icon')}"`)
            },
            font: {
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.(?:woff|woff2|ttf|otf|eot))["']([^>]*?)>/gi,
                types: ['font'],
                replace: (file, match, before, filename, after) => `<link${before}href="${this.app.getPreviewAssetUrl(file, 'font/woff2')}"${after}>`
            }
        };
    }

    isExternalAssetPath(path) {
        return this.app.fileSystemUtils.isExternalAssetPath(path);
    }

    withScriptBlocksPreserved(htmlContent, transform) {
        if (typeof htmlContent !== 'string' || typeof transform !== 'function') {
            return htmlContent;
        }

        const preservedBlocks = [];
        const placeholderPrefixBase = '\uE000PREVIEWER_SCRIPT_BLOCK_';
        let placeholderPrefix = placeholderPrefixBase;
        while (htmlContent.includes(placeholderPrefix)) {
            placeholderPrefix += '_';
        }

        const htmlWithoutScripts = htmlContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (match) => {
            const placeholder = `${placeholderPrefix}${preservedBlocks.length}__`;
            preservedBlocks.push(match);
            return placeholder;
        });

        if (preservedBlocks.length === 0) {
            return transform(htmlContent);
        }

        const transformedHtml = transform(htmlWithoutScripts);
        if (typeof transformedHtml !== 'string') {
            return htmlContent;
        }

        const placeholderPattern = new RegExp(`${placeholderPrefix}(\\d+)__`, 'g');
        return transformedHtml.replace(placeholderPattern, (match, index) => {
            const scriptBlock = preservedBlocks[Number(index)];
            return typeof scriptBlock === 'string' ? scriptBlock : match;
        });
    }

    createMissingAssetConsoleScript(assetLabel, requestedPath, currentFilePath, options = {}) {
        const safeRequestedPath = JSON.stringify(requestedPath || '');
        const safeSourcePath = JSON.stringify(currentFilePath || 'index.html');
        const deferUntilDomReady = Boolean(options.deferUntilDomReady);
        const scriptAttributes = typeof options.scriptAttributes === 'string' ? options.scriptAttributes : '';
        const logSnippet = `console.error('[Preview] ${assetLabel} not found:', ${safeRequestedPath}, 'from', ${safeSourcePath});`;

        if (!deferUntilDomReady) {
            return `<script${scriptAttributes}>${logSnippet}</script>`;
        }

        const deferredSnippet = `(function() {
            const logMissingAsset = () => { ${logSnippet} };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', logMissingAsset, { once: true });
            } else {
                logMissingAsset();
            }
        })();`;

        return `<script${scriptAttributes}>${deferredSnippet}</script>`;
    }

    /**
     * Configuration for different asset replacement patterns
     * Each entry defines: regex pattern, allowed file types, and replacement strategy
     */
    get REPLACEMENT_CONFIGS() {
        return this._replacementConfigs;
    }

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
            const resolved = this.app.fileSystemUtils.findFileRecord(fileSystem, filename, currentFilePath);
            const file = resolved?.file || null;
            if (file && config.types.includes(file.type)) {
                return config.replace(file, match, before, filename, after, currentFilePath, resolved.path, fileSystem);
            }
            if (typeof config.onMissing === 'function') {
                return config.onMissing(match, before, filename, after, currentFilePath);
            }
            return match;
        });
    }

    /**
     * Applies all config-driven replacements (CSS, images, video, source, audio, favicon, font)
     * in a single pass over the configuration map.
     * Iteration follows insertion order of REPLACEMENT_CONFIGS, matching the original call sequence.
     * @param {string} htmlContent - The HTML content to process
     * @param {Map} fileSystem - The virtual file system
     * @param {string} currentFilePath - Current file path for relative resolution
     * @returns {string} Processed HTML content
     */
    replaceAllConfigBased(htmlContent, fileSystem, currentFilePath) {
        for (const config of Object.values(this.REPLACEMENT_CONFIGS)) {
            htmlContent = this.applyReplacement(htmlContent, fileSystem, currentFilePath, config);
        }
        return htmlContent;
    }

    replaceDownloadLinks(htmlContent, fileSystem, currentFilePath, processedHtmlFiles) {
        if (!processedHtmlFiles) processedHtmlFiles = new Map();
        return htmlContent.replace(/<a([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, before, filename, after) => {
            if (match.includes('download') || !filename.includes('://')) {
                const resolved = this.app.fileSystemUtils.findFileRecord(fileSystem, filename, currentFilePath);
                const file = resolved?.file || null;
                if (file) {
                    if (file.type === 'html' && !match.includes('download')) {
                        const resolvedPath = resolved.path;
                        const cachedUrl = processedHtmlFiles.get(resolvedPath);
                        if (cachedUrl) {
                            return match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${cachedUrl}"`);
                        }
                        if (!processedHtmlFiles.has(resolvedPath)) {
                            processedHtmlFiles.set(resolvedPath, null);
                            let processedContent = this.app.replaceAssetReferences(file.content, fileSystem, resolvedPath, processedHtmlFiles);
                            processedContent = this.app.injectConsoleScript(processedContent, fileSystem, resolvedPath);
                            const blob = new Blob([processedContent], { type: 'text/html' });
                            const blobUrl = URL.createObjectURL(blob);
                            this.app.state.previewAssetUrls.add(blobUrl);
                            processedHtmlFiles.set(resolvedPath, blobUrl);
                            return match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${blobUrl}"`);
                        }
                    }
                    const href = this.app.getPreviewAssetUrl(file);
                    return match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${href}"`);
                }
            }
            return match;
        });
    }

    replaceStyleTags(htmlContent, fileSystem, currentFilePath) {
        return htmlContent.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
            const updatedCSS = this.app.replaceCSSAssetReferences(cssContent, fileSystem, currentFilePath);
            return match.replace(cssContent, updatedCSS);
        });
    }

    replaceScriptTags(htmlContent, fileSystem, currentFilePath, workerFileSet) {
        return htmlContent.replace(/<script([^>]*?)src\s*=\s*["']([^"']+\.(?:js|mjs))["']([^>]*?)><\/script>/gi, (match, before, filename, after) => {
            if (workerFileSet.has(filename)) {
                return '';
            }

            const isExternalScript = this.isExternalAssetPath(filename);
            if (isExternalScript) {
                return match;
            }

            const scriptHasModuleType = /\btype\s*=\s*["']module["']/i.test(`${before} ${after}`);
            const resolved = this.app.fileSystemUtils.findFileRecord(fileSystem, filename, currentFilePath);
            const file = resolved?.file || null;
            if (file && (file.type === 'javascript' || file.type === 'javascript-module')) {
                const blobUrl = this.app.createModuleAssetUrl(fileSystem, resolved.path);
                if (blobUrl) {
                    return match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${blobUrl}"`);
                }

                const escapedContent = file.content.replace(/<\/script>/gi, '<\\/script>');
                return `<script>${escapedContent}</script>`;
            }

            const scriptAttributes = scriptHasModuleType ? ' type="module"' : '';
            return this.createMissingAssetConsoleScript('Script', filename, currentFilePath, {
                scriptAttributes,
            });
        });
    }
}
