# Code Refactoring Guide

## Current State

The application currently uses a monolithic architecture with a single `script.js` file (3100+ lines) containing all application logic.

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

3. **js/file-system-utils.js** - Virtual file system utilities (NEW)
   - Path resolution for relative/absolute paths
   - File lookup with case-insensitive fallback
   - Data URL generation for file content
   - Code generation for injected scripts
   - Virtual file system creation from file arrays

4. **js/notification-system.js** - User notifications
   - Toast notification display
   - Success/warning/error styling

5. **js/utils.js** - General utilities
   - Module file detection
   - Safe DOM element access
   - File type content detection

6. **js/dom-manager.js** - DOM element caching
   - Centralized DOM element references
   - Safe element access patterns

7. **js/editor-manager.js** - Editor management
   - CodeMirror initialization
   - Fallback editor creation
   - Default content loading

## In-Script Refactoring

The main `script.js` has been refactored to include:

### fileSystemUtils Object
Centralized file system operations with:
- `resolvePath()` - Resolves relative paths against base paths
- `findFile()` - Finds files in virtual file system with case-insensitive fallback
- `isMatchingType()` - Checks file type against allowed types
- `getFileDataUrl()` - Generates data URLs for file content
- `generateResolvePathCode()` - Generates injectable path resolution code
- `generateFindFileCode()` - Generates injectable file lookup code
- `generateGetCurrentFilePathCode()` - Generates injectable context code

### assetReplacers Refactoring
- Added `REPLACEMENT_CONFIGS` - Configuration-driven replacement patterns
- Added `applyReplacement()` - Generic replacement handler
- Consolidated duplicate replacement patterns
- Improved code reuse across CSS, image, video, audio, font replacements

## Migration Path

### Phase 1: Utility Extraction (COMPLETED)
- ✅ Extract constants
- ✅ Extract file type utilities
- ✅ Extract notification system
- ✅ Extract general utilities
- ✅ Extract DOM manager
- ✅ Extract editor manager basics
- ✅ Extract file system utilities

### Phase 2: Core Module Extraction (IN PROGRESS)
- ✅ Refactor file referencing support in multi-file system
- ✅ Consolidate asset replacement patterns
- ⬜ Extract file management (import/export, panel creation)
- ⬜ Extract preview rendering logic
- ⬜ Extract console logging system
- ⬜ Extract drag-and-drop functionality
- ⬜ Extract toolbar event handlers

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
6. **DRY Code** - Configuration-driven patterns reduce duplication

## Current Usage

The original `script.js` is still in use. To use the modular version:

1. Use `index-modular.html` instead of `index.html`
2. Ensure `js/app.js` is created with full application logic
3. Test all functionality thoroughly before switching

## Notes

- `script.js.backup` contains the original unmodified script
- All new modules use ES6 syntax (export/import)
- Backward compatibility maintained during transition
- The `fileSystemUtils` object in script.js mirrors the standalone module for compatibility
