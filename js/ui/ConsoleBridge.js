class ConsoleBridge {
    constructor(consoleMessageType, previewScriptGenerator) {
        this.consoleMessageType = consoleMessageType;
        this.previewScriptGenerator = previewScriptGenerator;
        this.logCounts = { log: 0, warn: 0, error: 0, info: 0 };
        this.filters = { log: true, warn: true, error: true, info: true };
        this.OBJECT_COLLAPSE_THRESHOLD = 100;
        this.COPY_FEEDBACK_DURATION = 1000;
    }


    /**
     * Wires the console capture bridge to its DOM output element and the preview iframe.
     * Must be called once after the DOM is fully cached.
     * @param {HTMLElement} outputEl - The container element for rendered log messages
     * @param {HTMLElement} clearBtn - The "Clear console" button
     * @param {HTMLIFrameElement} previewFrame - The preview iframe (used to filter incoming messages)
     */
    init(outputEl, clearBtn, previewFrame) {
        this.outputEl = outputEl;
        this.previewFrame = previewFrame;
        clearBtn.addEventListener('click', () => this.clear());
        window.addEventListener('message', (e) => this.handleMessage(e));
        this.initFilterButtons();
    }

    initFilterButtons() {
        const consoleHeader = this.outputEl.parentElement.querySelector('.console-header');
        if (!consoleHeader) return;

        // Create filter container
        const filterContainer = document.createElement('div');
        filterContainer.className = 'console-filters';
        filterContainer.innerHTML = `
            <button class="console-filter-btn active" data-filter="log" title="Show logs">
                <span class="filter-icon">${SVG_ICONS.pencil}</span>
                <span class="filter-count" data-count="log">0</span>
            </button>
            <button class="console-filter-btn active" data-filter="info" title="Show info">
                <span class="filter-icon">${SVG_ICONS.info}</span>
                <span class="filter-count" data-count="info">0</span>
            </button>
            <button class="console-filter-btn active" data-filter="warn" title="Show warnings">
                <span class="filter-icon">${SVG_ICONS.warning}</span>
                <span class="filter-count" data-count="warn">0</span>
            </button>
            <button class="console-filter-btn active" data-filter="error" title="Show errors">
                <span class="filter-icon">${SVG_ICONS.xCircle}</span>
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
    }

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
    }

    updateFilterCounts() {
        Object.keys(this.logCounts).forEach(type => {
            const countEl = document.querySelector(`.filter-count[data-count="${type}"]`);
            if (countEl) {
                countEl.textContent = this.logCounts[type];
                countEl.classList.toggle('has-count', this.logCounts[type] > 0);
            }
        });
    }

    /**
     * Clears all logged messages from the output element and resets all log counters.
     */
    clear() {
        this.outputEl.innerHTML = '';
        this.logCounts = { log: 0, warn: 0, error: 0, info: 0 };
        this.updateFilterCounts();
    }

    formatValue(arg) {
        if (arg === null) return '<span class="console-null">null</span>';
        if (arg === undefined) return '<span class="console-undefined">undefined</span>';
        if (typeof arg === 'boolean') return `<span class="console-boolean">${arg}</span>`;
        if (typeof arg === 'number') return `<span class="console-number">${arg}</span>`;
        if (typeof arg === 'string') return escapeHtml(arg);
        if (typeof arg === 'object' && arg !== null) {
            try {
                const json = JSON.stringify(arg, null, 2);
                const isLarge = json.length > this.OBJECT_COLLAPSE_THRESHOLD || json.includes('\n');
                if (isLarge) {
                    return `<details class="console-object"><summary>${Array.isArray(arg) ? `Array(${arg.length})` : 'Object'}</summary><pre>${escapeHtml(json)}</pre></details>`;
                }
                return `<span class="console-object-inline">${escapeHtml(json)}</span>`;
            } catch (e) {
                return '<span class="console-error">[Unserializable Object]</span>';
            }
        }
        return String(arg);
    }

    getIcon(level) {
        const icons = {
            log: SVG_ICONS.pencil,
            info: SVG_ICONS.info,
            warn: SVG_ICONS.warning,
            error: SVG_ICONS.xCircle
        };
        return icons[level] || SVG_ICONS.pencil;
    }

    getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    }

    formatRuntimeErrorEntry(entry) {
        const source = entry.source || '(unknown source)';
        const line = Number(entry.line) || 0;
        const column = Number(entry.column) || 0;
        const location = line || column ? `${source}:${line}:${column}` : source;
        const origin = entry.originType || 'unknown';
        const stack = entry.stack
            ? `<details class="console-object"><summary>Stack trace</summary><pre>${escapeHtml(entry.stack)}</pre></details>`
            : '';

        return `<span class="console-runtime-error"><strong>${escapeHtml(String(entry.message || 'Runtime error'))}</strong> <span class="console-object-inline">(${escapeHtml(origin)})</span><br><span class="console-object-inline">${escapeHtml(location)}</span>${stack}</span>`;
    }

    normalizeMessage(message) {
        if (Array.isArray(message)) return message;
        if (message === undefined) return [];
        return [message];
    }

    isStructuredRuntimeErrorEntry(arg) {
        return !!(
            arg &&
            typeof arg === 'object' &&
            !Array.isArray(arg) &&
            arg.kind === 'runtime-error' &&
            Object.prototype.hasOwnProperty.call(arg, 'message') &&
            Object.prototype.hasOwnProperty.call(arg, 'source') &&
            Object.prototype.hasOwnProperty.call(arg, 'originType')
        );
    }

    formatMessageEntries(messageEntries) {
        return messageEntries.map(arg => {
            if (this.isStructuredRuntimeErrorEntry(arg)) {
                return this.formatRuntimeErrorEntry(arg);
            }
            return this.formatValue(arg);
        }).join(' ');
    }

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

        const messageEntries = this.normalizeMessage(logData.message);
        const messageContent = this.formatMessageEntries(messageEntries);

        el.innerHTML = `
            <span class="log-icon" aria-hidden="true">${this.getIcon(level)}</span>
            <span class="log-timestamp">${this.getTimestamp()}</span>
            <span class="log-content">${messageContent}</span>
            <button class="log-copy-btn" title="Copy message" aria-label="Copy message to clipboard">${SVG_ICONS.clipboard}</button>
        `;

        // Add copy functionality with accessibility support
        const copyBtn = el.querySelector('.log-copy-btn');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = messageEntries.map(arg => {
                if (this.isStructuredRuntimeErrorEntry(arg)) {
                    const source = arg.source || '(unknown source)';
                    const line = Number(arg.line) || 0;
                    const column = Number(arg.column) || 0;
                    const location = line || column ? `${source}:${line}:${column}` : source;
                    return `[RuntimeError/${arg.originType}] ${arg.message} @ ${location}${arg.stack ? `
${arg.stack}` : ''}`;
                }
                if (typeof arg === 'object') {
                    try { return JSON.stringify(arg, null, 2); } catch (e) { return String(arg); }
                }
                return String(arg);
            }).join(' ');
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.innerHTML = SVG_ICONS.checkCircle;
                copyBtn.setAttribute('aria-label', 'Copied to clipboard');
                setTimeout(() => {
                    copyBtn.innerHTML = SVG_ICONS.clipboard;
                    copyBtn.setAttribute('aria-label', 'Copy message to clipboard');
                }, this.COPY_FEEDBACK_DURATION);
            }).catch(() => {
                copyBtn.innerHTML = SVG_ICONS.xCircle;
                copyBtn.setAttribute('aria-label', 'Failed to copy');
                setTimeout(() => {
                    copyBtn.innerHTML = SVG_ICONS.clipboard;
                    copyBtn.setAttribute('aria-label', 'Copy message to clipboard');
                }, this.COPY_FEEDBACK_DURATION);
            });
        });

        this.outputEl.appendChild(el);
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    /**
     * Handles postMessage events from the preview iframe.
     * Filters to only process console capture messages from the active preview frame.
     * @param {MessageEvent} event
     */
    handleMessage(event) {
        const CONSOLE_MESSAGE_TYPE = this.consoleMessageType;
        // Guard: event.data may be null (e.g. from browser extensions).
        if (
            event.data &&
            event.source === this.previewFrame?.contentWindow &&
            event.data.type === CONSOLE_MESSAGE_TYPE
        ) {
            this.log(event.data);
        }
    }
    getCaptureScript(fileSystem = null, mainHtmlPath = 'index.html') {
        const MESSAGE_TYPE = this.consoleMessageType;

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
                const virtualFileSystem = JSON.parse(new TextDecoder().decode(base64ToUint8Array(virtualFileSystemData)));
                const mainHtmlPath = "${mainHtmlPath}";
            `;
        } else {
            fileSystemScript = `
                const virtualFileSystem = {};
                const mainHtmlPath = "index.html";
            `;
        }

        // Use the centralized code generators from previewScriptGenerator
        const fsUtils = this.previewScriptGenerator;
        const base64HelperCode = fsUtils.generateBase64HelperCode();
        const resolvePathCode = fsUtils.generateResolvePathCode();
        const findFileCode = fsUtils.generateFindFileCode();
        const getCurrentFilePathCode = fsUtils.generateGetCurrentFilePathCode();
        const assetResolverCode = fsUtils.generateAssetResolverCode();
        const fetchOverrideCode = fsUtils.generateFetchOverrideCode();
        const xhrOverrideCode = fsUtils.generateXHROverrideCode();
        const imageOverrideCode = fsUtils.generateImageOverrideCode();
        const audioOverrideCode = fsUtils.generateAudioOverrideCode();
        const cssURLOverrideCode = fsUtils.generateCSSURLOverrideCode();
        const elementSrcOverrideCode = fsUtils.generateElementSrcOverrideCode();
        const serviceWorkerOverrideCode = fsUtils.generateServiceWorkerOverrideCode();
        const consoleOverrideCode = fsUtils.generateConsoleOverrideCode(MESSAGE_TYPE);

        return `<script>
(function() {
    ${fileSystemScript}
    ${base64HelperCode}
    ${resolvePathCode}
    ${findFileCode}
    ${getCurrentFilePathCode}
    ${assetResolverCode}
    ${fetchOverrideCode}
    ${xhrOverrideCode}
    ${imageOverrideCode}
    ${audioOverrideCode}
    ${cssURLOverrideCode}
    ${elementSrcOverrideCode}
    ${serviceWorkerOverrideCode}
    ${consoleOverrideCode}
})();
</script>`;
    }
}
