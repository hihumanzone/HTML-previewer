/* ============================================================
   OpenCode Web – Vanilla JavaScript
   A browser-only AI coding agent interface.
   All state lives in localStorage; talks directly to any
   OpenAI-compatible API.
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     Constants & Default Configuration
  ---------------------------------------------------------- */
  var DEFAULT_SETTINGS = {
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o",
    systemPrompt:
      "You are OpenCode, an AI coding assistant. You help users write, debug, and understand code. " +
      "You can read and write files, run commands, search codebases, and more. " +
      "Be concise and helpful. Use markdown for formatting. " +
      "When showing code, always use fenced code blocks with the language specified.",
    temperature: 0.7,
    maxTokens: 4096,
    theme: "dark",
    stream: "true",
  };

  var STORAGE_KEY = "opencode_settings";
  var SESSIONS_KEY = "opencode_sessions";

  /* ----------------------------------------------------------
     State
  ---------------------------------------------------------- */
  var state = {
    settings: {},
    sessions: [],
    activeSessionId: null,
    activeAgent: "build",
    abortController: null,
    isGenerating: false,
  };

  /* ----------------------------------------------------------
     DOM references
  ---------------------------------------------------------- */
  var dom = {};

  function cacheDom() {
    dom.settingsOverlay = document.getElementById("settings-overlay");
    dom.closeSettings = document.getElementById("close-settings");
    dom.openSettings = document.getElementById("open-settings");
    dom.welcomeSettingsBtn = document.getElementById("welcome-settings-btn");
    dom.saveSettings = document.getElementById("save-settings");
    dom.resetSettings = document.getElementById("reset-settings");
    dom.settingBaseUrl = document.getElementById("setting-base-url");
    dom.settingApiKey = document.getElementById("setting-api-key");
    dom.settingModel = document.getElementById("setting-model");
    dom.settingSystemPrompt = document.getElementById("setting-system-prompt");
    dom.settingTemperature = document.getElementById("setting-temperature");
    dom.temperatureValue = document.getElementById("temperature-value");
    dom.settingMaxTokens = document.getElementById("setting-max-tokens");
    dom.settingTheme = document.getElementById("setting-theme");
    dom.settingStream = document.getElementById("setting-stream");
    dom.exportOverlay = document.getElementById("export-overlay");
    dom.closeExport = document.getElementById("close-export");
    dom.exportBtn = document.getElementById("export-btn");
    dom.exportJson = document.getElementById("export-json");
    dom.exportMd = document.getElementById("export-md");
    dom.sidebar = document.getElementById("sidebar");
    dom.sidebarToggle = document.getElementById("sidebar-toggle");
    dom.newSessionBtn = document.getElementById("new-session-btn");
    dom.sessionSearch = document.getElementById("session-search");
    dom.sessionList = document.getElementById("session-list");
    dom.sessionTitle = document.getElementById("session-title");
    dom.editTitleBtn = document.getElementById("edit-title-btn");
    dom.modelBadge = document.getElementById("model-badge");
    dom.modelNameDisplay = document.getElementById("model-name-display");
    dom.messagesArea = document.getElementById("messages-area");
    dom.welcomeScreen = document.getElementById("welcome-screen");
    dom.messageInput = document.getElementById("message-input");
    dom.sendBtn = document.getElementById("send-btn");
    dom.stopBtn = document.getElementById("stop-btn");
    dom.tokenInfo = document.getElementById("token-info");
    dom.agentBtns = document.querySelectorAll(".agent-btn");
  }

  /* ----------------------------------------------------------
     Settings (localStorage)
  ---------------------------------------------------------- */
  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      state.settings = raw ? JSON.parse(raw) : {};
    } catch (e) {
      state.settings = {};
    }
    // Merge with defaults
    for (var key in DEFAULT_SETTINGS) {
      if (state.settings[key] === undefined) {
        state.settings[key] = DEFAULT_SETTINGS[key];
      }
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  }

  function populateSettingsForm() {
    dom.settingBaseUrl.value = state.settings.baseUrl;
    dom.settingApiKey.value = state.settings.apiKey;
    dom.settingModel.value = state.settings.model;
    dom.settingSystemPrompt.value = state.settings.systemPrompt;
    dom.settingTemperature.value = state.settings.temperature;
    dom.temperatureValue.textContent = state.settings.temperature;
    dom.settingMaxTokens.value = state.settings.maxTokens;
    dom.settingTheme.value = state.settings.theme;
    dom.settingStream.value = state.settings.stream;
  }

  function readSettingsForm() {
    state.settings.baseUrl = dom.settingBaseUrl.value.trim().replace(/\/+$/, "");
    state.settings.apiKey = dom.settingApiKey.value.trim();
    state.settings.model = dom.settingModel.value.trim();
    state.settings.systemPrompt = dom.settingSystemPrompt.value.trim();
    state.settings.temperature = parseFloat(dom.settingTemperature.value);
    state.settings.maxTokens = parseInt(dom.settingMaxTokens.value, 10) || 4096;
    state.settings.theme = dom.settingTheme.value;
    state.settings.stream = dom.settingStream.value;
  }

  /* ----------------------------------------------------------
     Theme
  ---------------------------------------------------------- */
  function applyTheme() {
    var theme = state.settings.theme;
    if (theme === "system") {
      theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", theme);
  }

  /* ----------------------------------------------------------
     Sessions (localStorage)
  ---------------------------------------------------------- */
  function loadSessions() {
    try {
      var raw = localStorage.getItem(SESSIONS_KEY);
      state.sessions = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.sessions = [];
    }
  }

  function saveSessions() {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(state.sessions));
  }

  function createSession() {
    var session = {
      id: generateId(),
      title: "New Session",
      agent: state.activeAgent,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTokens: { input: 0, output: 0 },
      totalCost: 0,
    };
    state.sessions.unshift(session);
    saveSessions();
    return session;
  }

  function getSession(id) {
    for (var i = 0; i < state.sessions.length; i++) {
      if (state.sessions[i].id === id) return state.sessions[i];
    }
    return null;
  }

  function deleteSession(id) {
    state.sessions = state.sessions.filter(function (s) { return s.id !== id; });
    saveSessions();
    if (state.activeSessionId === id) {
      if (state.sessions.length > 0) {
        switchToSession(state.sessions[0].id);
      } else {
        state.activeSessionId = null;
        renderMessages();
        renderSessionList();
        updateHeader();
      }
    } else {
      renderSessionList();
    }
  }

  function switchToSession(id) {
    cancelGeneration();
    state.activeSessionId = id;
    var session = getSession(id);
    if (session) {
      state.activeAgent = session.agent || "build";
      updateAgentButtons();
    }
    renderMessages();
    renderSessionList();
    updateHeader();
    // Close sidebar on mobile
    dom.sidebar.classList.remove("open");
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /* ----------------------------------------------------------
     Render Session List (Sidebar)
  ---------------------------------------------------------- */
  function renderSessionList() {
    var search = dom.sessionSearch.value.toLowerCase();
    var html = "";
    var sessions = state.sessions;

    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      if (search && s.title.toLowerCase().indexOf(search) === -1) continue;
      var isActive = s.id === state.activeSessionId;
      var agent = s.agent || "build";
      var date = new Date(s.updatedAt);
      var timeStr = formatRelativeTime(date);
      var msgCount = s.messages ? s.messages.length : 0;

      html +=
        '<div class="session-item' + (isActive ? " active" : "") + '" data-session-id="' + s.id + '">' +
          '<div class="session-item-info">' +
            '<div class="session-item-title">' + escapeHtml(s.title) + '</div>' +
            '<div class="session-item-meta">' +
              '<span class="session-item-agent ' + agent + '">' + agent + '</span>' +
              '<span>' + msgCount + ' msg' + (msgCount !== 1 ? 's' : '') + '</span>' +
              '<span>' + timeStr + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="session-item-actions">' +
            '<button class="session-delete-btn" data-delete-id="' + s.id + '" title="Delete session">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
            '</button>' +
          '</div>' +
        '</div>';
    }

    if (!html) {
      html = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No sessions yet</div>';
    }

    dom.sessionList.innerHTML = html;

    // Bind click events
    var items = dom.sessionList.querySelectorAll(".session-item");
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener("click", function (e) {
        if (e.target.closest(".session-delete-btn")) return;
        var id = this.getAttribute("data-session-id");
        switchToSession(id);
      });
    }

    var delBtns = dom.sessionList.querySelectorAll(".session-delete-btn");
    for (var k = 0; k < delBtns.length; k++) {
      delBtns[k].addEventListener("click", function (e) {
        e.stopPropagation();
        var id = this.getAttribute("data-delete-id");
        if (confirm("Delete this session?")) {
          deleteSession(id);
        }
      });
    }
  }

  /* ----------------------------------------------------------
     Render Messages
  ---------------------------------------------------------- */
  function renderMessages() {
    var session = getSession(state.activeSessionId);
    if (!session || session.messages.length === 0) {
      dom.welcomeScreen.classList.remove("hidden");
      dom.messagesArea.innerHTML = "";
      dom.messagesArea.appendChild(dom.welcomeScreen);
      updateWelcome();
      dom.sessionTitle.textContent = session ? session.title : "New Session";
      return;
    }

    dom.welcomeScreen.classList.add("hidden");
    var html = "";

    for (var i = 0; i < session.messages.length; i++) {
      var msg = session.messages[i];
      html += renderMessage(msg);
    }

    dom.messagesArea.innerHTML = html;
    bindMessageEvents();
    scrollToBottom();
  }

  function renderMessage(msg) {
    var roleClass = msg.role;
    var roleName = msg.role === "user" ? "You" : msg.role === "assistant" ? "Assistant" : "Error";
    var roleLabel = msg.role;
    var agent = msg.agent || state.activeAgent;
    var time = msg.time ? formatTime(new Date(msg.time)) : "";

    var html = '<div class="message ' + roleClass + '">';
    html += '<div class="message-header">';
    html += '<span class="message-role ' + roleLabel + '">' + roleName + '</span>';
    if (msg.role === "assistant") {
      html += '<span class="message-agent">' + agent + '</span>';
    }
    if (time) {
      html += '<span class="message-time">' + time + '</span>';
    }
    html += '</div>';

    // Thinking/reasoning
    if (msg.thinking) {
      var thinkId = "think-" + generateId();
      html += '<div class="thinking-block">';
      html += '<div class="thinking-header" data-toggle="' + thinkId + '">';
      html += '<span>&#9656;</span> <span>Thinking...</span>';
      html += '</div>';
      html += '<div class="thinking-body" id="' + thinkId + '">';
      html += escapeHtml(msg.thinking);
      html += '</div></div>';
    }

    // Tool calls
    if (msg.toolCalls && msg.toolCalls.length > 0) {
      for (var t = 0; t < msg.toolCalls.length; t++) {
        html += renderToolCall(msg.toolCalls[t]);
      }
    }

    // Main content
    html += '<div class="message-body">' + renderMarkdown(msg.content || "") + '</div>';

    // Token info for assistant
    if (msg.role === "assistant" && msg.usage) {
      html += '<div class="message-footer">';
      if (msg.usage.prompt_tokens !== undefined) {
        html += '<span>In: ' + msg.usage.prompt_tokens.toLocaleString() + '</span>';
      }
      if (msg.usage.completion_tokens !== undefined) {
        html += '<span>Out: ' + msg.usage.completion_tokens.toLocaleString() + '</span>';
      }
      if (msg.usage.total_tokens !== undefined) {
        html += '<span>Total: ' + msg.usage.total_tokens.toLocaleString() + '</span>';
      }
      if (msg.cost !== undefined && msg.cost > 0) {
        html += '<span>Cost: $' + msg.cost.toFixed(4) + '</span>';
      }
      if (msg.model) {
        html += '<span>' + escapeHtml(msg.model) + '</span>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderToolCall(tc) {
    var tcId = "tc-" + generateId();
    var statusClass = tc.status || "completed";
    var statusLabel = tc.status || "done";

    var html = '<div class="tool-call">';
    html += '<div class="tool-call-header" data-toggle="' + tcId + '">';
    html += '<span class="tool-call-icon">&#9656;</span>';
    html += '<span class="tool-call-name">' + escapeHtml(tc.name || "tool") + '</span>';
    html += '<span class="tool-call-status ' + statusClass + '">' + statusLabel + '</span>';
    html += '</div>';
    html += '<div class="tool-call-body" id="' + tcId + '">';

    if (tc.input) {
      html += '<div class="tool-call-section">';
      html += '<div class="tool-call-section-label">Input</div>';
      html += '<pre><code>' + escapeHtml(typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input, null, 2)) + '</code></pre>';
      html += '</div>';
    }
    if (tc.output) {
      html += '<div class="tool-call-section">';
      html += '<div class="tool-call-section-label">Output</div>';
      html += '<pre><code>' + escapeHtml(typeof tc.output === "string" ? tc.output : JSON.stringify(tc.output, null, 2)) + '</code></pre>';
      html += '</div>';
    }

    html += '</div></div>';
    return html;
  }

  function bindMessageEvents() {
    // Toggle tool calls and thinking blocks
    var toggleHeaders = dom.messagesArea.querySelectorAll("[data-toggle]");
    for (var i = 0; i < toggleHeaders.length; i++) {
      toggleHeaders[i].addEventListener("click", function () {
        var targetId = this.getAttribute("data-toggle");
        var target = document.getElementById(targetId);
        if (target) {
          target.classList.toggle("expanded");
          this.classList.toggle("expanded");
        }
      });
    }

    // Copy code buttons
    var copyBtns = dom.messagesArea.querySelectorAll(".copy-code-btn");
    for (var j = 0; j < copyBtns.length; j++) {
      copyBtns[j].addEventListener("click", function () {
        var codeEl = this.closest(".message-body").querySelector("pre code");
        // Find the specific code block near this button
        var header = this.closest(".code-block-header");
        if (header && header.nextElementSibling && header.nextElementSibling.tagName === "PRE") {
          codeEl = header.nextElementSibling.querySelector("code");
        }
        if (codeEl) {
          navigator.clipboard.writeText(codeEl.textContent).then(
            function () {},
            function () {}
          );
          var btn = this;
          btn.textContent = "Copied!";
          setTimeout(function () { btn.textContent = "Copy"; }, 1500);
        }
      });
    }
  }

  /* ----------------------------------------------------------
     Markdown Renderer (simple, no dependencies)
  ---------------------------------------------------------- */
  function renderMarkdown(text) {
    if (!text) return "";

    // Escape HTML first
    var html = escapeHtml(text);

    // Code blocks with language
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function (match, lang, code) {
      var langLabel = lang || "text";
      return (
        '<div class="code-block-header"><span>' + escapeHtml(langLabel) + '</span><button class="copy-code-btn">Copy</button></div>' +
        '<pre><code class="language-' + escapeHtml(langLabel) + '">' + code + '</code></pre>'
      );
    });

    // Code blocks without language
    html = html.replace(/```\n?([\s\S]*?)```/g, function (match, code) {
      return '<pre><code>' + code + '</code></pre>';
    });

    // Inline code (avoid matching inside pre/code blocks)
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:6px;">');

    // Blockquotes
    html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Tables
    html = renderTables(html);

    // Unordered lists
    html = renderLists(html);

    // Ordered lists
    html = renderOrderedLists(html);

    // Paragraphs - wrap remaining text
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Clean up
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<div)/g, '$1');
    html = html.replace(/(<\/div>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table>)/g, '$1');
    html = html.replace(/(<\/table>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)/g, '$1');
    html = html.replace(/(<hr>)<\/p>/g, '$1');

    return html;
  }

  function renderTables(html) {
    var lines = html.split('\n');
    var result = [];
    var inTable = false;
    var tableRows = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.match(/^\|(.+)\|$/)) {
        if (line.match(/^\|[\s\-:|]+\|$/)) {
          // Separator row - skip
          continue;
        }
        tableRows.push(line);
        inTable = true;
      } else {
        if (inTable && tableRows.length > 0) {
          result.push(buildTable(tableRows));
          tableRows = [];
          inTable = false;
        }
        result.push(lines[i]);
      }
    }
    if (tableRows.length > 0) {
      result.push(buildTable(tableRows));
    }
    return result.join('\n');
  }

  function buildTable(rows) {
    var html = '<table>';
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].split('|').filter(function (c) { return c.trim() !== ''; });
      var tag = i === 0 ? 'th' : 'td';
      html += '<tr>';
      for (var j = 0; j < cells.length; j++) {
        html += '<' + tag + '>' + cells[j].trim() + '</' + tag + '>';
      }
      html += '</tr>';
    }
    html += '</table>';
    return html;
  }

  function renderLists(html) {
    var lines = html.split('\n');
    var result = [];
    var inList = false;

    for (var i = 0; i < lines.length; i++) {
      var match = lines[i].match(/^(\s*)[-*+]\s+(.+)$/);
      if (match) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        result.push('<li>' + match[2] + '</li>');
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(lines[i]);
      }
    }
    if (inList) result.push('</ul>');
    return result.join('\n');
  }

  function renderOrderedLists(html) {
    var lines = html.split('\n');
    var result = [];
    var inList = false;

    for (var i = 0; i < lines.length; i++) {
      var match = lines[i].match(/^(\s*)\d+\.\s+(.+)$/);
      if (match) {
        if (!inList) {
          result.push('<ol>');
          inList = true;
        }
        result.push('<li>' + match[2] + '</li>');
      } else {
        if (inList) {
          result.push('</ol>');
          inList = false;
        }
        result.push(lines[i]);
      }
    }
    if (inList) result.push('</ol>');
    return result.join('\n');
  }

  /* ----------------------------------------------------------
     API Communication
  ---------------------------------------------------------- */
  function buildMessages(session) {
    var messages = [];

    // System prompt
    var systemPrompt = state.settings.systemPrompt;
    if (session.agent === "plan") {
      systemPrompt += "\n\nYou are in PLAN mode. Focus on analysis, code exploration, and planning. " +
        "Do not make file edits directly. Instead, explain what changes should be made and why. " +
        "Ask permission before running any commands.";
    } else {
      systemPrompt += "\n\nYou are in BUILD mode. You have full access to execute development tasks. " +
        "Write code, make edits, run commands, and complete the user's requests.";
    }

    systemPrompt += "\n\nEnvironment info:\n- Platform: Browser\n- Date: " + new Date().toDateString() +
      "\n- Model: " + state.settings.model;

    messages.push({ role: "system", content: systemPrompt });

    // Conversation history
    for (var i = 0; i < session.messages.length; i++) {
      var msg = session.messages[i];
      if (msg.role === "user" || msg.role === "assistant") {
        var m = { role: msg.role, content: msg.content || "" };

        // Include tool calls in assistant messages
        if (msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0) {
          m.tool_calls = msg.toolCalls.map(function (tc) {
            return {
              id: tc.id,
              type: "function",
              function: {
                name: tc.name,
                arguments: typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input),
              },
            };
          });
        }

        messages.push(m);

        // Include tool results
        if (msg.role === "assistant" && msg.toolCalls) {
          for (var t = 0; t < msg.toolCalls.length; t++) {
            var tc = msg.toolCalls[t];
            if (tc.output !== undefined) {
              messages.push({
                role: "tool",
                tool_call_id: tc.id,
                content: typeof tc.output === "string" ? tc.output : JSON.stringify(tc.output),
              });
            }
          }
        }
      }
    }

    return messages;
  }

  function sendMessage(text) {
    if (!text.trim() || state.isGenerating) return;
    if (!state.settings.apiKey) {
      showSettingsModal();
      return;
    }

    // Ensure we have a session
    var session = getSession(state.activeSessionId);
    if (!session) {
      session = createSession();
      state.activeSessionId = session.id;
    }

    // Add user message
    var userMsg = {
      role: "user",
      content: text.trim(),
      time: Date.now(),
      agent: state.activeAgent,
    };
    session.messages.push(userMsg);
    session.agent = state.activeAgent;
    session.updatedAt = Date.now();
    saveSessions();

    // Clear input
    dom.messageInput.value = "";
    autoResizeInput();

    // Render
    renderMessages();
    renderSessionList();
    updateHeader();

    // Send to API
    if (state.settings.stream === "true") {
      streamResponse(session);
    } else {
      fetchResponse(session);
    }
  }

  /* --- Streaming Response --- */
  function streamResponse(session) {
    state.isGenerating = true;
    state.abortController = new AbortController();
    updateInputState();

    var messages = buildMessages(session);
    var url = state.settings.baseUrl + "/chat/completions";

    var body = {
      model: state.settings.model,
      messages: messages,
      temperature: state.settings.temperature,
      max_tokens: state.settings.maxTokens,
      stream: true,
    };

    // Create placeholder assistant message
    var assistantMsg = {
      role: "assistant",
      content: "",
      thinking: "",
      toolCalls: [],
      time: Date.now(),
      agent: state.activeAgent,
      model: state.settings.model,
      usage: null,
      cost: 0,
    };
    session.messages.push(assistantMsg);
    renderMessages();

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.settings.apiKey,
      },
      body: JSON.stringify(body),
      signal: state.abortController.signal,
    })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error("API Error (" + response.status + "): " + text);
          });
        }

        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";
        var toolCallBuffers = {};

        function processStream() {
          return reader.read().then(function (result) {
            if (result.done) {
              finishGeneration(session, assistantMsg);
              return;
            }

            buffer += decoder.decode(result.value, { stream: true });
            var lines = buffer.split("\n");
            buffer = lines.pop(); // Keep incomplete line

            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (!line || line === "data: [DONE]") continue;
              if (line.indexOf("data: ") !== 0) continue;

              try {
                var data = JSON.parse(line.substring(6));
                var delta = data.choices && data.choices[0] && data.choices[0].delta;
                if (!delta) continue;

                // Content
                if (delta.content) {
                  assistantMsg.content += delta.content;
                }

                // Reasoning / thinking
                if (delta.reasoning_content) {
                  assistantMsg.thinking += delta.reasoning_content;
                }

                // Tool calls
                if (delta.tool_calls) {
                  for (var tc = 0; tc < delta.tool_calls.length; tc++) {
                    var toolDelta = delta.tool_calls[tc];
                    var idx = toolDelta.index;
                    if (!toolCallBuffers[idx]) {
                      toolCallBuffers[idx] = {
                        id: toolDelta.id || "",
                        name: "",
                        input: "",
                        output: "",
                        status: "running",
                      };
                      assistantMsg.toolCalls.push(toolCallBuffers[idx]);
                    }
                    if (toolDelta.id) toolCallBuffers[idx].id = toolDelta.id;
                    if (toolDelta.function && toolDelta.function.name) {
                      toolCallBuffers[idx].name = toolDelta.function.name;
                    }
                    if (toolDelta.function && toolDelta.function.arguments) {
                      toolCallBuffers[idx].input += toolDelta.function.arguments;
                    }
                  }
                }

                // Usage from final chunk
                if (data.usage) {
                  assistantMsg.usage = data.usage;
                }

                // Finish reason
                if (data.choices && data.choices[0] && data.choices[0].finish_reason) {
                  // Mark tool calls as completed
                  for (var key in toolCallBuffers) {
                    toolCallBuffers[key].status = "completed";
                    // Try to parse input as JSON
                    try {
                      toolCallBuffers[key].input = JSON.parse(toolCallBuffers[key].input);
                    } catch (e) { /* keep as string */ }
                  }
                }
              } catch (e) {
                // Skip malformed chunks
              }
            }

            // Update display
            updateStreamingMessage(session);
            return processStream();
          });
        }

        return processStream();
      })
      .catch(function (err) {
        if (err.name === "AbortError") {
          // User cancelled
          finishGeneration(session, assistantMsg);
          return;
        }

        // Remove the empty assistant message
        if (assistantMsg.content === "" && assistantMsg.toolCalls.length === 0) {
          session.messages.pop();
        }

        // Add error message
        session.messages.push({
          role: "error",
          content: err.message,
          time: Date.now(),
        });
        saveSessions();
        finishGeneration(session, null);
      });
  }

  /* --- Non-streaming Response --- */
  function fetchResponse(session) {
    state.isGenerating = true;
    state.abortController = new AbortController();
    updateInputState();

    var messages = buildMessages(session);
    var url = state.settings.baseUrl + "/chat/completions";

    var body = {
      model: state.settings.model,
      messages: messages,
      temperature: state.settings.temperature,
      max_tokens: state.settings.maxTokens,
      stream: false,
    };

    // Show typing indicator
    showTypingIndicator();

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.settings.apiKey,
      },
      body: JSON.stringify(body),
      signal: state.abortController.signal,
    })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error("API Error (" + response.status + "): " + text);
          });
        }
        return response.json();
      })
      .then(function (data) {
        var choice = data.choices && data.choices[0];
        if (!choice) throw new Error("No response from API");

        var assistantMsg = {
          role: "assistant",
          content: choice.message.content || "",
          thinking: "",
          toolCalls: [],
          time: Date.now(),
          agent: state.activeAgent,
          model: data.model || state.settings.model,
          usage: data.usage || null,
          cost: 0,
        };

        // Tool calls
        if (choice.message.tool_calls) {
          for (var i = 0; i < choice.message.tool_calls.length; i++) {
            var tc = choice.message.tool_calls[i];
            var input = tc.function.arguments;
            try { input = JSON.parse(input); } catch (e) { /* keep as string */ }
            assistantMsg.toolCalls.push({
              id: tc.id,
              name: tc.function.name,
              input: input,
              output: "",
              status: "completed",
            });
          }
        }

        if (data.usage) {
          assistantMsg.usage = data.usage;
          session.totalTokens.input += data.usage.prompt_tokens || 0;
          session.totalTokens.output += data.usage.completion_tokens || 0;
        }

        session.messages.push(assistantMsg);
        session.updatedAt = Date.now();
        autoTitle(session);
        saveSessions();
        finishGeneration(session, assistantMsg);
      })
      .catch(function (err) {
        if (err.name === "AbortError") {
          finishGeneration(session, null);
          return;
        }
        session.messages.push({
          role: "error",
          content: err.message,
          time: Date.now(),
        });
        saveSessions();
        finishGeneration(session, null);
      });
  }

  function updateStreamingMessage(session) {
    renderMessages();
    scrollToBottom();
  }

  function finishGeneration(session, assistantMsg) {
    state.isGenerating = false;
    state.abortController = null;

    if (assistantMsg && assistantMsg.usage) {
      session.totalTokens.input += assistantMsg.usage.prompt_tokens || 0;
      session.totalTokens.output += assistantMsg.usage.completion_tokens || 0;
    }

    session.updatedAt = Date.now();
    autoTitle(session);
    saveSessions();
    updateInputState();
    renderMessages();
    renderSessionList();
    updateTokenInfo();
  }

  function cancelGeneration() {
    if (state.abortController) {
      state.abortController.abort();
      state.abortController = null;
    }
    state.isGenerating = false;
    updateInputState();
  }

  function showTypingIndicator() {
    var indicator = document.createElement("div");
    indicator.className = "message assistant";
    indicator.id = "typing-indicator";
    indicator.innerHTML =
      '<div class="message-header"><span class="message-role assistant">Assistant</span></div>' +
      '<div class="message-body"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
    dom.messagesArea.appendChild(indicator);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    var el = document.getElementById("typing-indicator");
    if (el) el.remove();
  }

  /* ----------------------------------------------------------
     Auto-title session from first user message
  ---------------------------------------------------------- */
  function autoTitle(session) {
    if (session.title !== "New Session") return;
    var firstUser = null;
    for (var i = 0; i < session.messages.length; i++) {
      if (session.messages[i].role === "user") {
        firstUser = session.messages[i];
        break;
      }
    }
    if (firstUser) {
      var title = firstUser.content.substring(0, 60);
      if (firstUser.content.length > 60) title += "...";
      session.title = title;
    }
  }

  /* ----------------------------------------------------------
     UI Updates
  ---------------------------------------------------------- */
  function updateHeader() {
    var session = getSession(state.activeSessionId);
    dom.sessionTitle.textContent = session ? session.title : "New Session";
    dom.modelNameDisplay.textContent = state.settings.model || "No model set";
  }

  function updateInputState() {
    if (state.isGenerating) {
      dom.sendBtn.classList.add("hidden");
      dom.stopBtn.classList.remove("hidden");
      dom.messageInput.disabled = true;
    } else {
      dom.sendBtn.classList.remove("hidden");
      dom.stopBtn.classList.add("hidden");
      dom.messageInput.disabled = false;
      dom.messageInput.focus();
    }
    removeTypingIndicator();
  }

  function updateAgentButtons() {
    for (var i = 0; i < dom.agentBtns.length; i++) {
      var btn = dom.agentBtns[i];
      if (btn.getAttribute("data-agent") === state.activeAgent) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  }

  function updateTokenInfo() {
    var session = getSession(state.activeSessionId);
    if (!session || (session.totalTokens.input === 0 && session.totalTokens.output === 0)) {
      dom.tokenInfo.textContent = "";
      return;
    }
    dom.tokenInfo.textContent =
      "Session: " + (session.totalTokens.input + session.totalTokens.output).toLocaleString() + " tokens";
  }

  function updateWelcome() {
    var actionsEl = document.getElementById("welcome-actions");
    if (state.settings.apiKey) {
      actionsEl.innerHTML = '<p class="setup-hint">Send a message to get started</p>';
    } else {
      actionsEl.innerHTML =
        '<p class="setup-hint">Configure your API settings to get started</p>' +
        '<button class="btn btn-primary" id="welcome-settings-btn">Open Settings</button>';
      var btn = document.getElementById("welcome-settings-btn");
      if (btn) {
        btn.addEventListener("click", showSettingsModal);
      }
    }
  }

  function autoResizeInput() {
    var el = dom.messageInput;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  function scrollToBottom() {
    dom.messagesArea.scrollTop = dom.messagesArea.scrollHeight;
  }

  /* ----------------------------------------------------------
     Settings Modal
  ---------------------------------------------------------- */
  function showSettingsModal() {
    populateSettingsForm();
    dom.settingsOverlay.classList.remove("hidden");
  }

  function hideSettingsModal() {
    dom.settingsOverlay.classList.add("hidden");
  }

  /* ----------------------------------------------------------
     Export
  ---------------------------------------------------------- */
  function showExportModal() {
    dom.exportOverlay.classList.remove("hidden");
  }

  function hideExportModal() {
    dom.exportOverlay.classList.add("hidden");
  }

  function exportAsJson() {
    var session = getSession(state.activeSessionId);
    if (!session) return;
    var data = JSON.stringify(session, null, 2);
    downloadFile(session.title + ".json", data, "application/json");
    hideExportModal();
  }

  function exportAsMarkdown() {
    var session = getSession(state.activeSessionId);
    if (!session) return;
    var md = "# " + session.title + "\n\n";
    md += "**Agent:** " + (session.agent || "build") + "  \n";
    md += "**Model:** " + state.settings.model + "  \n";
    md += "**Created:** " + new Date(session.createdAt).toLocaleString() + "\n\n---\n\n";

    for (var i = 0; i < session.messages.length; i++) {
      var msg = session.messages[i];
      var role = msg.role === "user" ? "User" : msg.role === "assistant" ? "Assistant" : "Error";
      md += "## " + role + "\n\n";
      if (msg.thinking) {
        md += "<details><summary>Thinking</summary>\n\n" + msg.thinking + "\n\n</details>\n\n";
      }
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        for (var t = 0; t < msg.toolCalls.length; t++) {
          var tc = msg.toolCalls[t];
          md += "**Tool: " + tc.name + "**\n";
          md += "```json\n" + JSON.stringify(tc.input, null, 2) + "\n```\n\n";
          if (tc.output) {
            md += "**Result:**\n```\n" + (typeof tc.output === "string" ? tc.output : JSON.stringify(tc.output)) + "\n```\n\n";
          }
        }
      }
      md += (msg.content || "") + "\n\n---\n\n";
    }

    downloadFile(session.title + ".md", md, "text/markdown");
    hideExportModal();
  }

  function downloadFile(name, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ----------------------------------------------------------
     Edit Session Title
  ---------------------------------------------------------- */
  function editTitle() {
    var session = getSession(state.activeSessionId);
    if (!session) return;
    var newTitle = prompt("Session title:", session.title);
    if (newTitle !== null && newTitle.trim()) {
      session.title = newTitle.trim();
      saveSessions();
      updateHeader();
      renderSessionList();
    }
  }

  /* ----------------------------------------------------------
     Helpers
  ---------------------------------------------------------- */
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatTime(date) {
    var h = date.getHours().toString().padStart(2, "0");
    var m = date.getMinutes().toString().padStart(2, "0");
    return h + ":" + m;
  }

  function formatRelativeTime(date) {
    var now = Date.now();
    var diff = now - date.getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return mins + "m";
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + "h";
    var days = Math.floor(hours / 24);
    if (days < 30) return days + "d";
    return date.toLocaleDateString();
  }

  /* ----------------------------------------------------------
     Event Binding
  ---------------------------------------------------------- */
  function bindEvents() {
    // Settings
    dom.openSettings.addEventListener("click", showSettingsModal);
    dom.closeSettings.addEventListener("click", hideSettingsModal);
    dom.settingsOverlay.addEventListener("click", function (e) {
      if (e.target === dom.settingsOverlay) hideSettingsModal();
    });

    dom.saveSettings.addEventListener("click", function () {
      readSettingsForm();
      saveSettings();
      applyTheme();
      updateHeader();
      updateWelcome();
      hideSettingsModal();
    });

    dom.resetSettings.addEventListener("click", function () {
      state.settings = Object.assign({}, DEFAULT_SETTINGS);
      populateSettingsForm();
    });

    dom.settingTemperature.addEventListener("input", function () {
      dom.temperatureValue.textContent = this.value;
    });

    // Export
    dom.exportBtn.addEventListener("click", showExportModal);
    dom.closeExport.addEventListener("click", hideExportModal);
    dom.exportOverlay.addEventListener("click", function (e) {
      if (e.target === dom.exportOverlay) hideExportModal();
    });
    dom.exportJson.addEventListener("click", exportAsJson);
    dom.exportMd.addEventListener("click", exportAsMarkdown);

    // Sidebar
    dom.sidebarToggle.addEventListener("click", function () {
      dom.sidebar.classList.toggle("open");
    });

    // New session
    dom.newSessionBtn.addEventListener("click", function () {
      var session = createSession();
      state.activeSessionId = session.id;
      renderMessages();
      renderSessionList();
      updateHeader();
      dom.messageInput.focus();
      dom.sidebar.classList.remove("open");
    });

    // Search sessions
    dom.sessionSearch.addEventListener("input", renderSessionList);

    // Edit title
    dom.editTitleBtn.addEventListener("click", editTitle);

    // Agent buttons
    for (var i = 0; i < dom.agentBtns.length; i++) {
      dom.agentBtns[i].addEventListener("click", function () {
        state.activeAgent = this.getAttribute("data-agent");
        updateAgentButtons();
        var session = getSession(state.activeSessionId);
        if (session) {
          session.agent = state.activeAgent;
          saveSessions();
          renderSessionList();
        }
      });
    }

    // Send message
    dom.sendBtn.addEventListener("click", function () {
      sendMessage(dom.messageInput.value);
    });

    dom.stopBtn.addEventListener("click", cancelGeneration);

    // Input handling
    dom.messageInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(dom.messageInput.value);
      }
    });

    dom.messageInput.addEventListener("input", autoResizeInput);

    // Keyboard shortcuts
    document.addEventListener("keydown", function (e) {
      // Ctrl/Cmd + K = new session
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        var session = createSession();
        state.activeSessionId = session.id;
        renderMessages();
        renderSessionList();
        updateHeader();
        dom.messageInput.focus();
      }

      // Escape = close modals
      if (e.key === "Escape") {
        hideSettingsModal();
        hideExportModal();
        dom.sidebar.classList.remove("open");
      }

      // Tab = switch agent
      if (e.key === "Tab" && !e.target.closest(".modal") && !e.target.closest("input") && !e.target.closest("textarea") && !e.target.closest("select")) {
        e.preventDefault();
        state.activeAgent = state.activeAgent === "build" ? "plan" : "build";
        updateAgentButtons();
        var activeSession = getSession(state.activeSessionId);
        if (activeSession) {
          activeSession.agent = state.activeAgent;
          saveSessions();
          renderSessionList();
        }
      }
    });

    // Theme listener
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () {
      if (state.settings.theme === "system") applyTheme();
    });
  }

  /* ----------------------------------------------------------
     Initialize
  ---------------------------------------------------------- */
  function init() {
    cacheDom();
    loadSettings();
    loadSessions();
    applyTheme();
    bindEvents();

    // Restore last active session or create one
    if (state.sessions.length > 0) {
      state.activeSessionId = state.sessions[0].id;
      state.activeAgent = state.sessions[0].agent || "build";
    }

    updateAgentButtons();
    renderSessionList();
    renderMessages();
    updateHeader();
    updateTokenInfo();
    updateWelcome();

    // Auto-open settings if no API key
    if (!state.settings.apiKey) {
      // Don't auto-open, let welcome screen guide them
    }
  }

  // Run on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
