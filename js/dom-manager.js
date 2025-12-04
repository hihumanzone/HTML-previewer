/**
 * DOM Manager
 * Handles caching and accessing DOM elements throughout the application
 */

import {
    EDITOR_IDS,
    CONTROL_IDS,
    CONTAINER_IDS,
    MODAL_IDS,
    CONSOLE_ID,
    MODAL_CONSOLE_PANEL_ID
} from './constants.js';

import { getSafeParentElement } from './utils.js';

/**
 * Cache and return all DOM elements used by the application
 * @returns {Object} Object containing all cached DOM elements
 */
export function cacheDOMElements() {
    return {
        htmlEditor: document.getElementById(EDITOR_IDS.HTML),
        cssEditor: document.getElementById(EDITOR_IDS.CSS),
        jsEditor: document.getElementById(EDITOR_IDS.JS),
        singleFileEditor: document.getElementById(EDITOR_IDS.SINGLE_FILE),
        modalBtn: document.getElementById(CONTROL_IDS.MODAL_BTN),
        tabBtn: document.getElementById(CONTROL_IDS.TAB_BTN),
        clearConsoleBtn: document.getElementById(CONTROL_IDS.CLEAR_CONSOLE_BTN),
        toggleConsoleBtn: document.getElementById(CONTROL_IDS.TOGGLE_CONSOLE_BTN),
        singleModeRadio: document.getElementById(CONTROL_IDS.SINGLE_MODE_RADIO),
        multiModeRadio: document.getElementById(CONTROL_IDS.MULTI_MODE_RADIO),
        singleModeOption: document.querySelector('label[for="single-mode-radio"]') || getSafeParentElement(CONTROL_IDS.SINGLE_MODE_RADIO),
        multiModeOption: document.querySelector('label[for="multi-mode-radio"]') || getSafeParentElement(CONTROL_IDS.MULTI_MODE_RADIO),
        addFileBtn: document.getElementById(CONTROL_IDS.ADD_FILE_BTN),
        importFileBtn: document.getElementById(CONTROL_IDS.IMPORT_FILE_BTN),
        importZipBtn: document.getElementById(CONTROL_IDS.IMPORT_ZIP_BTN),
        exportZipBtn: document.getElementById(CONTROL_IDS.EXPORT_ZIP_BTN),
        mainHtmlSelect: document.getElementById(CONTROL_IDS.MAIN_HTML_SELECT),
        mainHtmlSelector: document.getElementById('main-html-selector'),
        singleFileContainer: document.getElementById(CONTAINER_IDS.SINGLE_FILE),
        multiFileContainer: document.getElementById(CONTAINER_IDS.MULTI_FILE),
        modalOverlay: document.getElementById(MODAL_IDS.OVERLAY),
        previewFrame: document.getElementById(MODAL_IDS.FRAME),
        closeModalBtn: document.querySelector('.modal-header .close-btn'),
        consoleOutput: document.getElementById(CONSOLE_ID),
        modalConsolePanel: document.getElementById(MODAL_CONSOLE_PANEL_ID),
        editorGrid: document.querySelector('.editor-grid'),
        saveCodeBtn: document.getElementById('save-code-btn'),
        mediaModal: document.getElementById('media-modal'),
        mediaModalContent: document.getElementById('media-modal-content'),
        mediaModalTitle: document.getElementById('media-modal-title'),
    };
}
