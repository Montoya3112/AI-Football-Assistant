document.addEventListener('DOMContentLoaded', () => {
    // ═══ DOM ELEMENTS ═══
    const $ = id => document.getElementById(id);
    const loginScreen = $('login-screen'), mainApp = $('main-app'), loginCard = $('login-card');
    const loginBtn = $('login-btn'), guestBtn = $('guest-btn'), registerBtn = $('register-btn');
    const logoutBtn = $('logout-btn'), displayName = $('display-name'), userInitial = $('user-initial');
    const formLogin = $('form-login'), formRegister = $('form-register');
    const showRegisterLink = $('show-register'), showLoginLink = $('show-login');
    const chatForm = $('chat-form'), chatInput = $('chat-input');
    const chatMessages = $('chat-messages'), chatWelcome = $('chat-welcome');
    const sendMsgBtn = $('send-msg-btn'), newChatBtn = $('new-chat-btn');
    const historyList = $('chat-history-list');
    const dropZone = $('drop-zone'), fileInput = $('file-input');
    const imagePreviewContainer = $('image-preview-container'), imagePreview = $('image-preview');
    const uploadPrompt = $('upload-prompt'), removeImageBtn = $('remove-image-btn');
    const processVisionBtn = $('process-vision-btn');
    const btnText = processVisionBtn.querySelector('.btn-text');
    const spinnerEl = processVisionBtn.querySelector('.spinner');
    const visionResults = $('vision-results'), visionOutput = $('vision-output');
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const mobileMenuBtn = $('mobile-menu-btn');
    const sidebar = $('sidebar');

    // ═══ STATE ═══
    let currentUser = null;
    let authToken = null;
    let selectedImageFile = null;
    let conversations = [];
    let activeConvId = null;

    // ═══ INIT ═══
    function init() {
        initParticles();
        init3DTilt();
        checkSession();
        setupEventListeners();
    }

    // ════════════════════════════════════════
    // PARTICLE SYSTEM
    // ════════════════════════════════════════
    function initParticles() {
        const canvas = $('particles-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animId;

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = (Math.random() - 0.5) * 0.4;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.hue = Math.random() > 0.5 ? 250 : 210;
            }
            update() {
                this.x += this.speedX; this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue},70%,70%,${this.opacity})`;
                ctx.fill();
            }
        }

        const count = Math.min(80, Math.floor(canvas.width * canvas.height / 15000));
        for (let i = 0; i < count; i++) particles.push(new Particle());

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(124,106,239,${0.08*(1-dist/120)})`; ctx.lineWidth = 0.5; ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(animate);
        }
        animate();
        const obs = new MutationObserver(() => {
            if (!loginScreen.classList.contains('active')) { cancelAnimationFrame(animId); obs.disconnect(); }
        });
        obs.observe(loginScreen, { attributes: true, attributeFilter: ['class'] });
    }

    // ════════════════════════════════════════
    // 3D TILT
    // ════════════════════════════════════════
    function init3DTilt() {
        if (!loginCard) return;
        const persp = loginCard.closest('.login-perspective');
        if (!persp) return;
        persp.addEventListener('mousemove', e => {
            const r = persp.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            const rX = ((y - r.height/2) / (r.height/2)) * -8;
            const rY = ((x - r.width/2) / (r.width/2)) * 8;
            loginCard.style.transform = `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale(1.02)`;
            loginCard.style.setProperty('--mouse-x', (x/r.width*100)+'%');
            loginCard.style.setProperty('--mouse-y', (y/r.height*100)+'%');
        });
        persp.addEventListener('mouseleave', () => {
            loginCard.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    }

    // ════════════════════════════════════════
    // CANCHA TÁCTICA 3D VISUALIZER
    // ════════════════════════════════════════
    function generateTacticalPitchHTML(text) {
        const formations = {
            '4-3-3': [
                { pos: 'POR', name: 'Portero', y: 88, x: 50, type: 'gk' },
                { pos: 'LI', name: 'Lat. Izq.', y: 70, x: 18, type: 'df' },
                { pos: 'DFC', name: 'Def. Central', y: 74, x: 38, type: 'df' },
                { pos: 'DFC', name: 'Def. Central', y: 74, x: 62, type: 'df' },
                { pos: 'LD', name: 'Lat. Der.', y: 70, x: 82, type: 'df' },
                { pos: 'MCD', name: 'Pivote Def.', y: 52, x: 50, type: 'mf' },
                { pos: 'MC', name: 'Interior Izq.', y: 44, x: 30, type: 'mf' },
                { pos: 'MC', name: 'Interior Der.', y: 44, x: 70, type: 'mf' },
                { pos: 'EI', name: 'Extr. Izq.', y: 22, x: 20, type: 'fw' },
                { pos: 'DC', name: 'Delantero', y: 16, x: 50, type: 'fw' },
                { pos: 'ED', name: 'Extr. Der.', y: 22, x: 80, type: 'fw' },
            ],
            '4-4-2': [
                { pos: 'POR', name: 'Portero', y: 88, x: 50, type: 'gk' },
                { pos: 'LI', name: 'Lat. Izq.', y: 70, x: 18, type: 'df' },
                { pos: 'DFC', name: 'Def. Central', y: 74, x: 38, type: 'df' },
                { pos: 'DFC', name: 'Def. Central', y: 74, x: 62, type: 'df' },
                { pos: 'LD', name: 'Lat. Der.', y: 70, x: 82, type: 'df' },
                { pos: 'MI', name: 'Volante Izq.', y: 46, x: 18, type: 'mf' },
                { pos: 'MC', name: 'Medio Centro', y: 50, x: 38, type: 'mf' },
                { pos: 'MC', name: 'Medio Centro', y: 50, x: 62, type: 'mf' },
                { pos: 'MD', name: 'Volante Der.', y: 46, x: 82, type: 'mf' },
                { pos: 'DC', name: 'Delantero', y: 20, x: 38, type: 'fw' },
                { pos: 'DC', name: 'Delantero', y: 20, x: 62, type: 'fw' },
            ],
            '3-5-2': [
                { pos: 'POR', name: 'Portero', y: 88, x: 50, type: 'gk' },
                { pos: 'DFC', name: 'Central Izq.', y: 74, x: 26, type: 'df' },
                { pos: 'DFC', name: 'Central Lib.', y: 76, x: 50, type: 'df' },
                { pos: 'DFC', name: 'Central Der.', y: 74, x: 74, type: 'df' },
                { pos: 'CAD', name: 'Carrilero Izq.', y: 48, x: 14, type: 'mf' },
                { pos: 'MC', name: 'Medio Centro', y: 52, x: 36, type: 'mf' },
                { pos: 'MCD', name: 'Pivote', y: 56, x: 50, type: 'mf' },
                { pos: 'MC', name: 'Medio Centro', y: 52, x: 64, type: 'mf' },
                { pos: 'CAD', name: 'Carrilero Der.', y: 48, x: 86, type: 'mf' },
                { pos: 'DC', name: 'Delantero', y: 20, x: 38, type: 'fw' },
                { pos: 'DC', name: 'Delantero', y: 20, x: 62, type: 'fw' },
            ],
            '4-2-3-1': [
                { pos: 'POR', name: 'Portero', y: 88, x: 50, type: 'gk' },
                { pos: 'LI', name: 'Lat. Izq.', y: 70, x: 18, type: 'df' },
                { pos: 'DFC', name: 'Def. Central', y: 74, x: 38, type: 'df' },
                { pos: 'DFC', name: 'Def. Central', y: 74, x: 62, type: 'df' },
                { pos: 'LD', name: 'Lat. Der.', y: 70, x: 82, type: 'df' },
                { pos: 'MCD', name: 'Pivote 1', y: 54, x: 36, type: 'mf' },
                { pos: 'MCD', name: 'Pivote 2', y: 54, x: 64, type: 'mf' },
                { pos: 'MI', name: 'Extr. Izq.', y: 34, x: 20, type: 'mf' },
                { pos: 'MCO', name: 'Media Punta', y: 32, x: 50, type: 'mf' },
                { pos: 'MD', name: 'Extr. Der.', y: 34, x: 80, type: 'mf' },
                { pos: 'DC', name: 'Delantero', y: 16, x: 50, type: 'fw' },
            ]
        };

        const key = Object.keys(formations).find(f => text.includes(f));
        if (!key) return '';

        const players = formations[key];
        const playersHTML = players.map(p => `
            <div class="player-pin" style="top:${p.y}%; left:${p.x}%;" title="${p.name}">
                <div class="player-badge ${p.type}">${p.pos}</div>
                <span class="player-name">${p.name}</span>
            </div>
        `).join('');

        return `
            <div class="tactical-pitch-container">
                <div class="pitch-card">
                    <div class="pitch-header">
                        <div class="pitch-title">
                            ⚽ Pizarra Táctica 3D Interactiva
                        </div>
                        <span class="pitch-badge-tag">Formación ${key}</span>
                    </div>
                    <div class="soccer-field">
                        <div class="field-line-center"></div>
                        <div class="field-circle-center"></div>
                        <div class="field-area-top"></div>
                        <div class="field-area-bottom"></div>
                        ${playersHTML}
                    </div>
                </div>
            </div>
        `;
    }

    // ════════════════════════════════════════
    // HISTORIAL INDIVIDUAL POR USUARIO / INVITADO
    // ════════════════════════════════════════
    function getHistoryStorageKey() {
        if (!currentUser || currentUser === 'Invitado') {
            return 'fa_conversations_guest';
        }
        return `fa_conversations_${currentUser}`;
    }

    function loadUserConversations() {
        const key = getHistoryStorageKey();
        let raw;
        if (currentUser === 'Invitado') {
            raw = sessionStorage.getItem(key);
        } else {
            raw = localStorage.getItem(key);
        }
        conversations = raw ? JSON.parse(raw) : [];
        activeConvId = null;
        renderHistory();
        clearChatUI();
    }

    function saveConversations() {
        const key = getHistoryStorageKey();
        const json = JSON.stringify(conversations);
        if (currentUser === 'Invitado') {
            sessionStorage.setItem(key, json);
        } else {
            localStorage.setItem(key, json);
        }
    }

    function createNewChat() {
        const id = 'conv-' + Date.now();
        const conv = { id, title: 'Nuevo chat', messages: [], created: Date.now() };
        conversations.unshift(conv);
        activeConvId = id;
        saveConversations();
        renderHistory();
        clearChatUI();
    }

    function loadConversation(id) {
        activeConvId = id;
        const conv = conversations.find(c => c.id === id);
        if (!conv) return;
        renderHistory();
        clearChatUI();
        if (conv.messages.length > 0) {
            chatWelcome.classList.add('hidden');
            chatMessages.classList.remove('hidden');
            conv.messages.forEach(m => appendMessageDOM(m.text, m.sender, false));
            scrollToBottom();
        }
    }

    function deleteConversation(id, event) {
        if (event) event.stopPropagation();
        conversations = conversations.filter(c => c.id !== id);
        if (activeConvId === id) {
            activeConvId = null;
            clearChatUI();
        }
        saveConversations();
        renderHistory();
        showNotification('Chat eliminado', 'info');
    }

    function clearChatUI() {
        chatMessages.innerHTML = '';
        chatWelcome.classList.remove('hidden');
        chatMessages.classList.add('hidden');
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (conversations.length === 0) {
            historyList.innerHTML = '<p style="font-size:12px; color:var(--text-muted); padding:8px;">No hay chats previos.</p>';
            return;
        }
        conversations.forEach(conv => {
            const div = document.createElement('div');
            div.className = 'history-item' + (conv.id === activeConvId ? ' active' : '');
            
            div.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <span>${escapeHtml(conv.title)}</span>
                <button class="delete-chat-btn" title="Eliminar chat" aria-label="Eliminar chat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            `;
            
            div.addEventListener('click', () => loadConversation(conv.id));
            const delBtn = div.querySelector('.delete-chat-btn');
            delBtn.addEventListener('click', (e) => deleteConversation(conv.id, e));
            historyList.appendChild(div);
        });
    }

    function updateConvTitle(id, text) {
        const conv = conversations.find(c => c.id === id);
        if (conv && conv.title === 'Nuevo chat') {
            conv.title = text.length > 30 ? text.substring(0, 30) + '...' : text;
            saveConversations();
            renderHistory();
        }
    }

    // ════════════════════════════════════════
    // AUTENTICACIÓN
    // ════════════════════════════════════════
    function checkSession() {
        const u = sessionStorage.getItem('fa_user');
        const token = sessionStorage.getItem('fa_token');
        if (u) {
            currentUser = u;
            authToken = token || 'guest-access';
            showMainApp();
        }
    }

    function handleGuestLogin() {
        currentUser = 'Invitado';
        authToken = 'guest-access';
        sessionStorage.setItem('fa_user', currentUser);
        sessionStorage.setItem('fa_token', authToken);
        showMainApp();
        showNotification('Bienvenido, entraste como Invitado ⚽', 'success');
    }

    async function handleLogin() {
        const email = $('login-email').value.trim();
        const password = $('login-password').value;

        if (!email || !password) {
            showNotification('Ingresa tu correo y contraseña', 'error');
            return;
        }

        try {
            const resp = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await resp.json();
            if (!resp.ok) {
                showNotification(data.detail || 'Error al iniciar sesión', 'error');
                return;
            }

            currentUser = data.user.nombre || data.user.email.split('@')[0];
            authToken = data.access_token;
            sessionStorage.setItem('fa_user', currentUser);
            sessionStorage.setItem('fa_token', authToken);

            showMainApp();
            showNotification(`Bienvenido de nuevo, ${currentUser} 👋`, 'success');
        } catch (err) {
            console.error(err);
            showNotification('Error al conectar con el servidor de autenticación', 'error');
        }
    }

    async function handleRegister() {
        const nombre = $('reg-name').value.trim();
        const email = $('reg-email').value.trim();
        const password = $('reg-password').value;
        const confirm = $('reg-confirm').value;

        if (!nombre) { showNotification('Ingresa tu nombre completo', 'error'); return; }
        if (!email) { showNotification('Ingresa tu correo electrónico', 'error'); return; }
        if (password.length < 6) { showNotification('La contraseña debe tener mínimo 6 caracteres', 'error'); return; }
        if (password !== confirm) { showNotification('Las contraseñas no coinciden', 'error'); return; }

        try {
            const resp = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password })
            });
            const data = await resp.json();
            if (!resp.ok) {
                showNotification(data.detail || 'Error al registrar', 'error');
                return;
            }

            $('reg-name').value = '';
            $('reg-email').value = '';
            $('reg-password').value = '';
            $('reg-confirm').value = '';
            $('login-email').value = email;

            toggleForms(true);

            showNotification('✉️ Registro exitoso. Se ha enviado un correo de confirmación. Confírmalo e inicia sesión.', 'success');
        } catch (err) {
            console.error(err);
            showNotification('Error de conexión al crear cuenta', 'error');
        }
    }

    function handleLogout() {
        if (currentUser === 'Invitado') {
            sessionStorage.removeItem('fa_conversations_guest');
        }
        sessionStorage.removeItem('fa_user');
        sessionStorage.removeItem('fa_token');
        currentUser = null;
        authToken = null;
        conversations = [];
        activeConvId = null;
        loginScreen.classList.add('active');
        mainApp.classList.add('hidden');
        initParticles(); init3DTilt();
    }

    function showMainApp() {
        loginScreen.classList.remove('active');
        mainApp.classList.remove('hidden');
        displayName.textContent = currentUser;
        userInitial.textContent = currentUser.charAt(0).toUpperCase();
        loadUserConversations();
    }

    function toggleForms(showLogin) {
        formRegister.classList.toggle('hidden', showLogin);
        formLogin.classList.toggle('hidden', !showLogin);
    }

    // ════════════════════════════════════════
    // NAVIGATION
    // ════════════════════════════════════════
    function switchView(targetId) {
        navItems.forEach(i => i.classList.toggle('active', i.dataset.target === targetId));
        viewSections.forEach(s => {
            if (s.id === targetId) { s.classList.remove('hidden'); setTimeout(() => s.classList.add('active'), 10); }
            else { s.classList.remove('active'); setTimeout(() => s.classList.add('hidden'), 300); }
        });
    }

    // ════════════════════════════════════════
    // CHAT
    // ════════════════════════════════════════
    function handleChatInput() {
        sendMsgBtn.disabled = chatInput.value.trim().length === 0;
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
    }

    async function sendMessage(text) {
        if (!text) return;
        if (!activeConvId) createNewChat();

        chatWelcome.classList.add('hidden');
        chatMessages.classList.remove('hidden');

        appendMessageDOM(text, 'user');
        const conv = conversations.find(c => c.id === activeConvId);
        if (conv) { conv.messages.push({text, sender: 'user'}); updateConvTitle(activeConvId, text); saveConversations(); }

        chatInput.value = ''; chatInput.style.height = 'auto'; sendMsgBtn.disabled = true;

        const typingId = showTypingIndicator();

        try {
            const resp = await fetch('/api/v1/futbol/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (authToken || 'guest-access')
                },
                body: JSON.stringify({ mensaje: text })
            });

            removeTypingIndicator(typingId);

            if (!resp.ok) throw new Error('Error en el servidor');
            const data = await resp.json();
            const reply = data.respuesta || 'Sin respuesta.';
            appendMessageDOM(reply, 'bot');
            if (conv) { conv.messages.push({text: reply, sender: 'bot'}); saveConversations(); }
        } catch(err) {
            console.error(err);
            removeTypingIndicator(typingId);
            appendMessageDOM('⚠️ Error de comunicación con el servidor.', 'bot');
            showNotification('Error de conexión', 'error');
        }
    }

    async function handleChatSubmit(e) {
        e.preventDefault();
        await sendMessage(chatInput.value.trim());
    }

    function appendMessageDOM(text, sender, animate = true) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        if (!animate) div.style.animation = 'none';
        const avatar = sender === 'user' ? (currentUser ? currentUser.charAt(0).toUpperCase() : 'U') : '⚽';
        let formatted = sender === 'bot' ? formatMarkdown(text) : escapeHtml(text);

        // Si la respuesta del bot habla de una formación táctica, renderizar la Cancha 3D
        if (sender === 'bot') {
            const pitchHTML = generateTacticalPitchHTML(text);
            if (pitchHTML) {
                formatted += pitchHTML;
            }
        }

        div.innerHTML = `<div class="message-avatar">${avatar}</div><div class="message-content">${formatted}</div>`;
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.className = 'message bot-message'; div.id = id;
        div.innerHTML = `<div class="message-avatar">⚽</div><div class="message-content"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        chatMessages.appendChild(div); scrollToBottom();
        return id;
    }
    function removeTypingIndicator(id) { const el = $(id); if (el) el.remove(); }
    function scrollToBottom() { chatMessages.scrollTop = chatMessages.scrollHeight; }

    // ════════════════════════════════════════
    // VISION
    // ════════════════════════════════════════
    function handleFileSelect(file) {
        if (!file || !file.type.startsWith('image/')) { showNotification('Selecciona una imagen válida.', 'error'); return; }
        selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = e => {
            imagePreview.src = e.target.result;
            uploadPrompt.classList.add('hidden');
            imagePreviewContainer.classList.remove('hidden');
            processVisionBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
    function removeImage(e) {
        if (e) e.stopPropagation();
        selectedImageFile = null; fileInput.value = ''; imagePreview.src = '';
        uploadPrompt.classList.remove('hidden'); imagePreviewContainer.classList.add('hidden');
        processVisionBtn.disabled = true; visionResults.classList.add('hidden');
    }

    async function processVisionImage() {
        if (!selectedImageFile) return;
        processVisionBtn.disabled = true;
        btnText.textContent = '🔄 Analizando...';
        spinnerEl.classList.remove('hidden');
        visionResults.classList.add('hidden');

        const formData = new FormData();
        formData.append('file', selectedImageFile);

        try {
            const resp = await fetch('/api/v1/futbol/vision/cedulas', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + (authToken || 'guest-access')
                },
                body: formData
            });
            if (!resp.ok) throw new Error('Error processing');
            const data = await resp.json();
            let html = '';
            if (data.cedula) {
                const c = data.cedula;
                html = `<table class="results-table">
                    <tr><td class="label">⚽ Local</td><td>${c.equipo_local} <strong>${c.goles_local}</strong></td></tr>
                    <tr><td class="label">⚽ Visitante</td><td>${c.equipo_visitante} <strong>${c.goles_visitante}</strong></td></tr>
                    ${c.fecha ? `<tr><td class="label">📅 Fecha</td><td>${c.fecha}</td></tr>` : ''}
                    ${c.estadio ? `<tr><td class="label">🏟️ Estadio</td><td>${c.estadio}</td></tr>` : ''}
                    ${c.arbitro ? `<tr><td class="label">👨‍⚖️ Árbitro</td><td>${c.arbitro}</td></tr>` : ''}
                </table>`;
                if (data.inserted) html += `<p class="insert-badge">✅ Datos guardados en Supabase automáticamente</p>`;
            } else { html = '<p>No se pudieron extraer datos.</p>'; }
            visionOutput.innerHTML = html;
            visionResults.classList.remove('hidden');
            showNotification('Análisis completado ✅', 'success');
        } catch(err) {
            console.error(err);
            showNotification('Error al analizar la imagen.', 'error');
        } finally {
            processVisionBtn.disabled = false;
            btnText.textContent = '🔍 Analizar Cédula con IA';
            spinnerEl.classList.add('hidden');
        }
    }

    // ════════════════════════════════════════
    // UTILITIES
    // ════════════════════════════════════════
    function formatMarkdown(text) {
        if (!text) return '';
        let h = text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^\s*[-•]\s(.*)$/gim, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        h = h.replace(/(<li>.*?<\/li>)+/gs, m => '<ul>' + m + '</ul>');
        if (!h.startsWith('<')) h = '<p>' + h + '</p>';
        return h;
    }
    function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    function showNotification(msg, type='info') {
        const container = $('toast-container');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
        container.appendChild(t);
        setTimeout(() => { t.style.animation = 'fadeOut 0.3s forwards'; setTimeout(() => t.remove(), 300); }, 4000);
    }

    // ════════════════════════════════════════
    // EVENT LISTENERS
    // ════════════════════════════════════════
    function setupEventListeners() {
        loginBtn.addEventListener('click', handleLogin);
        guestBtn.addEventListener('click', handleGuestLogin);
        registerBtn.addEventListener('click', handleRegister);
        logoutBtn.addEventListener('click', handleLogout);
        showRegisterLink.addEventListener('click', e => { e.preventDefault(); toggleForms(false); });
        showLoginLink.addEventListener('click', e => { e.preventDefault(); toggleForms(true); });
        $('login-password').addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
        $('reg-confirm').addEventListener('keypress', e => { if (e.key === 'Enter') handleRegister(); });

        navItems.forEach(i => i.addEventListener('click', () => switchView(i.dataset.target)));
        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

        newChatBtn.addEventListener('click', createNewChat);

        document.addEventListener('click', (e) => {
            const card = e.target.closest('.suggestion-card');
            if (card && card.dataset.prompt) {
                sendMessage(card.dataset.prompt);
            }
        });

        chatInput.addEventListener('input', handleChatInput);
        chatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sendMsgBtn.disabled) handleChatSubmit(e); }
        });
        chatForm.addEventListener('submit', handleChatSubmit);

        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]); });
        dropZone.addEventListener('click', () => { if (!selectedImageFile) fileInput.click(); });
        fileInput.addEventListener('change', e => { if (e.target.files.length) handleFileSelect(e.target.files[0]); });
        removeImageBtn.addEventListener('click', removeImage);
        processVisionBtn.addEventListener('click', processVisionImage);
    }

    init();
});
