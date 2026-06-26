class CodePreviewer {
    constructor() {
        // ============================================================================
        // APPLICATION STATE
        // ============================================================================
        this.state = {
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
            activePanelId: null,
            formattingEditors: new Set(),
            mainHtmlFile: '',
            viewportResizeHandler: null,
            viewportResizeTimer: null,
            visualViewportResizeHandler: null,
            previewTabWindow: null,
            previewTabUrl: null,
            previewAssetUrls: new Set(),
            previewBlobUrlCache: new Map(),
            mediaPreviewUrls: new Set(),
            filePanelPreviewUrls: new Map(),
            previewRefreshTimer: null,
            previewRefreshDelay: 1000,
            isPreviewDocked: false,
            previewDockOrientation: 'right',
            previewDockSize: { right: null, bottom: null },
            dockResizeSession: null,
            consoleResizeSession: null,
            consoleHeight: 200,
            isCodeModalDockedLeft: false,
            isSyncingCodeModalToSource: false,
            codeModalPlaintextInputHandlerBound: false,
            settingsCloseHandler: null,
            settingsEscHandler: null,
            settingsTooltip: {
                activeBtn: null,
                isPinned: false
            },
            settings: {
                lineNumbers: true,
                lineWrapping: false,
                fontSize: 14,
                theme: 'dracula',
                tabSize: 4,
                indentWithTabs: false,
                autoCloseBrackets: true,
                matchBrackets: true,
            },
        };

        // ============================================================================
        // DOM ELEMENTS CACHE
        // ============================================================================
        this.dom = {};

        // ============================================================================
        // CONSTANTS AND CONFIGURATION
        // ============================================================================
        this.constants = {
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
                    'webmanifest': 'json',
                    'xml': 'xml',
                    'md': 'markdown', 'markdown': 'markdown',
                    'txt': 'text', 'gitignore': 'text',
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
                    'json': 'application/json', 'webmanifest': 'application/manifest+json', 'xml': 'application/xml',
                    'gitignore': 'text/plain'
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
                    'json': { name: 'javascript', json: true },
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
        };

        deepFreeze(this.constants.FILE_TYPES.EXTENSIONS);
        deepFreeze(this.constants.FILE_TYPES.MIME_TYPES);
        deepFreeze(this.constants.FILE_TYPES.EXTENSION_MIME_MAP);
        deepFreeze(this.constants.FILE_TYPES.CODEMIRROR_MODES);
        deepFreeze(this.constants.FILE_TYPES.DEFAULT_EXTENSIONS);
    }

    static _FILE_TYPE_CHOICES = Object.freeze([
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
    init() {
        // Create utility instances with dependency injection.
        // Order matters: each class receives its dependencies via constructor, so
        // instances must be created after their dependencies (e.g. fileSystemUtils
        // requires fileTypeUtils; assetReplacers requires the full app instance).
        this.fileTypeUtils = new FileTypeUtils(this.constants.FILE_TYPES);
        this.fileSystemUtils = new FileSystemUtils(this.fileTypeUtils);
        this.previewScriptGenerator = new PreviewScriptGenerator();
        this.htmlGenerators = new HtmlGenerators();
        this.notificationSystem = new NotificationSystem();
        this.assetReplacers = new AssetReplacers(this);

        // Existing helper instances
        this.previewRenderer = new PreviewRenderer(this);
        this.eventManager = new EventManager(this);
        this.storageHandler = new StorageHandler(this);

        this.cacheDOMElements();
        this.initSettingsCustomDropdowns();
        this.loadSettings();
        this.createDefaultPanels();
        this.initEditors();
        this.eventManager.bindAll();
        this.bindFileTreeEvents();
        this.initExistingFilePanels();
        this.ensureDefaultContentFile();
        this.applyEditorSettingsToAllEditors();
        this.syncSettingsUI();
        this.adjustKeyboardShortcutsForPlatform();

        // Initialize the console capture bridge with constants and previewScriptGenerator for injection script generation.
        this.consoleBridge = new ConsoleBridge(this.constants.CONSOLE_MESSAGE_TYPE, this.previewScriptGenerator);
        this.consoleBridge.init(this.dom.consoleOutput, this.dom.clearConsoleBtn, this.dom.previewFrame);

        this.updatePreviewActionButtons();
        this.updatePreviewViewportHeight();
        this.updateAdaptiveLayoutMode();
    }

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
            settingsTooltip: document.getElementById('settings-tooltip'),
            settingLineNumbers: document.getElementById(CONTROL_IDS.SETTINGS_LINE_NUMBERS),
            settingLineWrap: document.getElementById(CONTROL_IDS.SETTINGS_LINE_WRAP),
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
            consoleResizeDivider: document.getElementById('console-resize-divider'),
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
    }

    /**
     * Returns the parent element of the given element ID, or null if not found.
     * @param {string} elementId
     * @returns {HTMLElement|null}
     */
    getSafeParentElement(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.parentElement : null;
    }

    /**
     * Returns the editor panel element for the given file ID.
     * @param {string} fileId
     * @returns {HTMLElement|null}
     */
    getEditorPanel(fileId) {
        return document.querySelector(`.editor-panel[data-file-id="${fileId}"]`);
    }

    /**
     * Gets the current content of a file, preferring the editor value when available.
     * @param {Object} file - The file object with optional editor and content properties
     * @returns {string} The file content
     */
    getFileContent(file) {
        return (file.editor && file.editor.getValue ? file.editor.getValue() : file.content) || '';
    }

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
                ? new Blob([base64ToUint8Array(dataPart)], { type: mimeType })
                : new Blob([decodeURIComponent(dataPart)], { type: mimeType });
            return URL.createObjectURL(blob);
        } catch (error) {
            return null;
        }
    }

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
    }

    /**
     * Returns true if the given string is a blob: URL.
     * @param {unknown} url
     * @returns {boolean}
     */
    isBlobUrl(url) {
        return typeof url === 'string' && url.startsWith('blob:');
    }

    getPreviewAssetUrl(fileData, defaultMimeType = 'text/plain', urlSet = this.state.previewAssetUrls) {
        const sourceUrl = this.fileSystemUtils.getFileDataUrl(fileData, defaultMimeType);
        if (fileData?.isBinary && typeof sourceUrl === 'string' && sourceUrl.startsWith('data:')) {
            return this.createTrackedObjectUrlFromDataUrl(sourceUrl, urlSet);
        }
        return sourceUrl;
    }

    /**
     * Revokes all object URLs in the provided Set and clears it.
     * @param {Set<string>} urlSet
     */
    revokeTrackedObjectUrls(urlSet) {
        for (const url of urlSet) {
            URL.revokeObjectURL(url);
        }
        urlSet.clear();
    }

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
    }

    revokeFilePanelPreviewUrl(fileId) {
        const previewUrl = this.state.filePanelPreviewUrls.get(fileId);
        if (!previewUrl) return;
        URL.revokeObjectURL(previewUrl);
        this.state.filePanelPreviewUrls.delete(fileId);
    }

    revokeAllFilePanelPreviewUrls() {
        for (const previewUrl of this.state.filePanelPreviewUrls.values()) {
            URL.revokeObjectURL(previewUrl);
        }
        this.state.filePanelPreviewUrls.clear();
    }

    cleanupPreviewAssetUrlsIfUnused() {
        const isPreviewModalOpen = this.dom.modalOverlay?.getAttribute('aria-hidden') === 'false';
        const isPreviewTabOpen = this.state.previewTabWindow && !this.state.previewTabWindow.closed;
        if (!isPreviewModalOpen && !isPreviewTabOpen) {
            this.revokeTrackedObjectUrls(this.state.previewAssetUrls);
            this.state.previewBlobUrlCache.clear();
        }
    }

    hasHtmlFiles() {
        return this.state.files.some(file => file.type === 'html');
    }

    getPreviewAvailability() {
        const hasHtml = this.hasHtmlFiles();
        return {
            allowed: hasHtml,
            reason: hasHtml ? '' : 'Add at least one HTML file to preview.'
        };
    }

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
    }

    updatePreviewActionButtons() {
        const availability = this.getPreviewAvailability();
        const disabled = !availability.allowed;
        this._applyPreviewButtonState(this.dom.modalBtn, disabled, 'Open preview in modal', availability.reason);
        this._applyPreviewButtonState(this.dom.tabBtn,   disabled, 'Open preview in new tab', availability.reason);
    }

    /**
     * Creates the three default editor panels (HTML, CSS, JS) dynamically.
     * This replaces the previously hardcoded panel markup in index.html,
     * eliminating ~250 lines of duplicated toolbar, dropdown, and SVG markup.
     * Panels are generated using the same createFilePanel() path used for
     * dynamically added files, ensuring consistent markup and behaviour.
     */
    createDefaultPanels() {
        const defaults = [
            { id: 'default-html', name: 'index.html', type: 'html' },
            { id: 'default-css',  name: 'styles.css',  type: 'css' },
            { id: 'default-js',   name: 'script.js',   type: 'javascript' },
        ];

        for (const { id, name, type } of defaults) {
            this.createFilePanel(id, name, type, '', false);
        }

        // Re-cache textarea references now that the panels exist in the DOM.
        this.dom.htmlEditor = document.getElementById('default-html');
        this.dom.cssEditor  = document.getElementById('default-css');
        this.dom.jsEditor   = document.getElementById('default-js');
    }

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
    }
    initFallbackEditors() {
        this.state.editors.html = createMockEditor(this.dom.htmlEditor, this.state.settings.fontSize);
        this.state.editors.css = createMockEditor(this.dom.cssEditor, this.state.settings.fontSize);
        this.state.editors.js = createMockEditor(this.dom.jsEditor, this.state.settings.fontSize);

        this.setDefaultContent();
    }
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
    }

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
    }

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

        const panel = this.getEditorPanel(fileId);
        if (panel) {
            this.bindFilePanelEvents(panel);
        }

        this.refreshPanelAndFileTreeUI();
    }


    /**
     * Load user settings from localStorage
     * @private
     */
    loadSettings() {
        this.storageHandler.loadSettings();
    }

    /**
     * Save user settings to localStorage
     * @private
     */
    saveSettings() {
        this.storageHandler.saveSettings();
    }

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
            fontSize: allowedFontSizes.has(fontSize) ? fontSize : 14,
            theme: allowedThemes.has(nextSettings.theme) ? nextSettings.theme : 'dracula',
            tabSize: allowedTabSizes.has(tabSize) ? tabSize : 4,
            indentWithTabs: typeof nextSettings.indentWithTabs === 'boolean' ? nextSettings.indentWithTabs : false,
            autoCloseBrackets: typeof nextSettings.autoCloseBrackets === 'boolean' ? nextSettings.autoCloseBrackets : true,
            matchBrackets: typeof nextSettings.matchBrackets === 'boolean' ? nextSettings.matchBrackets : true,
        };
    }

    syncSettingsUI() {
        if (this.dom.settingLineNumbers) this.dom.settingLineNumbers.checked = !!this.state.settings.lineNumbers;
        if (this.dom.settingLineWrap) this.dom.settingLineWrap.checked = !!this.state.settings.lineWrapping;
        if (this.dom.settingFontSize) this.dom.settingFontSize.value = String(this.state.settings.fontSize);
        if (this.dom.settingEditorTheme) this.dom.settingEditorTheme.value = this.state.settings.theme;
        if (this.dom.settingTabSize) this.dom.settingTabSize.value = String(this.state.settings.tabSize);
        if (this.dom.settingIndentWithTabs) this.dom.settingIndentWithTabs.checked = !!this.state.settings.indentWithTabs;
        if (this.dom.settingAutoCloseBrackets) this.dom.settingAutoCloseBrackets.checked = !!this.state.settings.autoCloseBrackets;
        if (this.dom.settingMatchBrackets) this.dom.settingMatchBrackets.checked = !!this.state.settings.matchBrackets;

        [this.dom.settingFontSize, this.dom.settingEditorTheme, this.dom.settingTabSize]
            .filter(Boolean)
            .forEach((select) => this.updateSettingsSelectDropdownUI(select));
    }

    adjustKeyboardShortcutsForPlatform() {
        const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
        if (isMac && this.dom.settingsModal) {
            this.dom.settingsModal.querySelectorAll('.shortcut-key-ctrl').forEach((el) => {
                el.textContent = '⌘';
            });
        }
    }

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
                <button type="button" class="settings-select-dropdown-trigger" aria-haspopup="listbox" aria-controls="${escapeHtml(listId)}" aria-expanded="false"></button>
                <ul id="${escapeHtml(listId)}" class="settings-select-dropdown-list" role="listbox" tabindex="-1" hidden>
                    ${Array.from(select.options).map((option) => `<li role="option" aria-selected="false"><button type="button" class="settings-select-dropdown-option" data-value="${escapeHtml(option.value)}">${escapeHtml(option.textContent || '')}</button></li>`).join('')}
                </ul>
            `;

            select.insertAdjacentElement('afterend', dropdown);
            select.dataset.customDropdownInit = 'true';
            this.updateSettingsSelectDropdownUI(select);

            select.addEventListener('change', () => {
                this.updateSettingsSelectDropdownUI(select);
            });
        });
    }

    getSettingsSelectDropdown(select) {
        if (!select || !select.parentElement) {
            return null;
        }

        return select.parentElement.querySelector(`.settings-select-dropdown[data-select-id="${select.id}"]`);
    }

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
    }

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
                this.resetCustomDropdownPosition(list);
            }
        });
    }

    resetCustomDropdownPosition(list) {
        if (!list) {
            return;
        }

        list.style.position = '';
        list.style.left = '';
        list.style.right = '';
        list.style.top = '';
        list.style.bottom = '';
        list.style.width = '';
        list.style.minWidth = '';
        list.style.maxWidth = '';
        list.classList.remove('opens-upward', 'opens-leftward');
    }

    positionCustomDropdownList(trigger, list) {
        if (!trigger || !list || list.hidden) {
            return;
        }

        const viewport = window.visualViewport;
        const viewportLeft = viewport?.offsetLeft ?? 0;
        const viewportTop = viewport?.offsetTop ?? 0;
        const viewportWidth = viewport?.width ?? window.innerWidth;
        const viewportHeight = viewport?.height ?? window.innerHeight;
        const padding = 8;
        const gap = 6;

        this.resetCustomDropdownPosition(list);

        list.style.position = 'fixed';
        list.style.right = 'auto';
        list.style.bottom = 'auto';

        const triggerRect = trigger.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        const listWidth = Math.min(
            listRect.width || triggerRect.width,
            Math.max(triggerRect.width, viewportWidth - padding * 2)
        );
        const listHeight = listRect.height || 0;
        const viewportRight = viewportLeft + viewportWidth;
        const viewportBottom = viewportTop + viewportHeight;

        let left = triggerRect.left;
        let top = triggerRect.bottom + gap;
        const opensLeftward = left + listWidth + padding > viewportRight;
        if (opensLeftward) {
            left = triggerRect.right - listWidth;
        }

        left = Math.max(viewportLeft + padding, Math.min(left, viewportRight - listWidth - padding));

        const spaceBelow = viewportBottom - triggerRect.bottom - gap - padding;
        const spaceAbove = triggerRect.top - viewportTop - gap - padding;
        const opensUpward = listHeight > spaceBelow && spaceAbove > spaceBelow;
        if (opensUpward) {
            top = triggerRect.top - listHeight - gap;
        }

        if (opensUpward && top < viewportTop + padding) {
            top = viewportTop + padding;
        } else if (!opensUpward && top + listHeight + padding > viewportBottom) {
            top = Math.max(viewportTop + padding, viewportBottom - listHeight - padding);
        }

        list.style.left = `${left}px`;
        list.style.top = `${top}px`;
        list.style.width = `${listWidth}px`;
        list.style.minWidth = `${Math.min(triggerRect.width, listWidth)}px`;
        list.style.maxWidth = `${viewportWidth - padding * 2}px`;
        list.classList.toggle('opens-leftward', opensLeftward);
        list.classList.toggle('opens-upward', opensUpward);
    }

    positionOpenCustomDropdowns() {
        document.querySelectorAll('.file-type-dropdown-trigger[aria-expanded="true"]').forEach((trigger) => {
            const list = trigger.closest('.file-type-dropdown')?.querySelector('.file-type-dropdown-list');
            if (list) {
                this.positionCustomDropdownList(trigger, list);
            }
        });

        document.querySelectorAll('.settings-select-dropdown-trigger[aria-expanded="true"]').forEach((trigger) => {
            const list = trigger.closest('.settings-select-dropdown')?.querySelector('.settings-select-dropdown-list');
            if (list) {
                this.positionCustomDropdownList(trigger, list);
            }
        });

        if (this.dom.mainHtmlDropdownTrigger?.getAttribute('aria-expanded') === 'true' && this.dom.mainHtmlDropdownList) {
            this.positionCustomDropdownList(this.dom.mainHtmlDropdownTrigger, this.dom.mainHtmlDropdownList);
        }
    }

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
            this.positionCustomDropdownList(trigger, list);
            const selectedOption = dropdown.querySelector('.settings-select-dropdown-option.is-selected')
                || dropdown.querySelector('.settings-select-dropdown-option');
            selectedOption?.focus();
        } else {
            this.resetCustomDropdownPosition(list);
        }
    }

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
    }

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
    }

    getAllEditors() {
        const editors = Object.values(this.state.editors || {}).filter(Boolean);
        this.state.files.forEach(file => {
            if (file.editor) editors.push(file.editor);
        });
        if (this.state.codeModalEditor) editors.push(this.state.codeModalEditor);
        return editors;
    }

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
    }

    applyEditorSettingsToAllEditors() {
        this.getAllEditors().forEach((editor) => this.applySettingsToEditor(editor));
    }

    isSettingsModalOpen() {
        return !!(this.dom.settingsModal && this.dom.settingsModal.getAttribute('aria-hidden') === 'false');
    }

    toggleSettingsModal(forceOpen = null) {
        if (!this.dom.settingsModal) return;
        const isOpen = this.isSettingsModalOpen();
        const shouldOpen = forceOpen === null ? !isOpen : !!forceOpen;
        this.dom.settingsModal.setAttribute('aria-hidden', String(!shouldOpen));
        this.dom.settingsModal.hidden = !shouldOpen;

        if (!shouldOpen) {
            this.closeAllSettingsSelectDropdowns();
            this.hideSettingsTooltip();
        }

        this.updateDockDividerVisibility();
        this.updateBackgroundScrollLock();
    }

    // ============================================================================
    // SETTINGS HELP TOOLTIPS
    // ============================================================================
    settingsHelpData = {
        'line-numbers': {
            title: 'Line Numbers',
            what: 'Displays numbers along the side of the editor code window.',
            means: 'Helps you keep track of which line of code you are looking at or editing.',
            does: 'Shows line numbers on the left edge of each file when enabled, and hides them when disabled.'
        },
        'line-wrap': {
            title: 'Line Wrap',
            what: 'Automatic text wrapping.',
            means: 'Wraps long lines of code to the next line so they fit within the editor window.',
            does: 'Prevents horizontal scrolling. If enabled, long lines wrap down; if disabled, lines continue off-screen to the right.'
        },
        'font-size': {
            title: 'Font Size',
            what: 'Editor text size.',
            means: 'The visual scale of the characters in the editor.',
            does: 'Increases or decreases text readability. Changing this updates how large the code text appears immediately.'
        },
        'editor-theme': {
            title: 'Editor Theme',
            what: 'Syntax color scheme.',
            means: 'The color palette used for highlighting different code elements (keywords, strings, variables).',
            does: 'Changes the editor\'s visual style. Choose a theme that is comfortable for your eyes in different lighting.'
        },
        'tab-size': {
            title: 'Tab Size',
            what: 'Indentation spacing.',
            means: 'The number of space characters that a single press of the Tab key represents.',
            does: 'Controls code alignment. You can set it to 2, 4, or 8 spaces depending on your coding style preference.'
        },
        'indent-with-tabs': {
            title: 'Indent with Tabs',
            what: 'Tab character indentation.',
            means: 'Using physical Tab characters instead of spaces for indenting code.',
            does: 'Saves a Tab character rather than spaces. When enabled, pressing Tab inserts a literal tab; when disabled, it inserts spaces.'
        },
        'auto-close-brackets': {
            title: 'Auto-Close Brackets',
            what: 'Automatic character pairing.',
            means: 'Automatically inserting the matching closing character when you type an opening bracket, quote, or parenthesis.',
            does: 'Speeds up coding and prevents syntax errors by ensuring brackets (e.g., (, [, {, ") are always closed.'
        },
        'match-brackets': {
            title: 'Match Brackets',
            what: 'Bracket highlight helper.',
            means: 'Visually highlighting the corresponding matching bracket when the cursor is next to one.',
            does: 'Helps you navigate code structure. Moving your cursor next to a bracket (like }) instantly highlights its partner (like {).'
        }
    };

    showSettingsTooltip(btn, pinned = false) {
        if (!this.dom.settingsTooltip) return;

        const settingKey = btn.dataset.settingHelp;
        const helpData = this.settingsHelpData[settingKey];
        if (!helpData) return;

        // Check if it's already showing this one and pinned state matches or increases
        if (this.state.settingsTooltip.activeBtn === btn && (pinned ? this.state.settingsTooltip.isPinned : true)) {
            // Already showing, just update pinned status if it was increased to true
            if (pinned && !this.state.settingsTooltip.isPinned) {
                this.state.settingsTooltip.isPinned = true;
                btn.classList.add('is-active');
                btn.setAttribute('aria-expanded', 'true');
            }
            return;
        }

        // Clear active class from previous button
        if (this.state.settingsTooltip.activeBtn) {
            this.state.settingsTooltip.activeBtn.classList.remove('is-active');
            this.state.settingsTooltip.activeBtn.setAttribute('aria-expanded', 'false');
        }

        this.state.settingsTooltip.activeBtn = btn;
        this.state.settingsTooltip.isPinned = pinned;

        btn.classList.toggle('is-active', pinned);
        btn.setAttribute('aria-expanded', 'true');

        // Fill content using escapeHtml helper
        this.dom.settingsTooltip.innerHTML = `
            <div class="settings-tooltip-title">${escapeHtml(helpData.title)}</div>
            <div class="settings-tooltip-row">
                <span class="settings-tooltip-label">What it is:</span>
                <span class="settings-tooltip-desc">${escapeHtml(helpData.what)}</span>
            </div>
            <div class="settings-tooltip-row">
                <span class="settings-tooltip-label">What it means:</span>
                <span class="settings-tooltip-desc">${escapeHtml(helpData.means)}</span>
            </div>
            <div class="settings-tooltip-row">
                <span class="settings-tooltip-label">What it does:</span>
                <span class="settings-tooltip-desc">${escapeHtml(helpData.does)}</span>
            </div>
        `;

        this.dom.settingsTooltip.hidden = false;
        this.dom.settingsTooltip.setAttribute('aria-hidden', 'false');

        // Position tooltip
        this.positionSettingsTooltip(btn);
    }

    positionSettingsTooltip(btn) {
        if (!this.dom.settingsTooltip || !this.dom.settingsModal) return;

        const btnRect = btn.getBoundingClientRect();
        const modalContent = this.dom.settingsModal.querySelector('.settings-modal-content');
        if (!modalContent) return;

        const parentRect = modalContent.getBoundingClientRect();
        const tooltipRect = this.dom.settingsTooltip.getBoundingClientRect();

        const tooltipWidth = tooltipRect.width || 280;
        const tooltipHeight = tooltipRect.height || 180;
        const parentWidth = parentRect.width;

        // Button center relative to settings-modal-content
        const btnCenterRelativeX = btnRect.left - parentRect.left + btnRect.width / 2;
        const btnTopRelativeY = btnRect.top - parentRect.top;

        // Ideal left position for the tooltip (centered on the button)
        let tooltipLeft = btnCenterRelativeX - tooltipWidth / 2;
        
        // Prevent going off-screen / off-modal boundaries (with 12px padding)
        const minLeft = 12;
        const maxLeft = Math.max(minLeft, parentWidth - tooltipWidth - 12);
        
        if (tooltipLeft < minLeft) {
            tooltipLeft = minLeft;
        } else if (tooltipLeft > maxLeft) {
            tooltipLeft = maxLeft;
        }

        // Calculate arrow offset relative to the tooltip box
        const arrowLeft = btnCenterRelativeX - tooltipLeft;

        // Position the tooltip box
        this.dom.settingsTooltip.style.left = `${tooltipLeft}px`;
        
        // Check if there is enough space above the button.
        // If the button is too close to the top of the modal content, we can position the tooltip below the button.
        const spaceAbove = btnTopRelativeY;
        const threshold = tooltipHeight + 16; // height + spacing
        
        if (spaceAbove < threshold) {
            // Position below the button
            this.dom.settingsTooltip.style.top = `${btnTopRelativeY + btnRect.height + 8}px`;
            this.dom.settingsTooltip.classList.add('position-below');
            this.dom.settingsTooltip.classList.remove('position-above');
        } else {
            // Position above the button
            this.dom.settingsTooltip.style.top = `${btnTopRelativeY - 8}px`;
            this.dom.settingsTooltip.classList.add('position-above');
            this.dom.settingsTooltip.classList.remove('position-below');
        }

        // Set the arrow variable
        this.dom.settingsTooltip.style.setProperty('--arrow-left', `${arrowLeft}px`);
    }

    hideSettingsTooltip() {
        if (!this.dom.settingsTooltip) return;

        // Clear active class from button
        if (this.state.settingsTooltip.activeBtn) {
            this.state.settingsTooltip.activeBtn.classList.remove('is-active');
            this.state.settingsTooltip.activeBtn.setAttribute('aria-expanded', 'false');
        }

        this.state.settingsTooltip.activeBtn = null;
        this.state.settingsTooltip.isPinned = false;

        this.dom.settingsTooltip.hidden = true;
        this.dom.settingsTooltip.setAttribute('aria-hidden', 'true');
    }

    toggleSettingsTooltip(btn) {
        const isCurrent = this.state.settingsTooltip.activeBtn === btn;
        const isPinned = this.state.settingsTooltip.isPinned;

        if (isCurrent && isPinned) {
            this.hideSettingsTooltip();
        } else {
            this.showSettingsTooltip(btn, true);
        }
    }

    updatePreviewViewportHeight() {
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        document.documentElement.style.setProperty('--preview-viewport-height', `${viewportHeight}px`);
    }

    getAvailableEditorWidth() {
        if (!this.state.isPreviewDocked || this.state.previewDockOrientation !== 'right') {
            return this.getViewportWidth();
        }

        return this.getViewportWidth() - this.getDockSizePx('right');
    }

    updateAdaptiveLayoutMode() {
        const availableWidth = this.getAvailableEditorWidth();
        const isCompact = availableWidth <= 900;
        document.body.classList.toggle('compact-editor-layout', isCompact);
    }

    updateDockedModalCompactModes() {
        const previewIsNarrow = this.isMobileViewport()
            || (this.state.isPreviewDocked
                && this.state.previewDockOrientation === 'right'
                && this.getDockSizePx('right') <= 460);
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
    }

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
    }

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
    }

    isMobileViewport() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    isCompactEditorViewport() {
        return this.getAvailableEditorWidth() <= 768;
    }

    canDockCodeModalLeft() {
        return this.state.isPreviewDocked
            && this.dom.modalOverlay?.getAttribute('aria-hidden') === 'false';
    }

    isPreviewDockedBottom() {
        return this.state.previewDockOrientation === 'bottom';
    }

    isCodeModalCurrentlyDocked() {
        return this.dom.codeModal?.classList.contains('is-docked-left');
    }

    setCodeModalDockedState(shouldDock) {
        if (!this.dom.codeModal) return;
        this.dom.codeModal.classList.toggle('is-docked-left', !!shouldDock);
    }

    getCodeModalDockButtonText(isDockedLeft = this.state.isCodeModalDockedLeft) {
        const isBottomDock = this.isPreviewDockedBottom();
        if (isBottomDock) {
            return isDockedLeft ? 'Undock' : 'Dock Above';
        }
        return isDockedLeft ? 'Undock Left' : 'Dock Left';
    }

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
    }

    applyCodeModalDockLayout() {
        const shouldDockLeft = this.canDockCodeModalLeft() && this.state.isCodeModalDockedLeft;
        this.setCodeModalDockedState(shouldDockLeft);
    }

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
    }

    getCurrentCodeModalFileName(fallbackName = '') {
        return fallbackName
            || this.state.currentCodeModalSource?.querySelector('.file-name-input')?.value
            || 'Code';
    }

    getCodeModalFileMeta(fileName = null) {
        const sourceFileId = this.state.currentCodeModalSource?.dataset?.fileId;
        const fileInfo = this.state.files.find(file => file.id === sourceFileId);
        if (!fileInfo) return '';

        const displayFileName = this.getCurrentCodeModalFileName(fileName || '');
        const content = fileInfo.editor?.getValue?.() ?? fileInfo.content ?? '';
        const metaParts = [formatFileSize(new Blob([content]).size)];

        if (this.isTextFileType(fileInfo)) {
            const lineCount = getLineCount(content);
            metaParts.push(`${lineCount} line${lineCount === 1 ? '' : 's'}`);
        }

        return `${displayFileName} • ${metaParts.join(' • ')}`;
    }

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

    }

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
    }

    isExternalImportSpecifier(specifier) {
        return /^(?:[a-z][a-z\d+.-]*:|\/\/|data:|blob:|#)/i.test(specifier || '');
    }

    shouldRewriteImportSpecifier(specifier) {
        if (typeof specifier !== 'string' || !specifier.trim()) return false;
        if (this.isExternalImportSpecifier(specifier)) return false;
        return specifier.startsWith('.') || specifier.startsWith('/');
    }

    toVirtualModuleSpecifier(path) {
        const normalized = String(path || '').replace(/^\/+/, '');
        return `@preview/${normalized}`;
    }

    normalizeModuleSpecifier(specifier, currentFilePath) {
        if (!this.shouldRewriteImportSpecifier(specifier)) return specifier;
        const suffixMatch = specifier.match(/([?#].*)$/);
        const suffix = suffixMatch ? suffixMatch[1] : '';
        const specifierPath = suffix ? specifier.slice(0, -suffix.length) : specifier;
        const resolvedPath = specifierPath.startsWith('/')
            ? specifierPath.slice(1)
            : this.fileSystemUtils.resolvePath(currentFilePath, specifierPath);
        return this.toVirtualModuleSpecifier(resolvedPath) + suffix;
    }

    rewriteModuleSpecifiers(content, currentFilePath = 'index.html') {
        if (typeof content !== 'string' || !content) return content;
        const replaceSpecifier = (specifier) => this.normalizeModuleSpecifier(specifier, currentFilePath);

        let rewritten = content.replace(/((?:import|export)\s+[\s\S]*?\s+from\s*)(["'])([^"']+)(\2)/g, (match, before, quote, specifier) => {
            return `${before}${quote}${replaceSpecifier(specifier)}${quote}`;
        });

        rewritten = rewritten.replace(/(import\s*\(\s*)(["'])([^"']+)(\2\s*\))/g, (match, before, quote, specifier, after) => {
            return `${before}${quote}${replaceSpecifier(specifier)}${after}`;
        });

        return rewritten;
    }

    createRewrittenModuleBlobUrl(fileContent, modulePath) {
        const cached = this.state.previewBlobUrlCache.get(modulePath);
        if (cached) return cached;
        const rewrittenContent = this.rewriteModuleSpecifiers(fileContent || '', modulePath);
        const moduleBlob = new Blob([rewrittenContent], { type: 'text/javascript' });
        const moduleUrl = URL.createObjectURL(moduleBlob);
        this.state.previewAssetUrls.add(moduleUrl);
        this.state.previewBlobUrlCache.set(modulePath, moduleUrl);
        return moduleUrl;
    }

    buildModuleImportMap(fileSystem) {
        if (!(fileSystem instanceof Map) || fileSystem.size === 0) return null;

        const imports = {};
        for (const [path, file] of fileSystem.entries()) {
            if (!file || file.isBinary || (file.type !== 'javascript' && file.type !== 'javascript-module')) {
                continue;
            }

            const moduleUrl = this.createRewrittenModuleBlobUrl(file.content, path);
            imports[this.toVirtualModuleSpecifier(path)] = moduleUrl;
        }

        return Object.keys(imports).length > 0 ? imports : null;
    }

    createModuleAssetUrl(fileSystem, modulePath) {
        if (!modulePath || !(fileSystem instanceof Map)) return null;
        const file = this.fileSystemUtils.findFile(fileSystem, modulePath);
        if (!file || file.isBinary || (file.type !== 'javascript' && file.type !== 'javascript-module')) {
            return null;
        }

        return this.createRewrittenModuleBlobUrl(file.content, modulePath);
    }

    buildModuleImportMapScript(fileSystem) {
        const imports = this.buildModuleImportMap(fileSystem);
        if (!imports) return '';
        return `<script type="importmap">${JSON.stringify({ imports })}</script>`;
    }

    detectFileTypeForFilename(filename, content = null, mimeType = '', currentType = '') {
        const extensionType = this.fileTypeUtils.getTypeFromExtension(filename);

        if (extensionType === 'javascript' || extensionType === 'javascript-module') {
            return this.fileTypeUtils.detectJavaScriptType(content, filename, mimeType);
        }

        if (extensionType !== 'binary') {
            return extensionType;
        }

        return currentType || 'binary';
    }

    getFileNameFromPanel(fileId) {
        const panel = this.getEditorPanel(fileId);
        if (panel) {
            const nameInput = panel.querySelector('.file-name-input');
            return nameInput ? nameInput.value : null;
        }
        return null;
    }

    /**
     * Get the folder path from a full file path
     * @param {string} path - Full file path like "src/components/Button.js"
     * @returns {string} Folder path like "src/components" or "" for root
     */
    getFolderFromPath(path) {
        if (!path || !path.includes('/')) return '';
        return path.substring(0, path.lastIndexOf('/'));
    }

    /**
     * Get the filename from a full file path
     * @param {string} path - Full file path like "src/components/Button.js"
     * @returns {string} Just the filename like "Button.js"
     */
    getFilenameFromPath(path) {
        if (!path) return 'unnamed';
        if (!path.includes('/')) return path;
        return path.substring(path.lastIndexOf('/') + 1);
    }

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
    }

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
    }

    /**
     * Add a new folder
     */
    async addNewFolder() {
        const folderName = await this.showPromptDialog('New Folder', 'Enter folder name:');
        if (!folderName) return;
        this.createFolderPath(folderName);
    }

    /**
     * Add a new file within a specific folder
     * @param {string} folderPath - The folder path to add the file in
     */
    async addFileToFolder(folderPath) {
        await this.addNewFile(folderPath);
    }

    normalizeFolderPath(folderPath) {
        return (folderPath || '').trim().replace(/^\/+|\/+$/g, '');
    }

    sanitizeFolderPathInput(folderPath) {
        const normalizedPath = this.normalizeFolderPath(folderPath);
        if (!normalizedPath) return '';

        return normalizedPath
            .split('/')
            .map(segment => segment.trim().replace(/[<>:\"|?*]/g, ''))
            .filter(Boolean)
            .join('/');
    }

    getFilePathById(fileId) {
        const fileInfo = this.state.files.find(file => file.id === fileId);
        if (!fileInfo) return '';
        return this.getFileNameFromPanel(fileId) || fileInfo.fileName || '';
    }

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
    }

    async moveFileToFolder(fileId, destinationFolderPath) {
        const fileInfo = this.state.files.find(file => file.id === fileId);
        if (!fileInfo) return;

        const panel = this.getEditorPanel(fileId);
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
    }

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
    }

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
    }

    /**
     * Close all open file panels in a folder
     * @param {string} folderPath - Folder whose open file panels should be closed
     */
    closeFolderPanels(folderPath) {
        const openFileIds = this.getFileIdsInFolder(folderPath)
            .filter(fileId => this.state.openPanels.has(fileId));

        if (openFileIds.length === 0) return;

        openFileIds.forEach(fileId => {
            const panel = this.getEditorPanel(fileId);
            if (panel) {
                panel.style.display = 'none';
            }
            this.state.openPanels.delete(fileId);
        });

        this.renderFileTree();
        this.updatePanelMoveButtonsVisibility();
        this.updatePreviewActionButtons();
    }

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
    }

    /**
     * Clear sidebar selections for files and folders
     */
    clearSidebarSelection() {
        this.state.selectedFileIds.clear();
        this.state.selectedFolderPaths.clear();
    }

    focusSidebarSearch() {
        const searchInput = this.dom.fileTreeContainer?.querySelector('.file-tree-search-input');
        if (!searchInput) return;

        searchInput.focus();
        searchInput.select();
    }

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
                ${treeHtml || `<div class="file-tree-empty">${this.state.sidebarSearchQuery ? 'No matching files found. Try a different search.' : 'No files yet. Click <strong>+ Add File</strong> to get started.'}</div>`}
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
    }

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
    }

    renderFileTreeToolbar(tree) {
        const hasSelection = this.state.selectedFileIds.size > 0 || this.state.selectedFolderPaths.size > 0;
        const fileCount = this.countFilesInTree(tree);
        const searchIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="0.85em" height="0.85em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="6.5" r="4"/><line x1="10" y1="10" x2="14" y2="14"/></svg>';
        const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
        const shortcutHint = isMac ? '⌘K' : 'Ctrl+K';

        return `
            <div class="file-tree-toolbar">
                <div class="file-tree-search-wrap">
                    <span class="file-tree-search-icon" aria-hidden="true">${searchIcon}</span>
                    <input
                        type="search"
                        class="file-tree-search-input"
                        placeholder="Search files…"
                        value="${escapeHtml(this.state.sidebarSearchQuery)}"
                        aria-label="Search files in sidebar"
                    >
                    <span class="file-tree-search-hint" aria-hidden="true">${shortcutHint}</span>
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
    }

    countFilesInTree(node) {
        const childCount = Object.values(node.children).reduce((total, childNode) => total + this.countFilesInTree(childNode), 0);
        return node.files.length + childCount;
    }

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
                        <input type="checkbox" class="tree-folder-checkbox" aria-label="Select folder ${escapeHtml(folderPath)}" ${isFolderSelected ? 'checked' : ''}>
                        <span class="folder-icon">${isExpanded ? SVG_ICONS.folderOpen : SVG_ICONS.folder}</span>
                        <span class="folder-name">${escapeHtml(folderName)}</span>
                        <div class="folder-actions">
                            ${hasOpenFolderPanels
                                ? `<button class="close-folder-panels-btn" title="${escapeHtml(closeFolderPanelsLabel)}" aria-label="${escapeHtml(closeFolderPanelsLabel)}">${closeFolderPanelsIcon}</button>`
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
                    <input type="checkbox" class="tree-file-checkbox" aria-label="Select file ${escapeHtml(file.displayName)}" ${isSelected ? 'checked' : ''}>
                    <span class="file-icon">${fileIcon}</span>
                    <span class="file-name">${escapeHtml(file.displayName)}</span>
                    <div class="file-actions">
                        <button class="open-file-btn" title="${isOpen ? 'Focus file' : 'Open file'}" aria-label="${isOpen ? 'Focus file' : 'Open file'}">${isOpen ? SVG_ICONS.eye : SVG_ICONS.pencil}</button>
                        <button class="move-file-btn" title="Move file" aria-label="Move file">${SVG_ICONS.move}</button>
                        <button class="delete-file-btn" title="Delete file" aria-label="Delete file">${SVG_ICONS.trash}</button>
                    </div>
                </div>
            `;
        });

        return html;
    }

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
    }

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
    }

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
            const panel = this.getEditorPanel(file.id);
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
    }

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
        
        const panel = this.getEditorPanel(fileId);
        this.bindFilePanelEvents(panel);
        if (panel) {
            this.setActiveEditorPanel(panel);
        }
        
        this.refreshPanelAndFileTreeUI();
    }

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
    }

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
    }

    findFileByPath(path, excludeFileId = null) {
        return this.state.files.find(file => {
            if (excludeFileId && file.id === excludeFileId) return false;
            return this.getFilePathById(file.id) === path;
        });
    }

    generateRenamedFilePath(path, excludeFileId = null) {
        const folderPath = this.getFolderFromPath(path);
        const filename = this.getFilenameFromPath(path);
        const extension = this.fileTypeUtils.getExtension(filename);
        const baseName = extension ? filename.slice(0, -(extension.length + 1)) : filename;

        let suffix = 1;
        const MAX_RENAME_ATTEMPTS = 1000;
        while (suffix <= MAX_RENAME_ATTEMPTS) {
            const candidateName = extension
                ? `${baseName}(${suffix}).${extension}`
                : `${baseName}(${suffix})`;
            const candidatePath = folderPath ? `${folderPath}/${candidateName}` : candidateName;
            if (!this.findFileByPath(candidatePath, excludeFileId)) {
                return candidatePath;
            }
            suffix++;
        }
        throw new Error(`Unable to generate unique filename after ${MAX_RENAME_ATTEMPTS} attempts`);
    }

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
    }

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
    }


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
    }

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
    }

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
    }

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
    }

    normalizeImportPath(path) {
        return String(path || '').trim().replace(/^\/+/, '');
    }

    getEffectiveHomeFolderForImports(paths) {
        const normalizedPaths = paths
            .map((path) => this.normalizeImportPath(path))
            .filter(Boolean);

        if (normalizedPaths.some((path) => this.getFolderFromPath(path) === '')) {
            return '';
        }

        const topLevelFolders = new Set();
        normalizedPaths.forEach((path) => {
            if (!path.includes('/')) return;
            const topLevelFolder = path.split('/')[0];
            if (topLevelFolder) {
                topLevelFolders.add(topLevelFolder);
            }
        });

        if (topLevelFolders.size !== 1) {
            return null;
        }

        const [effectiveHomeFolder] = topLevelFolders;
        return effectiveHomeFolder;
    }

    shouldAutoOpenImportedPanel(fileName, pendingFilePaths = []) {
        const normalizedFileName = this.normalizeImportPath(fileName);
        if (!normalizedFileName) return false;

        const folderPath = this.getFolderFromPath(normalizedFileName);
        if (folderPath === '') {
            return true;
        }

        const existingFilePaths = this.state.files.map((file) =>
            this.getFileNameFromPanel(file.id) || file.fileName || ''
        );
        const effectiveHomeFolder = this.getEffectiveHomeFolderForImports([
            ...existingFilePaths,
            ...pendingFilePaths,
            normalizedFileName
        ]);

        return effectiveHomeFolder !== null && folderPath === effectiveHomeFolder;
    }

    /**
     * Determines if a file path should be ignored during import (e.g., development files/folders).
     * @param {string} path - The relative path of the file to check
     * @returns {boolean} True if the path should be ignored
     */
    _shouldIgnoreImportPath(path) {
        if (!path) return false;
        
        const segments = path.split(/[/\\]/);
        const ignoredFolders = new Set(['.git', 'node_modules', '.idea', '.vscode', '.github', '.svn', '.hg', 'cvs']);
        const ignoredFiles = new Set(['.ds_store', 'thumbs.db', '.gitignore', '.gitattributes', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']);
        
        return segments.some((segment, index) => {
            const lowerSegment = segment.toLowerCase();
            // Check if it's an ignored folder (any segment except the last one if it's just a filename)
            if (index < segments.length - 1 && ignoredFolders.has(lowerSegment)) {
                return true;
            }
            // Check if the last segment is an ignored file or folder
            if (index === segments.length - 1) {
                return ignoredFiles.has(lowerSegment) || ignoredFolders.has(lowerSegment);
            }
            return false;
        });
    }

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

        const importedFileNames = [];

        for (const file of files) {
            processedCount++;
            const targetFileName = getFileName(file);
            
            if (this._shouldIgnoreImportPath(targetFileName)) {
                skippedCount++;
                continue;
            }

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
            const detectedType = this.detectFileTypeForFilename(result.fileName, fileData.isBinary ? null : fileData.content, file.type);
            this.addNewFileWithContent(result.fileName, detectedType, fileData.content, fileData.isBinary, {
                autoOpenPanel: this.shouldAutoOpenImportedPanel(result.fileName, importedFileNames)
            });
            importedFileNames.push(result.fileName);
            importedCount++;
        }

        if (progress) {
            progress.complete('Import complete.');
        }

        this._showImportSummary(importedCount, skippedCount, successMessage);
    }

    importFile() {
        this._openFilePicker('*/*', true, async (fileList) => {
            await this._importFiles(fileList, (file) => file.name);
        });
    }

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
    }

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
    }

    addNewFileWithContent(fileName, fileType, content, isBinary = false, options = {}) {
        const { autoOpenPanel = true } = options;
        const fileId = `file-${this.state.nextFileId++}`;
        
        // Automatically create folder if file has path
        const folderPath = this.getFolderFromPath(fileName);
        if (folderPath) {
            this.ensureFolderExists(folderPath);
        }
        
        this.createFilePanel(fileId, fileName, fileType, content, isBinary);
        
        let newEditor;
        
        if (this.fileTypeUtils.isEditableType(fileType)) {
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
        
        if (autoOpenPanel) {
            // Mark panel as open
            this.state.openPanels.add(fileId);
        }
        
        const createdPanel = this.getEditorPanel(fileId);
        if (!autoOpenPanel && createdPanel) {
            createdPanel.style.display = 'none';
        }

        this.bindFilePanelEvents(createdPanel);
        if (autoOpenPanel && createdPanel) {
            this.setActiveEditorPanel(createdPanel);
        }
        
        this.refreshPanelAndFileTreeUI();
    }

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
    }

    /**
     * Returns the static list of supported file-type choices.
     * The array is defined once and shared; callers must not mutate it.
     * @returns {ReadonlyArray<{value: string, label: string, icon: string}>}
     */
    getFileTypeChoices() {
        return CodePreviewer._FILE_TYPE_CHOICES;
    }

    getFileTypeChoice(fileType) {
        return this.getFileTypeChoices().find(type => type.value === fileType) || null;
    }

    getFileTypeChoiceLabel(fileType) {
        const choice = this.getFileTypeChoice(fileType);
        return choice ? choice.label : 'Text';
    }

    renderFileTypeOptionLabel(choice) {
        const icon = choice.icon || SVG_ICONS.document;
        const label = escapeHtml(choice.label);
        return `<span class="file-type-option-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
    }

    generateFileTypeOptions(selectedType) {
        return this.getFileTypeChoices().map(type =>
            `<option value="${type.value}" ${selectedType === type.value ? 'selected' : ''}>${type.label}</option>`
        ).join('');
    }

    generateFileTypeDropdownOptions(selectedType) {
        return this.getFileTypeChoices().map(type => {
            const selectedClass = selectedType === type.value ? ' is-selected' : '';
            const selectedState = selectedType === type.value ? 'true' : 'false';
            return `<li role="option" aria-selected="${selectedState}"><button type="button" class="file-type-dropdown-option${selectedClass}" data-value="${escapeHtml(type.value)}">${this.renderFileTypeOptionLabel(type)}</button></li>`;
        }).join('');
    }

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
    }

    createFilePanel(fileId, fileName, fileType, content, isBinary) {
        const fileTypeOptions = this.generateFileTypeOptions(fileType);
        const fileTypeDropdownOptions = this.generateFileTypeDropdownOptions(fileType);
        const escapedFileName = escapeHtml(fileName);
        
        const panelHTML = `
            <div class="editor-panel" data-file-type="${fileType}" data-file-id="${fileId}">
                <div class="panel-header">
                    <div class="panel-move-controls" aria-label="Move panel">
                    <button class="move-panel-btn" data-direction="left" aria-label="Move panel left" title="Move left">←</button>
                    <button class="move-panel-btn" data-direction="right" aria-label="Move panel right" title="Move right">→</button>
                </div>
                    <input type="text" class="file-name-input" value="${escapedFileName}" aria-label="File name">
                    <div class="file-type-dropdown" data-file-type-dropdown>
                        <button type="button" class="file-type-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">${escapeHtml(this.getFileTypeChoiceLabel(fileType))}</button>
                        <ul class="file-type-dropdown-list" role="listbox" tabindex="-1" hidden>
                            ${fileTypeDropdownOptions}
                        </ul>
                        <select class="file-type-selector visually-hidden-select" aria-label="File type">
                            ${fileTypeOptions}
                        </select>
                    </div>
                    <button class="remove-file-btn" aria-label="Close panel" title="Close panel (file stays in sidebar)">${SVG_ICONS.close}</button>
                </div>
                ${this.generateToolbarHTML(fileType)}
                <label for="${fileId}" class="sr-only">${this.getFileTypeLabel(fileType)}</label>
                <div class="editor-wrapper">
                    ${this.generateFileContentDisplay(fileId, fileType, content, isBinary)}
                </div>
            </div>
        `;
        
        this.dom.editorGrid.insertAdjacentHTML('beforeend', panelHTML);
    }

    createEditorForTextarea(textarea, fileType, isBinary = false) {
        if (typeof window.CodeMirror !== 'undefined' && textarea) {
            const mode = this.fileTypeUtils.getCodeMirrorMode(fileType);
            
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
            return createMockEditor(textarea, this.state.settings.fontSize);
        }
        
        return null;
    }

    generateToolbarHTML(fileType) {
        const isEditable = this.fileTypeUtils.isEditableType(fileType);
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

        if (fileType === 'svg') {
            toolbarHTML += this.htmlGenerators.toolbarButton(SVG_ICONS.expand, 'View', 'view-svg-btn', 'View rendered SVG image', 'View');
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
    }

    hasExpandPreview(fileType) {
        return this.fileTypeUtils.isPreviewableType(fileType);
    }

    getFileTypeLabel(fileType) {
        return `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} ${this.fileTypeUtils.isEditableType(fileType) ? 'Editor' : 'Viewer'}`;
    }

    generateFileContentDisplay(fileId, fileType, content, isBinary) {
        if (this.fileTypeUtils.isEditableType(fileType)) {
            return `<textarea id="${fileId}"></textarea>`;
        }

        return this.htmlGenerators.filePreview(fileType, this.getFilePanelPreviewContent(fileId, fileType, content, isBinary));
    }


    isTextFileType(fileInfo) {
        if (!fileInfo || fileInfo.isBinary) return false;

        const mimeType = this.fileTypeUtils.getMimeTypeFromFileType(fileInfo.type) || '';
        return mimeType.startsWith('text/')
            || mimeType === 'application/json'
            || mimeType === 'application/xml'
            || mimeType.endsWith('+json')
            || mimeType.endsWith('+xml')
            || fileInfo.type === 'svg';
    }

    supportsFormattingForType(fileType) {
        return ['html', 'css', 'javascript', 'javascript-module', 'json', 'xml', 'svg'].includes(fileType);
    }

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
    }

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
                this.resetCustomDropdownPosition(list);
            }
        });
    }

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
    }

    applyFileTypeChange(panel, fileId, newType, contentOverride = null) {
        this.revokeFilePanelPreviewUrl(fileId);
        panel.dataset.fileType = newType;

        const fileInfo = this.state.files.find(f => f.id === fileId);
        if (fileInfo) {
            const oldType = fileInfo.type;
            fileInfo.type = newType;

            const oldIsEditable = this.fileTypeUtils.isEditableType(oldType);
            const newIsEditable = this.fileTypeUtils.isEditableType(newType);
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
                const mode = this.fileTypeUtils.getCodeMirrorMode(newType);
                fileInfo.editor.setOption('mode', mode);
                fileInfo.editor.setOption('autoCloseTags', newType === 'html');
            }
        }

        this.updatePanelFileTypeDropdownUI(panel, newType);
        this.updateToolbarForFileType(panel, newType);
        this.updateMainHtmlSelector();
        this.renderFileTree();
        this.updatePreviewActionButtons();
    }

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
                const extensionChanged = previousExtension !== nextExtension;
                const currentContent = fileInfo.isBinary ? null : (fileInfo.editor ? fileInfo.editor.getValue() : '');
                const suggestedType = this.detectFileTypeForFilename(filename, currentContent, '', typeSelector.value);
                const typeDiffers = suggestedType !== typeSelector.value;
                const shouldAutoChangeType = extensionChanged && typeDiffers;

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
                if (isOpen) {
                    this.resetCustomDropdownPosition(fileTypeDropdownList);
                } else {
                    this.positionCustomDropdownList(fileTypeTrigger, fileTypeDropdownList);
                }
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
                    this.positionCustomDropdownList(fileTypeTrigger, fileTypeDropdownList);
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
    }

    createEditorForFileType(fileInfo, fileId, fileType, content) {
        if (this.fileTypeUtils.isEditableType(fileType)) {
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
    }

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
    }

    getCurrentFileType(panel, fileInfo) {
        return panel?.dataset.fileType || fileInfo?.type || 'text';
    }

    getSavedFileType(savedState, fileInfo) {
        return savedState?.fileType || fileInfo?.type || 'text';
    }

    /**
     * Check if a file has been modified from its saved state
     * @param {string} fileId - The file ID
     * @param {HTMLElement} panel - The panel element (optional, will be found if not provided)
     * @returns {boolean} True if the file has unsaved changes
     */
    checkFileModified(fileId, panel = null) {
        if (!panel) {
            panel = this.getEditorPanel(fileId);
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
    }

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
    }

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
    }

    /**
     * Apply changes to a file (save the current state)
     * @param {string} fileId - The file ID
     */
    async applyFileChanges(fileId) {
        const panel = this.getEditorPanel(fileId);
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
    }

    /**
     * Discard changes to a file (revert to saved state)
     * @param {string} fileId - The file ID
     */
    discardFileChanges(fileId) {
        const panel = this.getEditorPanel(fileId);
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
        const savedIsEditable = this.fileTypeUtils.isEditableType(savedFileType);

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
    }

    /**
     * Set up content change listeners for a file editor
     * @param {string} fileId - The file ID
     * @param {Object} editor - The CodeMirror editor instance
     */
    setupEditorChangeListener(fileId, editor) {
        if (!editor || !editor.on) return;

        editor.on('change', (_cm, changeObj) => {
            const panel = this.getEditorPanel(fileId);
            this.checkFileModified(fileId, panel);

            const fileInfo = this.state.files.find(f => f.id === fileId);
            const fileType = fileInfo ? fileInfo.type : panel?.dataset.fileType;
            if (!fileType || !this.fileTypeUtils.isEditableType(fileType)) return;
            if (this.state.formattingEditors.has(fileId)) return;

            const origin = changeObj && changeObj.origin ? changeObj.origin : '';
            const isUserInput = ['+input', '+delete', 'paste', 'cut'].includes(origin);
            if (!isUserInput) return;

            this.schedulePreviewRefresh();
        });
    }

    /**
     * Close a file panel (hide it) - does NOT delete the file
     * @param {string} fileId - The file ID to close
     */

    schedulePreviewRefresh() {
        this.previewRenderer.scheduleRefresh();
    }

    closePanel(fileId) {
        // Use .editor-panel selector to avoid matching tree-file elements
        const panel = this.getEditorPanel(fileId);
        if (panel) {
            panel.style.display = 'none';
            this.state.openPanels.delete(fileId);
            this.renderFileTree();
            this.updatePanelMoveButtonsVisibility();
            this.updatePreviewActionButtons();

            if (fileId === this.state.activePanelId) {
                const fallback = Array.from(document.querySelectorAll('.editor-panel[data-file-id]'))
                    .find(p => this.state.openPanels.has(p.dataset.fileId));
                if (fallback) {
                    this.setActiveEditorPanel(fallback);
                } else {
                    this.clearActiveEditorPanel();
                }
            }
        }
    }

    /**
     * Open a file panel (show it) or create it if it doesn't exist
     * @param {string} fileId - The file ID to open
     */
    openPanel(fileId) {
        // Use .editor-panel selector to avoid matching tree-file elements
        const panel = this.getEditorPanel(fileId);
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
            this.setActiveEditorPanel(panel);
        }
        this.renderFileTree();
        this.updatePanelMoveButtonsVisibility();
        this.updatePreviewActionButtons();
    }

    /**
     * Delete a file completely (remove from state and DOM)
     * @param {string} fileId - The file ID to delete
     */
    deleteFile(fileId) {
        // Use .editor-panel selector to avoid matching tree-file elements
        const panel = this.getEditorPanel(fileId);
        if (panel) {
            panel.remove();
        }

        this.revokeFilePanelPreviewUrl(fileId);
        
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
        
        if (fileId === this.state.activePanelId) {
            const fallback = Array.from(document.querySelectorAll('.editor-panel[data-file-id]'))
                .find(p => this.state.openPanels.has(p.dataset.fileId));
            if (fallback) {
                this.setActiveEditorPanel(fallback);
            } else {
                this.clearActiveEditorPanel();
            }
        }

        this.refreshPanelAndFileTreeUI();
    }

    refreshPanelAndFileTreeUI() {
        document.querySelectorAll('.editor-panel[data-file-id]').forEach((panel) => {
            const { fileId } = panel.dataset;
            panel.style.display = this.state.openPanels.has(fileId) ? '' : 'none';
        });

        this.updateRemoveButtonsVisibility();
        this.updateMainHtmlSelector();
        this.renderFileTree();
        this.updatePanelMoveButtonsVisibility();
        this.updatePreviewActionButtons();
    }

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
            const panel = this.getEditorPanel(fileId);
            if (panel) {
                panel.remove();
            }
        });

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
    }

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
    }

    updateRemoveButtonsVisibility() {
        const allPanels = document.querySelectorAll('.editor-panel[data-file-id]');
        const actualPanels = Array.from(allPanels);
        
        actualPanels.forEach(panel => {
            const removeBtn = panel.querySelector('.remove-file-btn');
            if (removeBtn) {
                removeBtn.style.display = 'flex';
            }
        });
    }

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
    }

    bindToolbarEvents(panel) {
        const clearBtn = panel.querySelector('.clear-btn');
        const pasteBtn = panel.querySelector('.paste-btn');
        const copyBtn = panel.querySelector('.copy-btn');
        const formatBtn = panel.querySelector('.format-btn');
        const expandBtn = panel.querySelector('.expand-btn');
        const viewSvgBtn = panel.querySelector('.view-svg-btn');
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

        if (viewSvgBtn) {
            viewSvgBtn.addEventListener('click', () => {
                this.setActiveEditorPanel(panel);
                this.showMediaPreview(panel);
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
    }

    setActiveEditorPanel(panel) {
        if (!panel || !panel.dataset.fileId) return;
        this.state.activePanelId = panel.dataset.fileId;
        document.querySelectorAll('.editor-panel.is-active').forEach((active) => {
            if (active !== panel) active.classList.remove('is-active');
        });
        panel.classList.add('is-active');
    }

    clearActiveEditorPanel() {
        this.state.activePanelId = null;
        document.querySelectorAll('.editor-panel.is-active').forEach((active) => {
            active.classList.remove('is-active');
        });
    }

    getActiveEditorPanel() {
        if (this.state.activePanelId) {
            const panel = this.getEditorPanel(this.state.activePanelId);
            if (panel && this.state.openPanels.has(this.state.activePanelId)) {
                if (!panel.classList.contains('is-active')) {
                    panel.classList.add('is-active');
                }
                return panel;
            }
        }
        return null;
    }

    openPanelSearch(panel) {
        const { searchContainer } = this.getPanelSearchElements(panel);
        if (!searchContainer) return;
        this.setPanelSearchActive(panel, true);
    }


    formatPanelCode(panel) {
        if (!panel) return false;

        const fileId = panel.dataset.fileId;
        const fileType = panel.dataset.fileType;
        const editor = this.getEditorFromPanel(panel);
        if (!fileId || !editor || !this.fileTypeUtils.isEditableType(fileType) || !this.supportsFormattingForType(fileType)) return false;

        return this.formatEditorContent(fileId, editor, fileType, {
            preserveCursor: true,
        });
    }

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

            if (!options.silent) {
                this.showNotification('Code formatted', 'success');
            }

            const panel = this.getEditorPanel(fileId);
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
    }

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
    }

    getPanelSearchElements(panel) {
        return {
            searchContainer: panel.querySelector('.panel-search'),
            searchBtn: panel.querySelector('.search-btn'),
            searchInput: panel.querySelector('.panel-search-input'),
            searchNextBtn: panel.querySelector('.panel-search-next-btn'),
            searchCloseBtn: panel.querySelector('.panel-search-close-btn'),
        };
    }

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
    }

    togglePanelSearch(panel) {
        const { searchContainer } = this.getPanelSearchElements(panel);
        if (!searchContainer) return;

        const willOpen = searchContainer.hasAttribute('hidden');
        this.setPanelSearchActive(panel, willOpen);
    }

    closePanelSearch(panel) {
        this.setPanelSearchActive(panel, false);
    }

    getSearchStartIndex(editor, findNext) {
        if (!findNext || !editor?.getCursor || !editor?.indexFromPos) {
            return 0;
        }

        try {
            return editor.indexFromPos(editor.getCursor()) + 1;
        } catch (_e) {
            return 0;
        }
    }

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
    }
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

        const startIndex = this.getSearchStartIndex(editor, findNext);
        const matchIndex = findNextMatch(content, trimmedQuery, startIndex);

        if (matchIndex === -1) {
            if (searchInput) {
                searchInput.classList.add('no-match');
            }
            this.showNotification(`No match found for "${trimmedQuery}"`, 'info');
            return;
        }

        this.selectEditorSearchMatch(editor, matchIndex, trimmedQuery.length, findNext);
    }

    clearEditor(panel) {
        const editor = this.getEditorFromPanel(panel);
        if (editor) {
            editor.setValue('');
        }
    }

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
    }

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
    }

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
                blob = new Blob([base64ToUint8Array(base64Data)], { type: mimeType });
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
    }

    expandCode(panel) {
        const fileId = panel.dataset.fileId;
        const fileType = panel.dataset.fileType;
        
        if (!this.fileTypeUtils.isEditableType(fileType)) {
            this.showMediaPreview(panel);
            return;
        }
        
        const editor = this.getEditorFromPanel(panel);
        if (!editor) return;

        const content = editor.getValue();
        let fileName = 'Code';
        const language = this.fileTypeUtils.getCodeMirrorMode(fileType);

        const fileNameInput = panel.querySelector('.file-name-input');
        
        if (fileNameInput) {
            fileName = fileNameInput.value || 'Untitled';
        }

        this.openCodeModal(content, fileName, language, panel);
    }

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
    }

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
    }

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
    }

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
    }

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
    }


    refreshCodeModalEditor() {
        if (!(window.CodeMirror && this.state.codeModalEditor)) return;
        setTimeout(() => this.state.codeModalEditor.refresh(), 0);
    }

    getCodeModalEditorText() {
        if (window.CodeMirror && this.state.codeModalEditor) {
            return this.state.codeModalEditor.getValue();
        }

        const editorTextarea = document.getElementById('code-modal-editor');
        return editorTextarea ? editorTextarea.value : '';
    }

    openCodeModalSearch() {
        if (!this.dom.codeModalSearch || !this.dom.codeModalSearchInput) return;

        this.dom.codeModalSearch.hidden = false;
        this.dom.codeModalSearchBtn?.classList.add('active');
        this.dom.codeModalSearchBtn?.setAttribute('aria-expanded', 'true');
        this.dom.codeModalSearchInput.focus();
        this.dom.codeModalSearchInput.select();
        this.refreshCodeModalEditor();
    }

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
    }

    toggleCodeModalSearch() {
        if (!this.dom.codeModalSearch) return;

        if (this.dom.codeModalSearch.hidden) {
            this.openCodeModalSearch();
        } else {
            this.closeCodeModalSearch();
        }
    }
    searchInCodeModal(findNext = false) {
        if (!this.dom.codeModalSearchInput) return;

        const query = this.dom.codeModalSearchInput.value;
        const content = this.getCodeModalEditorText();
        this.dom.codeModalSearchInput.classList.remove('no-match');

        if (!query) {
            this.state.codeModalSearchState = { query: '', cursorIndex: -1 };
            return;
        }

        const searchState = this.state.codeModalSearchState;
        let startIndex = 0;
        if (findNext && searchState.query === query) {
            startIndex = Math.max(searchState.cursorIndex + 1, 0);
        }

        const matchIndex = findNextMatch(content, query, startIndex);

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
    }
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
    }
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
    }

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
    }

    /**
     * Displays a transient toast notification.
     * @param {string} message - The text to display
     * @param {'info'|'success'|'warn'|'error'} [type='info'] - Visual severity level
     */
    showNotification(message, type = 'info') {
        this.notificationSystem.show(message, type);
    }

    /**
     * Displays a progress notification with a live progress bar.
     * Returns a controller object with `update()`, `complete()`, `fail()`, and `dismiss()` methods.
     * @param {string} message - Initial message text
     * @param {{type?: string, total?: number}} [options={}]
     * @returns {{update: function, complete: function, fail: function, dismiss: function}}
     */
    showProgressNotification(message, options = {}) {
        return this.notificationSystem.showProgress(message, options);
    }

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
    }

    isFullHTMLDocument(content) {
        const hasDoctype = /<!doctype\s+html/i.test(content);
        const hasHtmlTag = /<html[^>]*>/i.test(content);
        const hasHeadTag = /<head[^>]*>/i.test(content);
        const hasBodyTag = /<body[^>]*>/i.test(content);
        
        return (hasDoctype && hasHtmlTag) || (hasHtmlTag && hasHeadTag && hasBodyTag);
    }

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
    }

    processHTMLScripts(htmlContent, jsFiles, moduleFiles, currentFilePath = 'index.html') {
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(`<div id="__preview-script-container">${htmlContent}</div>`, 'text/html');
        const container = parsedDoc.getElementById('__preview-script-container');
        if (!container) return htmlContent;

        container.querySelectorAll('script').forEach((scriptEl) => {
            const src = scriptEl.getAttribute('src');
            const scriptType = (scriptEl.getAttribute('type') || '').trim().toLowerCase();
            if (src) {
                const trimmedSrc = src.trim();
                const isExternal = /^(https?:)?\/\//i.test(trimmedSrc) || /^data:/i.test(trimmedSrc) || /^blob:/i.test(trimmedSrc);
                if (!isExternal && scriptType !== 'module') {
                    scriptEl.remove();
                }
                return;
            }

            const scriptContent = scriptEl.textContent || '';
            if (scriptType === 'module' || this.fileTypeUtils.isJavaScriptModule(scriptContent)) {
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
    }

    collectFileContents() {
        let html = '';
        let css = '';
        let cssFiles = [];
        let jsFiles = [];
        let moduleFiles = [];
        
        this.state.files.forEach(file => {
            const content = file.editor.getValue();
            if (file.type === 'html') {
                const filename = this.getFileNameFromPanel(file.id) || 'index.html';
                const { styles, contentWithoutStyles } = this.extractStylesFromHTML(content);
                if (styles) {
                    css += '\n' + styles;
                    cssFiles.push({
                        content: styles,
                        filename
                    });
                }
                
                let htmlContent = this.extractHTMLContent(contentWithoutStyles);
                htmlContent = this.processHTMLScripts(htmlContent, jsFiles, moduleFiles, filename);
                html += '\n' + htmlContent;
            } else if (file.type === 'css') {
                const filename = this.getFileNameFromPanel(file.id) || 'styles.css';
                css += '\n' + content;
                cssFiles.push({
                    content,
                    filename
                });
            } else if (file.type === 'javascript') {
                const filename = this.getFileNameFromPanel(file.id) || 'script.js';
                if (this.fileTypeUtils.isJavaScriptModule(content, filename)) {
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

        return { html, css, cssFiles, jsFiles, moduleFiles };
    }

    detectFullDocumentMode() {
        return this.state.files.some(file => 
            file.type === 'html' && this.isFullHTMLDocument(file.editor.getValue())
        );
    }

    createVirtualFileSystem() {
        const fileSystem = new Map();

        const addFileEntry = (filename, fileData) => {
            const normalizedFilename = this.fileSystemUtils.normalizePath(filename);
            if (!normalizedFilename) return;
            fileSystem.set(normalizedFilename, fileData);
            if (filename && filename !== normalizedFilename) {
                fileSystem.set(filename, fileData);
            }
        };
        
        this.state.files.forEach(file => {
            const currentFilename = this.getFileNameFromPanel(file.id);
            const originalFilename = file.fileName;
            
            if (currentFilename && file.editor) {
                const fileData = {
                    content: this.getFileContent(file),
                    type: file.type,
                    isBinary: file.isBinary || false
                };
                
                addFileEntry(currentFilename, fileData);
                
                if (originalFilename && originalFilename !== currentFilename) {
                    addFileEntry(originalFilename, fileData);
                }
            }
        });
        
        return fileSystem;
    }

    extractWorkerFileNames(htmlContent) {
        const workerMatches = htmlContent.match(/new\s+Worker\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi) || [];
        return workerMatches.map(match => {
            const fileMatch = match.match(/new\s+Worker\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/i);
            return fileMatch ? fileMatch[1] : null;
        }).filter(Boolean);
    }

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
    }

    replaceWorkerCalls(htmlContent, workerFileNames) {
        workerFileNames.forEach(fileName => {
            const urlVar = 'workerUrl_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
            const regex = new RegExp(`new\\s+Worker\\s*\\(\\s*['"\`]${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\s*\\)`, 'gi');
            htmlContent = htmlContent.replace(regex, `new Worker(${urlVar})`);
        });
        return htmlContent;
    }

    replaceAssetReferences(htmlContent, fileSystem, currentFilePath = '', processedHtmlFiles = null) {
        if (!processedHtmlFiles) processedHtmlFiles = new Map();
        htmlContent = this.assetReplacers.withScriptBlocksPreserved(htmlContent, (safeHtmlContent) => {
            let updatedHtml = this.assetReplacers.replaceAllConfigBased(safeHtmlContent, fileSystem, currentFilePath);
            updatedHtml = this.assetReplacers.replaceDownloadLinks(updatedHtml, fileSystem, currentFilePath, processedHtmlFiles);
            return this.assetReplacers.replaceStyleTags(updatedHtml, fileSystem, currentFilePath);
        });

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
    }

    replaceCSSAssetReferences(cssContent, fileSystem, currentFilePath = '') {
        if (typeof cssContent !== 'string' || !cssContent.includes('url(')) {
            return cssContent;
        }

        return cssContent.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote, filename) => {
            const resolved = this.fileSystemUtils.findFileRecord(fileSystem, filename, currentFilePath);
            const file = resolved?.file || null;
            if (!file || !['image', 'svg', 'font'].includes(file.type)) {
                return match;
            }
            return `url("${this.getPreviewAssetUrl(file, 'application/octet-stream')}")`;
        });
    }

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
    }

    injectConsoleScript(htmlContent, fileSystem = null, mainHtmlPath = 'index.html') {
        const moduleImportMapScript = this.buildModuleImportMapScript(fileSystem);
        const captureScript = this.consoleBridge.getCaptureScript(fileSystem, mainHtmlPath);
        const headInjection = [moduleImportMapScript, captureScript].filter(Boolean).join('\n');

        if (htmlContent.includes('</head>')) {
            return htmlContent.replace('</head>', headInjection + '\n</head>');
        } else if (htmlContent.includes('<head>')) {
            return htmlContent.replace('<head>', '<head>\n' + headInjection);
        } else {
            return htmlContent.replace(/<html[^>]*>/i, '$&\n<head>\n' + headInjection + '\n</head>');
        }
    }

    processModuleFiles(moduleFiles, currentFilePath = 'index.html') {
        if (moduleFiles.length === 0) return '';

        const moduleEntries = moduleFiles
            .map((file) => {
                const filename = file.filename || `${currentFilePath.replace(/\.(html?)$/i, '')}-module.mjs`;
                return {
                    content: this.rewriteModuleSpecifiers(file.content, filename),
                    filename
                };
            })
            .filter((file) => typeof file.content === 'string' && file.content.trim() !== '');

        if (moduleEntries.length === 0) return '';

        return moduleEntries.map((file) => {
            const escapedContent = file.content.replace(/<\/script>/gi, '<\\/script>');
            return `<script type="module">\n${escapedContent}\n</script>`;
        }).join('\n') + '\n';
    }

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
    }

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
    }

    generateMultiFilePreview() {
        if (this.detectFullDocumentMode()) {
            return this.generateFullDocumentPreview();
        }
        
        const { html, css, cssFiles, jsFiles, moduleFiles } = this.collectFileContents();
        
        const { processedHtml, workerScript } = this.processWebWorkers(html, jsFiles);
        
        const fileSystem = this.createVirtualFileSystem();
        const mainHtmlFile = this.getMainHtmlFile();
        const mainHtmlPath = mainHtmlFile ? (this.getFileNameFromPanel(mainHtmlFile.id) || 'index.html') : 'index.html';
        const htmlWithAssets = this.replaceAssetReferences(processedHtml, fileSystem, mainHtmlPath);
        const cssWithAssets = cssFiles.length > 0
            ? cssFiles
                .map((cssFile) => this.replaceCSSAssetReferences(cssFile.content, fileSystem, cssFile.filename))
                .join('\n')
            : this.replaceCSSAssetReferences(css, fileSystem, mainHtmlPath);
        
        const moduleImportMapScript = this.buildModuleImportMapScript(fileSystem);
        const moduleScript = this.processModuleFiles(moduleFiles, mainHtmlPath);
        const jsScript = this.processJavaScriptFiles(jsFiles, mainHtmlPath);

        return '<!DOCTYPE html>\n' +
            '<html lang="en">\n' +
            '<head>\n' +
            '    <meta charset="UTF-8">\n' +
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '    <title>Preview</title>\n' +
            '    ' + moduleImportMapScript + '\n' +
            '    ' + this.consoleBridge.getCaptureScript(fileSystem, mainHtmlPath) + '\n' +
            '    ' + workerScript + '\n' +
            '    <style>' + cssWithAssets + '</style>\n' +
            '</head>\n' +
            '<body>\n' +
            '    ' + htmlWithAssets + '\n' +
            '    ' + moduleScript + '\n' +
            '    ' + jsScript + '\n' +
            '</body>\n' +
            '</html>';
    }

    /**
     * Generates the full HTML document string for the current preview.
     * @returns {string} Complete HTML document ready to be injected into the iframe
     */
    generatePreviewContent() {
        return this.generateMultiFilePreview();
    }

    clearPreviewTabState() {
        if (this.state.previewTabUrl) {
            URL.revokeObjectURL(this.state.previewTabUrl);
            this.state.previewTabUrl = null;
        }
        this.state.previewTabWindow = null;
        this.cleanupPreviewAssetUrlsIfUnused();
    }

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
    }

    refreshOpenPreviews() {
        const isModalOpen = this.dom.modalOverlay?.getAttribute('aria-hidden') === 'false';
        const previewTabWindow = this.state.previewTabWindow;
        const isTabOpen = previewTabWindow && !previewTabWindow.closed;
        if (!isModalOpen && !isTabOpen) return;

        const availability = this.getPreviewAvailability();
        if (!availability.allowed) return;

        this.revokeTrackedObjectUrls(this.state.previewAssetUrls);
        this.state.previewBlobUrlCache.clear();
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
    }

    /**
     * Delegates preview rendering to PreviewRenderer.
     * @param {'modal'|'tab'} target - Where to display the preview
     */
    renderPreview(target) {
        this.previewRenderer.render(target);
    }


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
        this.state.previewBlobUrlCache.clear();
        const content = this.generatePreviewContent();
        this.consoleBridge.clear();
        this.previewRenderer.safeWritePreviewFrame(content);
        this.showNotification('Preview refreshed.', 'success');
    }

    getPreviewDockOrientation() {
        const isPortraitMobile = window.matchMedia('(max-width: 900px) and (orientation: portrait)').matches;
        return isPortraitMobile ? 'bottom' : 'right';
    }

    updatePreviewDockButton() {
        if (!this.dom.dockPreviewBtn) return;
        const isDocked = this.state.isPreviewDocked;
        this.dom.dockPreviewBtn.classList.toggle('active', isDocked);
        this.dom.dockPreviewBtn.setAttribute('aria-label', isDocked ? 'Undock preview panel' : 'Dock preview panel');
        this.updatePreviewDockControlButtons();
    }

    getViewportWidth() {
        return window.visualViewport?.width ?? window.innerWidth;
    }

    getViewportHeight() {
        return window.visualViewport?.height ?? window.innerHeight;
    }

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
    }

    getDockSizePx(orientation) {
        const stored = this.state.previewDockSize[orientation];
        const viewportHalf = orientation === 'bottom' ? this.getViewportHeight() / 2 : this.getViewportWidth() / 2;
        const next = stored ?? viewportHalf;
        const { minPreview, maxPreview } = this.getDockConstraints(orientation);
        const clamped = Math.min(maxPreview, Math.max(minPreview, next));
        this.state.previewDockSize[orientation] = clamped;
        return clamped;
    }

    isSecondaryModalOpen() {
        const codeOpen = document.getElementById('code-modal')?.getAttribute('aria-hidden') === 'false';
        const mediaOpen = this.dom.mediaModal?.getAttribute('aria-hidden') === 'false';
        const settingsOpen = this.isSettingsModalOpen();
        const codeModalOverDivider = codeOpen && !this.state.isCodeModalDockedLeft;
        return codeModalOverDivider || mediaOpen || settingsOpen;
    }

    updateBackgroundScrollLock() {
        const previewOpen = this.dom.modalOverlay?.getAttribute('aria-hidden') === 'false';
        const codeOpen = document.getElementById('code-modal')?.getAttribute('aria-hidden') === 'false';
        const settingsOpen = this.isSettingsModalOpen();
        const shouldLock = settingsOpen || codeOpen || (previewOpen && !this.state.isPreviewDocked);
        document.body.classList.toggle('modal-scroll-lock', shouldLock);
    }

    updateDockDividerVisibility() {
        if (!this.dom.previewDockDivider) return;

        const shouldShow = this.state.isPreviewDocked;
        const suspended = shouldShow && this.isSecondaryModalOpen();

        this.dom.previewDockDivider.hidden = !shouldShow;
        this.dom.previewDockDivider.classList.toggle('is-suspended', suspended);
    }

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
        this.syncConsoleDividerPosition();
    }

    syncConsoleDividerPosition() {
        if (!this.dom.consoleResizeDivider
            || this.dom.modalConsolePanel.classList.contains('hidden')) return;

        const actualHeight = this.dom.modalConsolePanel.getBoundingClientRect().height;
        if (actualHeight > 0) {
            this.state.consoleHeight = actualHeight;
            this.dom.consoleResizeDivider.style.bottom = actualHeight + 'px';
            this.dom.consoleResizeDivider.style.setProperty('--console-height', actualHeight + 'px');
        }
    }

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
    }

    handleDockViewportResize() {
        this.updatePreviewViewportHeight();
        if (!this.state.isPreviewDocked) return;
        const nextOrientation = this.getPreviewDockOrientation();
        if (nextOrientation !== this.state.previewDockOrientation) {
            this.state.previewDockOrientation = nextOrientation;
        }
        this.applyPreviewDockLayout();
    }

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
    }

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
    }

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
    }

    setModalConsoleVisibility(isVisible) {
        this.dom.modalConsolePanel.classList.toggle('hidden', !isVisible);
        this.dom.modalConsolePanel.setAttribute('aria-hidden', String(!isVisible));
        this.dom.toggleConsoleBtn.classList.toggle('active', isVisible);

        if (this.dom.consoleResizeDivider) {
            this.dom.consoleResizeDivider.classList.toggle('hidden', !isVisible);
            if (isVisible) {
                this.dom.modalConsolePanel.style.height = this.state.consoleHeight + 'px';
                this.dom.consoleResizeDivider.style.bottom = this.state.consoleHeight + 'px';
                this.dom.consoleResizeDivider.style.setProperty('--console-height', this.state.consoleHeight + 'px');
                this.syncConsoleDividerPosition();
            }
        }

        this.updatePreviewDockControlButtons();
    }

    toggleModal(show) {
        this.dom.modalOverlay.setAttribute('aria-hidden', !show);
        if (show) {
            this.applyPreviewDockLayout();
            this.setModalConsoleVisibility(false);
        } else {
            this.setModalConsoleVisibility(false);
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
    }

    toggleConsole() {
        const isVisible = this.dom.modalConsolePanel.classList.contains('hidden');
        this.setModalConsoleVisibility(isVisible);
    }

    startConsoleResize(event) {
        if (!this.dom.consoleResizeDivider) return;
        event.preventDefault();

        const divider = this.dom.consoleResizeDivider;
        this.state.consoleResizeSession = { pointerId: event.pointerId };

        divider.setPointerCapture(event.pointerId);

        const onMove = (moveEvent) => this.handleConsoleResize(moveEvent);
        const onUp = (upEvent) => this.endConsoleResize(upEvent);

        divider.addEventListener('pointermove', onMove);
        divider.addEventListener('pointerup', onUp, { once: true });
        divider.addEventListener('pointercancel', onUp, { once: true });

        this.state.consoleResizeSession.cleanup = () => {
            divider.removeEventListener('pointermove', onMove);
        };

        divider.classList.add('is-dragging');
        document.body.classList.add('is-resizing-console');
    }

    endConsoleResize(event) {
        const session = this.state.consoleResizeSession;
        if (!session || !this.dom.consoleResizeDivider) return;

        try {
            this.dom.consoleResizeDivider.releasePointerCapture(session.pointerId);
        } catch (_err) {
            // Pointer may already be released.
        }

        session.cleanup?.();
        this.state.consoleResizeSession = null;
        this.dom.consoleResizeDivider.classList.remove('is-dragging');
        document.body.classList.remove('is-resizing-console');

        if (event) {
            this.handleConsoleResize(event);
        }
    }

    handleConsoleResize(event) {
        if (!this.state.consoleResizeSession) return;

        const modalBody = this.dom.modalConsolePanel.parentElement;
        if (!modalBody) return;

        const bodyRect = modalBody.getBoundingClientRect();
        const rawHeight = bodyRect.bottom - event.clientY;
        const minHeight = 80;
        const maxHeight = bodyRect.height * 0.6;
        const newHeight = Math.min(maxHeight, Math.max(minHeight, rawHeight));

        this.state.consoleHeight = newHeight;
        this.dom.modalConsolePanel.style.height = newHeight + 'px';
        this.dom.consoleResizeDivider.style.bottom = newHeight + 'px';
        this.dom.consoleResizeDivider.style.setProperty('--console-height', newHeight + 'px');
    }

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
    }

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
    }

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
    }
    
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
    }

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

            const importedFileNames = [];

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const processedCount = i + 1;

                if (this._shouldIgnoreImportPath(entry.path)) {
                    skippedCount++;
                    continue;
                }

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

                const fileType = this.detectFileTypeForFilename(result.fileName, isBinary ? null : content, mimeType);
                this.addNewFileWithContent(result.fileName, fileType, content, isBinary, {
                    autoOpenPanel: this.shouldAutoOpenImportedPanel(result.fileName, importedFileNames)
                });
                importedFileNames.push(result.fileName);
                importedCount++;
            }

            progress.complete(label + ' import complete.');
            this._showImportSummary(importedCount, skippedCount, label + ' imported successfully!');

        } catch (error) {
            console.error('Error importing ' + label + ':', error);
            if (progress) progress.fail(label + ' import failed.');
            this.showNotification('Failed to import ' + label.toLowerCase(), 'error');
        }
    }

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
    }

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
    }

    _readTarString(header, offset, length) {
        const bytes = header.subarray(offset, offset + length);
        const nullIndex = bytes.indexOf(0);
        const end = nullIndex === -1 ? length : nullIndex;
        return new TextDecoder().decode(bytes.subarray(0, end));
    }

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
    }

    _normalizeTarEntries(tarFiles) {
        return tarFiles.map(f => ({
            path: f.name,
            readBinary: () => this._uint8ArrayToBase64(f.data),
            readText: () => new TextDecoder().decode(f.data)
        }));
    }

    async _importFromTar(file) {
        try {
            const buffer = await file.arrayBuffer();
            const entries = this._normalizeTarEntries(this._parseTar(buffer));
            await this._importEntries(entries, 'TAR archive');
        } catch (error) {
            console.error('Error processing TAR file:', error);
            this.showNotification('Failed to import TAR file', 'error');
        }
    }

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
    }

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
    }

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
    }

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
    }

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
    }

    toggleMainHtmlDropdown() {
        if (!this.dom.mainHtmlDropdownList || !this.dom.mainHtmlDropdownTrigger) return;
        const isOpen = this.dom.mainHtmlDropdownTrigger.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
            this.closeMainHtmlDropdown(true);
        } else {
            this.openMainHtmlDropdown();
        }
    }

    openMainHtmlDropdown() {
        if (!this.dom.mainHtmlDropdownList || !this.dom.mainHtmlDropdownTrigger) return;
        this.dom.mainHtmlDropdownList.hidden = false;
        this.dom.mainHtmlDropdownTrigger.setAttribute('aria-expanded', 'true');
        this.positionCustomDropdownList(this.dom.mainHtmlDropdownTrigger, this.dom.mainHtmlDropdownList);
    }

    closeMainHtmlDropdown(focusTrigger = false) {
        if (!this.dom.mainHtmlDropdownList || !this.dom.mainHtmlDropdownTrigger) return;
        this.dom.mainHtmlDropdownList.hidden = true;
        this.dom.mainHtmlDropdownTrigger.setAttribute('aria-expanded', 'false');
        this.resetCustomDropdownPosition(this.dom.mainHtmlDropdownList);
        if (focusTrigger) {
            this.dom.mainHtmlDropdownTrigger.focus();
        }
    }

    selectMainHtmlOption(fileId) {
        this.state.mainHtmlFile = fileId;
        if (this.dom.mainHtmlSelect) {
            this.dom.mainHtmlSelect.value = fileId;
        }
        this.updateMainHtmlSelector();
        this.closeMainHtmlDropdown(true);
    }

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
                return `<li role="option" aria-selected="${checked}"><button type="button" class="main-html-dropdown-option${selectedClass}" data-value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</button></li>`;
            }).join('');
        }

        if (this.dom.mainHtmlDropdownTrigger) {
            const selectedOption = options.find(option => option.value === selectedValue) || options[0];
            this.dom.mainHtmlDropdownTrigger.textContent = selectedOption.label;
        }
    }
    
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
    }

}
