# HTML Previewer

A lightweight, browser-based playground for HTML, CSS, and JavaScript. Write code and see the output instantly, all locally in your browser.

- Online demo: https://html-previewer-tawny.vercel.app
- Status: Public, static site (no server required)
- Tech stack: Vanilla HTML, CSS, and JavaScript

## Features

- Instant preview of HTML, CSS, and JavaScript in the browser
- No install or build step required—just open the page and start coding
- Works entirely client-side (your code stays in your browser)
- Portable, single-page app suitable for quick prototyping or teaching

Note: Exact UI and capabilities depend on the current implementation of `index.html` and `script.js`.

## Getting Started

### Option 1: Use the hosted app
1. Open the online demo: https://html-previewer-tawny.vercel.app
2. Start typing HTML, CSS, and JavaScript. The preview updates in real time.

### Option 2: Run locally
1. Clone this repository:
   - HTTPS: `git clone https://github.com/hihumanzone/HTML-previewer.git`
   - SSH: `git clone git@github.com:hihumanzone/HTML-previewer.git`
2. Open `index.html` in your browser (double-click or drag into a tab).
3. Begin editing—no server, no build, no dependencies.

## File Structure

- `index.html` — App markup and container for the editor and preview
- `style.css` — App styling
- `script.js` — App logic (e.g., wiring editors to the preview frame)
- `js/` — Modular JavaScript files (refactored utilities and components)
  - `constants.js` — Application constants and configuration
  - `file-type-utils.js` — File type detection and MIME type handling
  - `notification-system.js` — Toast notification system
  - `utils.js` — General utility functions
  - `dom-manager.js` — DOM element caching and management
  - `editor-manager.js` — CodeMirror editor initialization

See [REFACTORING.md](REFACTORING.md) for details about the modular architecture and migration path.

## Development

This project is a static site. You can iterate by editing the files directly and refreshing your browser.

If you prefer to serve locally (optional), you can use any simple static server, for example:
- Python 3: `python -m http.server 8080`
- Node (http-server): `npx http-server -p 8080`

Then visit `http://localhost:8080`.

## Deployment

This app is already deployed to Vercel at:
- https://html-previewer-tawny.vercel.app

Because it’s a static site, you can also deploy it to any static hosting provider (GitHub Pages, Netlify, etc.) by uploading the three files at the project root.

## Troubleshooting

- Preview not updating: open the browser DevTools console to check for errors.
- Blocking/security issues: if running from the local filesystem, some browsers restrict iframe/script behavior. Try serving the folder via a local web server as shown above.

## Contributing

Issues and pull requests are welcome:
1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a pull request
