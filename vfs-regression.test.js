const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const scriptPath = path.join(__dirname, 'script.js');
const source = fs.readFileSync(scriptPath, 'utf8') + `
globalThis.FileTypeUtils = FileTypeUtils;
globalThis.FileSystemUtils = FileSystemUtils;
globalThis.PreviewScriptGenerator = PreviewScriptGenerator;
globalThis.CodePreviewer = CodePreviewer;
`;

const context = {
    document: { addEventListener() {} },
    console,
    TextEncoder,
    TextDecoder,
    URL,
    Blob,
    Map,
    Set,
    Array,
    Object,
    String,
    RegExp,
    Error,
};
vm.createContext(context);
vm.runInContext(source, context);

const app = new context.CodePreviewer();
const fileTypeUtils = new context.FileTypeUtils(app.constants.FILE_TYPES);
const fileSystemUtils = new context.FileSystemUtils(fileTypeUtils);

const imageFile = { type: 'image', content: 'data:image/png;base64,AAAA', isBinary: true };
const videoFile = { type: 'video', content: 'data:video/mp4;base64,AAAA', isBinary: true };
const audioFile = { type: 'audio', content: 'data:audio/ogg;base64,AAAA', isBinary: true };
const cssFile = { type: 'css', content: '.hero{background:url("../assets/bg image.png")}', isBinary: false };
const nestedCssFile = { type: 'css', content: '.icon{background:url("../../assets/bg%20image.png?cache=1#v")}', isBinary: false };
const bgFile = { type: 'image', content: 'data:image/png;base64,BBBB', isBinary: true };
const flatFile = { type: 'image', content: 'data:image/png;base64,EEEE', isBinary: true };
const ambiguousA = { type: 'image', content: 'data:image/png;base64,CCCC', isBinary: true };
const ambiguousB = { type: 'image', content: 'data:image/png;base64,DDDD', isBinary: true };

const fileSystem = new Map([
    ['anniversary_16/wedding/us happy together.png', imageFile],
    ['anniversary_16/wedding/assets/landscape_bg_web.mp4', videoFile],
    ['anniversary_16/wedding/assets/kiss_of_life_web.ogg', audioFile],
    ['project/styles/main.css', cssFile],
    ['project/nested/styles/extra.css', nestedCssFile],
    ['project/assets/bg image.png', bgFile],
    ['flat.png', flatFile],
    ['project/a/logo.png', ambiguousA],
    ['project/b/logo.png', ambiguousB],
]);

assert.strictEqual(
    fileSystemUtils.findFile(fileSystem, 'wedding/us happy together.png', 'index.html'),
    imageFile,
    'single-root folder alias should resolve project-relative image paths'
);

assert.strictEqual(
    fileSystemUtils.findFile(fileSystem, 'wedding/assets/landscape_bg_web.mp4?cache=1#clip', 'index.html'),
    videoFile,
    'query/hash suffixes should not prevent media lookup'
);

assert.strictEqual(
    fileSystemUtils.findFile(fileSystem, 'wedding/assets/kiss_of_life_web.ogg', 'anniversary_16/index.html'),
    audioFile,
    'relative lookup from imported root HTML should resolve audio'
);

assert.strictEqual(
    fileSystemUtils.findFile(fileSystem, '../assets/bg%20image.png', 'project/styles/main.css'),
    bgFile,
    'encoded relative CSS URLs should resolve from the CSS file path'
);

assert.strictEqual(
    fileSystemUtils.findFile(fileSystem, '/project/assets/bg%20image.png?cache=1', 'project/styles/main.css'),
    bgFile,
    'root-relative VFS paths should resolve without the current-file folder'
);

assert.strictEqual(
    fileSystemUtils.findFile(fileSystem, 'flat.png', 'index.html'),
    flatFile,
    'older flat file imports should still resolve directly'
);

assert.strictEqual(
    fileSystemUtils.findFile(fileSystem, 'LOGO.PNG', 'index.html'),
    null,
    'ambiguous basename fallback should not pick an arbitrary file'
);

assert.strictEqual(
    fileSystemUtils.findFile(fileSystem, 'https://cdn.example.com/us%20happy%20together.png', 'index.html'),
    null,
    'external URLs should never match local files by basename'
);

app.fileTypeUtils = fileTypeUtils;
app.fileSystemUtils = fileSystemUtils;
const rewrittenCss = app.replaceCSSAssetReferences(cssFile.content, fileSystem, 'project/styles/main.css');
assert(
    rewrittenCss.includes(bgFile.content),
    'CSS url(...) references should be rewritten using the CSS file as context'
);

const rewrittenNestedCss = app.replaceCSSAssetReferences(nestedCssFile.content, fileSystem, 'project/nested/styles/extra.css');
assert(
    rewrittenNestedCss.includes(bgFile.content),
    'nested CSS files should resolve encoded relative URLs with query/hash suffixes'
);

const generator = new context.PreviewScriptGenerator();
const generatedRuntime =
    generator.generateResolvePathCode() +
    generator.generateFindFileCode() +
    generator.generateGetCurrentFilePathCode() +
    generator.generateAssetResolverCode();

const runtimeApi = new Function(
    'virtualFileSystem',
    'mainHtmlPath',
    'const window = {};\n' + generatedRuntime + '\nreturn { findFileInSystem, resolveVirtualAssetUrl, rewriteVirtualCssContent, getVirtualFileText };'
);

const virtualFileSystem = Object.fromEntries(fileSystem.entries());
const runtime = runtimeApi(virtualFileSystem, 'index.html');

assert.strictEqual(
    runtime.findFileInSystem('wedding/us%20happy%20together.png', 'index.html'),
    imageFile,
    'generated runtime should mirror host folder-alias and URL-decoding lookup'
);

assert.strictEqual(
    runtime.findFileInSystem('../assets/bg%20image.png', 'project/styles/main.css'),
    bgFile,
    'generated runtime should resolve nested relative URLs'
);

assert.strictEqual(
    runtime.findFileInSystem('/project/assets/bg%20image.png?cache=1', 'project/styles/main.css'),
    bgFile,
    'generated runtime should resolve root-relative VFS paths'
);

assert.strictEqual(
    runtime.resolveVirtualAssetUrl('wedding/assets/landscape_bg_web.mp4?cache=1', (file) => file.type === 'video'),
    videoFile.content,
    'generated runtime should return VFS data URL content for media assets'
);

assert(
    runtime.rewriteVirtualCssContent(nestedCssFile.content, 'project/nested/styles/extra.css').includes(bgFile.content),
    'generated runtime should rewrite CSS url(...) references relative to served CSS path'
);

assert(
    runtime.getVirtualFileText(nestedCssFile, 'project/nested/styles/extra.css').includes(bgFile.content),
    'runtime-served CSS text should include rewritten nested asset URLs'
);

const fetchRuntimeApi = new Function(
    'virtualFileSystem',
    'mainHtmlPath',
    'Headers',
    'Blob',
    'TextEncoder',
    `
const window = {
    fetch: function() {
        return Promise.reject(new Error('unexpected network fallback'));
    }
};
const atob = function() { return ''; };
` +
    generator.generateBase64HelperCode() +
    generator.generateResolvePathCode() +
    generator.generateFindFileCode() +
    generator.generateGetCurrentFilePathCode() +
    generator.generateAssetResolverCode() +
    generator.generateFetchOverrideCode() +
    '\nreturn window.fetch;'
);

const fetchVirtualAsset = fetchRuntimeApi(virtualFileSystem, 'index.html', Headers, Blob, TextEncoder);

const fullInjectedRuntime =
    generator.generateBase64HelperCode() +
    generator.generateResolvePathCode() +
    generator.generateFindFileCode() +
    generator.generateGetCurrentFilePathCode() +
    generator.generateAssetResolverCode() +
    generator.generateFetchOverrideCode() +
    generator.generateXHROverrideCode() +
    generator.generateImageOverrideCode() +
    generator.generateAudioOverrideCode() +
    generator.generateCSSURLOverrideCode() +
    generator.generateElementSrcOverrideCode();

new Function(fullInjectedRuntime);

fetchVirtualAsset('project/nested/styles/extra.css')
    .then((response) => response.text())
    .then((cssText) => {
        assert(
            cssText.includes(bgFile.content),
            'fetch() should serve CSS with nested url(...) references rewritten'
        );
        console.log('VFS regression checks passed');
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
