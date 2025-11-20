# Code Refactoring Guide

## Current State

The application currently uses a monolithic architecture with a single `script.js` file (2921 lines, 83+ methods) containing all application logic.

## Refactored Modules

We have extracted several utility modules to improve code organization:

### Created Modules

1. **js/constants.js** - Application constants
   - Editor IDs, Control IDs, Container IDs
   - File type mappings and MIME types
   - Binary file extensions
   - CodeMirror mode mappings

2. **js/file-type-utils.js** - File type utilities
   - Extension detection
   - MIME type resolution
   - Binary file detection
   - Editable/previewable type checking

3. **js/notification-system.js** - User notifications
   - Toast notification display
   - Success/warning/error styling

4. **js/utils.js** - General utilities
   - Module file detection
   - Safe DOM element access
   - File type content detection

5. **js/dom-manager.js** - DOM element caching
   - Centralized DOM element references
   - Safe element access patterns

6. **js/editor-manager.js** - Editor management
   - CodeMirror initialization
   - Fallback editor creation
   - Default content loading

## Migration Path

### Phase 1: Utility Extraction (COMPLETED)
- ✅ Extract constants
- ✅ Extract file type utilities
- ✅ Extract notification system
- ✅ Extract general utilities
- ✅ Extract DOM manager
- ✅ Extract editor manager basics

### Phase 2: Core Module Extraction (FUTURE)
- Extract file management (import/export, panel creation)
- Extract preview rendering logic
- Extract console logging system
- Extract drag-and-drop functionality
- Extract toolbar event handlers

### Phase 3: Main App Restructure (FUTURE)
- Create main app.js that orchestrates modules
- Update index.html to use ES6 modules
- Remove original monolithic script.js
- Full integration testing

## Benefits of Modular Architecture

1. **Maintainability** - Easier to locate and modify specific functionality
2. **Testability** - Individual modules can be unit tested
3. **Reusability** - Utility modules can be shared across projects
4. **Readability** - Smaller, focused files are easier to understand
5. **Collaboration** - Multiple developers can work on different modules

## Current Usage

The original `script.js` is still in use. To use the modular version:

1. Use `index-modular.html` instead of `index.html`
2. Ensure `js/app.js` is created with full application logic
3. Test all functionality thoroughly before switching

## Notes

- `script.js.backup` contains the original unmodified script
- All new modules use ES6 syntax (export/import)
- Backward compatibility maintained during transition
