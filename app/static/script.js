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
    const exportPdfBtn = $('export-pdf-btn');
    const exportExcelBtn = $('export-excel-btn');
    const exportTxtBtn = $('export-txt-btn');
    const downloadCedulaPdfBtn = $('download-cedula-pdf-btn');
    const downloadCedulaWordBtn = $('download-cedula-word-btn');
    const triggerLearningBtn = $('trigger-learning-btn');

    // ═══ STATE ═══
    let currentUser = null;
    let authToken = null;
    let selectedImageFile = null;
    let conversations = [];
    let activeConvId = null;
    let lastExtractedCedula = null;
    let lastUserPrompt = '';

    // ═══ INIT ═══
    function init() {
        initParticles();
        init3DTilt();
        checkSession();
        setupEventListeners();
        initDailyQuote();
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
                this.size = Math.random() * 2.2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = (Math.random() - 0.5) * 0.4;
                this.opacity = Math.random() * 0.5 + 0.15;
                this.hue = Math.random() > 0.5 ? 260 : 210;
            }
            update() {
                this.x += this.speedX; this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue},75%,70%,${this.opacity})`;
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
                        ctx.strokeStyle = `rgba(139,92,246,${0.09*(1-dist/120)})`; ctx.lineWidth = 0.5; ctx.stroke();
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
    // 3D TILT & PARALLAX DE BALONES Y PORTERÍAS
    // ════════════════════════════════════════
    function init3DTilt() {
        if (!loginCard) return;
        const screen = $('login-screen');
        if (!screen) return;

        screen.addEventListener('mousemove', e => {
            const w = window.innerWidth, h = window.innerHeight;
            const mouseX = (e.clientX - w / 2) / (w / 2);
            const mouseY = (e.clientY - h / 2) / (h / 2);

            const rX = mouseY * -10;
            const rY = mouseX * 10;

            loginCard.style.transform = `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale(1.02)`;
            loginCard.style.setProperty('--mouse-x', ((e.clientX / w) * 100) + '%');
            loginCard.style.setProperty('--mouse-y', ((e.clientY / h) * 100) + '%');

            // Parallax 3D interactivo en Balones, Porterías y Trofeos
            const balls = document.querySelectorAll('.floating-3d-ball');
            balls.forEach((b, idx) => {
                const depth = (idx + 1) * 22;
                b.style.transform = `translate3d(${mouseX * depth}px, ${mouseY * depth}px, ${depth}px) rotate(${mouseX * 40}deg)`;
            });

            const goals = document.querySelectorAll('.floating-3d-goal');
            goals.forEach((g, idx) => {
                const depth = (idx + 1) * -35;
                g.style.transform = `translate3d(${mouseX * depth}px, ${mouseY * depth}px, ${depth}px) rotateY(${mouseX * 25}deg)`;
            });

            const trophy = document.querySelector('.floating-3d-trophy');
            if (trophy) {
                trophy.style.transform = `translate3d(${mouseX * -15}px, ${mouseY * -15}px, 15px) rotate(${mouseX * -20}deg)`;
            }
        });

        screen.addEventListener('mouseleave', () => {
            loginCard.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    }

    // ════════════════════════════════════════
    // CONSEJOS DE MOTIVACIÓN DIARIOS (ROTATIVOS)
    // ════════════════════════════════════════
    const dailyQuotes = [
        { text: "El éxito no es un accidente. Es trabajo duro, perseverancia, aprendizaje, estudio, sacrificio y, sobre todo, amor por lo que estás haciendo.", author: "— Pelé" },
        { text: "Cuanto más difícil sea la victoria, mayor será la felicidad de ganar.", author: "— Pelé" },
        { text: "Tienes que luchar para alcanzar tu sueño. Tienes que sacrificarte y trabajar duro para ello.", author: "— Lionel Messi" },
        { text: "Tu amor me hace fuerte, tu odio me hace imparable.", author: "— Cristiano Ronaldo" },
        { text: "Si no tienes confianza, siempre encontrarás una forma de no ganar.", author: "— Carl Lewis" },
        { text: "Prefiero ser una buena persona antes que el mejor jugador del mundo.", author: "— Lionel Messi" },
        { text: "Mis errores han sido mi mayor aprendizaje para alcanzar el éxito táctico.", author: "— Pep Guardiola" },
        { text: "El talento gana partidos, pero el trabajo en equipo y la inteligencia ganan campeonatos.", author: "— Michael Jordan" },
        { text: "Jugar al fútbol es muy sencillo, pero jugar al fútbol sencillo es lo más difícil que hay.", author: "— Johan Cruyff" },
        { text: "No se trata de las ganas de ganar, todos las tienen. Se trata de las ganas de prepararse para ganar.", author: "— Sir Alex Ferguson" }
    ];

    function initDailyQuote() {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        const quoteObj = dailyQuotes[dayOfYear % dailyQuotes.length];
        
        const dateLabel = $('quote-date-label');
        const quoteText = $('daily-quote-text');
        const quoteAuthor = $('daily-quote-author');

        if (dateLabel && quoteText && quoteAuthor) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateLabel.textContent = `📅 ${today.toLocaleDateString('es-ES', options)}`;
            quoteText.textContent = `"${quoteObj.text}"`;
            quoteAuthor.textContent = quoteObj.author;
        }
    }

    // ════════════════════════════════════════
    // HERRAMIENTAS DE EXPORTACIÓN CON CANCHA EN PDF
    // ════════════════════════════════════════
    function exportToPDF() {
        const conv = conversations.find(c => c.id === activeConvId);
        if (!conv || conv.messages.length === 0) {
            showNotification('No hay mensajes en la conversación activa para exportar.', 'error');
            return;
        }

        try {
            if (window.jspdf && window.jspdf.jsPDF) {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(16);
                doc.text("AI Football Assistant - Reporte Táctico Oficial", 14, 18);
                
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text(`Usuario: ${currentUser || 'Invitado'} | Generado: ${new Date().toLocaleString()}`, 14, 25);
                doc.line(14, 32, 196, 32);

                let y = 36;
                conv.messages.forEach(m => {
                    const prefix = m.sender === 'user' ? `[${currentUser}]: ` : '[AI DT]: ';
                    const cleanText = m.text.replace(/[\*\#\`]/g, '');
                    const lines = doc.splitTextToSize(prefix + cleanText, 175);
                    
                    if (y + (lines.length * 5) > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    doc.setFont("helvetica", m.sender === 'user' ? "bold" : "normal");
                    doc.text(lines, 14, y);
                    y += (lines.length * 5) + 4;

                    // Si la respuesta incluye una formación táctica, dibujar la Pizarra Táctica en el PDF
                    if (m.sender === 'bot' && (m.text.includes('4-3-3') || m.text.includes('4-4-2') || m.text.includes('3-5-2') || m.text.includes('4-2-3-1'))) {
                        if (y + 75 > 270) { doc.addPage(); y = 20; }
                        
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(10);
                        doc.text("⚽ PIZARRA TÁCTICA Y PARADO DE NOMBRES EN EL CAMPO:", 14, y);
                        y += 6;

                        doc.setFillColor(15, 60, 30);
                        doc.roundedRect(14, y, 182, 60, 3, 3, 'F');
                        doc.setDrawColor(255, 255, 255);
                        doc.setLineWidth(0.4);
                        doc.rect(18, y + 3, 174, 54);
                        doc.line(105, y + 3, 105, y + 57);
                        doc.circle(105, y + 30, 12);

                        const pitchData = getFormationData(m.text);
                        if (pitchData) {
                            pitchData.players.forEach(p => {
                                const px = 18 + (p.x / 100) * 174;
                                const py = y + 3 + (p.y / 100) * 54;
                                
                                doc.setFillColor(p.type === 'gk' ? 245 : p.type === 'df' ? 59 : p.type === 'mf' ? 139 : 16,
                                                 p.type === 'gk' ? 158 : p.type === 'df' ? 130 : p.type === 'mf' ? 92 : 185,
                                                 p.type === 'gk' ? 11 : p.type === 'df' ? 246 : p.type === 'mf' ? 246 : 129);
                                doc.circle(px, py, 3.5, 'F');
                                doc.setFontSize(6.5);
                                doc.setFont("helvetica", "bold");
                                doc.setTextColor(255, 255, 255);
                                doc.text(p.name.substring(0, 10), px, py + 6, { align: 'center' });
                            });
                        }

                        doc.setTextColor(0, 0, 0);
                        y += 68;
                    }
                });

                doc.save(`Reporte_Tactico_Futbol_${Date.now()}.pdf`);
                showNotification('PDF con Pizarra Táctica descargado correctamente 📄', 'success');
            } else {
                window.print();
            }
        } catch (err) {
            console.error(err);
            showNotification('Error al generar PDF', 'error');
        }
    }

    function exportToExcel() {
        const conv = conversations.find(c => c.id === activeConvId);
        if (!conv || conv.messages.length === 0) {
            showNotification('No hay datos en el chat activo para exportar a Excel.', 'error');
            return;
        }

        let csvContent = "\uFEFF";
        csvContent += "ID_Conversacion,Remitente,Mensaje,Fecha\n";

        conv.messages.forEach((m, idx) => {
            const sender = m.sender === 'user' ? currentUser : 'AI DT';
            const cleanText = m.text.replace(/"/g, '""').replace(/\n/g, ' ');
            const dateStr = new Date(conv.created).toLocaleString();
            csvContent += `"${conv.id}_${idx + 1}","${sender}","${cleanText}","${dateStr}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Futbol_Excel_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification('Archivo Excel (.csv) descargado correctamente 📊', 'success');
    }

    function exportToTXT() {
        const conv = conversations.find(c => c.id === activeConvId);
        if (!conv || conv.messages.length === 0) {
            showNotification('No hay mensajes activos para exportar a TXT.', 'error');
            return;
        }

        let txt = `====================================================\n`;
        txt += `AI FOOTBALL ASSISTANT - REPORTE DE CONVERSACIÓN\n`;
        txt += `Usuario: ${currentUser || 'Invitado'}\n`;
        txt += `Fecha: ${new Date().toLocaleString()}\n`;
        txt += `====================================================\n\n`;

        conv.messages.forEach(m => {
            const sender = m.sender === 'user' ? currentUser.toUpperCase() : 'ASISTENTE TÁCTICO IA';
            txt += `[${sender}]:\n${m.text}\n\n----------------------------------------------------\n\n`;
        });

        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Transcripcion_Futbol_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification('Archivo TXT descargado correctamente 📝', 'success');
    }

    // ════════════════════════════════════════
    // DESCARGA DE CÉDULA RECONSTRUIDA (PDF Y WORD .DOCX)
    // ════════════════════════════════════════
    async function downloadCedulaWord() {
        if (!lastExtractedCedula) {
            showNotification('No hay una cédula procesada para exportar a Word.', 'error');
            return;
        }

        try {
            showNotification('Generando Cédula Oficial en formato Word (.docx)... ⏳', 'info');
            const resp = await fetch('/api/v1/futbol/vision/export-doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lastExtractedCedula)
            });

            if (!resp.ok) throw new Error('Error backend docx');

            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Cedula_Arbitral_${(lastExtractedCedula.equipo_local || 'Local').replace(/\s+/g, '_')}_vs_${(lastExtractedCedula.equipo_visitante || 'Visitante').replace(/\s+/g, '_')}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showNotification('Cédula en Word (.docx) descargada con éxito 📝', 'success');
        } catch(err) {
            console.error(err);
            showNotification('Error al descargar el documento de Word', 'error');
        }
    }

    function downloadCedulaPDF() {
        if (!lastExtractedCedula) {
            showNotification('No hay una cédula procesada para exportar a PDF.', 'error');
            return;
        }

        try {
            if (window.jspdf && window.jspdf.jsPDF) {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const c = lastExtractedCedula;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(16);
                doc.text("CÉDULA ARBITRAL Y INFORME OFICIAL DE PARTIDO", 14, 18);

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`MRCA Solutions — Visión Artificial & OCR Futbolístico`, 14, 25);
                doc.line(14, 28, 196, 28);

                let y = 36;
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text(`INFORMACIÓN DEL PARTIDO`, 14, y); y += 8;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.text(`• Equipo Local: ${c.equipo_local} (${c.goles_local} Goles)`, 14, y); y += 6;
                doc.text(`• Equipo Visitante: ${c.equipo_visitante} (${c.goles_visitante} Goles)`, 14, y); y += 6;
                doc.text(`• Fecha: ${c.fecha || 'No especificada'} | Estadio: ${c.estadio || 'No especificado'}`, 14, y); y += 6;
                doc.text(`• Árbitro Central: ${c.arbitro || 'No especificado'}`, 14, y); y += 10;

                // Plantilla Local
                if (c.jugadores_local && c.jugadores_local.length > 0) {
                    doc.setFont("helvetica", "bold");
                    doc.text(`PLANTILLA LOCAL (${c.equipo_local}):`, 14, y); y += 6;
                    doc.setFont("helvetica", "normal");
                    c.jugadores_local.forEach(j => {
                        doc.text(`  - N° ${j.numero || '-'}: ${j.nombre} (${j.posicion || 'Jugador'})`, 14, y);
                        y += 5;
                        if (y > 270) { doc.addPage(); y = 20; }
                    });
                    y += 4;
                }

                // Plantilla Visitante
                if (c.jugadores_visitante && c.jugadores_visitante.length > 0) {
                    doc.setFont("helvetica", "bold");
                    doc.text(`PLANTILLA VISITANTE (${c.equipo_visitante}):`, 14, y); y += 6;
                    doc.setFont("helvetica", "normal");
                    c.jugadores_visitante.forEach(j => {
                        doc.text(`  - N° ${j.numero || '-'}: ${j.nombre} (${j.posicion || 'Jugador'})`, 14, y);
                        y += 5;
                        if (y > 270) { doc.addPage(); y = 20; }
                    });
                    y += 4;
                }

                // Tarjetas
                if (c.tarjetas_amarillas.length > 0 || c.tarjetas_rojas.length > 0) {
                    doc.setFont("helvetica", "bold");
                    doc.text(`SANCIÓN DE TARJETAS:`, 14, y); y += 6;
                    doc.setFont("helvetica", "normal");
                    c.tarjetas_amarillas.forEach(t => {
                        doc.text(`  [Amarilla] ${t.jugador} (Min ${t.minuto || '-'})`, 14, y); y += 5;
                    });
                    c.tarjetas_rojas.forEach(t => {
                        doc.text(`  [ROJA] ${t.jugador} (Min ${t.minuto || '-'})`, 14, y); y += 5;
                    });
                }

                doc.save(`Cedula_Oficial_${(c.equipo_local||'Local').replace(/\s+/g,'_')}.pdf`);
                showNotification('Cédula en PDF descargada con éxito 📄', 'success');
            }
        } catch(err) {
            console.error(err);
            showNotification('Error al generar PDF de la Cédula', 'error');
        }
    }

    // ════════════════════════════════════════
    // CANCHA TÁCTICA 3D CON NOMBRES REALES Y AJUSTABLE (DRAG & DROP)
    // ════════════════════════════════════════
    function getFormationData(text) {
        const defaultNames = {
            '4-3-3': ['Courtois', 'Mendy', 'Rüdiger', 'Militão', 'Carvajal', 'Tchouaméni', 'Valverde', 'Bellingham', 'Vinícius Jr.', 'Mbappé', 'Rodrygo'],
            '4-4-2': ['Ter Stegen', 'Balde', 'Araújo', 'Cubarsí', 'Koundé', 'Raphinha', 'Pedri', 'De Jong', 'Yamal', 'Lewandowski', 'Olmo'],
            '3-5-2': ['Sommer', 'Bastoni', 'Acerbi', 'Pavard', 'Dimarco', 'Barella', 'Calhanoglu', 'Mkhitaryan', 'Dumfries', 'Lautaro', 'Thuram'],
            '4-2-3-1': ['Neuer', 'Davies', 'Kim', 'Upamecano', 'Kimmich', 'Goretzka', 'Pavlovic', 'Musiala', 'Müller', 'Sané', 'Kane']
        };

        const formations = {
            '4-3-3': [
                { pos: 'POR', y: 88, x: 50, type: 'gk' },
                { pos: 'LI', y: 70, x: 18, type: 'df' },
                { pos: 'DFC', y: 74, x: 38, type: 'df' },
                { pos: 'DFC', y: 74, x: 62, type: 'df' },
                { pos: 'LD', y: 70, x: 82, type: 'df' },
                { pos: 'MCD', y: 52, x: 50, type: 'mf' },
                { pos: 'MC', y: 44, x: 30, type: 'mf' },
                { pos: 'MC', y: 44, x: 70, type: 'mf' },
                { pos: 'EI', y: 22, x: 20, type: 'fw' },
                { pos: 'DC', y: 16, x: 50, type: 'fw' },
                { pos: 'ED', y: 22, x: 80, type: 'fw' },
            ],
            '4-4-2': [
                { pos: 'POR', y: 88, x: 50, type: 'gk' },
                { pos: 'LI', y: 70, x: 18, type: 'df' },
                { pos: 'DFC', y: 74, x: 38, type: 'df' },
                { pos: 'DFC', y: 74, x: 62, type: 'df' },
                { pos: 'LD', y: 70, x: 82, type: 'df' },
                { pos: 'MI', y: 46, x: 18, type: 'mf' },
                { pos: 'MC', y: 50, x: 38, type: 'mf' },
                { pos: 'MC', y: 50, x: 62, type: 'mf' },
                { pos: 'MD', y: 46, x: 82, type: 'mf' },
                { pos: 'DC', y: 20, x: 38, type: 'fw' },
                { pos: 'DC', y: 20, x: 62, type: 'fw' },
            ],
            '3-5-2': [
                { pos: 'POR', y: 88, x: 50, type: 'gk' },
                { pos: 'DFC', y: 74, x: 26, type: 'df' },
                { pos: 'DFC', y: 76, x: 50, type: 'df' },
                { pos: 'DFC', y: 74, x: 74, type: 'df' },
                { pos: 'CAD', y: 48, x: 14, type: 'mf' },
                { pos: 'MC', y: 52, x: 36, type: 'mf' },
                { pos: 'MCD', y: 56, x: 50, type: 'mf' },
                { pos: 'MC', y: 52, x: 64, type: 'mf' },
                { pos: 'CAD', y: 48, x: 86, type: 'mf' },
                { pos: 'DC', y: 20, x: 38, type: 'fw' },
                { pos: 'DC', y: 20, x: 62, type: 'fw' },
            ],
            '4-2-3-1': [
                { pos: 'POR', y: 88, x: 50, type: 'gk' },
                { pos: 'LI', y: 70, x: 18, type: 'df' },
                { pos: 'DFC', y: 74, x: 38, type: 'df' },
                { pos: 'DFC', y: 74, x: 62, type: 'df' },
                { pos: 'LD', y: 70, x: 82, type: 'df' },
                { pos: 'MCD', y: 54, x: 36, type: 'mf' },
                { pos: 'MCD', y: 54, x: 64, type: 'mf' },
                { pos: 'MI', y: 34, x: 20, type: 'mf' },
                { pos: 'MCO', y: 32, x: 50, type: 'mf' },
                { pos: 'MD', y: 34, x: 80, type: 'mf' },
                { pos: 'DC', y: 16, x: 50, type: 'fw' },
            ]
        };

        const key = Object.keys(formations).find(f => text.includes(f));
        if (!key) return null;

        const basePlayers = formations[key];
        const names = defaultNames[key] || [];

        const playersWithNames = basePlayers.map((p, idx) => ({
            ...p,
            name: names[idx] || `${p.pos} ${idx + 1}`
        }));

        return { key, players: playersWithNames };
    }

    function generateTacticalPitchHTML(text) {
        const formationData = getFormationData(text);
        if (!formationData) return '';

        const { key, players } = formationData;

        const playersHTML = players.map((p, idx) => `
            <div class="player-pin" style="top:${p.y}%; left:${p.x}%;" title="${p.name} (${p.pos})">
                <div class="player-badge ${p.type}">${p.pos}</div>
                <span class="player-name">${p.name}</span>
            </div>
        `).join('');

        return `
            <div class="tactical-pitch-container">
                <div class="pitch-card">
                    <div class="pitch-header">
                        <div class="pitch-title">
                            ⚽ Pizarra Táctica 3D Interactiva & Ajustable
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
                    <p class="pitch-instruction">🖐️ Puedes arrastrar y mover las fichas de los jugadores en la cancha para ajustar tu táctica.</p>
                </div>
            </div>
        `;
    }

    function initPitchDraggableEvents() {
        document.querySelectorAll('.soccer-field').forEach(field => {
            if (field.dataset.dragInit) return;
            field.dataset.dragInit = "true";

            let activePin = null;

            field.querySelectorAll('.player-pin').forEach(pin => {
                pin.addEventListener('mousedown', startDrag);
                pin.addEventListener('touchstart', startDrag, { passive: false });
            });

            function startDrag(e) {
                e.preventDefault();
                activePin = this;
                document.addEventListener('mousemove', onDrag);
                document.addEventListener('mouseup', stopDrag);
                document.addEventListener('touchmove', onDrag, { passive: false });
                document.addEventListener('touchend', stopDrag);
            }

            function onDrag(e) {
                if (!activePin) return;
                const rect = field.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;

                let x = ((clientX - rect.left) / rect.width) * 100;
                let y = ((clientY - rect.top) / rect.height) * 100;

                x = Math.max(5, Math.min(95, x));
                y = Math.max(5, Math.min(95, y));

                activePin.style.left = `${x}%`;
                activePin.style.top = `${y}%`;
            }

            function stopDrag() {
                activePin = null;
                document.removeEventListener('mousemove', onDrag);
                document.removeEventListener('mouseup', stopDrag);
                document.removeEventListener('touchmove', onDrag);
                document.removeEventListener('touchend', stopDrag);
            }
        });
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
            let currentPrompt = '';
            conv.messages.forEach(m => {
                if (m.sender === 'user') {
                    currentPrompt = m.text;
                    appendMessageDOM(m.text, m.sender, false);
                } else {
                    appendMessageDOM(m.text, m.sender, false, currentPrompt);
                }
            });
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

    function shouldShowTacticalPitch(userPrompt, text) {
        if (!userPrompt || !text) return false;
        const p = userPrompt.toLowerCase();
        const keywords = [
            'alineacion', 'alineación', 'formacion', 'formación', 'esquema',
            'parado', 'pizarra', 'once inicial', '11 inicial', '4-3-3', '4-4-2',
            '3-5-2', '4-2-3-1', '5-3-2', '3-4-3'
        ];
        const userAsked = keywords.some(k => p.includes(k));
        return userAsked;
    }

    async function sendMessage(text) {
        if (!text) return;
        if (!activeConvId) createNewChat();

        lastUserPrompt = text;

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

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.detail || 'Error en el servidor');
            }
            const data = await resp.json();
            const reply = data.respuesta || 'Sin respuesta.';
            appendMessageDOM(reply, 'bot', true, text);
            if (conv) { conv.messages.push({text: reply, sender: 'bot'}); saveConversations(); }
        } catch(err) {
            console.error(err);
            removeTypingIndicator(typingId);
            appendMessageDOM(`⚠️ Error: ${err.message || 'Error de comunicación con el servidor.'}`, 'bot');
            showNotification(err.message || 'Error de conexión', 'error');
        }
    }

    async function handleChatSubmit(e) {
        e.preventDefault();
        await sendMessage(chatInput.value.trim());
    }

    function appendMessageDOM(text, sender, animate = true, promptContext = null) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        if (!animate) div.style.animation = 'none';
        const avatar = sender === 'user' ? (currentUser ? currentUser.charAt(0).toUpperCase() : 'U') : '⚽';
        let formatted = sender === 'bot' ? formatMarkdown(text) : escapeHtml(text);

        const promptToCheck = promptContext || lastUserPrompt;

        if (sender === 'bot' && shouldShowTacticalPitch(promptToCheck, text)) {
            const pitchHTML = generateTacticalPitchHTML(text);
            if (pitchHTML) {
                formatted += pitchHTML;
            }
        }

        div.innerHTML = `<div class="message-avatar">${avatar}</div><div class="message-content">${formatted}</div>`;
        chatMessages.appendChild(div);
        scrollToBottom();

        setTimeout(initPitchDraggableEvents, 100);
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
    // VISION / MANUSCRITO OCR
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
        lastExtractedCedula = null;
    }

    async function processVisionImage() {
        if (!selectedImageFile) return;
        processVisionBtn.disabled = true;
        btnText.textContent = '🔄 Reconstruyendo Cédula...';
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
            lastExtractedCedula = data.cedula;

            let html = '';
            if (data.cedula) {
                const c = data.cedula;
                html = `<table class="results-table">
                    <tr><td class="label">⚽ Equipo Local</td><td><strong>${c.equipo_local}</strong> (${c.goles_local} Goles)</td></tr>
                    <tr><td class="label">⚽ Equipo Visitante</td><td><strong>${c.equipo_visitante}</strong> (${c.goles_visitante} Goles)</td></tr>
                    ${c.fecha ? `<tr><td class="label">📅 Fecha</td><td>${c.fecha}</td></tr>` : ''}
                    ${c.estadio ? `<tr><td class="label">🏟️ Estadio</td><td>${c.estadio}</td></tr>` : ''}
                    ${c.arbitro ? `<tr><td class="label">👨‍⚖️ Árbitro Central</td><td>${c.arbitro}</td></tr>` : ''}
                </table>`;

                if (c.jugadores_local && c.jugadores_local.length > 0) {
                    html += `<div style="margin-top:14px;"><strong>Plantilla Local (${c.equipo_local}):</strong><ul style="margin-left:20px; font-size:13px;">`;
                    c.jugadores_local.forEach(j => { html += `<li>N° ${j.numero||'-'}: ${j.nombre} (${j.posicion||'Jugador'})</li>`; });
                    html += `</ul></div>`;
                }

                if (c.jugadores_visitante && c.jugadores_visitante.length > 0) {
                    html += `<div style="margin-top:14px;"><strong>Plantilla Visitante (${c.equipo_visitante}):</strong><ul style="margin-left:20px; font-size:13px;">`;
                    c.jugadores_visitante.forEach(j => { html += `<li>N° ${j.numero||'-'}: ${j.nombre} (${j.posicion||'Jugador'})</li>`; });
                    html += `</ul></div>`;
                }

                if (data.inserted) html += `<p class="insert-badge">✅ Cédula Reconstruida y Registrada en Supabase automáticamente</p>`;
            } else { html = '<p>No se pudieron extraer datos de la imagen.</p>'; }
            visionOutput.innerHTML = html;
            visionResults.classList.remove('hidden');
            showNotification('Cédula Reconstruida con Éxito. ¡Elige PDF o Word para descargar! ✅', 'success');
        } catch(err) {
            console.error(err);
            showNotification('Error al reconstruir la cédula.', 'error');
        } finally {
            processVisionBtn.disabled = false;
            btnText.textContent = '🔍 Reconstruir Cédula con IA';
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
            .replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 🔗</a>')
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

        // Chat Export Buttons
        if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
        if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToExcel);
        if (exportTxtBtn) exportTxtBtn.addEventListener('click', exportToTXT);

        // Vision Export Buttons
        if (downloadCedulaPdfBtn) downloadCedulaPdfBtn.addEventListener('click', downloadCedulaPDF);
        if (downloadCedulaWordBtn) downloadCedulaWordBtn.addEventListener('click', downloadCedulaWord);

        // Simulator para Red Neuronal 4D en Acerca de
        if (triggerLearningBtn) {
            triggerLearningBtn.addEventListener('click', () => {
                const weightsEl = $('nn-weights');
                const accEl = $('nn-acc');
                const latencyEl = $('nn-latency');
                const statusEl = $('nn-status');

                if (statusEl) {
                    statusEl.textContent = '⚡ Ajustando Pesos Neuronal 4D...';
                    statusEl.className = 'm-val cyan';
                }

                document.querySelectorAll('.pulse-node').forEach(n => {
                    n.style.animation = 'nodePulse 0.4s infinite ease-in-out';
                });

                setTimeout(() => {
                    if (weightsEl) weightsEl.textContent = (1750000 + Math.floor(Math.random() * 50000)).toLocaleString();
                    if (accEl) accEl.textContent = (99.4 + (Math.random() * 0.4)).toFixed(1) + '%';
                    if (latencyEl) latencyEl.textContent = (0.15 + (Math.random() * 0.1)).toFixed(2) + 's';
                    if (statusEl) {
                        statusEl.textContent = '● Aprendizaje Optimizado 4D';
                        statusEl.className = 'm-val green';
                    }
                    document.querySelectorAll('.pulse-node').forEach(n => {
                        n.style.animation = 'nodePulse 3s infinite ease-in-out';
                    });
                    showNotification('¡Simulación de Aprendizaje 4D Completada! Pesos Neuronales Ajustados ✅', 'success');
                }, 1500);
            });
        }

        // Presets de Motivación
        document.querySelectorAll('.btn-motivation-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const topic = btn.dataset.topic;
                if (topic) {
                    switchView('chat-view');
                    sendMessage(topic);
                }
            });
        });

        document.addEventListener('click', (e) => {
            const card = e.target.closest('.suggestion-card');
            if (card && card.dataset.prompt) {
                switchView('chat-view');
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
