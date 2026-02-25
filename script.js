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
 * - fileSystemUtils: Virtual file system runtime operations (path resolution, file lookup, data URLs)
 * - previewScriptGenerator: Code-generation utilities — produces JS strings injected into the preview iframe
 * - init(): Application initialization
 * - Editor Management: initEditors(), createEditorForTextarea(), etc.
 * - File Management: addNewFile(), importFile(), exportFile(), etc.
 * - Preview Management: renderPreview(), toggleModal(), etc.
 * - UI Management: eventManager.bindAll(), switchMode(), etc.
 * - htmlGenerators: HTML generation utilities
 * - notificationSystem: Toast notifications
 * - assetReplacers: Asset path replacement for multi-file projects
 * - consoleBridge: Console capture and logging
 * 
 */
const SVG_ICONS = {
    // UI Action Icons
    settings: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/><circle cx="5" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="8" r="1.5" fill="currentColor"/><circle cx="7" cy="12" r="1.5" fill="currentColor"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10l-1 10H4L3 4z"/><path d="M1 4h14"/><path d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4"/><line x1="6.5" y1="7" x2="6.5" y2="11"/><line x1="9.5" y1="7" x2="9.5" y2="11"/></svg>',
    package: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1L14 4v8l-6 3L2 12V4l6-3z"/><path d="M8 8v7"/><path d="M2 4l6 4 6-4"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v8h-13v-10z"/></svg>',
    folderOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v2"/><path d="M1.5 13.5l2-6h12l-2 6h-12z"/></svg>',
    folderTabs: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v8h-13v-10z"/><path d="M5 3.5V1.5h4v2"/></svg>',
    clipboard: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2.5" width="10" height="12" rx="1"/><path d="M5.5 2.5V2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v.5"/><line x1="5.5" y1="7" x2="10.5" y2="7"/><line x1="5.5" y1="9.5" x2="10.5" y2="9.5"/><line x1="5.5" y1="12" x2="8.5" y2="12"/></svg>',
    document: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14.5" y2="14.5"/></svg>',
    format: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="13" x2="10" y2="2"/><path d="M10 2l1.5 3"/><path d="M1 6l2-2 2 2"/><circle cx="12.5" cy="3.5" r="0.75" fill="currentColor" stroke="none"/></svg>',
    expand: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="10,2 14,2 14,6"/><polyline points="6,14 2,14 2,10"/><line x1="14" y1="2" x2="9.5" y2="6.5"/><line x1="2" y1="14" x2="6.5" y2="9.5"/></svg>',
    save: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5h9.5L14 4v10.5H2V1.5z"/><rect x="4.5" y="1.5" width="5" height="4"/><rect x="4.5" y="9.5" width="7" height="5"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>',
    dock: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2" width="13" height="12" rx="1"/><line x1="10" y1="2" x2="10" y2="14"/></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3v4H9"/><path d="M3 13v-4h4"/><path d="M4.1 6.1A5 5 0 0 1 13 7"/><path d="M11.9 9.9A5 5 0 0 1 3 9"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>',
    pencil: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z"/></svg>',
    move: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="8" x2="14" y2="8"/><polyline points="10,4 14,8 10,12"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8.5 6.5,12 13,4"/></svg>',
    checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><polyline points="5,8.5 7,10.5 11,5.5"/></svg>',
    xCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><line x1="5.5" y1="5.5" x2="10.5" y2="10.5"/><line x1="10.5" y1="5.5" x2="5.5" y2="10.5"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><line x1="8" y1="7.5" x2="8" y2="11.5"/><circle cx="8" cy="5" r="0.75" fill="currentColor" stroke="none"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5L1 14h14L8 1.5z"/><line x1="8" y1="6" x2="8" y2="10"/><circle cx="8" cy="12" r="0.75" fill="currentColor" stroke="none"/></svg>',
    folderPlus: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v8h-13v-10z"/><line x1="8" y1="7.5" x2="8" y2="11.5"/><line x1="6" y1="9.5" x2="10" y2="9.5"/></svg>',
    folderMinus: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5h4l2 2h7v8h-13v-10z"/><line x1="6" y1="9.5" x2="10" y2="9.5"/></svg>',
    // File Type Icons
    fileHtml: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="3" ry="6.5"/><path d="M1.5 8h13"/></svg>',
    fileCss: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 14l-1-4 3-2-3-2 1-4"/><circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="12"/><path d="M10 12a2 2 0 1 0 4 0"/></svg>',
    fileJs: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,4 1.5,8 4,12"/><polyline points="12,4 14.5,8 12,12"/></svg>',
    fileJson: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2c-2 0-2 2-2 3v1.5c0 1-1 1.5-1.5 1.5 .5 0 1.5.5 1.5 1.5V11c0 1 0 3 2 3"/><path d="M11 2c2 0 2 2 2 3v1.5c0 1 1 1.5 1.5 1.5-.5 0-1.5.5-1.5 1.5V11c0 1 0 3-2 3"/></svg>',
    fileXml: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/><polyline points="6,9 5,11 6,13"/><polyline points="10,9 11,11 10,13"/></svg>',
    fileMarkdown: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/><path d="M6.5 9v4h1v-2.5L9 12l1.5-1.5V13h1V9"/></svg>',
    fileText: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/><line x1="6" y1="8" x2="11" y2="8"/><line x1="6" y1="10.5" x2="11" y2="10.5"/><line x1="6" y1="13" x2="9" y2="13"/></svg>',
    fileImage: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2" width="13" height="12" rx="1"/><circle cx="5" cy="5.5" r="1.5"/><path d="M1.5 12l4-4 3 3 2-2 4 4"/></svg>',
    fileAudio: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6v4h3l4 3V3L5 6H2z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5"/><path d="M12.5 3.5a6 6 0 0 1 0 9"/></svg>',
    fileVideo: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="3" width="13" height="10" rx="1"/><path d="M6 6.5v3l3-1.5-3-1.5z"/></svg>',
    fileFont: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14l4-12 4 12"/><line x1="5.5" y1="10" x2="10.5" y2="10"/><line x1="3" y1="14" x2="5" y2="14"/><line x1="11" y1="14" x2="13" y2="14"/></svg>',
    filePdf: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.5h5.5L13 5v9.5H4V1.5z"/><path d="M9 1.5v4h4"/><path d="M6 9h1.5a1.25 1.25 0 0 0 0-2.5H6v6"/></svg>',
    fileBinary: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1L14 4v8l-6 3L2 12V4l6-3z"/><path d="M8 8v7"/><path d="M2 4l6 4 6-4"/></svg>',
};


/**
 * Handles preview rendering concerns such as debouncing and runtime fallback UI.
 */
class PreviewRenderer {
    /**
     * @param {typeof CodePreviewer} app
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Debounce preview refresh requests to reduce expensive iframe updates while typing.
     */
    scheduleRefresh() {
        const { state } = this.app;
        clearTimeout(state.previewRefreshTimer);

        state.previewRefreshTimer = setTimeout(() => {
            state.previewRefreshTimer = null;
            this.safeRefreshOpenPreviews();
        }, state.previewRefreshDelay);
    }

    /**
     * Triggers a preview render to the requested target.
     * Validates HTML availability before proceeding.
     * @param {'modal'|'tab'} target - Where to display the preview
     */
    render(target) {
        const availability = this.app.getPreviewAvailability();
        if (!availability.allowed) {
            this.app.showNotification('No HTML file found. Import or create an HTML file to preview.', 'warn');
            this.app.updatePreviewActionButtons();
            return;
        }

        // Always revoke previous asset URLs before generating new ones to avoid leaks.
        this.app.revokeTrackedObjectUrls(this.app.state.previewAssetUrls);
        const content = this.app.generatePreviewContent();

        if (target === 'modal') {
            this.app.consoleBridge.clear();
            this.safeWritePreviewFrame(content);
            this.app.toggleModal(true);
            return;
        }

        if (target === 'tab') {
            try {
                this.app.updatePreviewTab(content, true);
                this.app.showNotification('Preview opened in a new tab.', 'success');
            } catch (error) {
                console.error('Failed to create or open new tab:', error);
                this.app.showNotification('Unable to open preview tab. Check popup settings and try again.', 'error');
            }
        }
    }

    /**
     * Safely refresh already-open preview targets (modal and/or tab).
     * On failure, writes an error document to the iframe instead of silently breaking.
     */
    safeRefreshOpenPreviews() {
        try {
            this.app.refreshOpenPreviews();
        } catch (error) {
            console.error('Preview refresh failed:', error);
            this.app.showNotification('Preview refresh failed. The editor content is unchanged.', 'error');
            this.safeWritePreviewFrame(this.buildPreviewErrorDocument(error));
        }
    }

    /**
     * Writes an HTML string to the preview iframe's srcdoc.
     * On failure, replaces the content with a formatted error document.
     * @param {string} content - Complete HTML document string
     */
    safeWritePreviewFrame(content) {
        if (!this.app.dom.previewFrame) return;

        try {
            this.app.dom.previewFrame.srcdoc = content;
        } catch (error) {
            console.error('Unable to render preview iframe:', error);
            this.app.dom.previewFrame.srcdoc = this.buildPreviewErrorDocument(error);
            this.app.showNotification('Unable to render preview content. See details in preview pane.', 'error');
        }
    }

    /**
     * Builds a self-contained HTML error document for display inside the preview iframe.
     * @param {unknown} error - The caught error value
     * @returns {string} A minimal HTML document string
     */
    buildPreviewErrorDocument(error) {
        const errorText = this.app.escapeHtml(error instanceof Error ? error.message : String(error));
        return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Preview Error</title></head><body style="font-family:Arial,sans-serif;background:#121219;color:#f8f8ff;padding:16px;"><h2 style="margin-top:0;">Preview rendering error</h2><p>The preview could not be generated safely.</p><pre style="white-space:pre-wrap;background:#1d1f2e;padding:12px;border-radius:8px;border:1px solid #34364d;">${errorText}</pre></body></html>`;
    }
}

/**
 * Persists and restores user preferences via localStorage.
 * All I/O is wrapped in try/catch so a corrupt or missing entry never
 * prevents the application from starting.
 */
class StorageHandler {
    /**
     * @param {typeof CodePreviewer} app
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Reads settings from localStorage and merges them into the current state.
     * Silently ignores missing, malformed, or unreadable data.
     * @returns {void}
     */
    loadSettings() {
        try {
            const raw = localStorage.getItem(this.app.constants.SETTINGS_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            this.app.state.settings = this.app.normalizeSettings({
                ...this.app.state.settings,
                ...parsed,
            });
        } catch (error) {
            console.warn('Unable to load settings:', error);
        }
    }

    /**
     * Serializes the current settings object to localStorage.
     * Silently ignores QuotaExceededError and other write failures.
     * @returns {void}
     */
    saveSettings() {
        try {
            localStorage.setItem(
                this.app.constants.SETTINGS_STORAGE_KEY,
                JSON.stringify(this.app.state.settings)
            );
        } catch (error) {
            console.warn('Unable to save settings:', error);
        }
    }
}

class EventManager {
    /**
     * @param {typeof CodePreviewer} app
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Entry point — wires every category of events.
     * Called once during init().
     */
    bindAll() {
        this.bindPrimaryActions();
        this.bindConsoleActions();
        this.bindPreviewDock();
        this.bindModalOverlay();
        this.bindKeyboard();
        this.bindCodeModal();
        this.bindMediaModal();
        this.bindFileActions();
        this.bindSettingsModal();
        this.bindViewportResize();
    }

    // ─── Preview ──────────────────────────────────────────────────────────────

    /**
     * Binds the primary preview action buttons (modal / tab).
     */
    bindPrimaryActions() {
        this.app.dom.modalBtn.addEventListener('click', () => this.app.renderPreview('modal'));
        this.app.dom.tabBtn.addEventListener('click', () => this.app.renderPreview('tab'));
        this.app.dom.closeModalBtn.addEventListener('click', () => this.app.toggleModal(false));
        this.app.dom.refreshPreviewBtn?.addEventListener('click', () => this.app.refreshModalPreview());
    }

    // ─── Console ──────────────────────────────────────────────────────────────

    /**
     * Binds console toggle button.
     */
    bindConsoleActions() {
        this.app.dom.toggleConsoleBtn.addEventListener('click', () => this.app.toggleConsole());
    }

    // ─── Preview Dock ─────────────────────────────────────────────────────────

    /**
     * Binds dock toggle and resize-divider drag events.
     */
    bindPreviewDock() {
        this.app.dom.dockPreviewBtn?.addEventListener('click', () => this.app.togglePreviewDock());
        this.app.dom.previewDockDivider?.addEventListener(
            'pointerdown',
            (e) => this.app.startPreviewDockResize(e)
        );
    }

    // ─── Modal Overlay ────────────────────────────────────────────────────────

    /**
     * Closes the preview modal when the backdrop is clicked (undocked mode only).
     */
    bindModalOverlay() {
        this.app.dom.modalOverlay.addEventListener('click', (e) => {
            if (this.app.state.isPreviewDocked) return;
            if (e.target === this.app.dom.modalOverlay) this.app.toggleModal(false);
        });
    }

    // ─── Global Keyboard ──────────────────────────────────────────────────────

    /**
     * Binds application-wide keyboard shortcuts.
     */
    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            const { app } = this;
            const activePanel = app.getActiveEditorPanel();

            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                app.renderPreview('modal');
                return;
            }

            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                app.focusSidebarSearch();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'f') {
                const codeModal = app.dom.codeModal;
                const isCodeModalOpen = codeModal?.getAttribute('aria-hidden') === 'false';
                if (isCodeModalOpen) {
                    e.preventDefault();
                    app.openCodeModalSearch();
                } else if (activePanel) {
                    e.preventDefault();
                    app.openPanelSearch(activePanel);
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e' && activePanel) {
                e.preventDefault();
                app.expandCode(activePanel);
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f' && activePanel) {
                e.preventDefault();
                app.formatPanelCode(activePanel, false);
                return;
            }

            if (e.key === 'Escape') {
                if (app.dom.modalOverlay.getAttribute('aria-hidden') === 'false') {
                    app.toggleModal(false);
                }
                app.toggleSettingsModal(false);
                if (app.dom.codeModal?.getAttribute('aria-hidden') === 'false') {
                    app.closeCodeModal();
                }
                if (app.dom.mediaModal?.getAttribute('aria-hidden') === 'false') {
                    app.closeMediaModal();
                }
            }
        });
    }

    // ─── Code Modal ───────────────────────────────────────────────────────────

    /**
     * Binds code-view modal close and search actions.
     */
    bindCodeModal() {
        const { app } = this;
        const codeModalCloseBtn = app.dom.codeModal?.querySelector('.close-btn');

        if (codeModalCloseBtn) {
            codeModalCloseBtn.addEventListener('click', () => app.closeCodeModal());
        }

        if (app.dom.codeModal) {
            app.dom.codeModal.addEventListener('click', (e) => {
                if (e.target === app.dom.codeModal) app.closeCodeModal();
            });
        }

        if (app.dom.codeModalDockBtn) {
            app.dom.codeModalDockBtn.addEventListener('click', () => app.toggleCodeModalDockLeft());
        }

        if (app.dom.codeModalSearchBtn) {
            app.dom.codeModalSearchBtn.addEventListener('click', () => app.toggleCodeModalSearch());
        }

        if (app.dom.codeModalSearchInput) {
            app.dom.codeModalSearchInput.addEventListener('input', () => app.searchInCodeModal(false));
            app.dom.codeModalSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    app.searchInCodeModal(true);
                }
            });
        }

        if (app.dom.codeModalSearchNextBtn) {
            app.dom.codeModalSearchNextBtn.addEventListener('click', () => app.searchInCodeModal(true));
        }

        if (app.dom.codeModalSearchCloseBtn) {
            app.dom.codeModalSearchCloseBtn.addEventListener('click', () => app.closeCodeModalSearch());
        }

    }

    // ─── Media Modal ──────────────────────────────────────────────────────────

    /**
     * Binds media preview modal close action.
     */
    bindMediaModal() {
        const { app } = this;
        const mediaModalCloseBtn = app.dom.mediaModal?.querySelector('.close-btn');

        if (mediaModalCloseBtn) {
            mediaModalCloseBtn.addEventListener('click', () => app.closeMediaModal());
        }

        if (app.dom.mediaModal) {
            app.dom.mediaModal.addEventListener('click', (e) => {
                if (e.target === app.dom.mediaModal) app.closeMediaModal();
            });
        }
    }

    // ─── File Actions ─────────────────────────────────────────────────────────

    /**
     * Binds file management toolbar buttons (add, import, export, clear).
     */
    bindFileActions() {
        const { app } = this;

        app.dom.addFileBtn.addEventListener('click', () => app.addNewFile());
        app.dom.addFolderBtn?.addEventListener('click', () => app.addNewFolder());
        app.dom.clearAllFilesBtn?.addEventListener('click', () => app.clearAllFiles());
        app.dom.importFileBtn.addEventListener('click', () => app.importFile());
        app.dom.importFolderBtn?.addEventListener('click', () => app.importFolder());
        app.dom.importZipBtn.addEventListener('click', () => app.importArchive());
        app.dom.exportZipBtn.addEventListener('click', () => app.exportZip());

        app.setupMainHtmlDropdownEvents();

        // Close custom dropdowns when clicking outside their boundaries
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.file-type-dropdown')) app.closeAllFileTypeDropdowns();
            if (!e.target.closest('.settings-select-dropdown')) app.closeAllSettingsSelectDropdowns();
        });
    }

    // ─── Settings Modal ───────────────────────────────────────────────────────

    /**
     * Binds settings button, settings modal close/backdrop, and all setting controls.
     * Uses a declarative binding table to eliminate repetitive handler blocks.
     */
    bindSettingsModal() {
        const { app } = this;

        app.dom.settingsBtn?.addEventListener('click', () => app.toggleSettingsModal(true));

        if (!app.dom.settingsModal) return;

        // Close on backdrop click
        app.dom.settingsModal.addEventListener('click', (e) => {
            if (e.target === app.dom.settingsModal) app.toggleSettingsModal(false);
        });

        // Custom dropdown: open/select
        app.dom.settingsModal.addEventListener('click', (e) => {
            const trigger = e.target.closest('.settings-select-dropdown-trigger');
            if (trigger) {
                app.toggleSettingsSelectDropdown(trigger.closest('.settings-select-dropdown'));
                return;
            }
            const option = e.target.closest('.settings-select-dropdown-option');
            if (option) {
                app.selectSettingsDropdownOption(option.closest('.settings-select-dropdown'), option);
            }
        });

        // Custom dropdown: keyboard navigation
        app.dom.settingsModal.addEventListener('keydown', (e) => {
            const dropdown = e.target.closest('.settings-select-dropdown');
            if (!dropdown) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                app.toggleSettingsSelectDropdown(dropdown, true);
                app.moveSettingsDropdownFocus(dropdown, 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                app.toggleSettingsSelectDropdown(dropdown, true);
                app.moveSettingsDropdownFocus(dropdown, -1);
            } else if (e.key === 'Enter' || e.key === ' ') {
                const option = e.target.closest('.settings-select-dropdown-option');
                if (option) {
                    e.preventDefault();
                    app.selectSettingsDropdownOption(dropdown, option);
                } else if (e.target.closest('.settings-select-dropdown-trigger')) {
                    e.preventDefault();
                    app.toggleSettingsSelectDropdown(dropdown);
                }
            }
        });

        // Close button
        const settingsCloseBtn = app.dom.settingsModal.querySelector('.close-btn');
        if (settingsCloseBtn) {
            settingsCloseBtn.addEventListener('click', () => app.toggleSettingsModal(false));
        }

        // ESC to close (registered once on document to avoid duplicates)
        if (!app.state.settingsEscHandler) {
            app.state.settingsEscHandler = (e) => {
                if (e.key === 'Escape' && app.isSettingsModalOpen()) {
                    const hasOpenDropdown = !!app.dom.settingsModal?.querySelector(
                        '.settings-select-dropdown-trigger[aria-expanded="true"]'
                    );
                    if (hasOpenDropdown) {
                        app.closeAllSettingsSelectDropdowns();
                        return;
                    }
                    app.toggleSettingsModal(false);
                }
            };
            document.addEventListener('keydown', app.state.settingsEscHandler);
        }

        this._bindSettingControls();
    }

    /**
     * Declarative table-driven binding for individual setting controls.
     * Each entry maps a DOM element to a state property and a value reader.
     * This replaces nine near-identical if-block handlers.
     * @private
     */
    _bindSettingControls() {
        const { app } = this;

        /** @type {Array<{domKey: string, stateKey: string, readValue: function, refreshEditors?: boolean}>} */
        const SETTING_BINDINGS = [
            { domKey: 'settingLineNumbers',    stateKey: 'lineNumbers',       readValue: (el) => el.checked,                  refreshEditors: true  },
            { domKey: 'settingLineWrap',        stateKey: 'lineWrapping',      readValue: (el) => el.checked,                  refreshEditors: true  },
            { domKey: 'settingAutoFormat',      stateKey: 'autoFormatOnType',  readValue: (el) => el.checked,                  refreshEditors: false },
            { domKey: 'settingFontSize',        stateKey: 'fontSize',          readValue: (el) => Number(el.value) || 14,      refreshEditors: true  },
            { domKey: 'settingEditorTheme',     stateKey: 'theme',             readValue: (el) => el.value || 'dracula',       refreshEditors: true  },
            { domKey: 'settingTabSize',         stateKey: 'tabSize',           readValue: (el) => Number(el.value) || 4,       refreshEditors: true  },
            { domKey: 'settingIndentWithTabs',  stateKey: 'indentWithTabs',    readValue: (el) => el.checked,                  refreshEditors: true  },
            { domKey: 'settingAutoCloseBrackets', stateKey: 'autoCloseBrackets', readValue: (el) => el.checked,               refreshEditors: true  },
            { domKey: 'settingMatchBrackets',   stateKey: 'matchBrackets',     readValue: (el) => el.checked,                  refreshEditors: true  },
        ];

        const applySetting = (updateFn, { refreshEditors = false } = {}) => {
            updateFn();
            app.state.settings = app.normalizeSettings(app.state.settings);
            app.syncSettingsUI();
            if (refreshEditors) app.applyEditorSettingsToAllEditors();
            app.saveSettings();
        };

        SETTING_BINDINGS.forEach(({ domKey, stateKey, readValue, refreshEditors }) => {
            const el = app.dom[domKey];
            if (!el) return;
            el.addEventListener('change', () => {
                applySetting(() => { app.state.settings[stateKey] = readValue(el); }, { refreshEditors });
            });
        });
    }

    // ─── Viewport Resize ──────────────────────────────────────────────────────

    /**
     * Registers debounced window-resize and visualViewport-resize handlers.
     * Guards against duplicate registration.
     */
    bindViewportResize() {
        const { app } = this;

        if (!app.state.viewportResizeHandler) {
            app.state.viewportResizeHandler = () => {
                clearTimeout(app.state.viewportResizeTimer);
                app.state.viewportResizeTimer = setTimeout(() => {
                    app.updatePanelMoveButtonDirections();
                    app.updateCodeModalHeaderAndButtons();
                    app.updateAdaptiveLayoutMode();
                }, 80);
            };

            // A single named handler avoids creating a second anonymous wrapper for dock resize.
            const onWindowResize = () => {
                app.state.viewportResizeHandler();
                app.handleDockViewportResize();
            };
            window.addEventListener('resize', onWindowResize);
        }

        if (!app.state.visualViewportResizeHandler && window.visualViewport) {
            app.state.visualViewportResizeHandler = () => {
                app.updatePreviewViewportHeight();
                app.handleDockViewportResize();
            };
            window.visualViewport.addEventListener('resize', app.state.visualViewportResizeHandler);
            window.visualViewport.addEventListener('scroll', app.state.visualViewportResizeHandler);
        }
    }
}

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
        savedFileStates: {}, // Track saved states for files: { fileId: { content: string, fileName: string, fileType: string } }
        modifiedFiles: new Set(),
        sidebarShowModifiedOnly: false,
        sidebarSearchQuery: '',
        selectedFileIds: new Set(),
        selectedFolderPaths: new Set(),
        sidebarSearchDebounceTimer: null,
        codeModalEditor: null,
        currentCodeModalSource: null,
        codeModalSearchState: { query: '', cursorIndex: -1 },
        activePanelId: 'default-html',
        autoFormatTimers: new Map(),
        formattingEditors: new Set(),
        mainHtmlFile: '',
        viewportResizeHandler: null,
        viewportResizeTimer: null,
        visualViewportResizeHandler: null,
        previewTabWindow: null,
        previewTabUrl: null,
        previewAssetUrls: new Set(),
        mediaPreviewUrls: new Set(),
        filePanelPreviewUrls: new Map(),
        previewRefreshTimer: null,
        previewRefreshDelay: 1000,
        isPreviewDocked: false,
        previewDockOrientation: 'right',
        previewDockSize: { right: null, bottom: null },
        dockResizeSession: null,
        isCodeModalDockedLeft: false,
        isSyncingCodeModalToSource: false,
        codeModalPlaintextInputHandlerBound: false,
        settingsCloseHandler: null,
        settingsEscHandler: null,
        settings: {
            lineNumbers: true,
            lineWrapping: false,
            autoFormatOnType: false,
            fontSize: 14,
            theme: 'dracula',
            tabSize: 4,
            indentWithTabs: false,
            autoCloseBrackets: true,
            matchBrackets: true,
        },
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
            REFRESH_PREVIEW_BTN: 'refresh-preview-btn',
            ADD_FILE_BTN: 'add-file-btn',
            ADD_FOLDER_BTN: 'add-folder-btn',
            CLEAR_ALL_FILES_BTN: 'clear-all-files-btn',
            IMPORT_FILE_BTN: 'import-file-btn',
            IMPORT_FOLDER_BTN: 'import-folder-btn',
            IMPORT_ZIP_BTN: 'import-zip-btn',
            EXPORT_ZIP_BTN: 'export-zip-btn',
            SETTINGS_BTN: 'settings-btn',
            SETTINGS_MODAL: 'settings-modal',
            SETTINGS_LINE_NUMBERS: 'setting-line-numbers',
            SETTINGS_LINE_WRAP: 'setting-line-wrap',
            SETTINGS_AUTO_FORMAT: 'setting-auto-format',
            SETTINGS_FONT_SIZE: 'setting-font-size',
            SETTINGS_EDITOR_THEME: 'setting-editor-theme',
            SETTINGS_TAB_SIZE: 'setting-tab-size',
            SETTINGS_INDENT_WITH_TABS: 'setting-indent-with-tabs',
            SETTINGS_AUTO_CLOSE_BRACKETS: 'setting-auto-close-brackets',
            SETTINGS_MATCH_BRACKETS: 'setting-match-brackets',
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
        SETTINGS_STORAGE_KEY: 'codepreviewer.settings',
        
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
                const normalizedMimeType = mimeType.toLowerCase().split(';')[0].trim();
                if (normalizedMimeType === 'image/svg+xml' || normalizedMimeType === 'application/json' || normalizedMimeType.endsWith('+json')) {
                    return false;
                }

                return this.hasBinaryMimePrefix(normalizedMimeType);
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
            if (CodePreviewer.isModuleFile(content, filename)) return 'javascript-module';
            if (/^\s*[\.\#\@]|\s*\w+\s*\{/m.test(content)) return 'css';
            
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
    },

    // ============================================================================
    // PREVIEW SCRIPT GENERATOR
    // Generates JavaScript code strings that are injected into the preview iframe.
    // Kept separate from fileSystemUtils (runtime file-system operations) because
    // these methods produce source-code text, not data.
    // ============================================================================
    previewScriptGenerator: {
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
                        return Promise.resolve(new Blob([base64ToUint8Array(base64)], { type: mimeType }));
                    } else {
                        return Promise.resolve(new Blob([fileData.content], { type: "text/plain" }));
                    }
                },
                arrayBuffer: () => {
                    if (fileData.isBinary && fileData.content.startsWith("data:")) {
                        const [header, base64] = fileData.content.split(",");
                        return Promise.resolve(base64ToUint8Array(base64).buffer);
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
                let targetPath = value.replace(/^\\.\\//,"");
                const fileData = findFileInSystem(targetPath, currentFilePath);
                
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
        },

        generateImageOverrideCode() {
            return this.generateMediaOverrideCode({
                name: 'Image',
                typeCheck: 'fileData.type === "image" || fileData.type === "svg"',
                resolveExpr: 'fileData.isBinary ? fileData.content : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fileData.content)',
                hasInitialSrc: false
            });
        },

        generateAudioOverrideCode() {
            return this.generateMediaOverrideCode({
                name: 'Audio',
                typeCheck: 'fileData.type === "audio"',
                resolveExpr: 'fileData.content',
                hasInitialSrc: true
            });
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
                const currentFilePath = getCurrentFilePath();
                const targetPath = url.replace(/^\\.\\//,"");
                const fileData = findFileInSystem(targetPath, currentFilePath);
                if (fileData && (fileData.type === "image" || fileData.type === "svg")) {
                    const dataUrl = fileData.isBinary ? fileData.content :
                        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fileData.content);
                    return 'url("' + dataUrl + '")';
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
    },

    // ============================================================================
    // APPLICATION INITIALIZATION AND LIFECYCLE
    // ============================================================================
    
    /**
     * Bootstraps the Code Previewer application.
     *
     * Initialization order is intentional:
     *  1. Helper class instances (EventManager needs DOM refs; StorageHandler needs constants).
     *  2. DOM cache — required by every subsequent step.
     *  3. Settings loaded before editors are created so they receive the correct theme/font/etc.
     *  4. Editors initialized before event binding so change-listeners have valid targets.
     *  5. Events bound before file panels so file-tree click handlers are ready.
     *  6. consoleBridge initialized last because it needs the final previewFrame reference.
     */
    init() {
        // 1. Instantiate helpers — storageHandler needed by loadSettings(),
        //    previewRenderer and eventManager needed before bindAll().
        this.previewRenderer = new PreviewRenderer(this);
        this.eventManager    = new EventManager(this);
        this.storageHandler  = new StorageHandler(this);

        // 2. Cache all DOM references once.
        this.cacheDOMElements();
        this.initSettingsCustomDropdowns();

        // 3. Load persisted settings before creating editors.
        this.loadSettings();

        // 4. Initialize CodeMirror editors.
        this.initEditors();

        // 5. Bind all UI events via the EventManager.
        this.eventManager.bindAll();
        this.bindFileTreeEvents();

        // 6. Hydrate existing file panels and ensure default demo files exist.
        this.initExistingFilePanels();
        this.ensureDefaultContentFile();

        // 7. Apply loaded settings to every editor instance and sync the settings UI.
        this.applyEditorSettingsToAllEditors();
        this.syncSettingsUI();

        // 8. Initialize the console capture bridge with the preview iframe reference.
        this.consoleBridge.init(this.dom.consoleOutput, this.dom.clearConsoleBtn, this.dom.previewFrame);

        // 9. Final layout pass.
        this.updatePreviewActionButtons();
        this.updatePreviewViewportHeight();
        this.updateAdaptiveLayoutMode();
    },

    /**
     * Cache all DOM element references for performance
     * @private
     */
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
            refreshPreviewBtn: document.getElementById(CONTROL_IDS.REFRESH_PREVIEW_BTN),
            dockPreviewBtn: document.getElementById('dock-preview-btn'),
            previewDockDivider: document.getElementById('preview-dock-divider'),
            addFileBtn: document.getElementById(CONTROL_IDS.ADD_FILE_BTN),
            addFolderBtn: document.getElementById(CONTROL_IDS.ADD_FOLDER_BTN),
            clearAllFilesBtn: document.getElementById(CONTROL_IDS.CLEAR_ALL_FILES_BTN),
            importFileBtn: document.getElementById(CONTROL_IDS.IMPORT_FILE_BTN),
            importFolderBtn: document.getElementById(CONTROL_IDS.IMPORT_FOLDER_BTN),
            importZipBtn: document.getElementById(CONTROL_IDS.IMPORT_ZIP_BTN),
            exportZipBtn: document.getElementById(CONTROL_IDS.EXPORT_ZIP_BTN),
            settingsBtn: document.getElementById(CONTROL_IDS.SETTINGS_BTN),
            settingsModal: document.getElementById(CONTROL_IDS.SETTINGS_MODAL),
            settingLineNumbers: document.getElementById(CONTROL_IDS.SETTINGS_LINE_NUMBERS),
            settingLineWrap: document.getElementById(CONTROL_IDS.SETTINGS_LINE_WRAP),
            settingAutoFormat: document.getElementById(CONTROL_IDS.SETTINGS_AUTO_FORMAT),
            settingFontSize: document.getElementById(CONTROL_IDS.SETTINGS_FONT_SIZE),
            settingEditorTheme: document.getElementById(CONTROL_IDS.SETTINGS_EDITOR_THEME),
            settingTabSize: document.getElementById(CONTROL_IDS.SETTINGS_TAB_SIZE),
            settingIndentWithTabs: document.getElementById(CONTROL_IDS.SETTINGS_INDENT_WITH_TABS),
            settingAutoCloseBrackets: document.getElementById(CONTROL_IDS.SETTINGS_AUTO_CLOSE_BRACKETS),
            settingMatchBrackets: document.getElementById(CONTROL_IDS.SETTINGS_MATCH_BRACKETS),
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
            codeModalDockBtn: document.getElementById('code-modal-dock-btn'),
            codeModalSearchBtn: document.getElementById('code-modal-search-btn'),
            codeModalSearch: document.getElementById('code-modal-search'),
            codeModalSearchInput: document.getElementById('code-modal-search-input'),
            codeModalSearchNextBtn: document.getElementById('code-modal-search-next-btn'),
            codeModalSearchCloseBtn: document.getElementById('code-modal-search-close-btn'),
            mediaModal: document.getElementById('media-modal'),
            codeModal: document.getElementById('code-modal'),
            codeModalTitle: document.getElementById('code-modal-title'),
            codeModalFileMeta: document.getElementById('code-modal-file-meta'),
            mediaModalContent: document.getElementById('media-modal-content'),
            mediaModalTitle: document.getElementById('media-modal-title'),
        };
    },

    /**
     * Returns the parent element of the given element ID, or null if not found.
     * @param {string} elementId
     * @returns {HTMLElement|null}
     */
    getSafeParentElement(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.parentElement : null;
    },

    /**
     * Escapes special HTML characters in any value.
     * Handles null/undefined gracefully — returns an empty string.
     * @param {unknown} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /**
     * Decodes a base64 string into a Uint8Array.
     * Callers are responsible for ensuring valid base64 input; atob will throw on invalid data.
     * @param {string} base64 - The base64-encoded string
     * @returns {Uint8Array} The decoded byte array
     */
    base64ToUint8Array(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    },

    /**
     * Gets the current content of a file, preferring the editor value when available.
     * @param {Object} file - The file object with optional editor and content properties
     * @returns {string} The file content
     */
    getFileContent(file) {
        return (file.editor && file.editor.getValue ? file.editor.getValue() : file.content) || '';
    },

    createObjectUrlFromDataUrl(dataUrl) {
        if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl;
        try {
            const commaIndex = dataUrl.indexOf(',');
            if (commaIndex === -1) return dataUrl;
            const header = dataUrl.slice(0, commaIndex);
            const dataPart = dataUrl.slice(commaIndex + 1);
            const mimeTypeMatch = header.match(/^data:([^;]+)/i);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';
            const blob = header.includes(';base64')
                ? new Blob([this.base64ToUint8Array(dataPart)], { type: mimeType })
                : new Blob([decodeURIComponent(dataPart)], { type: mimeType });
            return URL.createObjectURL(blob);
        } catch (error) {
            return null;
        }
    },

    createTrackedObjectUrlFromDataUrl(dataUrl, urlSet = this.state.previewAssetUrls) {
        const objectUrl = this.createObjectUrlFromDataUrl(dataUrl);
        if (objectUrl === null) {
            return dataUrl;
        }
        if (!this.isBlobUrl(objectUrl)) {
            return dataUrl;
        }
        if (urlSet) {
            urlSet.add(objectUrl);
        }
        return objectUrl;
    },

    /**
     * Returns true if the given string is a blob: URL.
     * @param {unknown} url
     * @returns {boolean}
     */
    isBlobUrl(url) {
        return typeof url === 'string' && url.startsWith('blob:');
    },

    getPreviewAssetUrl(fileData, defaultMimeType = 'text/plain', urlSet = this.state.previewAssetUrls) {
        const sourceUrl = this.fileSystemUtils.getFileDataUrl(fileData, defaultMimeType);
        if (fileData?.isBinary && typeof sourceUrl === 'string' && sourceUrl.startsWith('data:')) {
            return this.createTrackedObjectUrlFromDataUrl(sourceUrl, urlSet);
        }
        return sourceUrl;
    },

    /**
     * Revokes all object URLs in the provided Set and clears it.
     * @param {Set<string>} urlSet
     */
    revokeTrackedObjectUrls(urlSet) {
        for (const url of urlSet) {
            URL.revokeObjectURL(url);
        }
        urlSet.clear();
    },

    getFilePanelPreviewContent(fileId, fileType, content, isBinary) {
        const isDirectPreviewType = ['image', 'audio', 'video', 'pdf'].includes(fileType);
        if (!isBinary || !isDirectPreviewType) return content;

        const existingPreviewUrl = this.state.filePanelPreviewUrls.get(fileId);
        if (existingPreviewUrl) {
            return existingPreviewUrl;
        }

        const previewUrl = this.createObjectUrlFromDataUrl(content);
        if (previewUrl === null) {
            return content;
        }
        if (!this.isBlobUrl(previewUrl)) {
            return content;
        }
        this.state.filePanelPreviewUrls.set(fileId, previewUrl);
        return previewUrl;
    },

    revokeFilePanelPreviewUrl(fileId) {
        const previewUrl = this.state.filePanelPreviewUrls.get(fileId);
        if (!previewUrl) return;
        URL.revokeObjectURL(previewUrl);
        this.state.filePanelPreviewUrls.delete(fileId);
    },

    revokeAllFilePanelPreviewUrls() {
        for (const previewUrl of this.state.filePanelPreviewUrls.values()) {
            URL.revokeObjectURL(previewUrl);
        }
        this.state.filePanelPreviewUrls.clear();
    },

    cleanupPreviewAssetUrlsIfUnused() {
        const isPreviewModalOpen = this.dom.modalOverlay?.getAttribute('aria-hidden') === 'false';
        const isPreviewTabOpen = this.state.previewTabWindow && !this.state.previewTabWindow.closed;
        if (!isPreviewModalOpen && !isPreviewTabOpen) {
            this.revokeTrackedObjectUrls(this.state.previewAssetUrls);
        }
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

    /**
     * Applies preview-button enabled/disabled state to a single button element.
     * @param {HTMLElement|null|undefined} btn
     * @param {boolean} disabled
     * @param {string} enabledTitle
     * @param {string} disabledReason
     * @private
     */
    _applyPreviewButtonState(btn, disabled, enabledTitle, disabledReason) {
        if (!btn) return;
        btn.disabled = false;
        btn.setAttribute('aria-disabled', String(disabled));
        btn.classList.toggle('button-disabled-state', disabled);
        btn.title = disabled ? disabledReason : enabledTitle;
    },

    updatePreviewActionButtons() {
        const availability = this.getPreviewAvailability();
        const disabled = !availability.allowed;
        this._applyPreviewButtonState(this.dom.modalBtn, disabled, 'Open preview in modal', availability.reason);
        this._applyPreviewButtonState(this.dom.tabBtn,   disabled, 'Open preview in new tab', availability.reason);
    },

    initEditors() {
        if (typeof window.CodeMirror === 'undefined') {
            console.warn('CodeMirror not available, using fallback textarea editors');
            this.initFallbackEditors();
            return;
        }

        // CodeMirror editor configuration with all settings
        // Note: indentUnit is set to match tabSize regardless of indentWithTabs.
        // This ensures consistent indentation width whether using spaces or tabs.
        const editorConfig = (mode) => ({
            lineNumbers: !!this.state.settings.lineNumbers,
            mode: mode,
            theme: this.state.settings.theme,
            autoCloseTags: mode === 'htmlmixed',
            lineWrapping: !!this.state.settings.lineWrapping,
            tabSize: this.state.settings.tabSize,
            indentUnit: this.state.settings.tabSize,
            indentWithTabs: !!this.state.settings.indentWithTabs,
            autoCloseBrackets: !!this.state.settings.autoCloseBrackets,
            matchBrackets: !!this.state.settings.matchBrackets,
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

        this.applyEditorSettingsToAllEditors();
        this.setDefaultContent();
    },

    initFallbackEditors() {
        const createMockEditor = (textarea) => {
            if (!textarea) return null;
            
            Object.assign(textarea.style, {
                fontFamily: 'monospace', fontSize: `${this.state.settings.fontSize}px`, lineHeight: '1.5',
                resize: 'none', border: 'none', outline: 'none',
                background: '#282a36', color: '#f8f8f2', padding: '1rem',
                width: '100%', height: '400px'
            });
            
            return {
                setValue: (value) => textarea.value = value,
                getValue: () => textarea.value,
                refresh: () => {},
                setOption: () => {},
                on: (eventName, handler) => {
                    if (eventName !== 'change' || !handler) return;
                    if (textarea.__changeListener) {
                        textarea.removeEventListener('input', textarea.__changeListener);
                    }
                    textarea.__changeListener = () => handler(null, { origin: '+input' });
                    textarea.addEventListener('input', textarea.__changeListener);
                },
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

        this.initFileSavedState(fileId, content, fileName, 'markdown');
        this.setupEditorChangeListener(fileId, editor);
        this.state.openPanels.add(fileId);

        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (panel) {
            this.bindFilePanelEvents(panel);
        }

        this.refreshPanelAndFileTreeUI();
    },


    /**
     * Load user settings from localStorage
     * @private
     */
    loadSettings() {
        this.storageHandler.loadSettings();
    },

    /**
     * Save user settings to localStorage
     * @private
     */
    saveSettings() {
        this.storageHandler.saveSettings();
    },

    normalizeSettings(nextSettings = {}) {
        const allowedFontSizes = new Set([12, 13, 14, 15, 16, 18]);
        const allowedThemes = new Set(['dracula', 'default', 'material', 'monokai', 'nord', 'eclipse', 'idea']);
        const allowedTabSizes = new Set([2, 4, 8]);

        const fontSize = Number(nextSettings.fontSize);
        const tabSize = Number(nextSettings.tabSize);

        return {
            ...nextSettings,
            lineNumbers: typeof nextSettings.lineNumbers === 'boolean' ? nextSettings.lineNumbers : true,
            lineWrapping: typeof nextSettings.lineWrapping === 'boolean' ? nextSettings.lineWrapping : false,
            autoFormatOnType: typeof nextSettings.autoFormatOnType === 'boolean' ? nextSettings.autoFormatOnType : false,
            fontSize: allowedFontSizes.has(fontSize) ? fontSize : 14,
            theme: allowedThemes.has(nextSettings.theme) ? nextSettings.theme : 'dracula',
            tabSize: allowedTabSizes.has(tabSize) ? tabSize : 4,
            indentWithTabs: typeof nextSettings.indentWithTabs === 'boolean' ? nextSettings.indentWithTabs : false,
            autoCloseBrackets: typeof nextSettings.autoCloseBrackets === 'boolean' ? nextSettings.autoCloseBrackets : true,
            matchBrackets: typeof nextSettings.matchBrackets === 'boolean' ? nextSettings.matchBrackets : true,
        };
    },

    syncSettingsUI() {
        if (this.dom.settingLineNumbers) this.dom.settingLineNumbers.checked = !!this.state.settings.lineNumbers;
        if (this.dom.settingLineWrap) this.dom.settingLineWrap.checked = !!this.state.settings.lineWrapping;
        if (this.dom.settingAutoFormat) this.dom.settingAutoFormat.checked = !!this.state.settings.autoFormatOnType;
        if (this.dom.settingFontSize) this.dom.settingFontSize.value = String(this.state.settings.fontSize);
        if (this.dom.settingEditorTheme) this.dom.settingEditorTheme.value = this.state.settings.theme;
        if (this.dom.settingTabSize) this.dom.settingTabSize.value = String(this.state.settings.tabSize);
        if (this.dom.settingIndentWithTabs) this.dom.settingIndentWithTabs.checked = !!this.state.settings.indentWithTabs;
        if (this.dom.settingAutoCloseBrackets) this.dom.settingAutoCloseBrackets.checked = !!this.state.settings.autoCloseBrackets;
        if (this.dom.settingMatchBrackets) this.dom.settingMatchBrackets.checked = !!this.state.settings.matchBrackets;

        [this.dom.settingFontSize, this.dom.settingEditorTheme, this.dom.settingTabSize]
            .filter(Boolean)
            .forEach((select) => this.updateSettingsSelectDropdownUI(select));
    },

    initSettingsCustomDropdowns() {
        const settingSelects = [this.dom.settingFontSize, this.dom.settingEditorTheme, this.dom.settingTabSize].filter(Boolean);

        settingSelects.forEach((select) => {
            if (select.dataset.customDropdownInit === 'true') {
                return;
            }

            select.classList.add('visually-hidden-select');

            const dropdown = document.createElement('div');
            dropdown.className = 'settings-select-dropdown';
            dropdown.dataset.settingsDropdown = 'true';
            dropdown.dataset.selectId = select.id;

            const listId = `${select.id}-custom-listbox`;

            dropdown.innerHTML = `
                <button type="button" class="settings-select-dropdown-trigger" aria-haspopup="listbox" aria-controls="${this.escapeHtml(listId)}" aria-expanded="false"></button>
                <ul id="${this.escapeHtml(listId)}" class="settings-select-dropdown-list" role="listbox" tabindex="-1" hidden>
                    ${Array.from(select.options).map((option) => `<li role="option" aria-selected="false"><button type="button" class="settings-select-dropdown-option" data-value="${this.escapeHtml(option.value)}">${this.escapeHtml(option.textContent || '')}</button></li>`).join('')}
                </ul>
            `;

            select.insertAdjacentElement('afterend', dropdown);
            select.dataset.customDropdownInit = 'true';
            this.updateSettingsSelectDropdownUI(select);

            select.addEventListener('change', () => {
                this.updateSettingsSelectDropdownUI(select);
            });
        });
    },

    getSettingsSelectDropdown(select) {
        if (!select || !select.parentElement) {
            return null;
        }

        return select.parentElement.querySelector(`.settings-select-dropdown[data-select-id="${select.id}"]`);
    },

    updateSettingsSelectDropdownUI(select) {
        const dropdown = this.getSettingsSelectDropdown(select);
        if (!dropdown) {
            return;
        }

        const trigger = dropdown.querySelector('.settings-select-dropdown-trigger');
        const options = dropdown.querySelectorAll('.settings-select-dropdown-option');
        const selectedOption = select.options[select.selectedIndex] || select.options[0];

        if (trigger && selectedOption) {
            trigger.textContent = selectedOption.textContent || '';
        }

        options.forEach((optionButton) => {
            const isSelected = optionButton.dataset.value === select.value;
            optionButton.classList.toggle('is-selected', isSelected);
            const listItem = optionButton.closest('li');
            if (listItem) {
                listItem.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            }
        });
    },

    closeAllSettingsSelectDropdowns(exceptDropdown = null) {
        document.querySelectorAll('.settings-select-dropdown').forEach((dropdown) => {
            if (exceptDropdown && dropdown === exceptDropdown) {
                return;
            }

            const trigger = dropdown.querySelector('.settings-select-dropdown-trigger');
            const list = dropdown.querySelector('.settings-select-dropdown-list');
            if (trigger && list) {
                trigger.setAttribute('aria-expanded', 'false');
                list.hidden = true;
            }
        });
    },

    toggleSettingsSelectDropdown(dropdown, forceOpen = null) {
        if (!dropdown) {
            return;
        }

        const trigger = dropdown.querySelector('.settings-select-dropdown-trigger');
        const list = dropdown.querySelector('.settings-select-dropdown-list');
        if (!trigger || !list) {
            return;
        }

        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const shouldOpen = forceOpen === null ? !isExpanded : !!forceOpen;

        this.closeAllSettingsSelectDropdowns(shouldOpen ? dropdown : null);
        trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        list.hidden = !shouldOpen;

        if (shouldOpen) {
            const selectedOption = dropdown.querySelector('.settings-select-dropdown-option.is-selected')
                || dropdown.querySelector('.settings-select-dropdown-option');
            selectedOption?.focus();
        }
    },

    selectSettingsDropdownOption(dropdown, optionButton) {
        if (!dropdown || !optionButton) {
            return;
        }

        const selectId = dropdown.dataset.selectId;
        const select = document.getElementById(selectId);
        if (!select) {
            return;
        }

        const newValue = optionButton.dataset.value || '';
        if (select.value !== newValue) {
            select.value = newValue;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            this.updateSettingsSelectDropdownUI(select);
        }

        this.toggleSettingsSelectDropdown(dropdown, false);
        dropdown.querySelector('.settings-select-dropdown-trigger')?.focus();
    },

    moveSettingsDropdownFocus(dropdown, direction) {
        if (!dropdown || !direction) {
            return;
        }

        const options = Array.from(dropdown.querySelectorAll('.settings-select-dropdown-option'));
        if (!options.length) {
            return;
        }

        const currentIndex = options.findIndex((option) => option === document.activeElement);
        const selectedIndex = options.findIndex((option) => option.classList.contains('is-selected'));
        const startIndex = currentIndex >= 0 ? currentIndex : (selectedIndex >= 0 ? selectedIndex : 0);
        const nextIndex = (startIndex + direction + options.length) % options.length;
        options[nextIndex].focus();
    },

    getAllEditors() {
        const editors = Object.values(this.state.editors || {}).filter(Boolean);
        this.state.files.forEach(file => {
            if (file.editor) editors.push(file.editor);
        });
        if (this.state.codeModalEditor) editors.push(this.state.codeModalEditor);
        return editors;
    },

    applySettingsToEditor(editor) {
        if (!editor) return;

        if (editor.setOption) {
            editor.setOption('lineNumbers', !!this.state.settings.lineNumbers);
            editor.setOption('lineWrapping', !!this.state.settings.lineWrapping);
            editor.setOption('theme', this.state.settings.theme);
            editor.setOption('tabSize', this.state.settings.tabSize);
            editor.setOption('indentUnit', this.state.settings.tabSize);
            editor.setOption('indentWithTabs', !!this.state.settings.indentWithTabs);
            editor.setOption('autoCloseBrackets', !!this.state.settings.autoCloseBrackets);
            editor.setOption('matchBrackets', !!this.state.settings.matchBrackets);
        }

        const wrapper = editor.getWrapperElement ? editor.getWrapperElement() : null;
        if (wrapper) {
            wrapper.style.fontSize = `${this.state.settings.fontSize}px`;
        }

        if (!editor.setOption && editor.getTextArea) {
            const textarea = editor.getTextArea();
            if (textarea) textarea.style.fontSize = `${this.state.settings.fontSize}px`;
        }

        if (editor.refresh) {
            editor.refresh();
        }
    },

    applyEditorSettingsToAllEditors() {
        this.getAllEditors().forEach((editor) => this.applySettingsToEditor(editor));
    },

    isSettingsModalOpen() {
        return !!(this.dom.settingsModal && this.dom.settingsModal.getAttribute('aria-hidden') === 'false');
    },

    toggleSettingsModal(forceOpen = null) {
        if (!this.dom.settingsModal) return;
        const isOpen = this.isSettingsModalOpen();
        const shouldOpen = forceOpen === null ? !isOpen : !!forceOpen;
        this.dom.settingsModal.setAttribute('aria-hidden', String(!shouldOpen));
        this.dom.settingsModal.hidden = !shouldOpen;

        if (!shouldOpen) {
            this.closeAllSettingsSelectDropdowns();
        }

        this.updateDockDividerVisibility();
        this.updateBackgroundScrollLock();
    },

    updatePreviewViewportHeight() {
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        document.documentElement.style.setProperty('--preview-viewport-height', `${viewportHeight}px`);
    },

    getAvailableEditorWidth() {
        if (!this.state.isPreviewDocked || this.state.previewDockOrientation !== 'right') {
            return this.getViewportWidth();
        }

        return this.getViewportWidth() - this.getDockSizePx('right');
    },

    updateAdaptiveLayoutMode() {
        const availableWidth = this.getAvailableEditorWidth();
        const isCompact = availableWidth <= 900;
        document.body.classList.toggle('compact-editor-layout', isCompact);
    },

    updateDockedModalCompactModes() {
        const previewIsNarrow = this.state.isPreviewDocked
            && this.state.previewDockOrientation === 'right'
            && this.getDockSizePx('right') <= 460;
        document.body.classList.toggle('preview-dock-compact-controls', previewIsNarrow);

        const codeDockedLeft = this.isCodeModalCurrentlyDocked();
        const codeModalWidth = this.getViewportWidth() - this.getDockSizePx('right');
        const codeIsNarrow = codeDockedLeft
            && this.state.isPreviewDocked
            && this.state.previewDockOrientation === 'right'
            && codeModalWidth <= 720;

        this.dom.codeModal?.classList.toggle('is-compact-docked', codeIsNarrow);

        this.updatePreviewDockControlButtons();
        if (this.dom.codeModal?.getAttribute('aria-hidden') === 'false') {
            this.updateCodeModalHeaderAndButtons();
        }
    },

    updatePreviewDockControlButtons() {
        const isCompact = document.body.classList.contains('preview-dock-compact-controls');

        if (this.dom.toggleConsoleBtn) {
            const isConsoleVisible = !this.dom.modalConsolePanel.classList.contains('hidden');
            const consoleText = isConsoleVisible ? 'Hide Console' : 'Console';
            this.setIconButtonLabel(this.dom.toggleConsoleBtn, SVG_ICONS.clipboard, consoleText, isCompact);
        }

        if (this.dom.dockPreviewBtn) {
            const dockText = this.state.isPreviewDocked ? 'Undock' : 'Dock';
            this.setIconButtonLabel(this.dom.dockPreviewBtn, SVG_ICONS.dock, dockText, isCompact);
        }

        if (this.dom.refreshPreviewBtn) {
            this.setIconButtonLabel(this.dom.refreshPreviewBtn, SVG_ICONS.refresh, 'Refresh', isCompact);
        }
    },

    /**
     * Updates a header control button with icon-only (compact) or icon+label content.
     * @param {HTMLButtonElement | null} button
     * @param {string} iconMarkup
     * @param {string} label
     * @param {boolean} isCompact
     */
    setIconButtonLabel(button, iconMarkup, label, isCompact) {
        if (!button) return;
        button.innerHTML = isCompact ? iconMarkup : `${iconMarkup} ${label}`;
    },

    isMobileViewport() {
        return window.matchMedia('(max-width: 768px)').matches;
    },

    isCompactEditorViewport() {
        return this.getAvailableEditorWidth() <= 768;
    },

    canDockCodeModalLeft() {
        return this.state.isPreviewDocked
            && this.dom.modalOverlay?.getAttribute('aria-hidden') === 'false';
    },

    isPreviewDockedBottom() {
        return this.state.previewDockOrientation === 'bottom';
    },

    isCodeModalCurrentlyDocked() {
        return this.dom.codeModal?.classList.contains('is-docked-left');
    },

    setCodeModalDockedState(shouldDock) {
        if (!this.dom.codeModal) return;
        this.dom.codeModal.classList.toggle('is-docked-left', !!shouldDock);
    },

    getCodeModalDockButtonText(isDockedLeft = this.state.isCodeModalDockedLeft) {
        const isBottomDock = this.isPreviewDockedBottom();
        if (isBottomDock) {
            return isDockedLeft ? 'Undock' : 'Dock Above';
        }
        return isDockedLeft ? 'Undock Left' : 'Dock Left';
    },

    updateCodeModalDockButton() {
        const dockBtn = this.dom.codeModalDockBtn;
        if (!dockBtn) return;

        const canDockLeft = this.canDockCodeModalLeft();
        dockBtn.hidden = !canDockLeft;

        if (!canDockLeft) return;

        const isDockedLeft = this.state.isCodeModalDockedLeft;
        const dockButtonText = this.getCodeModalDockButtonText(isDockedLeft);
        dockBtn.classList.toggle('active', isDockedLeft);
        dockBtn.innerHTML = SVG_ICONS.dock + ' ' + dockButtonText;

        const isBottomDock = this.isPreviewDockedBottom();
        const dockTargetDescription = isBottomDock ? 'above the docked preview' : 'to the left of preview';
        dockBtn.setAttribute('aria-label', isDockedLeft
            ? 'Undock expanded code view'
            : `Dock expanded code view ${dockTargetDescription}`);
        dockBtn.title = isDockedLeft ? 'Undock expanded code view' : `Dock expanded code view ${dockTargetDescription}`;
    },

    applyCodeModalDockLayout() {
        const shouldDockLeft = this.canDockCodeModalLeft() && this.state.isCodeModalDockedLeft;
        this.setCodeModalDockedState(shouldDockLeft);
    },

    toggleCodeModalDockLeft(forceState = null) {
        if (!this.canDockCodeModalLeft()) return;

        this.state.isCodeModalDockedLeft = typeof forceState === 'boolean'
            ? forceState
            : !this.state.isCodeModalDockedLeft;

        this.updateCodeModalDockButton();
        this.applyCodeModalDockLayout();
        this.updateDockedModalCompactModes();
        this.updateDockDividerVisibility();
        this.refreshCodeModalEditor();
    },

    formatFileSize(bytes) {
        const normalized = Number.isFinite(bytes) && bytes >= 0 ? bytes : 0;
        if (normalized < 1024) return `${normalized} B`;

        const units = ['KB', 'MB', 'GB'];
        let size = normalized;
        let unitIndex = -1;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex += 1;
        }

        const roundedSize = size >= 10 ? Math.round(size) : Math.round(size * 10) / 10;
        return `${roundedSize} ${units[unitIndex]}`;
    },

    getCurrentCodeModalFileName(fallbackName = '') {
        return fallbackName
            || this.state.currentCodeModalSource?.querySelector('.file-name-input')?.value
            || 'Code';
    },

    getLineCount(content) {
        return content.length === 0 ? 1 : content.split(/\r\n|\r|\n/).length;
    },

    getCodeModalFileMeta(fileName = null) {
        const sourceFileId = this.state.currentCodeModalSource?.dataset?.fileId;
        const fileInfo = this.state.files.find(file => file.id === sourceFileId);
        if (!fileInfo) return '';

        const displayFileName = this.getCurrentCodeModalFileName(fileName || '');
        const content = fileInfo.editor?.getValue?.() ?? fileInfo.content ?? '';
        const metaParts = [this.formatFileSize(new Blob([content]).size)];

        if (this.isTextFileType(fileInfo)) {
            const lineCount = this.getLineCount(content);
            metaParts.push(`${lineCount} line${lineCount === 1 ? '' : 's'}`);
        }

        return `${displayFileName} • ${metaParts.join(' • ')}`;
    },

    updateCodeModalHeaderAndButtons(fileName = null) {
        const modalTitle = this.dom.codeModalTitle;
        const modalFileMeta = this.dom.codeModalFileMeta;
        const isMobile = this.isMobileViewport() || this.dom.codeModal?.classList.contains('is-compact-docked');
        const displayFileName = this.getCurrentCodeModalFileName(fileName);

        if (modalTitle) {
            modalTitle.textContent = isMobile ? displayFileName : `Code View - ${displayFileName}`;
        }

        if (modalFileMeta) {
            modalFileMeta.textContent = this.getCodeModalFileMeta(displayFileName);
        }

        if (this.dom.codeModalDockBtn && !this.dom.codeModalDockBtn.hidden) {
            const dockText = this.getCodeModalDockButtonText();
            this.dom.codeModalDockBtn.innerHTML = isMobile ? SVG_ICONS.dock : SVG_ICONS.dock + ' ' + dockText;
        }

        if (this.dom.codeModalSearchBtn) {
            this.dom.codeModalSearchBtn.innerHTML = isMobile ? SVG_ICONS.search : SVG_ICONS.search + ' Search';
        }

    },

    updatePanelMoveButtonDirections() {
        const isMobile = this.isCompactEditorViewport();
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
    async addFileToFolder(folderPath) {
        await this.addNewFile(folderPath);
    },

    normalizeFolderPath(folderPath) {
        return (folderPath || '').trim().replace(/^\/+|\/+$/g, '');
    },

    sanitizeFolderPathInput(folderPath) {
        const normalizedPath = this.normalizeFolderPath(folderPath);
        if (!normalizedPath) return '';

        return normalizedPath
            .split('/')
            .map(segment => segment.trim().replace(/[<>:\"|?*]/g, ''))
            .filter(Boolean)
            .join('/');
    },

    getFilePathById(fileId) {
        const fileInfo = this.state.files.find(file => file.id === fileId);
        if (!fileInfo) return '';
        return this.getFileNameFromPanel(fileId) || fileInfo.fileName || '';
    },

    async promptMoveFile(fileId) {
        const fileInfo = this.state.files.find(file => file.id === fileId);
        if (!fileInfo) return;

        const currentFullPath = this.getFilePathById(fileId);
        const currentFolderPath = this.getFolderFromPath(currentFullPath);
        const currentFilename = this.getFilenameFromPath(currentFullPath);
        const destinationInput = await this.showPromptDialog(
            'Move File',
            `Enter destination folder for "${currentFilename}" (leave empty for root):`,
            currentFolderPath
        );

        if (destinationInput === null) return;

        await this.moveFileToFolder(fileId, destinationInput);
    },

    async moveFileToFolder(fileId, destinationFolderPath) {
        const fileInfo = this.state.files.find(file => file.id === fileId);
        if (!fileInfo) return;

        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (!panel) return;

        const fileNameInput = panel.querySelector('.file-name-input');
        const currentFullPath = fileNameInput?.value || this.getFilePathById(fileId);
        const baseFilename = this.getFilenameFromPath(currentFullPath);
        const sanitizedDestination = this.sanitizeFolderPathInput(destinationFolderPath);
        const nextFullPath = sanitizedDestination ? `${sanitizedDestination}/${baseFilename}` : baseFilename;

        if (nextFullPath === currentFullPath) {
            this.showNotification('File is already in that folder.', 'info');
            return;
        }

        const conflictResult = await this.resolvePathConflict(nextFullPath, { excludeFileId: fileId });
        if (conflictResult.skipped) {
            this.showNotification(`Skipped moving "${baseFilename}".`, 'info');
            return;
        }

        const resolvedPath = conflictResult.targetPath;
        const resolvedDestination = this.getFolderFromPath(resolvedPath);

        if (resolvedDestination) {
            this.ensureFolderExists(resolvedDestination);
        }

        fileNameInput.value = resolvedPath;
        fileInfo.fileName = resolvedPath;
        if (resolvedDestination) {
            this.state.expandedFolders.add(resolvedDestination);
        }

        this.checkFileModified(fileId, panel);
        this.refreshPanelAndFileTreeUI();
        this.showNotification(`Moved "${baseFilename}" to ${resolvedDestination || 'root'}.`, 'success');
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
     * Close all open file panels in a folder
     * @param {string} folderPath - Folder whose open file panels should be closed
     */
    closeFolderPanels(folderPath) {
        const openFileIds = this.getFileIdsInFolder(folderPath)
            .filter(fileId => this.state.openPanels.has(fileId));

        if (openFileIds.length === 0) return;

        openFileIds.forEach(fileId => {
            const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
            if (panel) {
                this.clearPendingAutoFormat(fileId);
                panel.style.display = 'none';
            }
            this.state.openPanels.delete(fileId);
        });

        this.renderFileTree();
        this.updatePanelMoveButtonsVisibility();
        this.updatePreviewActionButtons();
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

    focusSidebarSearch() {
        const searchInput = this.dom.fileTreeContainer?.querySelector('.file-tree-search-input');
        if (!searchInput) return;

        searchInput.focus();
        searchInput.select();
    },

    /**
     * Render the file tree sidebar
     */
    renderFileTree() {
        if (!this.dom.fileTreeContainer) return;

        const activeEl = document.activeElement;
        const shouldRestoreSidebarSearchFocus = !!(activeEl && activeEl.classList && activeEl.classList.contains('file-tree-search-input'));
        const sidebarSearchSelectionStart = shouldRestoreSidebarSearchFocus ? activeEl.selectionStart : null;
        const sidebarSearchSelectionEnd = shouldRestoreSidebarSearchFocus ? activeEl.selectionEnd : null;

        const tree = this.buildFolderTree();
        this.pruneSidebarSelections();
        const treeHtml = this.renderFolderContents(tree, '');
        const toolbarHtml = this.renderFileTreeToolbar(tree);

        this.dom.fileTreeContainer.innerHTML = `
            ${toolbarHtml}
            <div class="file-tree-content">
                ${treeHtml || '<div class="file-tree-empty">No matching files found. Try a different search.</div>'}
            </div>
        `;

        if (shouldRestoreSidebarSearchFocus) {
            const searchInput = this.dom.fileTreeContainer.querySelector('.file-tree-search-input');
            if (searchInput) {
                searchInput.focus();
                if (typeof sidebarSearchSelectionStart === 'number' && typeof sidebarSearchSelectionEnd === 'number') {
                    searchInput.setSelectionRange(sidebarSearchSelectionStart, sidebarSearchSelectionEnd);
                }
            }
        }
    },

    pruneSidebarSelections() {
        const existingIds = new Set(this.state.files.map(file => file.id));
        this.state.selectedFileIds.forEach((fileId) => {
            if (!existingIds.has(fileId)) {
                this.state.selectedFileIds.delete(fileId);
            }
        });

        const existingFolderPaths = new Set(this.state.folders.map(folder => folder.path));
        this.state.selectedFolderPaths.forEach((folderPath) => {
            if (!existingFolderPaths.has(folderPath)) {
                this.state.selectedFolderPaths.delete(folderPath);
            }
        });
    },

    renderFileTreeToolbar(tree) {
        const hasSelection = this.state.selectedFileIds.size > 0 || this.state.selectedFolderPaths.size > 0;
        const fileCount = this.countFilesInTree(tree);

        return `
            <div class="file-tree-toolbar">
                <div class="file-tree-search-wrap">
                    <input
                        type="search"
                        class="file-tree-search-input"
                        placeholder="Search files..."
                        value="${this.escapeHtml(this.state.sidebarSearchQuery)}"
                        aria-label="Search files in sidebar"
                    >
                    <span class="file-tree-search-hint" aria-hidden="true">⌘/Ctrl + K</span>
                </div>
                <div class="file-tree-toolbar-meta">${fileCount} file${fileCount === 1 ? '' : 's'}</div>
                <div class="file-tree-toolbar-actions">
                    <button class="tree-toolbar-btn clear-selection-btn" title="Clear selection" ${hasSelection ? '' : 'disabled'}>Clear</button>
                    <button class="tree-toolbar-btn open-selected-btn" title="Open selected files/folders" ${hasSelection ? '' : 'disabled'}>Open</button>
                    <button class="tree-toolbar-btn close-selected-btn" title="Close selected files/folders" ${hasSelection ? '' : 'disabled'}>Close</button>
                    <button class="tree-toolbar-btn delete-selected-btn" title="Delete selected files/folders" ${hasSelection ? '' : 'disabled'}>Delete</button>
                </div>
            </div>
        `;
    },

    countFilesInTree(node) {
        const childCount = Object.values(node.children).reduce((total, childNode) => total + this.countFilesInTree(childNode), 0);
        return node.files.length + childCount;
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
            const openFolderFileIds = folderFileIds.filter(fileId => this.state.openPanels.has(fileId));
            const hasOpenFolderPanels = openFolderFileIds.length > 0;
            const closeFolderPanelsLabel = 'Collapse all file panels in folder';
            const closeFolderPanelsIcon = SVG_ICONS.folderMinus;

            html += `
                <div class="tree-folder ${isExpanded ? 'expanded' : ''} ${isFolderSelected ? 'folder-selected-in-sidebar' : ''}" data-folder-path="${folderPath}">
                    <div class="tree-folder-header">
                        <input type="checkbox" class="tree-folder-checkbox" aria-label="Select folder ${this.escapeHtml(folderPath)}" ${isFolderSelected ? 'checked' : ''}>
                        <span class="folder-icon">${isExpanded ? SVG_ICONS.folderOpen : SVG_ICONS.folder}</span>
                        <span class="folder-name">${this.escapeHtml(folderName)}</span>
                        <div class="folder-actions">
                            ${hasOpenFolderPanels
                                ? `<button class="close-folder-panels-btn" title="${this.escapeHtml(closeFolderPanelsLabel)}" aria-label="${this.escapeHtml(closeFolderPanelsLabel)}">${closeFolderPanelsIcon}</button>`
                                : ''}
                            <button class="add-file-to-folder-btn" title="Add file to folder">+</button>
                            <button class="add-subfolder-btn" title="Add subfolder">${SVG_ICONS.folderPlus}</button>
                            <button class="delete-folder-btn" title="Delete folder">${SVG_ICONS.trash}</button>
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
                    <input type="checkbox" class="tree-file-checkbox" aria-label="Select file ${this.escapeHtml(file.displayName)}" ${isSelected ? 'checked' : ''}>
                    <span class="file-icon">${fileIcon}</span>
                    <span class="file-name">${this.escapeHtml(file.displayName)}</span>
                    <div class="file-actions">
                        <button class="open-file-btn" title="${isOpen ? 'Focus file' : 'Open file'}" aria-label="${isOpen ? 'Focus file' : 'Open file'}">${isOpen ? SVG_ICONS.eye : SVG_ICONS.pencil}</button>
                        <button class="move-file-btn" title="Move file" aria-label="Move file">${SVG_ICONS.move}</button>
                        <button class="delete-file-btn" title="Delete file" aria-label="Delete file">${SVG_ICONS.trash}</button>
                    </div>
                </div>
            `;
        });

        return html;
    },

    /**
     * Get the appropriate icon for a file type
     * @param {string} fileType - The file type
     * @returns {string} SVG icon
     */
    getFileIcon(fileType) {
        const icons = {
            'html': SVG_ICONS.fileHtml,
            'css': SVG_ICONS.fileCss,
            'javascript': SVG_ICONS.fileJs,
            'javascript-module': SVG_ICONS.package,
            'json': SVG_ICONS.fileJson,
            'xml': SVG_ICONS.fileXml,
            'markdown': SVG_ICONS.fileMarkdown,
            'text': SVG_ICONS.fileText,
            'svg': SVG_ICONS.fileImage,
            'image': SVG_ICONS.fileImage,
            'audio': SVG_ICONS.fileAudio,
            'video': SVG_ICONS.fileVideo,
            'font': SVG_ICONS.fileFont,
            'pdf': SVG_ICONS.filePdf,
            'binary': SVG_ICONS.fileBinary
        };
        return icons[fileType] || SVG_ICONS.document;
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
                if (this.state.sidebarSearchDebounceTimer) {
                    clearTimeout(this.state.sidebarSearchDebounceTimer);
                }
                this.state.sidebarSearchQuery = target.value.trim().toLowerCase();
                this.state.sidebarSearchDebounceTimer = setTimeout(() => {
                    this.renderFileTree();
                    this.state.sidebarSearchDebounceTimer = null;
                }, 120);
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
            
            // Close all open file panels in folder
            if (target.closest('.close-folder-panels-btn')) {
                e.stopPropagation();
                const folderPath = target.closest('.tree-folder').dataset.folderPath;
                this.closeFolderPanels(folderPath);
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

            // Move file button
            if (target.closest('.move-file-btn')) {
                e.stopPropagation();
                await this.promptMoveFile(fileId);
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

    async addNewFile(folderPath) {
        const initialFileName = folderPath ? `${folderPath}/newfile.html` : 'newfile.html';
        const conflictResult = await this.resolvePathConflict(initialFileName);
        if (conflictResult.skipped) {
            this.showNotification('Skipped creating file.', 'info');
            return;
        }

        const fileId = `file-${this.state.nextFileId++}`;
        const fileName = conflictResult.targetPath;
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
        this.initFileSavedState(fileId, content, fileName, 'html');
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
                const preferred = ['confirm', 'replace', 'rename', 'submit'];
                const found = preferred.find(action => buttonElements.some(button => button.dataset.action === action));
                return found || buttonElements[0]?.dataset.action || 'cancel';
            };

            const getCancelAction = () => {
                const preferred = ['cancel', 'skip'];
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

            const preferredFocusButton = buttonElements.find(button => ['confirm', 'replace', 'rename'].includes(button.dataset.action)) || buttonElements[0];
            if (preferredFocusButton) {
                preferredFocusButton.focus();
            } else {
                dialog.focus();
            }
        });
    },

    /**
     * Show a dialog to resolve file conflicts.
     * @param {string} fileName - Name of the conflicting file
     * @returns {Promise<string>} - 'replace', 'skip', or 'rename'
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
                {text: 'Rename', action: 'rename', className: 'conflict-replace'}
            ]
        });
    },

    findFileByPath(path, excludeFileId = null) {
        return this.state.files.find(file => {
            if (excludeFileId && file.id === excludeFileId) return false;
            return this.getFilePathById(file.id) === path;
        });
    },

    generateRenamedFilePath(path, excludeFileId = null) {
        const folderPath = this.getFolderFromPath(path);
        const filename = this.getFilenameFromPath(path);
        const extension = this.fileTypeUtils.getExtension(filename);
        const baseName = extension ? filename.slice(0, -(extension.length + 1)) : filename;

        let suffix = 1;
        while (true) {
            const candidateName = extension
                ? `${baseName}(${suffix}).${extension}`
                : `${baseName}(${suffix})`;
            const candidatePath = folderPath ? `${folderPath}/${candidateName}` : candidateName;
            if (!this.findFileByPath(candidatePath, excludeFileId)) {
                return candidatePath;
            }
            suffix++;
        }
    },

    async resolvePathConflict(targetPath, options = {}) {
        const existingFile = this.findFileByPath(targetPath, options.excludeFileId || null);
        if (!existingFile) {
            return {
                skipped: false,
                targetPath
            };
        }

        const action = await this.showFileConflictDialog(targetPath);
        if (action === 'skip') {
            return {
                skipped: true,
                targetPath
            };
        }

        if (action === 'replace') {
            this.deleteFile(existingFile.id);
            return {
                skipped: false,
                targetPath
            };
        }

        return {
            skipped: false,
            targetPath: this.generateRenamedFilePath(targetPath, options.excludeFileId || null)
        };
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
     * @param {string} fileName - Name of the file being imported
     * @returns {Promise<{status: 'imported'|'skipped', fileName: string}>}
     */
    async _resolveImportConflict(fileName) {
        const resolved = await this.resolvePathConflict(fileName);
        return {
            status: resolved.skipped ? 'skipped' : 'imported',
            fileName: resolved.targetPath
        };
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

            const result = await this._resolveImportConflict(targetFileName);
            if (result.status === 'skipped') {
                skippedCount++;
                continue;
            }

            const fileData = await this.readFileContent(file);
            const detectedType = this.autoDetectFileType(result.fileName, fileData.isBinary ? null : fileData.content, file.type);
            this.addNewFileWithContent(result.fileName, detectedType, fileData.content, fileData.isBinary);
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
        this.initFileSavedState(fileId, content, fileName, fileType);
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

    /**
     * Returns the static list of supported file-type choices.
     * The array is defined once and shared; callers must not mutate it.
     * @returns {ReadonlyArray<{value: string, label: string, icon: string}>}
     */
    getFileTypeChoices() {
        return CodePreviewer._FILE_TYPE_CHOICES;
    },

    getFileTypeChoice(fileType) {
        return this.getFileTypeChoices().find(type => type.value === fileType) || null;
    },

    getFileTypeChoiceLabel(fileType) {
        const choice = this.getFileTypeChoice(fileType);
        return choice ? choice.label : 'Text';
    },

    renderFileTypeOptionLabel(choice) {
        const icon = choice.icon || SVG_ICONS.document;
        const label = this.escapeHtml(choice.label);
        return `<span class="file-type-option-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
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
            return `<li role="option" aria-selected="${selectedState}"><button type="button" class="file-type-dropdown-option${selectedClass}" data-value="${this.escapeHtml(type.value)}">${this.renderFileTypeOptionLabel(type)}</button></li>`;
        }).join('');
    },

    decorateFileTypeDropdownOptions(panel) {
        const options = panel.querySelectorAll('.file-type-dropdown-option');
        options.forEach((option) => {
            if (option.querySelector('.file-type-option-icon')) {
                return;
            }

            const fileType = option.dataset.value;
            const choice = this.getFileTypeChoice(fileType);
            if (!choice) {
                return;
            }

            option.innerHTML = this.renderFileTypeOptionLabel(choice);
        });
    },

    createFilePanel(fileId, fileName, fileType, content, isBinary) {
        const fileTypeOptions = this.generateFileTypeOptions(fileType);
        const fileTypeDropdownOptions = this.generateFileTypeDropdownOptions(fileType);
        const escapedFileName = this.escapeHtml(fileName);
        
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
            
            // Create CodeMirror editor with all settings
            // indentUnit matches tabSize for consistent indentation width
            const editor = window.CodeMirror.fromTextArea(textarea, {
                lineNumbers: !!this.state.settings.lineNumbers,
                mode: mode,
                theme: this.state.settings.theme,
                autoCloseTags: fileType === 'html',
                lineWrapping: !!this.state.settings.lineWrapping,
                tabSize: this.state.settings.tabSize,
                indentUnit: this.state.settings.tabSize,
                indentWithTabs: !!this.state.settings.indentWithTabs,
                autoCloseBrackets: !!this.state.settings.autoCloseBrackets,
                matchBrackets: !!this.state.settings.matchBrackets,
                readOnly: isBinary ? 'nocursor' : false
            });
            this.applySettingsToEditor(editor);
            return editor;
        } else if (textarea) {
            Object.assign(textarea.style, {
                fontFamily: 'monospace', fontSize: `${this.state.settings.fontSize}px`, lineHeight: '1.5',
                resize: 'none', border: 'none', outline: 'none',
                background: '#282a36', color: '#f8f8f2', padding: '1rem',
                width: '100%', height: '400px'
            });
            
            return {
                setValue: (value) => textarea.value = value,
                getValue: () => textarea.value,
                refresh: () => {},
                setOption: () => {},
                on: (eventName, handler) => {
                    if (eventName !== 'change' || !handler) return;
                    if (textarea.__changeListener) {
                        textarea.removeEventListener('input', textarea.__changeListener);
                    }
                    textarea.__changeListener = () => handler(null, { origin: '+input' });
                    textarea.addEventListener('input', textarea.__changeListener);
                },
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
            toolbarHTML += this.htmlGenerators.toolbarButton(SVG_ICONS.trash, 'Clear', 'clear-btn', 'Clear content', 'Clear');
            toolbarHTML += this.htmlGenerators.toolbarButton(SVG_ICONS.clipboard, 'Paste', 'paste-btn', 'Paste from clipboard', 'Paste');
            toolbarHTML += this.htmlGenerators.toolbarButton(SVG_ICONS.document, 'Copy', 'copy-btn', 'Copy to clipboard', 'Copy');
            toolbarHTML += this.htmlGenerators.toolbarButton(SVG_ICONS.search, 'Search', 'search-btn', 'Search in file', 'Search in file');
            if (supportsFormatting) {
                toolbarHTML += this.htmlGenerators.toolbarButton(SVG_ICONS.format, 'Format', 'format-btn', 'Format code', 'Format code');
            }
        }
        
        if (hasExpandPreview) {
            const expandLabel = isEditable ? "Expand code view" : "View media";
            const expandTitle = isEditable ? "Expand" : "View";
            toolbarHTML += this.htmlGenerators.toolbarButton(SVG_ICONS.expand, expandTitle, 'expand-btn', expandLabel, expandTitle);
        }
        
        toolbarHTML += this.htmlGenerators.toolbarButton(SVG_ICONS.save, 'Export', 'export-btn', 'Export file', 'Export');
        toolbarHTML += this.htmlGenerators.toolbarButton(SVG_ICONS.folder, 'Collapse', 'collapse-btn', 'Collapse/Expand editor', 'Collapse/Expand');

        toolbarHTML += '</div>';

        if (isEditable) {
            toolbarHTML += `
                <div class="panel-search" hidden>
                    <input type="search" class="panel-search-input" placeholder="Search in this file" aria-label="Search in this file">
                    <button class="panel-search-next-btn" aria-label="Find next match" title="Find next">Next</button>
                    <button class="panel-search-close-btn" aria-label="Close search" title="Close search">${SVG_ICONS.close}</button>
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

        return this.htmlGenerators.filePreview(fileType, this.getFilePanelPreviewContent(fileId, fileType, content, isBinary));
    },

    isEditableFileType(fileType) {
        return this.fileTypeUtils.isEditableType(fileType);
    },


    isTextFileType(fileInfo) {
        if (!fileInfo || fileInfo.isBinary) return false;

        const mimeType = this.fileTypeUtils.getMimeTypeFromFileType(fileInfo.type) || '';
        return mimeType.startsWith('text/')
            || mimeType === 'application/json'
            || mimeType === 'application/xml'
            || mimeType.endsWith('+json')
            || mimeType.endsWith('+xml')
            || fileInfo.type === 'svg';
    },

    supportsFormattingForType(fileType) {
        return ['html', 'css', 'javascript', 'javascript-module', 'json', 'xml', 'svg'].includes(fileType);
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

    applyFileTypeChange(panel, fileId, newType, contentOverride = null) {
        this.revokeFilePanelPreviewUrl(fileId);
        panel.dataset.fileType = newType;

        const fileInfo = this.state.files.find(f => f.id === fileId);
        if (fileInfo) {
            const oldType = fileInfo.type;
            fileInfo.type = newType;

            const oldIsEditable = this.isEditableFileType(oldType);
            const newIsEditable = this.isEditableFileType(newType);
            const resolvedContent = contentOverride !== null
                ? contentOverride
                : (fileInfo.editor ? fileInfo.editor.getValue() : '');

            if (oldIsEditable !== newIsEditable) {
                const editorWrapper = panel.querySelector('.editor-wrapper');
                if (editorWrapper) {
                    const newContent = this.generateFileContentDisplay(fileId, newType, resolvedContent, false);
                    editorWrapper.innerHTML = newContent;

                    this.createEditorForFileType(fileInfo, fileId, newType, resolvedContent);
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
                if (!fileInfo || !typeSelector) return;

                const previousExtension = this.fileTypeUtils.getExtension(fileInfo.fileName);
                const nextExtension = this.fileTypeUtils.getExtension(filename);
                const suggestedType = this.fileTypeUtils.getTypeFromExtension(filename);
                const extensionChanged = previousExtension !== nextExtension;
                const isValidDetectedType = suggestedType !== 'binary';
                const typeDiffers = suggestedType !== typeSelector.value;
                const shouldAutoChangeType = extensionChanged && isValidDetectedType && typeDiffers;

                if (shouldAutoChangeType) {
                    this.applyFileTypeChange(panel, fileId, suggestedType);
                } else {
                    this.renderFileTree();
                    this.updateMainHtmlSelector();
                }

                this.checkFileModified(fileId, panel);
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
                this.checkFileModified(fileId, panel);
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
                this.checkFileModified(fileId, panel);
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
    initFileSavedState(fileId, content, fileName, fileType) {
        this.state.savedFileStates[fileId] = {
            content: content || '',
            fileName: fileName || '',
            fileType: fileType || 'text'
        };
    },

    getCurrentFileType(panel, fileInfo) {
        return panel?.dataset.fileType || fileInfo?.type || 'text';
    },

    getSavedFileType(savedState, fileInfo) {
        return savedState?.fileType || fileInfo?.type || 'text';
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
        const currentFileType = this.getCurrentFileType(panel, fileInfo);
        
        let isModified = false;
        
        if (savedState) {
            const savedFileType = this.getSavedFileType(savedState, fileInfo);
            isModified = currentContent !== savedState.content || currentFileName !== savedState.fileName || currentFileType !== savedFileType;
        } else {
            // Initialize saved state if it doesn't exist (for files created before tracking was added)
            this.initFileSavedState(fileId, currentContent, currentFileName, currentFileType);
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
                applyBtn.innerHTML = '<span class="btn-icon">' + SVG_ICONS.check + '</span> Apply';
                applyBtn.addEventListener('click', () => this.applyFileChanges(fileId));
                toolbar.insertBefore(applyBtn, toolbar.firstChild);
            }
            
            if (!discardBtn) {
                discardBtn = document.createElement('button');
                discardBtn.className = 'toolbar-btn discard-changes-btn';
                discardBtn.setAttribute('aria-label', 'Discard changes');
                discardBtn.setAttribute('title', 'Discard changes');
                discardBtn.innerHTML = '<span class="btn-icon">' + SVG_ICONS.close + '</span> Discard';
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
    async applyFileChanges(fileId) {
        const panel = document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
        if (!panel) return;
        
        const fileInfo = this.state.files.find(f => f.id === fileId);
        if (!fileInfo) return;
        
        const fileNameInput = panel.querySelector('.file-name-input');
        const currentFileName = fileNameInput ? fileNameInput.value : '';
        const conflictResult = await this.resolvePathConflict(currentFileName, { excludeFileId: fileId });
        if (conflictResult.skipped) {
            if (fileNameInput) fileNameInput.value = fileInfo.fileName;
            this.checkFileModified(fileId, panel);
            this.showNotification('Skipped applying filename change.', 'info');
            return;
        }

        const resolvedFileName = conflictResult.targetPath;
        if (fileNameInput) fileNameInput.value = resolvedFileName;
        const currentContent = fileInfo.editor ? fileInfo.editor.getValue() : '';
        const currentFileType = this.getCurrentFileType(panel, fileInfo);
        
        // Update saved state
        this.state.savedFileStates[fileId] = {
            content: currentContent,
            fileName: resolvedFileName,
            fileType: currentFileType
        };
        
        // Update file info
        fileInfo.fileName = resolvedFileName;
        
        // Update UI
        this.checkFileModified(fileId, panel);
        this.renderFileTree();
        this.updateMainHtmlSelector();
        this.schedulePreviewRefresh();
        
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

        const currentFileType = this.getCurrentFileType(panel, fileInfo);
        const savedFileType = this.getSavedFileType(savedState, fileInfo);
        const savedIsEditable = this.isEditableFileType(savedFileType);

        if (currentFileType !== savedFileType) {
            this.applyFileTypeChange(panel, fileId, savedFileType, savedState.content);
        }

        // Revert content when the saved type remains editable in the current editor instance.
        if (savedIsEditable && fileInfo.editor && fileInfo.editor.setValue) {
            fileInfo.editor.setValue(savedState.content);
        }
        
        // Update file info
        fileInfo.fileName = savedState.fileName;
        
        // Update UI
        this.checkFileModified(fileId, panel);
        this.renderFileTree();
        this.updateMainHtmlSelector();
        this.schedulePreviewRefresh();
        
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
            this.schedulePreviewRefresh();
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

    schedulePreviewRefresh() {
        this.previewRenderer.scheduleRefresh();
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

        this.revokeFilePanelPreviewUrl(fileId);
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
        this.revokeAllFilePanelPreviewUrls();

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
            this.decorateFileTypeDropdownOptions(panel);
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
                    this.initFileSavedState(fileId, content, fileName, fileType);
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
        if (!this.state.settings.autoFormatOnType) return;
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
            // Use configured tab size and indent type from settings
            const indentSize = this.state.settings.tabSize || 4;
            const indentChar = this.state.settings.indentWithTabs ? '\t' : ' ';
            
            if (fileType === 'json') {
                // JSON.stringify uses spaces, so we use indentSize directly
                const formatted = JSON.stringify(JSON.parse(content), null, indentSize);
                // If using tabs, replace leading spaces with tabs
                if (this.state.settings.indentWithTabs) {
                    return formatted.split('\n').map(line => {
                        const spaces = line.match(/^ +/);
                        if (spaces) {
                            const spaceCount = spaces[0].length;
                            const tabCount = Math.floor(spaceCount / indentSize);
                            return '\t'.repeat(tabCount) + line.slice(tabCount * indentSize);
                        }
                        return line;
                    }).join('\n');
                }
                return formatted;
            }

            if ((fileType === 'javascript' || fileType === 'javascript-module') && typeof window.js_beautify === 'function') {
                return window.js_beautify(content, { 
                    indent_size: indentSize,
                    indent_char: indentChar,
                    preserve_newlines: true 
                });
            }

            if (fileType === 'css' && typeof window.css_beautify === 'function') {
                return window.css_beautify(content, { 
                    indent_size: indentSize,
                    indent_char: indentChar
                });
            }

            if ((fileType === 'html' || fileType === 'xml' || fileType === 'svg') && typeof window.html_beautify === 'function') {
                return window.html_beautify(content, { 
                    indent_size: indentSize,
                    indent_char: indentChar,
                    wrap_line_length: 120 
                });
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

    selectEditorSearchMatch(editor, matchIndex, queryLength, shouldFocus = true) {
        if (editor.posFromIndex && editor.setSelection) {
            const from = editor.posFromIndex(matchIndex);
            const to = editor.posFromIndex(matchIndex + queryLength);
            editor.setSelection(from, to);
            if (editor.scrollIntoView) {
                editor.scrollIntoView({ from, to }, 100);
            }
            if (shouldFocus && editor.focus) {
                editor.focus();
            }
            return true;
        }

        if (typeof editor.selectionStart === 'number' && typeof editor.setSelectionRange === 'function') {
            if (shouldFocus) {
                editor.focus();
            }
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

        this.selectEditorSearchMatch(editor, matchIndex, trimmedQuery.length, findNext);
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

            const fileId = panel.dataset.fileId;
            const fileInfo = this.state.files.find(f => f.id === fileId);
            if (!fileInfo) {
                console.warn('exportFile: file info not found for fileId', fileId);
            }
            const isBinary = fileInfo ? fileInfo.isBinary : false;

            let blob;
            const commaIndex = content.indexOf(',');
            if (isBinary && content.startsWith('data:') && commaIndex !== -1) {
                const base64Data = content.slice(commaIndex + 1);
                blob = new Blob([this.base64ToUint8Array(base64Data)], { type: mimeType });
            } else {
                blob = new Blob([content], { type: mimeType });
            }
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

        this.revokeTrackedObjectUrls(this.state.mediaPreviewUrls);
        
        let previewContent = '';
        
        if (fileType === 'svg') {
            previewContent = this.htmlGenerators.mediaPreviewContent('svg', fileInfo.content, fileName, fileInfo.isBinary);
        } else {
            previewContent = this.htmlGenerators.mediaPreviewContent(fileType, this.getPreviewAssetUrl(fileInfo, 'application/octet-stream', this.state.mediaPreviewUrls), fileName);
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
        this.updateDockDividerVisibility();
        this.updateBackgroundScrollLock();
    },

    closeMediaModal() {
        this.revokeTrackedObjectUrls(this.state.mediaPreviewUrls);
        if (this.dom.mediaModal) {
            this.dom.mediaModal.style.display = 'none';
            this.dom.mediaModal.setAttribute('aria-hidden', 'true');
        }
        if (this.dom.mediaModalContent) {
            this.dom.mediaModalContent.innerHTML = '';
        }
        this.updateDockDividerVisibility();
        this.updateBackgroundScrollLock();
    },

    openCodeModal(content, fileName, language, sourcePanel) {
        try {
            const modal = this.dom.codeModal;
            const modalTitle = this.dom.codeModalTitle;
            const editorTextarea = document.getElementById('code-modal-editor');

            if (!modal || !modalTitle || !editorTextarea) {
                console.error('Code modal elements not found');
                return;
            }

            this.state.currentCodeModalSource = sourcePanel;
            this.setActiveEditorPanel(sourcePanel);

            this.updateCodeModalDockButton();
            this.applyCodeModalDockLayout();
            this.updateCodeModalHeaderAndButtons(fileName);

            if (window.CodeMirror) {
                if (!this.state.codeModalEditor) {
                    // Create modal CodeMirror editor with all settings
                    // indentUnit matches tabSize for consistent indentation width
                    this.state.codeModalEditor = window.CodeMirror.fromTextArea(editorTextarea, {
                        lineNumbers: true,
                        mode: language,
                        theme: this.state.settings.theme,
                        readOnly: false,
                        lineWrapping: !!this.state.settings.lineWrapping,
                        autoCloseTags: true,
                        tabSize: this.state.settings.tabSize,
                        indentUnit: this.state.settings.tabSize,
                        indentWithTabs: !!this.state.settings.indentWithTabs,
                        autoCloseBrackets: !!this.state.settings.autoCloseBrackets,
                        matchBrackets: !!this.state.settings.matchBrackets,
                        viewportMargin: Infinity,
                    });
                } else {
                    this.state.codeModalEditor.setOption('mode', language);
                    this.state.codeModalEditor.setOption('readOnly', false);
                    this.applySettingsToEditor(this.state.codeModalEditor);
                }

                if (!this.state.codeModalEditor._liveSyncBound) {
                    this.state.codeModalEditor.on('change', (cm) => {
                        this.syncCodeModalToSource(cm.getValue());
                    });
                    this.state.codeModalEditor._liveSyncBound = true;
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
                editorTextarea.style.fontSize = `${this.state.settings.fontSize}px`;
                editorTextarea.style.border = 'none';
                editorTextarea.style.outline = 'none';
                editorTextarea.style.padding = '10px';
                editorTextarea.style.backgroundColor = '#282a36';
                editorTextarea.style.color = '#f8f8f2';
                editorTextarea.style.resize = 'none';
                if (!this.state.codeModalPlaintextInputHandlerBound) {
                    editorTextarea.addEventListener('input', () => {
                        this.syncCodeModalToSource(editorTextarea.value);
                    });
                    this.state.codeModalPlaintextInputHandlerBound = true;
                }
                editorTextarea.focus();
            }

            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
            this.updateDockDividerVisibility();
            this.updateDockedModalCompactModes();
            this.updateBackgroundScrollLock();

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
        this.setCodeModalDockedState(false);
        this.dom.codeModal?.classList.remove('is-compact-docked');
        this.closeCodeModalSearch();
        this.updateDockDividerVisibility();
        this.updateBackgroundScrollLock();
    },



    refreshCodeModalEditor() {
        if (!(window.CodeMirror && this.state.codeModalEditor)) return;
        setTimeout(() => this.state.codeModalEditor.refresh(), 0);
    },

    getCodeModalEditorText() {
        if (window.CodeMirror && this.state.codeModalEditor) {
            return this.state.codeModalEditor.getValue();
        }

        const editorTextarea = document.getElementById('code-modal-editor');
        return editorTextarea ? editorTextarea.value : '';
    },

    openCodeModalSearch() {
        if (!this.dom.codeModalSearch || !this.dom.codeModalSearchInput) return;

        this.dom.codeModalSearch.hidden = false;
        this.dom.codeModalSearchBtn?.classList.add('active');
        this.dom.codeModalSearchBtn?.setAttribute('aria-expanded', 'true');
        this.dom.codeModalSearchInput.focus();
        this.dom.codeModalSearchInput.select();
        this.refreshCodeModalEditor();
    },

    closeCodeModalSearch() {
        if (!this.dom.codeModalSearch || !this.dom.codeModalSearchInput) return;

        this.dom.codeModalSearch.hidden = true;
        this.dom.codeModalSearchInput.value = '';
        this.dom.codeModalSearchInput.classList.remove('no-match');
        this.dom.codeModalSearchBtn?.classList.remove('active');
        this.dom.codeModalSearchBtn?.setAttribute('aria-expanded', 'false');
        this.state.codeModalSearchState = { query: '', cursorIndex: -1 };

        if (window.CodeMirror && this.state.codeModalEditor) {
            this.state.codeModalEditor.focus();
        }

        this.refreshCodeModalEditor();
    },

    toggleCodeModalSearch() {
        if (!this.dom.codeModalSearch) return;

        if (this.dom.codeModalSearch.hidden) {
            this.openCodeModalSearch();
        } else {
            this.closeCodeModalSearch();
        }
    },

    searchInCodeModal(findNext = false) {
        if (!this.dom.codeModalSearchInput) return;

        const query = this.dom.codeModalSearchInput.value;
        const content = this.getCodeModalEditorText();
        this.dom.codeModalSearchInput.classList.remove('no-match');

        if (!query) {
            this.state.codeModalSearchState = { query: '', cursorIndex: -1 };
            return;
        }

        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();
        const searchState = this.state.codeModalSearchState;

        let startIndex = 0;
        if (findNext && searchState.query === query) {
            startIndex = Math.max(searchState.cursorIndex + 1, 0);
        }

        let matchIndex = contentLower.indexOf(queryLower, startIndex);
        if (matchIndex === -1 && findNext) {
            matchIndex = contentLower.indexOf(queryLower, 0);
        }

        if (matchIndex === -1) {
            this.dom.codeModalSearchInput.classList.add('no-match');
            return;
        }

        const endIndex = matchIndex + query.length;
        this.state.codeModalSearchState = { query, cursorIndex: matchIndex };

        if (window.CodeMirror && this.state.codeModalEditor) {
            const startPos = this.state.codeModalEditor.posFromIndex(matchIndex);
            const endPos = this.state.codeModalEditor.posFromIndex(endIndex);
            if (findNext) {
                this.state.codeModalEditor.focus();
            }
            this.state.codeModalEditor.setSelection(startPos, endPos);
            this.state.codeModalEditor.scrollIntoView({ from: startPos, to: endPos }, 60);
        } else {
            const editorTextarea = document.getElementById('code-modal-editor');
            if (editorTextarea) {
                if (findNext) {
                    editorTextarea.focus();
                }
                editorTextarea.setSelectionRange(matchIndex, endIndex);
            }
        }
    },
    syncCodeModalToSource(content) {
        try {
            if (!this.state.currentCodeModalSource || this.state.isSyncingCodeModalToSource) {
                return;
            }

            const sourceEditor = this.getEditorFromPanel(this.state.currentCodeModalSource);
            if (!sourceEditor || sourceEditor.getValue() === content) {
                return;
            }

            this.state.isSyncingCodeModalToSource = true;
            sourceEditor.setValue(content);
            this.updateCodeModalHeaderAndButtons();
            this.schedulePreviewRefresh();

            if (sourceEditor.refresh) {
                setTimeout(() => {
                    sourceEditor.refresh();
                }, 0);
            }
        } catch (error) {
            console.error('Error syncing expanded code view to source editor:', error);
        } finally {
            this.state.isSyncingCodeModalToSource = false;
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
            ? '<span class="btn-icon">' + SVG_ICONS.folderOpen + '</span> Actions'
            : '<span class="btn-icon">' + SVG_ICONS.folder + '</span> Collapse';

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

    /**
     * Displays a transient toast notification.
     * @param {string} message - The text to display
     * @param {'info'|'success'|'warn'|'error'} [type='info'] - Visual severity level
     */
    showNotification(message, type = 'info') {
        this.notificationSystem.show(message, type);
    },

    /**
     * Displays a progress notification with a live progress bar.
     * Returns a controller object with `update()`, `complete()`, `fail()`, and `dismiss()` methods.
     * @param {string} message - Initial message text
     * @param {{type?: string, total?: number}} [options={}]
     * @returns {{update: function, complete: function, fail: function, dismiss: function}}
     */
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
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(`<div id="__preview-script-container">${htmlContent}</div>`, 'text/html');
        const container = parsedDoc.getElementById('__preview-script-container');
        if (!container) return htmlContent;

        container.querySelectorAll('script').forEach((scriptEl) => {
            const src = scriptEl.getAttribute('src');
            if (src) {
                const trimmedSrc = src.trim();
                const isExternal = /^(https?:)?\/\//i.test(trimmedSrc) || /^data:/i.test(trimmedSrc) || /^blob:/i.test(trimmedSrc);
                if (!isExternal) {
                    scriptEl.remove();
                }
                return;
            }

            const scriptContent = scriptEl.textContent || '';
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
            scriptEl.remove();
        });

        container.querySelectorAll('link[rel="stylesheet"]').forEach((linkEl) => linkEl.remove());
        return container.innerHTML;
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
                    content: this.getFileContent(file),
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

    replaceAssetReferences(htmlContent, fileSystem, currentFilePath = '', processedHtmlFiles = null) {
        if (!processedHtmlFiles) processedHtmlFiles = new Map();
        htmlContent = this.assetReplacers.replaceAllConfigBased(htmlContent, fileSystem, currentFilePath);
        htmlContent = this.assetReplacers.replaceDownloadLinks(htmlContent, fileSystem, currentFilePath, processedHtmlFiles);
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
        const processedHtmlFiles = new Map();
        processedHtmlFiles.set(mainHtmlPath, null);
        let processedHtml = this.replaceAssetReferences(mainHtmlFile.editor.getValue(), fileSystem, mainHtmlPath, processedHtmlFiles);
        
        return this.injectConsoleScript(processedHtml, fileSystem, mainHtmlPath);
    },

    injectConsoleScript(htmlContent, fileSystem = null, mainHtmlPath = 'index.html') {
        const captureScript = this.consoleBridge.getCaptureScript(fileSystem, mainHtmlPath);
        
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
            // Escape closing script tags to prevent them from breaking the parent script tag
            const escapedContent = combinedModuleContent.replace(/<\/script>/gi, '<\\/script>');
            return '<script type="module">\n' + escapedContent + '\n</script>\n';
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
            // Escape closing script tags to prevent them from breaking the parent script tag
            const escapedJS = regularJS.replace(/<\/script>/gi, '<\\/script>');
            return '<script>\n' + escapedJS + '</script>\n';
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
            '    ' + this.consoleBridge.getCaptureScript(fileSystem, mainHtmlPath) + '\n' +
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

    /**
     * Generates the full HTML document string for the current preview.
     * @returns {string} Complete HTML document ready to be injected into the iframe
     */
    generatePreviewContent() {
        return this.generateMultiFilePreview();
    },

    clearPreviewTabState() {
        if (this.state.previewTabUrl) {
            URL.revokeObjectURL(this.state.previewTabUrl);
            this.state.previewTabUrl = null;
        }
        this.state.previewTabWindow = null;
        this.cleanupPreviewAssetUrlsIfUnused();
    },

    updatePreviewTab(content, openIfNeeded = false) {
        let previewWindow = this.state.previewTabWindow;
        const isTabOpen = previewWindow && !previewWindow.closed;
        if (!isTabOpen && !openIfNeeded) {
            this.clearPreviewTabState();
            return false;
        }

        if (!isTabOpen) {
            previewWindow = window.open('about:blank', '_blank');
            if (!previewWindow) throw new Error('Failed to open preview tab: popup may have been blocked by the browser.');
            this.state.previewTabWindow = previewWindow;
        }

        const blob = new Blob([content], { type: 'text/html' });
        const nextUrl = URL.createObjectURL(blob);
        previewWindow.location.replace(nextUrl);

        const previousTabUrl = this.state.previewTabUrl;
        this.state.previewTabUrl = nextUrl;
        if (previousTabUrl) {
            queueMicrotask(() => URL.revokeObjectURL(previousTabUrl));
        }
        return true;
    },

    refreshOpenPreviews() {
        const isModalOpen = this.dom.modalOverlay?.getAttribute('aria-hidden') === 'false';
        const previewTabWindow = this.state.previewTabWindow;
        const isTabOpen = previewTabWindow && !previewTabWindow.closed;
        if (!isModalOpen && !isTabOpen) return;

        const availability = this.getPreviewAvailability();
        if (!availability.allowed) return;

        this.revokeTrackedObjectUrls(this.state.previewAssetUrls);
        const content = this.generatePreviewContent();

        if (isModalOpen && this.dom.previewFrame) {
            const activeEl = document.activeElement;
            this.previewRenderer.safeWritePreviewFrame(content);
            if (activeEl && activeEl !== document.body && activeEl !== this.dom.previewFrame) {
                const restoreFocus = () => {
                    if (document.contains(activeEl) &&
                        (document.activeElement === this.dom.previewFrame || document.activeElement === document.body)) {
                        activeEl.focus();
                    }
                };
                this.dom.previewFrame.addEventListener('load', restoreFocus, { once: true });
            }
        }

        if (isTabOpen) {
            try {
                this.updatePreviewTab(content, false);
            } catch (e) {
                console.error('Failed to update preview tab:', e);
                this.clearPreviewTabState();
            }
        }
    },

    /**
     * Delegates preview rendering to PreviewRenderer.
     * @param {'modal'|'tab'} target - Where to display the preview
     */
    renderPreview(target) {
        this.previewRenderer.render(target);
    },


    /**
     * Regenerates and reloads preview content in the modal iframe.
     */
    refreshModalPreview() {
        const availability = this.getPreviewAvailability();
        if (!availability.allowed) {
            this.showNotification('No HTML file found. Import or create an HTML file to preview.', 'warn');
            this.updatePreviewActionButtons();
            return;
        }

        this.revokeTrackedObjectUrls(this.state.previewAssetUrls);
        const content = this.generatePreviewContent();
        this.consoleBridge.clear();
        this.previewRenderer.safeWritePreviewFrame(content);
        this.showNotification('Preview refreshed.', 'success');
    },

    getPreviewDockOrientation() {
        const isPortraitMobile = window.matchMedia('(max-width: 900px) and (orientation: portrait)').matches;
        return isPortraitMobile ? 'bottom' : 'right';
    },

    updatePreviewDockButton() {
        if (!this.dom.dockPreviewBtn) return;
        const isDocked = this.state.isPreviewDocked;
        this.dom.dockPreviewBtn.classList.toggle('active', isDocked);
        this.dom.dockPreviewBtn.setAttribute('aria-label', isDocked ? 'Undock preview panel' : 'Dock preview panel');
        this.updatePreviewDockControlButtons();
    },

    getViewportWidth() {
        return window.visualViewport?.width ?? window.innerWidth;
    },

    getViewportHeight() {
        return window.visualViewport?.height ?? window.innerHeight;
    },

    getDockConstraints(orientation) {
        if (orientation === 'bottom') {
            const minPreview = 220;
            const minEditor = 260;
            const maxPreview = Math.max(minPreview, this.getViewportHeight() - minEditor);
            return { minPreview, maxPreview };
        }

        const minPreview = 320;
        const minEditor = 420;
        const maxPreview = Math.max(minPreview, this.getViewportWidth() - minEditor);
        return { minPreview, maxPreview };
    },

    getDockSizePx(orientation) {
        const stored = this.state.previewDockSize[orientation];
        const viewportHalf = orientation === 'bottom' ? this.getViewportHeight() / 2 : this.getViewportWidth() / 2;
        const next = stored ?? viewportHalf;
        const { minPreview, maxPreview } = this.getDockConstraints(orientation);
        const clamped = Math.min(maxPreview, Math.max(minPreview, next));
        this.state.previewDockSize[orientation] = clamped;
        return clamped;
    },

    isSecondaryModalOpen() {
        const codeOpen = document.getElementById('code-modal')?.getAttribute('aria-hidden') === 'false';
        const mediaOpen = this.dom.mediaModal?.getAttribute('aria-hidden') === 'false';
        const settingsOpen = this.isSettingsModalOpen();
        const codeModalOverDivider = codeOpen && !this.state.isCodeModalDockedLeft;
        return codeModalOverDivider || mediaOpen || settingsOpen;
    },

    updateBackgroundScrollLock() {
        const previewOpen = this.dom.modalOverlay?.getAttribute('aria-hidden') === 'false';
        const codeOpen = document.getElementById('code-modal')?.getAttribute('aria-hidden') === 'false';
        const settingsOpen = this.isSettingsModalOpen();
        const shouldLock = settingsOpen || codeOpen || (previewOpen && !this.state.isPreviewDocked);
        document.body.classList.toggle('modal-scroll-lock', shouldLock);
    },

    updateDockDividerVisibility() {
        if (!this.dom.previewDockDivider) return;

        const shouldShow = this.state.isPreviewDocked;
        const suspended = shouldShow && this.isSecondaryModalOpen();

        this.dom.previewDockDivider.hidden = !shouldShow;
        this.dom.previewDockDivider.classList.toggle('is-suspended', suspended);
    },

    applyPreviewDockLayout() {
        const orientation = this.state.previewDockOrientation;
        const sizePx = this.getDockSizePx(orientation);
        document.documentElement.style.setProperty('--preview-dock-size', `${sizePx}px`);

        document.body.classList.toggle('preview-docked', this.state.isPreviewDocked);
        document.body.classList.toggle('preview-docked-right', this.state.isPreviewDocked && orientation === 'right');
        document.body.classList.toggle('preview-docked-bottom', this.state.isPreviewDocked && orientation === 'bottom');

        if (this.dom.modalOverlay) {
            this.dom.modalOverlay.classList.toggle('is-docked', this.state.isPreviewDocked);
            this.dom.modalOverlay.setAttribute('aria-modal', this.state.isPreviewDocked ? 'false' : 'true');
        }

        if (this.dom.previewDockDivider) {
            this.dom.previewDockDivider.classList.toggle('is-bottom', orientation === 'bottom');
        }
        this.updateDockDividerVisibility();

        this.updatePreviewDockButton();
        this.updateAdaptiveLayoutMode();
        this.updateCodeModalDockButton();
        this.applyCodeModalDockLayout();
        this.updateDockedModalCompactModes();
        this.updateBackgroundScrollLock();
    },

    togglePreviewDock(forceState = null) {
        const nextState = typeof forceState === 'boolean' ? forceState : !this.state.isPreviewDocked;
        if (!nextState && this.state.dockResizeSession) {
            this.endPreviewDockResize();
        }
        this.state.isPreviewDocked = nextState;
        if (nextState) {
            this.state.previewDockOrientation = this.getPreviewDockOrientation();
        } else {
            this.state.isCodeModalDockedLeft = false;
        }
        this.applyPreviewDockLayout();
    },

    handleDockViewportResize() {
        this.updatePreviewViewportHeight();
        if (!this.state.isPreviewDocked) return;
        const nextOrientation = this.getPreviewDockOrientation();
        if (nextOrientation !== this.state.previewDockOrientation) {
            this.state.previewDockOrientation = nextOrientation;
        }
        this.applyPreviewDockLayout();
    },

    startPreviewDockResize(event) {
        if (!this.state.isPreviewDocked || !this.dom.previewDockDivider) return;
        event.preventDefault();

        const divider = this.dom.previewDockDivider;
        const orientation = this.state.previewDockOrientation;
        this.state.dockResizeSession = { orientation, pointerId: event.pointerId };

        divider.setPointerCapture(event.pointerId);

        const onMove = (moveEvent) => this.handlePreviewDockResize(moveEvent);
        const onUp = (upEvent) => this.endPreviewDockResize(upEvent);

        divider.addEventListener('pointermove', onMove);
        divider.addEventListener('pointerup', onUp, { once: true });
        divider.addEventListener('pointercancel', onUp, { once: true });

        this.state.dockResizeSession.cleanup = () => {
            divider.removeEventListener('pointermove', onMove);
        };

        divider.classList.add('is-dragging');
        document.body.classList.add('is-resizing-preview-dock');
    },

    endPreviewDockResize(event) {
        const session = this.state.dockResizeSession;
        if (!session || !this.dom.previewDockDivider) return;

        try {
            this.dom.previewDockDivider.releasePointerCapture(session.pointerId);
        } catch (_err) {
            // Pointer may already be released.
        }

        session.cleanup?.();
        this.state.dockResizeSession = null;
        this.dom.previewDockDivider.classList.remove('is-dragging');
        document.body.classList.remove('is-resizing-preview-dock');

        if (event) {
            this.handlePreviewDockResize(event);
        }
    },

    handlePreviewDockResize(event) {
        const session = this.state.dockResizeSession;
        if (!session) return;

        if (session.orientation === 'right') {
            const rawSize = this.getViewportWidth() - event.clientX;
            const { minPreview, maxPreview } = this.getDockConstraints('right');
            this.state.previewDockSize.right = Math.min(maxPreview, Math.max(minPreview, rawSize));
        } else {
            const rawSize = this.getViewportHeight() - event.clientY;
            const { minPreview, maxPreview } = this.getDockConstraints('bottom');
            this.state.previewDockSize.bottom = Math.min(maxPreview, Math.max(minPreview, rawSize));
        }

        this.applyPreviewDockLayout();
    },

    toggleModal(show) {
        this.dom.modalOverlay.setAttribute('aria-hidden', !show);
        if (show) {
            this.applyPreviewDockLayout();
            this.dom.modalConsolePanel.classList.add('hidden');
            this.dom.toggleConsoleBtn.classList.remove('active');
            this.updatePreviewDockControlButtons();
        } else {
            this.togglePreviewDock(false);
            if (this.state.previewRefreshTimer) {
                clearTimeout(this.state.previewRefreshTimer);
                this.state.previewRefreshTimer = null;
            }

            // Replace the iframe entirely on close. cloneNode(false) creates a fresh
            // element with no running scripts, listeners, or timers — the safest teardown.
            const iframe = this.dom.previewFrame;
            const parent = iframe.parentNode;
            iframe.removeAttribute('srcdoc');
            iframe.src = 'about:blank';
            const newIframe = iframe.cloneNode(false);
            newIframe.removeAttribute('srcdoc');
            newIframe.src = 'about:blank';
            parent.replaceChild(newIframe, iframe);

            // Update cached references to the replacement iframe.
            this.dom.previewFrame = newIframe;
            this.consoleBridge.previewFrame = newIframe;

            this.consoleBridge.clear();
            this.cleanupPreviewAssetUrlsIfUnused();
        }

        this.updateDockDividerVisibility();
        this.updateBackgroundScrollLock();
    },

    toggleConsole() {
        const isHidden = this.dom.modalConsolePanel.classList.contains('hidden');

        if (isHidden) {
            this.dom.modalConsolePanel.classList.remove('hidden');
            this.dom.toggleConsoleBtn.classList.add('active');
        } else {
            this.dom.modalConsolePanel.classList.add('hidden');
            this.dom.toggleConsoleBtn.classList.remove('active');
        }

        this.updatePreviewDockControlButtons();
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
                let content = this.getFileContent(file);
                
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
    
    // ============================================================================
    // ARCHIVE IMPORT
    // Multi-format archive import: ZIP, TAR, TAR.GZ/TGZ, RAR, 7Z
    // ============================================================================

    async importArchive() {
        this._openFilePicker('.zip,.rar,.7z,.tar.gz,.tgz,.tar', false, async (fileList) => {
            const file = fileList[0];
            if (!file) return;

            const name = file.name.toLowerCase();

            if (name.endsWith('.zip')) {
                return this._importFromZip(file);
            }
            if (name.endsWith('.tar.gz') || name.endsWith('.tgz')) {
                return this._importFromTarGz(file);
            }
            if (name.endsWith('.tar')) {
                return this._importFromTar(file);
            }
            if (name.endsWith('.rar') || name.endsWith('.7z')) {
                return this._importFromLibArchive(file);
            }

            this.showNotification('Unsupported archive format.', 'error');
        });
    },

    /**
     * Shared import loop for all archive formats.
     * @param {Array<{path: string, readBinary: function, readText: function}>} entries
     *   Normalized entries where readBinary() returns base64 content and readText() returns text content.
     * @param {string} label - Human-readable archive type label (e.g. 'ZIP archive')
     * @param {Object} [options]
     * @param {Object} [options.progress] - Existing progress notification to reuse (e.g. from libarchive loading phase)
     */
    async _importEntries(entries, label, { progress } = {}) {
        try {
            if (entries.length === 0) {
                if (progress) progress.fail('No files found in archive.');
                this.showNotification('The archive appears to be empty.', 'warn');
                return;
            }

            if (progress) {
                progress.update({ total: entries.length, message: `Found ${entries.length} files in archive` });
            } else {
                progress = this.showProgressNotification(`Importing ${label} contents…`, {
                    total: Math.max(entries.length, 1),
                    type: 'info'
                });
            }

            let importedCount = 0;
            let skippedCount = 0;

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const processedCount = i + 1;

                progress.update({
                    current: processedCount,
                    message: `Importing ${processedCount}/${entries.length}: ${entry.path}`
                });

                if (processedCount % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }

                const result = await this._resolveImportConflict(entry.path);
                if (result.status === 'skipped') {
                    skippedCount++;
                    continue;
                }

                const extension = this.fileTypeUtils.getExtension(result.fileName);
                const isBinary = this.fileTypeUtils.isBinaryFile(result.fileName, '');
                let content;
                let mimeType = '';

                if (isBinary) {
                    const base64Content = await entry.readBinary();
                    mimeType = this.fileTypeUtils.getMimeTypeFromExtension(extension);
                    content = `data:${mimeType};base64,${base64Content}`;
                } else {
                    content = await entry.readText();
                    mimeType = this.fileTypeUtils.getMimeTypeFromExtension(extension);
                }

                const fileType = this.autoDetectFileType(result.fileName, isBinary ? null : content, mimeType);
                this.addNewFileWithContent(result.fileName, fileType, content, isBinary);
                importedCount++;
            }

            progress.complete(label + ' import complete.');
            this._showImportSummary(importedCount, skippedCount, label + ' imported successfully!');

        } catch (error) {
            console.error('Error importing ' + label + ':', error);
            if (progress) progress.fail(label + ' import failed.');
            this.showNotification('Failed to import ' + label.toLowerCase(), 'error');
        }
    },

    async _importFromZip(file) {
        if (typeof JSZip === 'undefined') {
            this.showNotification('JSZip library not available', 'error');
            return;
        }

        try {
            const zip = await JSZip.loadAsync(file);
            const zipEntries = Object.entries(zip.files).filter(([, zipEntry]) => !zipEntry.dir);
            const entries = zipEntries.map(([relativePath, zipEntry]) => ({
                path: relativePath,
                readBinary: () => zipEntry.async('base64'),
                readText: () => zipEntry.async('string')
            }));
            await this._importEntries(entries, 'ZIP archive');
        } catch (error) {
            console.error('Error processing ZIP file:', error);
            this.showNotification('Failed to import ZIP file', 'error');
        }
    },

    _uint8ArrayToBase64(bytes) {
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            for (let j = 0; j < chunk.length; j++) {
                binary += String.fromCharCode(chunk[j]);
            }
        }
        return btoa(binary);
    },

    _readTarString(header, offset, length) {
        const bytes = header.subarray(offset, offset + length);
        const nullIndex = bytes.indexOf(0);
        const end = nullIndex === -1 ? length : nullIndex;
        return new TextDecoder().decode(bytes.subarray(0, end));
    },

    _parseTar(buffer) {
        const files = [];
        const view = new Uint8Array(buffer);
        let offset = 0;

        while (offset + 512 <= view.length) {
            const header = view.subarray(offset, offset + 512);
            if (header.every(b => b === 0)) break;
            offset += 512;

            const namePrefix = this._readTarString(header, 345, 155);
            const name = this._readTarString(header, 0, 100);
            const fullName = namePrefix ? namePrefix + '/' + name : name;

            const sizeStr = this._readTarString(header, 124, 12);
            const size = parseInt(sizeStr, 8) || 0;

            const typeFlag = header[156];

            if ((typeFlag === 0 || typeFlag === 48) && size > 0) {
                files.push({
                    name: fullName,
                    data: view.slice(offset, offset + size)
                });
            }

            offset += Math.ceil(size / 512) * 512;
        }

        return files;
    },

    _normalizeTarEntries(tarFiles) {
        return tarFiles.map(f => ({
            path: f.name,
            readBinary: () => this._uint8ArrayToBase64(f.data),
            readText: () => new TextDecoder().decode(f.data)
        }));
    },

    async _importFromTar(file) {
        try {
            const buffer = await file.arrayBuffer();
            const entries = this._normalizeTarEntries(this._parseTar(buffer));
            await this._importEntries(entries, 'TAR archive');
        } catch (error) {
            console.error('Error processing TAR file:', error);
            this.showNotification('Failed to import TAR file', 'error');
        }
    },

    async _importFromTarGz(file) {
        if (typeof pako === 'undefined') {
            this.showNotification('pako library not available for gzip decompression', 'error');
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const decompressed = pako.ungzip(new Uint8Array(buffer));
            const entries = this._normalizeTarEntries(this._parseTar(decompressed.buffer));
            await this._importEntries(entries, 'TAR.GZ archive');
        } catch (error) {
            console.error('Error processing TAR.GZ file:', error);
            this.showNotification('Failed to import TAR.GZ file', 'error');
        }
    },

    _flattenArchiveTree(obj, prefix = '') {
        const entries = [];
        for (const key of Object.keys(obj)) {
            if (obj[key] instanceof File) {
                entries.push({ path: prefix + key, file: obj[key] });
            } else if (obj[key] && typeof obj[key] === 'object') {
                entries.push(...this._flattenArchiveTree(obj[key], prefix + key + '/'));
            }
        }
        return entries;
    },

    async _loadLibArchive() {
        if (this._libArchiveCache) return this._libArchiveCache;

        const CDN_BASE = 'https://cdn.jsdelivr.net/npm/libarchive.js@2.0.2/dist/';

        const workerResponse = await fetch(CDN_BASE + 'worker-bundle.js');
        if (!workerResponse.ok) {
            throw new Error('Failed to load archive library from CDN (status ' + workerResponse.status + ')');
        }
        const workerText = await workerResponse.text();
        const patched = workerText.replace(/import\.meta\.url/g, JSON.stringify(CDN_BASE + 'worker-bundle.js'));
        const blob = new Blob([patched], { type: 'text/javascript' });
        const blobUrl = URL.createObjectURL(blob);

        const mod = await import(CDN_BASE + 'libarchive.js');
        mod.Archive.init({
            getWorker: function() { return new Worker(blobUrl, { type: 'module' }); }
        });

        this._libArchiveCache = mod.Archive;
        return this._libArchiveCache;
    },

    async _importFromLibArchive(file) {
        let progress = null;

        try {
            progress = this.showProgressNotification('Loading archive library…', { type: 'info' });

            const Archive = await this._loadLibArchive();
            progress.update({ message: 'Extracting archive…' });

            const archive = await Archive.open(file);
            const obj = await archive.extractFiles();
            const flatEntries = this._flattenArchiveTree(obj);

            const entries = flatEntries.map(e => ({
                path: e.path,
                readBinary: async () => {
                    const arrayBuffer = await e.file.arrayBuffer();
                    return this._uint8ArrayToBase64(new Uint8Array(arrayBuffer));
                },
                readText: () => e.file.text()
            }));

            await this._importEntries(entries, 'archive', { progress });

        } catch (error) {
            console.error('Error processing archive:', error);
            if (progress) progress.fail('Archive import failed.');
            this.showNotification('Failed to import archive. The format may not be supported in this browser.', 'error');
        }
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
                    <img src="${content}" alt="Preview">
                </div>`,
                audio: `<div class="file-preview audio-preview">
                    <audio controls>
                        <source src="${content}">
                        Your browser does not support the audio element.
                    </audio>
                </div>`,
                video: `<div class="file-preview video-preview">
                    <video controls>
                        <source src="${content}">
                        Your browser does not support the video element.
                    </video>
                </div>`,
                pdf: `<div class="file-preview pdf-preview">
                    <object data="${content}" type="application/pdf">
                        <p>PDF failed to load. <a href="${content}" target="_blank">Open in new tab</a></p>
                    </object>
                </div>`,
                default: `<div class="file-preview binary-preview">
                    <p>${SVG_ICONS.fileBinary} Binary file: Cannot display content</p>
                    <p>File can be referenced in HTML code</p>
                </div>`
            };
            return previews[type] || previews.default;
        },

        mediaPreviewContent(type, content, fileName) {
            const safeFileName = CodePreviewer.escapeHtml(fileName);
            const safeContent = CodePreviewer.escapeHtml(content);
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
                    const safeSvgUrl = CodePreviewer.escapeHtml(svgDataUrl);
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
    // Renders toast notifications with optional progress bars.
    // Public surface: show(message, type) and showProgress(message, options).
    // All other methods are internal helpers.
    // ============================================================================
    notificationSystem: {
        /** @type {HTMLElement|null} Lazily created container element */
        container: null,
        /** @type {number} Auto-incrementing ID for progress notification elements */
        progressId: 0,

        /**
         * Returns (and lazily creates) the notification container element.
         * The container is appended once to document.body and reused for all notifications.
         * @returns {HTMLElement}
         */
        getContainer() {
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'notification-container';
                this.container.setAttribute('role', 'status');
                this.container.setAttribute('aria-live', 'polite');
                this.container.setAttribute('aria-atomic', 'false');
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
                    <button class="notification-close-btn" aria-label="Close notification" title="Close">${SVG_ICONS.close}</button>
                </div>
            `;

            container.appendChild(notification);

            // Define dismiss before attaching the close-button listener so the
            // reference is unambiguously resolved (avoids temporal dead zone).
            const dismiss = () => {
                if (notification.classList.contains('notification-hiding')) return;
                notification.classList.add('notification-hiding');
                notification.addEventListener('animationend', () => {
                    notification.remove();
                }, { once: true });
            };

            const closeBtn = notification.querySelector('.notification-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', dismiss);
            }

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
                    <button class="notification-close-btn" aria-label="Close notification" title="Close">${SVG_ICONS.close}</button>
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
            let maxValue = Math.max(total, 1);
            let currentValue = 0;

            const dismiss = () => {
                if (notification.classList.contains('notification-hiding')) return;
                notification.classList.add('notification-hiding');
                notification.addEventListener('animationend', () => notification.remove(), { once: true });
            };

            if (closeBtn) {
                closeBtn.addEventListener('click', () => dismiss());
            }

            const update = ({ current, total: nextTotal, message: nextMessage, type: nextType } = {}) => {
                if (typeof nextTotal === 'number' && nextTotal >= 1) {
                    maxValue = nextTotal;
                    progressBar.setAttribute('aria-valuemax', String(maxValue));
                }
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
        isExternalAssetPath(path) {
            return /^(?:https?:|\/\/|data:|blob:)/i.test(path || '');
        },

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
        },

        /**
         * Configuration for different asset replacement patterns
         * Each entry defines: regex pattern, allowed file types, and replacement strategy
         */
        REPLACEMENT_CONFIGS: {
            css: {
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.css)["']([^>]*?)>/gi,
                types: ['css'],
                replace: (file) => `<style>${file.content}</style>`,
                onMissing: (match, before, filename, after, currentFilePath) => {
                    if (CodePreviewer.assetReplacers.isExternalAssetPath(filename)) {
                        return match;
                    }
                    return CodePreviewer.assetReplacers.createMissingAssetConsoleScript('Stylesheet', filename, currentFilePath, {
                        deferUntilDomReady: true,
                    });
                }
            },
            images: {
                pattern: /<img([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['image', 'svg'],
                replace: (file, match) => {
                    const src = CodePreviewer.getPreviewAssetUrl(file, 'image/png');
                    return match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${src}"`);
                }
            },
            video: {
                pattern: /<video([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['video'],
                replace: (file, match) => match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${CodePreviewer.getPreviewAssetUrl(file, 'video/mp4')}"`)
            },
            source: {
                pattern: /<source([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['video', 'audio'],
                replace: (file, match) => match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${CodePreviewer.getPreviewAssetUrl(file, 'application/octet-stream')}"`)
            },
            audio: {
                pattern: /<audio([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
                types: ['audio'],
                replace: (file, match) => match.replace(/src\s*=\s*["'][^"']*["']/i, `src="${CodePreviewer.getPreviewAssetUrl(file, 'audio/mpeg')}"`)
            },
            favicon: {
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.ico)["']([^>]*?)>/gi,
                types: ['image'],
                replace: (file, match) => match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${CodePreviewer.getPreviewAssetUrl(file, 'image/x-icon')}"`)
            },
            font: {
                pattern: /<link([^>]*?)href\s*=\s*["']([^"']+\.(?:woff|woff2|ttf|otf|eot))["']([^>]*?)>/gi,
                types: ['font'],
                replace: (file, match, before, filename, after) => `<link${before}href="${CodePreviewer.getPreviewAssetUrl(file, 'font/woff2')}"${after}>`
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
                if (file && config.types.includes(file.type)) {
                    return config.replace(file, match, before, filename, after);
                }
                if (typeof config.onMissing === 'function') {
                    return config.onMissing(match, before, filename, after, currentFilePath);
                }
                return match;
            });
        },

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
        },

        replaceDownloadLinks(htmlContent, fileSystem, currentFilePath, processedHtmlFiles) {
            if (!processedHtmlFiles) processedHtmlFiles = new Map();
            return htmlContent.replace(/<a([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, before, filename, after) => {
                if (match.includes('download') || !filename.includes('://')) {
                    const file = CodePreviewer.fileSystemUtils.findFile(fileSystem, filename, currentFilePath);
                    if (file) {
                        if (file.type === 'html' && !match.includes('download')) {
                            const resolvedPath = currentFilePath
                                ? CodePreviewer.fileSystemUtils.resolvePath(currentFilePath, filename)
                                : filename;
                            const cachedUrl = processedHtmlFiles.get(resolvedPath);
                            if (cachedUrl) {
                                return match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${cachedUrl}"`);
                            }
                            if (!processedHtmlFiles.has(resolvedPath)) {
                                processedHtmlFiles.set(resolvedPath, null);
                                let processedContent = CodePreviewer.replaceAssetReferences(file.content, fileSystem, resolvedPath, processedHtmlFiles);
                                processedContent = CodePreviewer.injectConsoleScript(processedContent, fileSystem, resolvedPath);
                                const blob = new Blob([processedContent], { type: 'text/html' });
                                const blobUrl = URL.createObjectURL(blob);
                                CodePreviewer.state.previewAssetUrls.add(blobUrl);
                                processedHtmlFiles.set(resolvedPath, blobUrl);
                                return match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${blobUrl}"`);
                            }
                        }
                        const href = CodePreviewer.getPreviewAssetUrl(file);
                        return match.replace(/href\s*=\s*["'][^"']*["']/i, `href="${href}"`);
                    }
                }
                return match;
            });
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

                const isExternalScript = CodePreviewer.assetReplacers.isExternalAssetPath(filename);
                if (isExternalScript) {
                    return match;
                }
                
                const file = CodePreviewer.fileSystemUtils.findFile(fileSystem, filename, currentFilePath);
                if (file && (file.type === 'javascript' || file.type === 'javascript-module')) {
                    const scriptType = file.type === 'javascript-module' ? ' type="module"' : '';
                    // Escape closing script tags to prevent them from breaking the parent script tag
                    const escapedContent = file.content.replace(/<\/script>/gi, '<\\/script>');
                    return `<script${scriptType}>${escapedContent}</script>`;
                }

                const scriptAttributes = /\btype\s*=\s*["']module["']/i.test(`${before} ${after}`)
                    ? ' type="module"'
                    : '';
                return CodePreviewer.assetReplacers.createMissingAssetConsoleScript('Script', filename, currentFilePath, {
                    scriptAttributes,
                });
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
                return `<li role="option" aria-selected="${checked}"><button type="button" class="main-html-dropdown-option${selectedClass}" data-value="${this.escapeHtml(option.value)}">${this.escapeHtml(option.label)}</button></li>`;
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
    consoleBridge: {
        logCounts: { log: 0, warn: 0, error: 0, info: 0 },
        filters: { log: true, warn: true, error: true, info: true },
        
        /**
         * Configuration constants for console behavior
         * @property {number} OBJECT_COLLAPSE_THRESHOLD - Character count threshold for collapsing JSON objects into expandable details
         * @property {number} COPY_FEEDBACK_DURATION - Duration in milliseconds to show copy success/failure feedback
         */
        OBJECT_COLLAPSE_THRESHOLD: 100,
        COPY_FEEDBACK_DURATION: 1000,
        
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
        },
        
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
        
        /**
         * Clears all logged messages from the output element and resets all log counters.
         */
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
                log: SVG_ICONS.pencil,
                info: SVG_ICONS.info,
                warn: SVG_ICONS.warning,
                error: SVG_ICONS.xCircle
            };
            return icons[level] || SVG_ICONS.pencil;
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
        
        formatRuntimeErrorEntry(entry) {
            const source = entry.source || '(unknown source)';
            const line = Number(entry.line) || 0;
            const column = Number(entry.column) || 0;
            const location = line || column ? `${source}:${line}:${column}` : source;
            const origin = entry.originType || 'unknown';
            const stack = entry.stack
                ? `<details class="console-object"><summary>Stack trace</summary><pre>${this.escapeHtml(entry.stack)}</pre></details>`
                : '';

            return `<span class="console-runtime-error"><strong>${this.escapeHtml(String(entry.message || 'Runtime error'))}</strong> <span class="console-object-inline">(${this.escapeHtml(origin)})</span><br><span class="console-object-inline">${this.escapeHtml(location)}</span>${stack}</span>`;
        },

        normalizeMessage(message) {
            if (Array.isArray(message)) return message;
            if (message === undefined) return [];
            return [message];
        },

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
        },

        formatMessageEntries(messageEntries) {
            return messageEntries.map(arg => {
                if (this.isStructuredRuntimeErrorEntry(arg)) {
                    return this.formatRuntimeErrorEntry(arg);
                }
                return this.formatValue(arg);
            }).join(' ');
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
        },
        
        /**
         * Handles postMessage events from the preview iframe.
         * Filters to only process console capture messages from the active preview frame.
         * @param {MessageEvent} event
         */
        handleMessage(event) {
            const { CONSOLE_MESSAGE_TYPE } = CodePreviewer.constants;
            // Guard: event.data may be null (e.g. from browser extensions).
            if (
                event.data &&
                event.source === this.previewFrame?.contentWindow &&
                event.data.type === CONSOLE_MESSAGE_TYPE
            ) {
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
            const fsUtils = CodePreviewer.previewScriptGenerator;
            const base64HelperCode = fsUtils.generateBase64HelperCode();
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
    ${base64HelperCode}
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


// ============================================================================
// STATIC CACHED CONSTANTS
// These are defined after the object literal so they can reference SVG_ICONS.
// ============================================================================

/**
 * Immutable list of supported file-type choices. Cached here to avoid
 * allocating a new array on every getFileTypeChoices() call.
 * @type {ReadonlyArray<{value: string, label: string, icon: string}>}
 */
CodePreviewer._FILE_TYPE_CHOICES = Object.freeze([
    { value: 'html',              label: 'HTML',              icon: SVG_ICONS.fileHtml     },
    { value: 'css',               label: 'CSS',               icon: SVG_ICONS.fileCss      },
    { value: 'javascript',        label: 'JavaScript',        icon: SVG_ICONS.fileJs       },
    { value: 'javascript-module', label: 'JavaScript Module', icon: SVG_ICONS.package      },
    { value: 'json',              label: 'JSON',              icon: SVG_ICONS.fileJson     },
    { value: 'xml',               label: 'XML',               icon: SVG_ICONS.fileXml      },
    { value: 'markdown',          label: 'Markdown',          icon: SVG_ICONS.fileMarkdown },
    { value: 'text',              label: 'Text',              icon: SVG_ICONS.fileText     },
    { value: 'svg',               label: 'SVG',               icon: SVG_ICONS.fileImage    },
    { value: 'image',             label: 'Image',             icon: SVG_ICONS.fileImage    },
    { value: 'audio',             label: 'Audio',             icon: SVG_ICONS.fileAudio    },
    { value: 'video',             label: 'Video',             icon: SVG_ICONS.fileVideo    },
    { value: 'font',              label: 'Font',              icon: SVG_ICONS.fileFont     },
    { value: 'pdf',               label: 'PDF',               icon: SVG_ICONS.filePdf      },
    { value: 'binary',            label: 'Binary',            icon: SVG_ICONS.fileBinary   },
]);

document.addEventListener('DOMContentLoaded', () => CodePreviewer.init());
