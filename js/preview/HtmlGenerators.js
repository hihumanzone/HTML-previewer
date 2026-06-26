class HtmlGenerators {
    toolbarButton(icon, text, className, ariaLabel, title) {
        return `<button class="toolbar-btn ${className}" aria-label="${ariaLabel}" title="${title}">
            <span class="btn-icon">${icon}</span> ${text}
        </button>`;
    }

    fileTypeOption(value, label, selected = false) {
        return `<option value="${value}" ${selected ? 'selected' : ''}>${label}</option>`;
    }

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
    }

    mediaPreviewContent(type, content, fileName, isBinary = false) {
        const safeFileName = escapeHtml(fileName);
        const safeContent = escapeHtml(content);
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
                const safeSvgUrl = escapeHtml(svgDataUrl);
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
        return typeof containers[type] === 'function' ? containers[type](content, fileName, isBinary) : (containers[type] || containers.default);
    }
}
