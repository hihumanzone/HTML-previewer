class PreviewScriptGenerator {
    /**
     * Generates JavaScript code for path resolution (used in injected scripts)
     * @returns {string} JavaScript code for the resolvePath function
     */
    generateResolvePathCode() {
        return `
    function isExternalPreviewUrl(value) {
    return /^(?:[a-z][a-z\\d+.-]*:|\\/\\/|#)/i.test(value || "");
    }
    function splitPathSuffix(value) {
    const rawValue = String(value || "").trim();
    const match = rawValue.match(/([?#].*)$/);
    return {
        path: match ? rawValue.slice(0, -match[1].length) : rawValue,
        suffix: match ? match[1] : ""
    };
    }
    function safeDecodePath(path) {
    return String(path || "").split("/").map(function(segment) {
        try {
            return decodeURIComponent(segment);
        } catch (error) {
            return segment;
        }
    }).join("/");
    }
    function normalizePath(path) {
    const parts = safeDecodePath(path).replace(/\\\\/g, "/").replace(/^\\/+/,"").split("/");
    const normalizedParts = [];
    for (const part of parts) {
        if (!part || part === ".") continue;
        if (part === "..") {
            normalizedParts.pop();
            continue;
        }
        normalizedParts.push(part);
    }
    return normalizedParts.join("/");
    }
    function resolvePath(basePath, relativePath) {
    const normalizedRelativePath = normalizePath(relativePath);
    if (!normalizedRelativePath) return "";
    if (String(relativePath || "").trim().startsWith("/")) {
        return normalizedRelativePath;
    }
    const normalizedBasePath = normalizePath(basePath);
    const baseDir = normalizedBasePath.includes("/") ? normalizedBasePath.substring(0, normalizedBasePath.lastIndexOf("/")) : "";
    const baseParts = baseDir ? baseDir.split("/") : [];
    const relativeParts = normalizedRelativePath.split("/");
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
     * Generates JavaScript code for file lookup (used in injected scripts)
     * @returns {string} JavaScript code for the findFileInSystem function
     */
    generateFindFileCode() {
        return `
    function normalizeRequestPath(path, currentFilePath = "") {
    if (typeof path !== "string" || !path.trim() || isExternalPreviewUrl(path.trim())) return "";
    const requestPath = splitPathSuffix(path).path;
    const normalizedRequestPath = normalizePath(requestPath);
    if (!normalizedRequestPath) return "";
    if (requestPath.trim().startsWith("/")) return normalizedRequestPath;
    return currentFilePath ? resolvePath(currentFilePath, normalizedRequestPath) : normalizedRequestPath;
    }
    function getBasename(path) {
    const normalizedPath = normalizePath(path);
    if (!normalizedPath) return "";
    return normalizedPath.includes("/") ? normalizedPath.substring(normalizedPath.lastIndexOf("/") + 1) : normalizedPath;
    }
    function getCandidatePaths(targetPath) {
    const normalizedTarget = normalizePath(targetPath);
    if (!normalizedTarget) return [];
    const candidates = [normalizedTarget];
    const parts = normalizedTarget.split("/");
    if (parts.length > 1) {
        for (let i = 1; i < parts.length - 1; i++) {
            candidates.push(parts.slice(i).join("/"));
        }
    }
    return Array.from(new Set(candidates));
    }
    function findFileRecordInSystem(targetFilename, currentFilePath = "") {
    const targetPath = normalizeRequestPath(targetFilename, currentFilePath);
    if (!targetPath) return null;
    const entries = Object.entries(virtualFileSystem);
    if (entries.length === 0) return null;
    const directCandidates = getCandidatePaths(targetPath);
    for (const candidate of directCandidates) {
        const exactMatch = virtualFileSystem[candidate];
        if (exactMatch) return { path: candidate, file: exactMatch };
    }
    const lowerCandidates = new Set(directCandidates.map(function(candidate) { return candidate.toLowerCase(); }));
    for (const [filename, file] of entries) {
        if (lowerCandidates.has(normalizePath(filename).toLowerCase())) return { path: filename, file };
    }
    if (targetPath.includes("/")) {
        const targetSuffix = "/" + targetPath;
        const targetSuffixLower = targetSuffix.toLowerCase();
        for (const [filename, file] of entries) {
            const normalizedFilename = normalizePath(filename);
            if (normalizedFilename.endsWith(targetSuffix) || normalizedFilename.toLowerCase().endsWith(targetSuffixLower)) {
                return { path: filename, file };
            }
        }
    }
    const targetBasename = getBasename(targetPath);
    if (targetBasename) {
        const targetBasenameLower = targetBasename.toLowerCase();
        const matches = entries.filter(function(entry) {
            return getBasename(entry[0]).toLowerCase() === targetBasenameLower;
        });
        if (matches.length === 1) {
            return { path: matches[0][0], file: matches[0][1] };
        }
    }
    return null;
    }
    function findFileInSystem(targetFilename, currentFilePath = "") {
    return findFileRecordInSystem(targetFilename, currentFilePath)?.file || null;
    }`;
    }

    generateAssetResolverCode() {
        return `
    function getDataUrlForFile(fileData) {
    if (!fileData) return null;
    if (fileData.isBinary) return fileData.content;
    if (fileData.type === "svg") {
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fileData.content);
    }
    const typeMap = {
        "html": "text/html",
        "css": "text/css",
        "javascript": "text/javascript",
        "javascript-module": "text/javascript",
        "json": "application/json",
        "xml": "application/xml",
        "markdown": "text/markdown",
        "text": "text/plain"
    };
    const mimeType = typeMap[fileData.type] || "text/plain";
    return "data:" + mimeType + ";charset=utf-8," + encodeURIComponent(fileData.content);
    }
    function resolveVirtualAssetUrl(value, typeCheck, currentFilePath = getCurrentFilePath()) {
    if (typeof value !== "string" || !value || isExternalPreviewUrl(value)) return null;
    const fileData = findFileInSystem(value, currentFilePath);
    if (!fileData || (typeof typeCheck === "function" && !typeCheck(fileData))) return null;
    const dataUrl = getDataUrlForFile(fileData);
    return dataUrl || null;
    }
    function rewriteVirtualCssContent(cssContent, currentFilePath = getCurrentFilePath()) {
    if (typeof cssContent !== "string" || !cssContent.includes("url(")) return cssContent;
    return cssContent.replace(/url\\(\\s*(["']?)([^"')]+)\\1\\s*\\)/gi, function(match, quote, url) {
        const resolved = resolveVirtualAssetUrl(url, function(fileData) {
            return isImageLikeFile(fileData) || fileData.type === "font";
        }, currentFilePath);
        return resolved ? 'url("' + resolved + '")' : match;
    });
    }
    function getVirtualFileText(fileData, currentFilePath = getCurrentFilePath()) {
    if (!fileData) return "";
    if (fileData.type === "css" && !fileData.isBinary) {
        return rewriteVirtualCssContent(fileData.content, currentFilePath);
    }
    return fileData.content;
    }
    function isImageLikeFile(fileData) {
    return fileData && (fileData.type === "image" || fileData.type === "svg");
    }
    function isMediaLikeFile(fileData) {
    return fileData && (fileData.type === "audio" || fileData.type === "video" || isImageLikeFile(fileData));
    }
    function isLinkLikeFile(fileData) {
    return fileData && (fileData.type === "css" || fileData.type === "html" || fileData.type === "font" || isImageLikeFile(fileData));
    }
    function isScriptLikeFile(fileData) {
    return fileData && (fileData.type === "javascript" || fileData.type === "javascript-module");
    }`;
    }

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
    }

    /**
     * Generates JavaScript code for a shared base64-to-Uint8Array helper (used in injected scripts)
     * Eliminates duplicate byte-conversion loops in fetch, XHR, and other overrides
     * @returns {string} JavaScript code for the base64ToUint8Array function
     */
    generateBase64HelperCode() {
        return `
    function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
    }`;
    }

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
    if (typeof url !== "string" || isExternalPreviewUrl(url)) {
        return originalFetch.apply(this, arguments);
    }
    const fileRecord = findFileRecordInSystem(url, currentFilePath);
    const fileData = fileRecord ? fileRecord.file : null;

    if (fileData) {
        const textContent = getVirtualFileText(fileData, fileRecord.path);
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
            text: () => Promise.resolve(textContent),
            json: () => {
                try {
                    return Promise.resolve(JSON.parse(textContent));
                } catch (e) {
                    return Promise.reject(new Error("Invalid JSON"));
                }
            },
            blob: () => {
                if (fileData.isBinary && fileData.content.startsWith("data:")) {
                    const [header, base64] = fileData.content.split(",");
                    const mimeType = header.match(/data:([^;]+)/)[1];
                    return Promise.resolve(new Blob([base64ToUint8Array(base64)], { type: mimeType }));
                } else {
                    return Promise.resolve(new Blob([textContent], { type: fileData.type === "css" ? "text/css" : "text/plain" }));
                }
            },
            arrayBuffer: () => {
                if (fileData.isBinary && fileData.content.startsWith("data:")) {
                    const [header, base64] = fileData.content.split(",");
                    return Promise.resolve(base64ToUint8Array(base64).buffer);
                } else {
                    const encoder = new TextEncoder();
                    return Promise.resolve(encoder.encode(textContent).buffer);
                }
            }
        };

        return Promise.resolve(response);
    }

    return originalFetch.apply(this, arguments);
    };`;
    }

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
    let virtualFilePath = "";

    xhr.open = function(method, url, async, user, password) {
        try {
            if (method.toUpperCase() === "GET") {
                const currentFilePath = getCurrentFilePath();
                if (typeof url !== "string" || isExternalPreviewUrl(url)) {
                    isVirtualRequest = false;
                    virtualFileData = null;
                    virtualFilePath = "";
                    return originalOpen.call(this, method, url, async, user, password);
                }
                const fileRecord = findFileRecordInSystem(url, currentFilePath);
                const fileData = fileRecord ? fileRecord.file : null;

                if (fileData) {
                    isVirtualRequest = true;
                    virtualFileData = fileData;
                    virtualFilePath = fileRecord.path;
                    xhr.setRequestHeader = function() {};
                    xhr.overrideMimeType = function() {};
                    return;
                }
            }

            isVirtualRequest = false;
            virtualFileData = null;
            virtualFilePath = "";
            return originalOpen.call(this, method, url, async, user, password);
        } catch (e) {
            isVirtualRequest = false;
            virtualFileData = null;
            virtualFilePath = "";
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

                        const textContent = getVirtualFileText(virtualFileData, virtualFilePath);

                        if (virtualFileData.isBinary && virtualFileData.content.startsWith("data:")) {
                            if (xhr.responseType === "arraybuffer") {
                                const [header, base64] = virtualFileData.content.split(",");
                                Object.defineProperty(xhr, "response", { value: base64ToUint8Array(base64).buffer, configurable: true });
                            } else if (xhr.responseType === "blob") {
                                const [header, base64] = virtualFileData.content.split(",");
                                const mimeType = header.match(/data:([^;]+)/)[1];
                                Object.defineProperty(xhr, "response", { value: new Blob([base64ToUint8Array(base64)], { type: mimeType }), configurable: true });
                            } else {
                                Object.defineProperty(xhr, "response", { value: virtualFileData.content, configurable: true });
                                Object.defineProperty(xhr, "responseText", { value: virtualFileData.content, configurable: true });
                            }
                        } else {
                            Object.defineProperty(xhr, "responseText", { value: textContent, configurable: true });
                            Object.defineProperty(xhr, "response", { value: textContent, configurable: true });
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
    }

    /**
     * Generates JavaScript code for the Image constructor override (used in injected scripts)
     * Intercepts Image src assignments to serve images from the virtual file system
     * @returns {string} JavaScript code for the Image constructor override
     */
    /**
     * Generates JavaScript code for a media constructor override (used in injected scripts).
     * Intercepts src assignments to serve files from the virtual file system.
     * Used to generate both Image and Audio overrides.
     * @param {Object} options - Configuration for the override
     * @param {string} options.name - Constructor name (e.g., 'Image', 'Audio')
     * @param {string} options.typeCheck - JS expression for matching file types
     * @param {string} options.resolveExpr - JS expression to resolve the src value
     * @param {boolean} options.hasInitialSrc - Whether the constructor accepts an initial src argument
     * @returns {string} JavaScript code for the constructor override
     */
    generateMediaOverrideCode({ name, typeCheck, resolveExpr, hasInitialSrc }) {
        const paramList = hasInitialSrc ? 'src' : '';
        const initSrc = hasInitialSrc ? `
    if (src !== undefined) {
        el.src = src;
    }` : '';
        return `
    const Original${name} = window.${name};
    window.${name} = function(${paramList}) {
    const el = new Original${name}();

    let _originalSrc = "";
    let _resolvedSrc = "";

    Object.defineProperty(el, "src", {
        get: function() {
            return _resolvedSrc || _originalSrc;
        },
        set: function(value) {
            _originalSrc = value;

            const currentFilePath = getCurrentFilePath();
            if (typeof value !== "string" || isExternalPreviewUrl(value)) {
                _resolvedSrc = value;
                el.setAttribute("src", value);
                return;
            }
            const fileData = findFileInSystem(value, currentFilePath);

            if (fileData && (${typeCheck})) {
                const resolved = ${resolveExpr};
                _resolvedSrc = resolved;
                el.setAttribute("src", resolved);
            } else {
                _resolvedSrc = value;
                el.setAttribute("src", value);
            }
        },
        enumerable: true,
        configurable: true
    });
    ${initSrc}
    return el;
    };`;
    }

    generateImageOverrideCode() {
        return this.generateMediaOverrideCode({
            name: 'Image',
            typeCheck: 'fileData.type === "image" || fileData.type === "svg"',
            resolveExpr: 'fileData.isBinary ? fileData.content : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fileData.content)',
            hasInitialSrc: false
        });
    }

    generateAudioOverrideCode() {
        return this.generateMediaOverrideCode({
            name: 'Audio',
            typeCheck: 'fileData.type === "audio"',
            resolveExpr: 'fileData.content',
            hasInitialSrc: true
        });
    }

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
            const currentFilePath = getCurrentFilePath();
            const resolved = resolveVirtualAssetUrl(url, isImageLikeFile, currentFilePath);
            if (resolved) {
                return 'url("' + resolved + '")';
            }
            return match;
        });
    }
    const urlProps = new Set(['backgroundImage', 'background', 'listStyleImage', 'borderImage', 'borderImageSource', 'cursor', 'content',
        'background-image', 'list-style-image', 'border-image', 'border-image-source']);
    const origSetProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(prop, value, priority) {
        if (urlProps.has(prop)) value = resolveUrlsInValue(value);
        return origSetProperty.call(this, prop, value, priority);
    };
    const styleDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
    if (styleDesc && styleDesc.get) {
        const origStyleGet = styleDesc.get;
        const proxyCache = new WeakMap();
        Object.defineProperty(HTMLElement.prototype, 'style', {
            get: function() {
                const realStyle = origStyleGet.call(this);
                if (proxyCache.has(realStyle)) return proxyCache.get(realStyle);
                const proxy = new Proxy(realStyle, {
                    set: function(target, prop, value) {
                        if (typeof prop === 'string' && urlProps.has(prop)) {
                            value = resolveUrlsInValue(value);
                        }
                        target[prop] = value;
                        return true;
                    },
                    get: function(target, prop) {
                        const val = target[prop];
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
    }

    /**
     * Generates JavaScript code for intercepting .src on existing DOM image/audio elements
     * Ensures elements created via HTML (not via new Image()/new Audio()) also resolve virtual paths
     * @returns {string} JavaScript code for the element src override
     */
    generateElementSrcOverrideCode() {
        return `
    (function() {
    function resolveElementAsset(el, value, typeCheck) {
        if (typeof value !== 'string' || !value) return null;
        return resolveVirtualAssetUrl(value, typeCheck);
    }
    function getTypeCheckForElement(el, attrName) {
        if (attrName === 'href') return isLinkLikeFile;
        if (attrName === 'poster') return isImageLikeFile;
        if (attrName === 'srcset') return isImageLikeFile;
        if (el instanceof HTMLImageElement) return isImageLikeFile;
        if (el instanceof HTMLSourceElement) return isMediaLikeFile;
        if (el instanceof HTMLMediaElement) return function(f) { return f.type === "audio" || f.type === "video"; };
        if (el instanceof HTMLScriptElement) return isScriptLikeFile;
        return null;
    }
    function resolveSrcsetValue(value) {
        if (typeof value !== 'string' || !value || isExternalPreviewUrl(value.trim())) return null;
        let changed = false;
        const resolvedCandidates = value.split(',').map(function(candidate) {
            const trimmed = candidate.trim();
            if (!trimmed) return candidate;
            const parts = trimmed.split(/\\s+/);
            const resolved = resolveVirtualAssetUrl(parts[0], isImageLikeFile);
            if (!resolved) return candidate;
            changed = true;
            return [resolved].concat(parts.slice(1)).join(' ');
        });
        return changed ? resolvedCandidates.join(', ') : null;
    }
    function overrideUrlProperty(proto, propertyName, typeCheck) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, propertyName);
        if (!descriptor || !descriptor.set) return;
        const origSet = descriptor.set;
        const origGet = descriptor.get;
        Object.defineProperty(proto, propertyName, {
            set: function(value) {
                const resolved = propertyName === 'srcset'
                    ? resolveSrcsetValue(value)
                    : resolveElementAsset(this, value, typeCheck);
                if (resolved) {
                    origSet.call(this, resolved);
                    return;
                }
                origSet.call(this, value);
            },
            get: origGet ? function() { return origGet.call(this); } : undefined,
            enumerable: descriptor.enumerable,
            configurable: true
        });
    }
    overrideUrlProperty(HTMLImageElement.prototype, 'src', isImageLikeFile);
    overrideUrlProperty(HTMLMediaElement.prototype, 'src', function(f) { return f.type === "audio" || f.type === "video"; });
    overrideUrlProperty(HTMLSourceElement.prototype, 'src', isMediaLikeFile);
    overrideUrlProperty(HTMLLinkElement.prototype, 'href', isLinkLikeFile);
    overrideUrlProperty(HTMLScriptElement.prototype, 'src', isScriptLikeFile);
    overrideUrlProperty(HTMLImageElement.prototype, 'srcset', isImageLikeFile);
    overrideUrlProperty(HTMLSourceElement.prototype, 'srcset', isImageLikeFile);
    overrideUrlProperty(HTMLVideoElement.prototype, 'poster', isImageLikeFile);

    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
        const attrName = String(name || '').toLowerCase();
        if (['src', 'href', 'poster', 'srcset'].includes(attrName) && typeof value === 'string') {
            const typeCheck = getTypeCheckForElement(this, attrName);
            if (typeCheck) {
                const resolved = attrName === 'srcset'
                    ? resolveSrcsetValue(value)
                    : resolveElementAsset(this, value, typeCheck);
                if (resolved) {
                    return originalSetAttribute.call(this, name, resolved);
                }
            }
        }
        return originalSetAttribute.call(this, name, value);
    };

    function resolveExistingElement(el) {
        if (!el || typeof el.getAttribute !== 'function') return;
        for (const attrName of ['src', 'href', 'poster', 'srcset']) {
            if (!el.hasAttribute(attrName)) continue;
            const originalValue = el.getAttribute(attrName);
            if (!originalValue || (attrName !== 'srcset' && isExternalPreviewUrl(originalValue))) continue;
            const typeCheck = getTypeCheckForElement(el, attrName);
            if (!typeCheck) continue;
            const resolved = attrName === 'srcset'
                ? resolveSrcsetValue(originalValue)
                : resolveElementAsset(el, originalValue, typeCheck);
            if (resolved && resolved !== originalValue) {
                originalSetAttribute.call(el, attrName, resolved);
                const mediaEl = el instanceof HTMLMediaElement
                    ? el
                    : (el instanceof HTMLSourceElement && el.parentElement instanceof HTMLMediaElement ? el.parentElement : null);
                if (mediaEl && typeof mediaEl.load === 'function') {
                    try { mediaEl.load(); } catch (e) {}
                }
            }
        }
    }
    function resolveExistingAssets(root) {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        if (root.matches && root.matches('img,video,audio,source,link,script')) resolveExistingElement(root);
        root.querySelectorAll('img,video,audio,source,link,script').forEach(resolveExistingElement);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { resolveExistingAssets(document); }, { once: true });
    } else {
        resolveExistingAssets(document);
    }
    const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) resolveExistingAssets(node);
                });
            } else if (mutation.type === 'attributes') {
                resolveExistingElement(mutation.target);
            }
        }
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'href', 'poster', 'srcset']
    });
    })();`;
    }

    /**
     * Generates JavaScript code for console capture and error handling (used in injected scripts)
     * Overrides console methods to post messages to the parent window and captures errors
     * @param {string} messageType - The message type identifier for postMessage communication
     * @returns {string} JavaScript code for console capture
     */

    /**
     * Generates JavaScript code that safely handles Service Worker registration in preview contexts.
     * @returns {string} JavaScript code for service worker override
     */
    generateServiceWorkerOverrideCode() {
        return `
    try {
    const serviceWorkerContainer = navigator && navigator.serviceWorker;
    const isPreviewLikeProtocol = /^(about:|data:|blob:)/i.test(window.location.protocol || '') || window.location.href === 'about:srcdoc';
    if (serviceWorkerContainer && typeof serviceWorkerContainer.register === 'function' && isPreviewLikeProtocol) {
        const unsupportedError = () => {
            const error = new Error('Service Worker registration is not supported in preview mode (about:srcdoc/data/blob contexts).');
            error.name = 'PreviewServiceWorkerUnsupportedError';
            return error;
        };
        Object.defineProperty(serviceWorkerContainer, 'register', {
            configurable: true,
            writable: true,
            value: function registerServiceWorkerInPreview() {
                const err = unsupportedError();
                if (window && window.console && typeof window.console.warn === 'function') {
                    window.console.warn('[Preview] ' + err.message);
                }
                return Promise.reject(err);
            }
        });
    }
    } catch (serviceWorkerOverrideError) {
    // no-op: preview safety override should never break page execution
    }`;
    }

    generateConsoleOverrideCode(messageType) {
        return `
    const normalizeSourcePath = (source) => {
    if (!source || typeof source !== 'string') return '';
    try {
        const parsed = new URL(source, window.location.href);
        if (parsed.protocol === 'blob:' || parsed.protocol === 'data:' || parsed.href === 'about:srcdoc') {
            return source;
        }
        const path = parsed.pathname || '';
        return path.startsWith('/') ? path.slice(1) : path;
    } catch (error) {
        return source.startsWith('/') ? source.slice(1) : source;
    }
    };
    const classifySourceOrigin = (source) => {
    if (!source) return 'unknown';
    if (typeof source !== 'string') return 'unknown';

    const normalizedPath = normalizeSourcePath(source);
    if (normalizedPath && Object.prototype.hasOwnProperty.call(virtualFileSystem, normalizedPath)) {
        return 'virtual-file';
    }

    if (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('//')) {
        return 'external-url';
    }

    if (/^(blob:|data:|about:srcdoc)/i.test(source)) {
        return 'virtual-file';
    }

    return 'unknown';
    };
    const serializeArg = (arg) => {
    if (arg instanceof Error) {
        return {
            message: arg.message,
            stack: arg.stack,
            name: arg.name
        };
    }
    try {
        return JSON.parse(JSON.stringify(arg));
    } catch (e) {
        return 'Unserializable Object';
    }
    };
    const postLog = (level, args) => {
    const formattedArgs = Array.isArray(args) ? args.map(serializeArg) : [serializeArg(args)];
    window.parent.postMessage({ type: '${messageType}', level, message: formattedArgs }, '*');
    };
    const postStructuredError = (payload) => {
    window.parent.postMessage({
        type: '${messageType}',
        level: 'error',
        message: [{
            kind: 'runtime-error',
            message: payload.message || 'Unknown runtime error',
            source: payload.source || '',
            line: Number(payload.line) || 0,
            column: Number(payload.column) || 0,
            stack: payload.stack || '',
            originType: classifySourceOrigin(payload.source)
        }]
    }, '*');
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
    postStructuredError({
        message: message,
        source: source,
        line: lineno,
        column: colno,
        stack: error && error.stack ? error.stack : ''
    });
    return true;
    };
    window.addEventListener('unhandledrejection', e => {
    const reason = e && Object.prototype.hasOwnProperty.call(e, 'reason') ? e.reason : 'Unknown rejection reason';
    postStructuredError({
        message: 'Unhandled promise rejection',
        source: (e && e.reason && e.reason.sourceURL) || '',
        line: (e && e.reason && e.reason.line) || 0,
        column: (e && e.reason && e.reason.column) || 0,
        stack: reason && reason.stack ? reason.stack : ''
    });
    postLog('error', ['Unhandled promise rejection:', reason]);
    });`;
    }
}
