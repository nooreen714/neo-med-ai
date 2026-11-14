    // =========================================================================
    // ENTER YOUR GEMINI API KEY HERE
    // =========================================================================
    const GEMINI_API_KEY = "AQ.Ab8RN6Iopy-YtI9x8TyqP9tGZm1Apbmdz4rSLge1E0hsE5PsOg";

    function getActiveApiKey() {
      const saved = localStorage.getItem('gemini_api_key');
      if (saved && saved.trim() !== '') return saved.trim();
      if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") return GEMINI_API_KEY.trim();
      return '';
    }

    function updateApiKeyStatusIndicator() {
      const key = getActiveApiKey();
      const dot = document.getElementById('apiKeyStatusDot');
      const label = document.getElementById('apiKeyStatusLabel');
      const settingsInput = document.getElementById('settingsApiKeyInput');
      if (key) {
        dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
        label.textContent = 'Gemini API Connected';
        if (settingsInput) settingsInput.value = key;
      } else {
        dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
        label.textContent = 'Set Gemini API Key';
      }
    }

    // Core Gemini 2.5 Flash API caller (supports both text & multimodal base64 images)
    async function callGeminiAPI({ prompt, systemInstruction = '', imageBase64 = null, imageMimeType = 'image/jpeg' }) {
      const apiKey = getActiveApiKey();
      if (!apiKey) {
        openApiKeyModal();
        return "Please enter your **Google Gemini API Key** in the popup or in **Settings → Gemini AI Configuration** to enable live AI responses.";
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

      const parts = [{ text: prompt }];
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: imageMimeType,
            data: imageBase64
          }
        });
      }

      const payload = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 900
        }
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          const errMsg = data?.error?.message || `HTTP ${res.status}`;
          throw new Error(errMsg);
        }

        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return reply || "I received an empty response. Please try phrasing your question again.";
      } catch (err) {
        console.error('Gemini API Error:', err);
        return `**API Connection Notice:** ${err.message}. Please verify your Gemini API key in Settings.`;
      }
    }

    // Lightweight Markdown-to-HTML formatter for clean AI output
    function formatAiText(text) {
      if (!text) return '';
      let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Bold **text**
      escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Convert bullet lists
      const lines = escaped.split('\n');
      let html = '';
      let inList = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          if (!inList) {
            html += '<ul>';
            inList = true;
          }
          html += `<li>${trimmed.substring(2)}</li>`;
        } else {
          if (inList) {
            html += '</ul>';
            inList = false;
          }
          if (trimmed.length > 0) {
            html += `<p>${trimmed}</p>`;
          }
        }
      }
      if (inList) html += '</ul>';
      return html;
    }

    // =========================================================================
    // NAVIGATION & SIDEBAR MENU CONFIGURATION (All 10 Views)
    // =========================================================================
    const NAV_ITEMS = [
      { id: 'home', label: 'Home', icon: 'home', iconColor: 'text-sky-400', activeBg: 'bg-[#1456d9]', activeText: 'text-white' },
      { id: 'symptom', label: 'Symptom Checker', icon: 'stethoscope', iconColor: 'text-[#00d2ff]', activeBg: 'bg-[#0284c7]', activeText: 'text-white' },
      { id: 'dashboard', label: 'Health Dashboard', icon: 'bar-chart-2', iconColor: 'text-purple-400', activeBg: 'bg-[#7e22ce]', activeText: 'text-white' },
      { id: 'medicine', label: 'Medicine Scanner', icon: 'pill', iconColor: 'text-cyan-400', activeBg: 'bg-[#0284c7]', activeText: 'text-white' },
      { id: 'wellness', label: 'Mental Wellness', icon: 'heart', iconColor: 'text-pink-400', activeBg: 'bg-[#db2777]', activeText: 'text-white' },
      { id: 'emergency', label: 'Emergency Help', icon: 'alert-triangle', iconColor: 'text-red-400', activeBg: 'bg-[#a81c1c]', activeText: 'text-white' },
      { id: 'records', label: 'Health Records', icon: 'file-text', iconColor: 'text-amber-400', activeBg: 'bg-[#b45309]', activeText: 'text-white' },
      { id: 'hospitals', label: 'Find Hospitals', icon: 'map-pin', iconColor: 'text-cyan-400', activeBg: 'bg-[#0284c7]', activeText: 'text-white' },
      { id: 'coach', label: 'AI Health Coach', icon: 'user-check', iconColor: 'text-emerald-400', activeBg: 'bg-[#16a34a]', activeText: 'text-white' },
      { id: 'settings', label: 'Settings', icon: 'settings', iconColor: 'text-slate-400', activeBg: 'bg-[#1e293b]', activeText: 'text-white' }
    ];

    let currentTab = 'home';

    function renderSidebarNav() {
      const nav = document.getElementById('sidebarNav');
      nav.innerHTML = NAV_ITEMS.map(item => {
        const isActive = item.id === currentTab;
        const rowClass = isActive
          ? `${item.activeBg} ${item.activeText} font-semibold shadow-md`
          : 'text-slate-300 hover:bg-[#0e1c36] hover:text-white font-medium';
        const iconClass = isActive ? 'text-white' : item.iconColor;
        return `
          <button onclick="navigateTo('${item.id}')" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] transition cursor-pointer ${rowClass}">
            <span class="flex items-center gap-3">
              <i data-lucide="${item.icon}" class="w-4 h-4 ${iconClass}"></i>
              <span>${item.label}</span>
            </span>
            ${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ''}
          </button>
        `;
      }).join('');
      lucide.createIcons();
    }

    function navigateTo(tabId) {
      currentTab = tabId;
      document.querySelectorAll('.page-view').forEach(sec => sec.classList.add('hidden'));
      const target = document.getElementById(`page-${tabId}`);
      if (target) target.classList.remove('hidden');

      renderSidebarNav();

      if (tabId === 'dashboard') {
        setTimeout(renderAllCharts, 40);
      }

      // Close mobile sidebar if open
      const sidebar = document.getElementById('leftSidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      if (!sidebar.classList.contains('-translate-x-full') && window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      }
    }

    function toggleMobileSidebar() {
      const sidebar = document.getElementById('leftSidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      sidebar.classList.toggle('-translate-x-full');
      backdrop.classList.toggle('hidden');
    }

    // =========================================================================
    // PAGE 1: HOME — DR. NEO VOICE, CHAT & SKIN SCANNER
    // =========================================================================
    function speakHeroGreeting() {
      const control = document.getElementById('heroVoiceControl');
      const label = document.getElementById('heroVoiceLabel');
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Hello Aarav! I am Dr. Neo, your AI Health Assistant. I can help you with your health! You can ask me about symptoms, medicines, treatments and more.");
        utterance.rate = 1.02;
        utterance.pitch = 1.05;
        utterance.onstart = () => {
          control.classList.add('speaking');
          label.classList.remove('hidden');
        };
        utterance.onend = () => {
          control.classList.remove('speaking');
          label.classList.add('hidden');
        };
        window.speechSynthesis.speak(utterance);
      } else {
        showToast("Dr. Neo: Hello Aarav! How can I help you with your health today?");
      }
    }

    function startVoiceRecognition(inputId, btnId) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast("Voice recognition is not supported in this browser. Please type your query.");
        return;
      }
      const recognition = new SpeechRecognition();
      const btn = document.getElementById(btnId);
      recognition.lang = 'en-US';
      recognition.onstart = () => {
        btn.classList.add('animate-pulse', 'ring-4', 'ring-purple-400/50');
        showToast("Listening... Speak now");
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById(inputId).value = transcript;
        if (inputId === 'homeChatInput') sendHomeChat();
      };
      recognition.onend = () => {
        btn.classList.remove('animate-pulse', 'ring-4', 'ring-purple-400/50');
      };
      recognition.start();
    }

    function appendHomeMessage(sender, htmlContent, isImage = false) {
      const thread = document.getElementById('homeChatThread');
      thread.classList.remove('hidden');

      const bubble = document.createElement('div');
      if (sender === 'user') {
        bubble.className = 'flex justify-end';
        bubble.innerHTML = `
          <div class="rounded-2xl rounded-br-sm bg-[#1456d9] text-white px-4 py-2.5 text-sm max-w-lg shadow-md">
            ${htmlContent}
          </div>
        `;
      } else {
        bubble.className = 'flex justify-start';
        bubble.innerHTML = `
          <div class="rounded-2xl rounded-bl-sm bg-[#0c1c36] border border-[#1d355b] text-slate-200 px-4 py-3 text-sm max-w-2xl shadow-md ai-prose">
            <div class="flex items-center gap-2 text-[#00d2ff] font-bold text-xs mb-1">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
              <span>Dr. Neo AI</span>
            </div>
            <div>${htmlContent}</div>
          </div>
        `;
      }
      thread.appendChild(bubble);
      lucide.createIcons();
      thread.scrollTop = thread.scrollHeight;
      return bubble;
    }

    async function sendHomeChat(overrideText = null) {
      const input = document.getElementById('homeChatInput');
      const text = (overrideText || input.value).trim();
      if (!text) return;
      if (!overrideText) input.value = '';

      appendHomeMessage('user', text.replace(/</g, '&lt;'));
      const loadingBubble = appendHomeMessage('ai', '<span class="text-cyan-400 animate-pulse">Dr. Neo is analyzing your question...</span>');

      const reply = await callGeminiAPI({
        prompt: text,
        systemInstruction: "You are Dr. Neo, a friendly, knowledgeable, and empathetic AI Health Assistant for Aarav. Provide clear, concise, structured medical guidance with bullet points. Always advise consulting a licensed healthcare professional for diagnosis."
      });

      loadingBubble.querySelector('div > div:last-child').innerHTML = formatAiText(reply);
    }

    function triggerHomeQuickTopic(promptText) {
      sendHomeChat(promptText);
    }

    function handleSkinPhotoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function (e) {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1];
        appendHomeMessage('user', `<div class="space-y-1.5"><div class="text-xs opacity-90">Uploaded skin photo for AI analysis:</div><img src="${dataUrl}" class="max-h-36 rounded-lg border border-white/20" /></div>`);
        const loadingBubble = appendHomeMessage('ai', '<span class="text-cyan-400 animate-pulse">Dr. Neo is examining your skin photo...</span>');

        const reply = await callGeminiAPI({
          prompt: "Please examine this skin image and provide possible dermatological observations, gentle care advice, and signs that warrant seeing a dermatologist.",
          systemInstruction: "You are Dr. Neo, an AI Health Assistant. Analyze the uploaded skin image carefully, highlight possible common causes, general soothing care, and red flags requiring an in-person dermatologist visit.",
          imageBase64: base64Data,
          imageMimeType: file.type || 'image/jpeg'
        });

        loadingBubble.querySelector('div > div:last-child').innerHTML = formatAiText(reply);
      };
      reader.readAsDataURL(file);
    }

    // =========================================================================
    // PAGE 2: SYMPTOM CHECKER
    // =========================================================================
    const COMMON_SYMPTOMS = [
      'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea',
      'Sore Throat', 'Body Ache', 'Shortness of Breath', 'Dizziness', 'Stomach Pain'
    ];
    let activeSymptomSessionIdx = 0;

    function renderSymptomCheckerSetup() {
      const list = document.getElementById('symptomSessionList');
      list.innerHTML = Array.from({ length: 10 }).map((_, idx) => {
        const active = idx === activeSymptomSessionIdx;
        return `
          <button onclick="selectSymptomSession(${idx})" class="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
            active ? 'bg-[#00a8e8] text-white font-semibold shadow-md' : 'text-slate-300 hover:bg-[#0e1d38]'
          }">
            Medical Assistant Chat
          </button>
        `;
      }).join('');

      const tags = document.getElementById('commonSymptomTags');
      tags.innerHTML = COMMON_SYMPTOMS.map(sym => `
        <button onclick="appendAndSendSymptom('${sym}')" class="px-3 py-1.5 rounded-full bg-[#0c1a30] hover:bg-[#142b4f] border border-[#1d355b] text-xs text-slate-200 transition cursor-pointer">
          ${sym}
        </button>
      `).join('');
    }

    function selectSymptomSession(idx) {
      activeSymptomSessionIdx = idx;
      renderSymptomCheckerSetup();
    }

    function createNewSymptomSession() {
      activeSymptomSessionIdx = 0;
      renderSymptomCheckerSetup();
      document.getElementById('symptomChatMessages').innerHTML = `
        <div class="rounded-2xl bg-[#0c1a30] border border-[#1c3152] p-4 text-sm text-slate-300 max-w-2xl">
          <div class="flex items-center gap-2 text-[#00d2ff] font-semibold mb-1">
            <i data-lucide="stethoscope" class="w-4 h-4"></i>
            <span>New Symptom Analysis Session</span>
          </div>
          Describe your current symptoms below and I will provide structured medical insights.
        </div>
      `;
      lucide.createIcons();
    }

    function appendAndSendSymptom(symptom) {
      const input = document.getElementById('symptomInput');
      input.value = input.value ? `${input.value}, ${symptom}` : `I am experiencing ${symptom.toLowerCase()}`;
      sendSymptomQuery();
    }

    async function sendSymptomQuery() {
      const input = document.getElementById('symptomInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      const box = document.getElementById('symptomChatMessages');
      box.innerHTML += `
        <div class="flex justify-end">
          <div class="rounded-2xl rounded-br-sm bg-[#0284c7] text-white px-4 py-2.5 text-sm max-w-lg">
            ${text.replace(/</g, '&lt;')}
          </div>
        </div>
      `;

      const loadId = 'sym-load-' + Date.now();
      box.innerHTML += `
        <div id="${loadId}" class="flex justify-start">
          <div class="rounded-2xl rounded-bl-sm bg-[#0c1a30] border border-[#1c3152] text-slate-200 px-4 py-3 text-sm max-w-2xl ai-prose">
            <span class="text-[#00d2ff] animate-pulse">Analyzing symptoms with Dr. Neo AI...</span>
          </div>
        </div>
      `;
      box.scrollTop = box.scrollHeight;

      const reply = await callGeminiAPI({
        prompt: `Patient reports symptoms: ${text}`,
        systemInstruction: "You are Dr. Neo, a clinical symptom triage AI. Structure your response cleanly with: 1) **Possible Causes**, 2) **Recommended Self-Care**, and 3) **When to See a Doctor Immediately**. Keep it empathetic, clear, and concise."
      });

      document.getElementById(loadId).querySelector('div').innerHTML = formatAiText(reply);
      box.scrollTop = box.scrollHeight;
    }

    // =========================================================================
    // PAGE 3: HEALTH DASHBOARD — INTERACTIVE CUBIC SVG CHARTS
    // =========================================================================
    const CHART_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const DASHBOARD_CHARTS = [
      {
        containerId: 'chart-heart',
        data: [70, 74, 72, 75, 71, 73, 72],
        min: 60,
        max: 85,
        stroke: '#f43f5e',
        gradId: 'gradHeart',
        gradTop: 'rgba(244, 63, 94, 0.35)',
        gradBottom: 'rgba(244, 63, 94, 0.0)'
      },
      {
        containerId: 'chart-sleep',
        data: [7.2, 7.8, 7.5, 7.0, 8.1, 8.0, 7.6],
        min: 5.5,
        max: 9.5,
        stroke: '#a855f7',
        gradId: 'gradSleep',
        gradTop: 'rgba(168, 85, 247, 0.35)',
        gradBottom: 'rgba(168, 85, 247, 0.0)'
      },
      {
        containerId: 'chart-steps',
        data: [7800, 9200, 8100, 8500, 9000, 7600, 8432],
        min: 5000,
        max: 11000,
        stroke: '#10b981',
        gradId: 'gradSteps',
        gradTop: 'rgba(16, 185, 129, 0.35)',
        gradBottom: 'rgba(16, 185, 129, 0.0)'
      }
    ];

    function buildSmoothPath(points) {
      if (points.length === 0) return '';
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpx1 = p0.x + (p1.x - p0.x) * 0.45;
        const cpy1 = p0.y;
        const cpx2 = p0.x + (p1.x - p0.x) * 0.55;
        const cpy2 = p1.y;
        d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.x} ${p1.y}`;
      }
      return d;
    }

    function renderInteractiveChart(cfg) {
      const container = document.getElementById(cfg.containerId);
      if (!container) return;
      const width = container.clientWidth || 720;
      const height = 200;
      const padLeft = 24;
      const padRight = 24;
      const padTop = 22;
      const padBottom = 30;
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      const points = cfg.data.map((val, idx) => {
        const x = padLeft + (idx / (cfg.data.length - 1)) * plotW;
        const norm = (val - cfg.min) / (cfg.max - cfg.min);
        const y = padTop + plotH - norm * plotH;
        return { x, y, val, day: CHART_DAYS[idx] };
      });

      const linePath = buildSmoothPath(points);
      const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + plotH} L ${points[0].x} ${padTop + plotH} Z`;

      // Default highlight on Thu (index 3) matching video
      const defaultPt = points[3];

      container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible select-none">
          <defs>
            <linearGradient id="${cfg.gradId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${cfg.gradTop}" />
              <stop offset="100%" stop-color="${cfg.gradBottom}" />
            </linearGradient>
          </defs>

          <!-- Horizontal subtle grid lines -->
          <line x1="${padLeft}" y1="${padTop}" x2="${width - padRight}" y2="${padTop}" stroke="rgba(148,163,184,0.08)" stroke-dasharray="4 4" />
          <line x1="${padLeft}" y1="${padTop + plotH / 2}" x2="${width - padRight}" y2="${padTop + plotH / 2}" stroke="rgba(148,163,184,0.08)" stroke-dasharray="4 4" />
          <line x1="${padLeft}" y1="${padTop + plotH}" x2="${width - padRight}" y2="${padTop + plotH}" stroke="rgba(148,163,184,0.12)" />

          <!-- Gradient Fill & Smooth Curve -->
          <path d="${areaPath}" fill="url(#${cfg.gradId})" />
          <path d="${linePath}" fill="none" stroke="${cfg.stroke}" stroke-width="3" stroke-linecap="round" />

          <!-- Vertical Crosshair Line -->
          <line id="${cfg.containerId}-crosshair" x1="${defaultPt.x}" y1="${padTop}" x2="${defaultPt.x}" y2="${padTop + plotH}" stroke="rgba(255,255,255,0.28)" stroke-width="1.2" stroke-dasharray="3 3" />

          <!-- Active Point Dot -->
          <circle id="${cfg.containerId}-dot" cx="${defaultPt.x}" cy="${defaultPt.y}" r="5.5" fill="#ffffff" stroke="${cfg.stroke}" stroke-width="3" />

          <!-- Day Labels -->
          ${points.map(p => `
            <text x="${p.x}" y="${height - 6}" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="500">${p.day}</text>
          `).join('')}

          <!-- Invisible Hover Columns for Smooth Tracking -->
          ${points.map((p, idx) => {
            const colW = plotW / points.length;
            return `<rect x="${p.x - colW / 2}" y="0" width="${colW}" height="${height}" fill="transparent" class="cursor-crosshair" onmouseenter="updateChartTooltip('${cfg.containerId}', ${idx})" />`;
          }).join('')}
        </svg>

        <!-- Dark Floating Tooltip -->
        <div id="${cfg.containerId}-tooltip" style="left: ${Math.min(Math.max(defaultPt.x - 42, 8), width - 98)}px; top: ${Math.max(defaultPt.y - 54, 4)}px;" class="pointer-events-none absolute bg-[#081224]/95 border border-[#233d66] rounded-lg px-3 py-1.5 shadow-xl text-[11px] transition-all duration-150">
          <div class="text-slate-300 font-semibold">${defaultPt.day}</div>
          <div class="text-white font-bold mt-0.5">value : <span style="color:${cfg.stroke}">${defaultPt.val}</span></div>
        </div>
      `;
      container._points = points;
      container._stroke = cfg.stroke;
      container._width = width;
    }

    function updateChartTooltip(containerId, idx) {
      const container = document.getElementById(containerId);
      if (!container || !container._points) return;
      const pt = container._points[idx];
      const crosshair = document.getElementById(`${containerId}-crosshair`);
      const dot = document.getElementById(`${containerId}-dot`);
      const tooltip = document.getElementById(`${containerId}-tooltip`);

      if (crosshair) {
        crosshair.setAttribute('x1', pt.x);
        crosshair.setAttribute('x2', pt.x);
      }
      if (dot) {
        dot.setAttribute('cx', pt.x);
        dot.setAttribute('cy', pt.y);
      }
      if (tooltip) {
        tooltip.style.left = `${Math.min(Math.max(pt.x - 42, 8), container._width - 98)}px`;
        tooltip.style.top = `${Math.max(pt.y - 54, 4)}px`;
        tooltip.innerHTML = `
          <div class="text-slate-300 font-semibold">${pt.day}</div>
          <div class="text-white font-bold mt-0.5">value : <span style="color:${container._stroke}">${pt.val}</span></div>
        `;
      }
    }

    function renderAllCharts() {
      DASHBOARD_CHARTS.forEach(renderInteractiveChart);
    }
    window.addEventListener('resize', () => {
      if (currentTab === 'dashboard') renderAllCharts();
    });

    // =========================================================================
    // PAGE 4: MEDICINE SCANNER (TEXT SEARCH + MULTIMODAL PHOTO SCAN)
    // =========================================================================
    function quickSearchMedicine(name) {
      document.getElementById('medicineSearchInput').value = name;
      searchMedicine();
    }

    async function searchMedicine() {
      const query = document.getElementById('medicineSearchInput').value.trim();
      if (!query) {
        showToast('Please enter a medicine name or upload a photo.');
        return;
      }
      const resBox = document.getElementById('medicineResultContainer');
      resBox.classList.remove('hidden');
      resBox.innerHTML = `<div class="flex items-center gap-2 text-cyan-400 text-sm animate-pulse"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Fetching clinical monograph for "${query}" via Gemini AI...</span></div>`;
      lucide.createIcons();

      const reply = await callGeminiAPI({
        prompt: `Provide a detailed medication summary for: ${query}`,
        systemInstruction: "You are a clinical pharmacist AI. Format the medication guide with clear headings: **Overview & Uses**, **Active Ingredients**, **Typical Adult Dosage**, and **Precautions & Side Effects**. Remind the user to follow their doctor's prescription."
      });

      resBox.innerHTML = `
        <div class="flex items-center justify-between border-b border-[#192f52] pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-cyan-500/15 text-[#00d2ff] flex items-center justify-center">
              <i data-lucide="pill" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white capitalize">${query}</h3>
              <span class="text-[11px] text-cyan-400">AI Pharmaceutical Monograph</span>
            </div>
          </div>
        </div>
        <div class="text-sm text-slate-200 ai-prose">${formatAiText(reply)}</div>
      `;
      lucide.createIcons();
    }

    function handleMedicinePhotoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function (e) {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1];
        const resBox = document.getElementById('medicineResultContainer');
        resBox.classList.remove('hidden');
        resBox.innerHTML = `<div class="flex items-center gap-3 text-cyan-400 text-sm animate-pulse"><i data-lucide="scan-line" class="w-5 h-5"></i><span>Scanning medicine package with Gemini Vision AI...</span></div>`;
        lucide.createIcons();

        const reply = await callGeminiAPI({
          prompt: "Identify this medicine package/tablet strip from the photo. Provide its brand/generic name, active ingredients, primary uses, standard dosage guidelines, and key safety warnings.",
          systemInstruction: "You are an expert AI pharmacist using computer vision. Identify the medication clearly and structure the output into **Identified Medicine**, **Active Ingredients**, **Primary Uses**, **Typical Dosage**, and **Precautions & Side Effects**.",
          imageBase64: base64Data,
          imageMimeType: file.type || 'image/jpeg'
        });

        resBox.innerHTML = `
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-[#192f52] pb-4">
            <img src="${dataUrl}" class="w-24 h-24 object-cover rounded-xl border border-cyan-500/40" />
            <div>
              <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-[#00d2ff] text-[11px] font-semibold">Scanned Package Result</span>
              <h3 class="text-base font-bold text-white mt-1">Medicine Vision Analysis</h3>
              <p class="text-xs text-slate-400">Extracted active ingredients, uses &amp; safety profile</p>
            </div>
          </div>
          <div class="text-sm text-slate-200 ai-prose">${formatAiText(reply)}</div>
        `;
        lucide.createIcons();
      };
      reader.readAsDataURL(file);
    }

    // =========================================================================
    // PAGE 5: MENTAL WELLNESS
    // =========================================================================
    const MOODS = [
      { id: 'Great', icon: 'smile-plus', activeBg: 'bg-emerald-500 border-emerald-400 text-white' },
      { id: 'Good', icon: 'smile', activeBg: 'bg-cyan-500 border-cyan-400 text-white' },
      { id: 'Okay', icon: 'meh', activeBg: 'bg-amber-500 border-amber-400 text-white' },
      { id: 'Low', icon: 'frown', activeBg: 'bg-indigo-500 border-indigo-400 text-white' },
      { id: 'Stressed', icon: 'angry', activeBg: 'bg-[#ef4444] border-red-400 text-white' }
    ];

    const WELLNESS_EXERCISES = [
      { title: 'Deep Breathing', duration: '5 min', mins: 5, icon: 'wind', color: 'text-cyan-400 bg-cyan-500/15', desc: 'Calm your nervous system with guided breathing exercises' },
      { title: 'Mindfulness Meditation', duration: '10 min', mins: 10, icon: 'sparkles', color: 'text-purple-400 bg-purple-500/15', desc: 'Focus on the present moment and reduce anxiety' },
      { title: 'Gratitude Journal', duration: '5 min', mins: 5, icon: 'book-open', color: 'text-amber-400 bg-amber-500/15', desc: 'Write down three things you are grateful for today' },
      { title: 'Body Scan', duration: '15 min', mins: 15, icon: 'activity', color: 'text-emerald-400 bg-emerald-500/15', desc: 'Progressive muscle relaxation from head to toe' }
    ];

    let selectedMood = null;
    let exerciseInterval = null;

    function renderMentalWellness() {
      const grid = document.getElementById('moodSelectorGrid');
      grid.innerHTML = MOODS.map(m => {
        const isSelected = selectedMood === m.id;
        return `
          <button onclick="selectMood('${m.id}')" class="rounded-xl p-3 sm:p-4 border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
            isSelected
              ? `${m.activeBg} shadow-lg scale-[1.02]`
              : 'bg-[#081326] hover:bg-[#0f203d] border-[#182e52] text-slate-300'
          }">
            <i data-lucide="${m.icon}" class="w-6 h-6"></i>
            <span class="text-xs font-semibold">${m.id}</span>
          </button>
        `;
      }).join('');

      const exList = document.getElementById('wellnessExercisesList');
      exList.innerHTML = WELLNESS_EXERCISES.map((ex, i) => `
        <div class="neo-card rounded-2xl p-4 sm:p-5 space-y-3">
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl ${ex.color} flex items-center justify-center shrink-0">
              <i data-lucide="${ex.icon}" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-white">${ex.title}</h4>
                <span class="text-xs font-semibold text-[#00d2ff]">${ex.duration}</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">${ex.desc}</p>
            </div>
          </div>
          <button onclick="startWellnessExercise(${i})" class="w-full py-2.5 rounded-xl bg-[#071122] hover:bg-[#0e1f3d] border border-[#1a3052] text-xs font-semibold text-white transition cursor-pointer">
            Start
          </button>
        </div>
      `).join('');
      lucide.createIcons();
    }

    function selectMood(moodId) {
      selectedMood = moodId;
      renderMentalWellness();
      const box = document.getElementById('moodDetailBox');
      box.classList.remove('hidden');
      document.getElementById('selectedMoodBadge').textContent = `Selected mood: ${moodId}`;
    }

    async function getMentalWellnessSupport() {
      const notes = document.getElementById('moodReflectionInput').value.trim();
      const respBox = document.getElementById('wellnessAiResponse');
      respBox.classList.remove('hidden');
      respBox.innerHTML = `<span class="text-cyan-400 animate-pulse">Dr. Neo is preparing personalized emotional support...</span>`;

      const reply = await callGeminiAPI({
        prompt: `User's current mood: ${selectedMood || 'Stressed'}. Additional thoughts: ${notes || 'Feeling overwhelmed today and looking for calm.'}`,
        systemInstruction: "You are a warm, compassionate mental wellness AI companion. Validate the user's feelings and offer 3 practical, calming grounding steps they can do right now."
      });

      respBox.innerHTML = formatAiText(reply);
    }

    function startWellnessExercise(idx) {
      const ex = WELLNESS_EXERCISES[idx];
      document.getElementById('exerciseModalTitle').textContent = ex.title;
      document.getElementById('exerciseModalDesc').textContent = ex.desc;
      let seconds = ex.mins * 60;
      const timerEl = document.getElementById('exerciseTimerDisplay');
      const phaseEl = document.getElementById('exercisePhaseText');
      const phases = ['Inhale slowly (4s)...', 'Hold gently (4s)...', 'Exhale completely (6s)...'];
      let pIdx = 0;

      const updateDisplay = () => {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
        if (seconds % 5 === 0) {
          phaseEl.textContent = phases[pIdx % phases.length];
          pIdx++;
        }
      };
      updateDisplay();

      const modal = document.getElementById('exerciseModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      clearInterval(exerciseInterval);
      exerciseInterval = setInterval(() => {
        if (seconds > 0) {
          seconds--;
          updateDisplay();
        } else {
          stopWellnessExercise();
          showToast(`${ex.title} completed! Great job.`);
        }
      }, 1000);
    }

    function stopWellnessExercise() {
      clearInterval(exerciseInterval);
      closeModal('exerciseModal');
    }

    // =========================================================================
    // PAGE 7 & SIDEBAR: HEALTH RECORDS & MEDICATION REMINDERS
    // =========================================================================
    const RECENT_RECORDS = [
      {
        title: 'Blood Test Results',
        meta: 'Lab Report · May 20, 2026',
        icon: 'file-spreadsheet',
        badge: 'bg-cyan-500/15 text-[#00d2ff]',
        details: 'Complete Blood Count (CBC) & Lipid Profile: Hemoglobin 14.6 g/dL (Normal), Total Cholesterol 178 mg/dL (Optimal), Fasting Glucose 92 mg/dL (Normal).'
      },
      {
        title: 'Vitamin D Deficiency Treatment',
        meta: 'Prescription · May 15, 2026',
        icon: 'pill',
        badge: 'bg-emerald-500/15 text-emerald-400',
        details: 'Prescribed Cholecalciferol (Vitamin D3) 2000 IU once daily after breakfast for 8 weeks. Re-test serum 25(OH)D levels in July.'
      },
      {
        title: 'Annual Physical Checkup',
        meta: 'Consultation · Apr 28, 2026',
        icon: 'stethoscope',
        badge: 'bg-purple-500/15 text-purple-400',
        details: 'General physical evaluation by Dr. R. Mehta. Blood Pressure: 118/76 mmHg, Resting HR: 72 bpm, BMI: 22.8. Overall health rated Good (85%).'
      },
      {
        title: 'Thyroid Panel',
        meta: 'Lab Report · Apr 10, 2026',
        icon: 'activity',
        badge: 'bg-amber-500/15 text-amber-400',
        details: 'TSH: 2.15 mIU/L (Reference: 0.4–4.0), Free T3: 3.2 pg/mL, Free T4: 1.18 ng/dL. Euthyroid status confirmed.'
      }
    ];

    let MEDICATIONS = [
      { name: 'Omega 3', note: '1 Capsule after lunch', time: '01:00 PM', enabled: true },
      { name: 'Vitamin D3', note: '1 Tablet after breakfast', time: '08:00 AM', enabled: true },
      { name: 'Multivitamin', note: '1 Tablet after dinner', time: '08:00 PM', enabled: true }
    ];

    function renderRecordsAndMedications() {
      // Recent Records
      const recContainer = document.getElementById('recentRecordsList');
      if (recContainer) {
        recContainer.innerHTML = RECENT_RECORDS.map((r, idx) => `
          <div class="neo-card rounded-2xl p-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-xl ${r.badge} flex items-center justify-center shrink-0">
                <i data-lucide="${r.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="text-sm font-bold text-white">${r.title}</div>
                <div class="text-xs text-slate-400 mt-0.5">${r.meta}</div>
              </div>
            </div>
            <button onclick="openRecordModal(${idx})" class="px-3.5 py-2 rounded-xl bg-[#00b4d8] hover:bg-[#00d2ff] text-[#041224] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">View</span>
            </button>
          </div>
        `).join('');
      }

      // Home Right Sidebar Medications
      const sidebarMed = document.getElementById('sidebarMedList');
      if (sidebarMed) {
        sidebarMed.innerHTML = MEDICATIONS.map(m => `
          <div class="rounded-xl bg-[#081326] border border-[#142642] p-2.5 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                <i data-lucide="pill" class="w-3.5 h-3.5"></i>
              </div>
              <div class="min-w-0">
                <div class="text-[12px] font-bold text-white truncate">${m.name}</div>
                <div class="text-[10px] text-slate-400 truncate">${m.note}</div>
              </div>
            </div>
            <span class="text-[11px] font-bold text-[#00d2ff] shrink-0">${m.time}</span>
          </div>
        `).join('');
      }

      // Health Records Page Medications
      const recordsMed = document.getElementById('recordsMedList');
      if (recordsMed) {
        recordsMed.innerHTML = MEDICATIONS.map((m, idx) => `
          <div class="neo-card rounded-2xl p-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                <i data-lucide="pill" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="text-sm font-bold text-white">${m.name}</div>
                <div class="text-xs text-slate-400 mt-0.5">${m.note} · <span class="text-[#00d2ff] font-semibold">${m.time}</span></div>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" ${m.enabled ? 'checked' : ''} class="sr-only peer" onchange="toggleMedication(${idx}, this.checked)" />
              <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b4d8]"></div>
            </label>
          </div>
        `).join('');
      }

      lucide.createIcons();
    }

    function toggleMedication(idx, checked) {
      MEDICATIONS[idx].enabled = checked;
      showToast(`${MEDICATIONS[idx].name} reminder ${checked ? 'enabled' : 'paused'}`);
    }

    function openRecordModal(idx) {
      const rec = RECENT_RECORDS[idx];
      document.getElementById('recordModalTitle').textContent = rec.title;
      document.getElementById('recordModalBody').innerHTML = `
        <div class="text-[#00d2ff] font-semibold mb-1">${rec.meta}</div>
        <p>${rec.details}</p>
      `;
      const m = document.getElementById('recordModal');
      m.classList.remove('hidden');
      m.classList.add('flex');
    }

    function openAddMedicationModal() {
      const m = document.getElementById('addMedModal');
      m.classList.remove('hidden');
      m.classList.add('flex');
    }

    function saveNewMedication() {
      const name = document.getElementById('newMedName').value.trim();
      const note = document.getElementById('newMedNote').value.trim() || '1 Dose daily';
      const time = document.getElementById('newMedTime').value.trim() || '09:00 AM';
      if (!name) return;
      MEDICATIONS.push({ name, note, time, enabled: true });
      document.getElementById('newMedName').value = '';
      document.getElementById('newMedNote').value = '';
      document.getElementById('newMedTime').value = '';
      closeModal('addMedModal');
      renderRecordsAndMedications();
      showToast(`Added reminder for ${name}`);
    }

    // =========================================================================
    // PAGE 8: FIND HOSPITALS
    // =========================================================================
    const HOSPITALS = [
      { name: 'City Care Hospital', hours: 'Open 24/7', distance: '3.2 km away', phone: '+91 40 2345 6701' },
      { name: 'Apollo Medical Center', hours: 'Open 24/7', distance: '4.7 km away', phone: '+91 40 2345 8890' },
      { name: 'LifeLine Clinic', hours: 'Mon-Sat 9AM-8PM', distance: '6.1 km away', phone: '+91 40 2345 1122' }
    ];

    function renderHospitals() {
      const list = document.getElementById('hospitalCardsList');
      list.innerHTML = HOSPITALS.map(h => `
        <div class="neo-card rounded-2xl overflow-hidden">
          <div class="h-24 bg-[#071122] border-b border-[#152847] flex items-center justify-center relative">
            <div class="w-9 h-9 rounded-full bg-cyan-500/15 text-[#00d2ff] flex items-center justify-center">
              <i data-lucide="map-pin" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="p-4 sm:p-5 space-y-4">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="text-base font-bold text-white">${h.name}</h3>
                <div class="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>${h.hours}</span>
                </div>
              </div>
              <span class="text-xs font-semibold text-[#00d2ff]">${h.distance}</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <button onclick="showToast('Calling ${h.name} (${h.phone})...')" class="py-2.5 rounded-xl bg-[#00b4d8] hover:bg-[#00d2ff] text-[#041224] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                <i data-lucide="phone" class="w-3.5 h-3.5"></i>
                <span>Call</span>
              </button>
              <button onclick="showToast('Opening turn-by-turn directions to ${h.name}')" class="py-2.5 rounded-xl bg-[#071122] hover:bg-[#0e1f3d] border border-[#1c3257] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                <i data-lucide="navigation" class="w-3.5 h-3.5 text-[#00d2ff]"></i>
                <span>Directions</span>
              </button>
            </div>
          </div>
        </div>
      `).join('');
      lucide.createIcons();
    }

    // =========================================================================
    // PAGE 9: AI HEALTH COACH (Warm Light/Cream Theme)
    // =========================================================================
    const COACH_SUGGESTIONS = [
      'Create a personalized fitness plan',
      'Help me lose weight healthily',
      'Improve my sleep quality',
      'Manage my stress levels',
      'Build a nutrition plan',
      'I feel chest pain'
    ];
    let activeCoachSessionIdx = 3; // Highlighted coral item matching video

    function renderCoachPanel() {
      const sList = document.getElementById('coachSessionList');
      sList.innerHTML = Array.from({ length: 8 }).map((_, idx) => {
        const active = idx === activeCoachSessionIdx;
        return `
          <button onclick="selectCoachSession(${idx})" class="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
            active ? 'bg-[#f46b75] text-white font-semibold shadow-sm' : 'text-slate-700 hover:bg-[#efe7e1]'
          }">
            Medical Assistant Chat
          </button>
        `;
      }).join('');

      const topics = document.getElementById('coachSuggestedTopics');
      topics.innerHTML = COACH_SUGGESTIONS.map(topic => `
        <button onclick="sendCoachTopic('${topic}')" class="w-full text-left px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-[#e8dfd8] text-xs font-medium text-slate-700 transition cursor-pointer">
          ${topic}
        </button>
      `).join('');
    }

    function selectCoachSession(idx) {
      activeCoachSessionIdx = idx;
      renderCoachPanel();
      startCoachSession();
    }

    function resetCoachSession() {
      document.getElementById('coachHeroState').classList.remove('hidden');
      document.getElementById('coachActiveChat').classList.add('hidden');
      document.getElementById('coachActiveChat').innerHTML = '';
    }

    function startCoachSession() {
      document.getElementById('coachHeroState').classList.add('hidden');
      const chat = document.getElementById('coachActiveChat');
      chat.classList.remove('hidden');
      if (chat.children.length === 0) {
        chat.innerHTML = `
          <div class="flex justify-start">
            <div class="rounded-2xl rounded-bl-sm bg-white border border-[#e8dfd8] text-slate-800 px-4 py-3 text-sm max-w-xl shadow-xs">
              Hello! I am Dr. Neo, your personal health coach. I am here to listen and help you with any health concerns. How are you feeling today?
            </div>
          </div>
        `;
      }
    }

    function sendCoachTopic(topic) {
      startCoachSession();
      document.getElementById('coachChatInput').value = topic;
      sendCoachMessage();
    }

    async function sendCoachMessage() {
      const input = document.getElementById('coachChatInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      startCoachSession();

      const chat = document.getElementById('coachActiveChat');
      chat.innerHTML += `
        <div class="flex justify-end">
          <div class="rounded-2xl rounded-br-sm bg-[#f46b75] text-white px-4 py-2.5 text-sm max-w-md shadow-xs">
            ${text.replace(/</g, '&lt;')}
          </div>
        </div>
      `;

      const loadId = 'coach-load-' + Date.now();
      chat.innerHTML += `
        <div id="${loadId}" class="flex justify-start">
          <div class="rounded-2xl rounded-bl-sm bg-white border border-[#e8dfd8] text-slate-700 px-4 py-3 text-sm max-w-xl shadow-xs coach-prose">
            <span class="text-[#f46b75] animate-pulse">Dr. Neo is crafting your wellness plan...</span>
          </div>
        </div>
      `;
      chat.scrollTop = chat.scrollHeight;

      const reply = await callGeminiAPI({
        prompt: text,
        systemInstruction: "You are Dr. Neo, a warm, encouraging personal health & wellness coach. If the user mentions chest pain or red-flag emergencies, urge them to call 112 immediately first. Otherwise, offer supportive, actionable, step-by-step lifestyle guidance."
      });

      document.getElementById(loadId).querySelector('div').innerHTML = formatAiText(reply);
      chat.scrollTop = chat.scrollHeight;
    }

    // =========================================================================
    // MODALS, API KEY STORAGE & TOAST HELPERS
    // =========================================================================
    function openApiKeyModal() {
      const modal = document.getElementById('apiKeyModal');
      document.getElementById('modalApiKeyInput').value = getActiveApiKey();
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function saveApiKeyFromModal() {
      const val = document.getElementById('modalApiKeyInput').value.trim();
      localStorage.setItem('gemini_api_key', val);
      updateApiKeyStatusIndicator();
      closeModal('apiKeyModal');
      showToast(val ? 'Gemini API Key saved successfully!' : 'Gemini API Key cleared');
    }

    function saveApiKeyFromSettings() {
      const val = document.getElementById('settingsApiKeyInput').value.trim();
      localStorage.setItem('gemini_api_key', val);
      updateApiKeyStatusIndicator();
      showToast(val ? 'Gemini API Key saved successfully!' : 'Gemini API Key cleared');
    }

    function triggerSosModal(serviceName) {
      document.getElementById('sosModalTitle').textContent = `Calling ${serviceName}...`;
      const m = document.getElementById('sosModal');
      m.classList.remove('hidden');
      m.classList.add('flex');
    }

    function closeModal(id) {
      const m = document.getElementById(id);
      m.classList.add('hidden');
      m.classList.remove('flex');
    }

    let toastTimeout = null;
    function showToast(msg) {
      const banner = document.getElementById('toastBanner');
      document.getElementById('toastMessage').textContent = msg;
      banner.classList.remove('hidden');
      banner.classList.add('flex');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        banner.classList.add('hidden');
        banner.classList.remove('flex');
      }, 3200);
    }

    // =========================================================================
    // INITIALIZE APPLICATION ON LOAD
    // =========================================================================
    window.addEventListener('DOMContentLoaded', () => {
      renderSidebarNav();
      renderSymptomCheckerSetup();
      renderMentalWellness();
      renderRecordsAndMedications();
      renderHospitals();
      renderCoachPanel();
      updateApiKeyStatusIndicator();
      lucide.createIcons();
    });
