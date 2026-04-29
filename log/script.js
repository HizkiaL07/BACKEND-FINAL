/* ════════════════════════════════════
       MOVIE BILLBOARD DATA
       Setiap film punya: judul, genre, rating, warna poster, dan SVG poster
    ════════════════════════════════════ */
    const movies = [
      {
        title: "ECLIPSE OF DARK",
        genre: "SCI-FI · ACTION",
        rating: "⭐ 9.1",
        cta: "Beli Tiket",
        bg: ["#0a0f2e","#1a2a6c","#b21f1f","#fdbb2d"],
        render: () => `
          <rect width="200" height="300" fill="url(#g1)"/>
          <defs>
            <radialGradient id="g1" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#1a2a6c"/>
              <stop offset="60%" stop-color="#0d0d1f"/>
              <stop offset="100%" stop-color="#000"/>
            </radialGradient>
          </defs>
          ${Array.from({length:30}, (_,i) => `<circle cx="${(i*37+13)%200}" cy="${(i*53+7)%160}" r="${i%3==0?1.2:.6}" fill="white" opacity="${.3+.5*(i%3)/3}"/>`).join('')}
          <circle cx="100" cy="110" r="55" fill="url(#pg)"/>
          <defs>
            <radialGradient id="pg" cx="35%" cy="35%">
              <stop offset="0%" stop-color="#4a6fa5"/>
              <stop offset="100%" stop-color="#0d1b3e"/>
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="110" rx="65" ry="18" fill="none" stroke="#fdbb2d" stroke-width="3" opacity=".7"/>
          <ellipse cx="100" cy="110" rx="65" ry="18" fill="none" stroke="white" stroke-width="1" opacity=".3"/>
          <ellipse cx="100" cy="240" rx="35" ry="12" fill="#000" opacity=".5"/>
          <rect x="88" y="180" width="24" height="50" rx="4" fill="#111"/>
          <circle cx="100" cy="170" r="12" fill="#111"/>
          <polygon points="100,160 85,220 115,220" fill="#fdbb2d" opacity=".08"/>
          <rect x="0" y="220" width="200" height="80" fill="url(#tb1)"/>
          <defs><linearGradient id="tb1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="transparent"/><stop offset="100%" stop-color="#000"/></linearGradient></defs>
        `
      },
      {
        title: "SCARLET STORM",
        genre: "THRILLER · DRAMA",
        rating: "⭐ 8.7",
        cta: "Beli Tiket",
        bg: ["#1a0000","#b21f1f","#ff6b35"],
        render: () => `
          <defs>
            <radialGradient id="g2" cx="50%" cy="20%" r="80%">
              <stop offset="0%" stop-color="#8b0000"/>
              <stop offset="50%" stop-color="#3d0000"/>
              <stop offset="100%" stop-color="#0d0000"/>
            </radialGradient>
          </defs>
          <rect width="200" height="300" fill="url(#g2)"/>
          ${Array.from({length:25}, (_,i) => `<line x1="${(i*9+5)%200}" y1="0" x2="${(i*9+3)%200}" y2="${40+i%60}" stroke="rgba(255,100,80,.15)" stroke-width=".8"/>`).join('')}
          <rect x="0" y="170" width="200" height="130" fill="#0d0000"/>
          <rect x="10" y="150" width="18" height="50" fill="#110000"/>
          <rect x="35" y="130" width="25" height="70" fill="#110000"/>
          <rect x="65" y="145" width="15" height="55" fill="#110000"/>
          <rect x="85" y="120" width="30" height="80" fill="#110000"/>
          <rect x="120" y="140" width="20" height="60" fill="#110000"/>
          <rect x="150" y="155" width="22" height="45" fill="#110000"/>
          <rect x="178" y="148" width="22" height="52" fill="#110000"/>
          ${Array.from({length:20}, (_,i) => `<rect x="${15+(i*11)%170}" y="${130+(i*7)%40}" width="3" height="4" fill="#ff4d00" opacity="${.1+.3*(i%4)/4}"/>`).join('')}
          <circle cx="100" cy="80" r="55" fill="none" stroke="#ff2244" stroke-width="2" opacity=".4"/>
          <circle cx="100" cy="80" r="40" fill="none" stroke="#ff4422" stroke-width="1.5" opacity=".3"/>
          <circle cx="100" cy="80" r="25" fill="rgba(200,10,10,.25)"/>
          <polygon points="105,45 95,80 108,80 98,115" fill="#ff6b35" opacity=".9"/>
          <rect x="0" y="220" width="200" height="80" fill="url(#tb2)"/>
          <defs><linearGradient id="tb2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="transparent"/><stop offset="100%" stop-color="#0d0000"/></linearGradient></defs>
        `
      },
      {
        title: "NEON DYNASTY",
        genre: "ACTION · CYBERPUNK",
        rating: "⭐ 9.4",
        cta: "Beli Tiket",
        bg: ["#000d1a","#00d2ff","#ff00aa"],
        render: () => `
          <defs>
            <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#000d1a"/>
              <stop offset="100%" stop-color="#001428"/>
            </linearGradient>
          </defs>
          <rect width="200" height="300" fill="url(#g3)"/>
          ${Array.from({length:10}, (_,i) => `<line x1="0" y1="${120+i*18}" x2="200" y2="${120+i*18}" stroke="rgba(0,210,255,.12)" stroke-width=".8"/>`).join('')}
          ${Array.from({length:11}, (_,i) => `<line x1="${i*20}" y1="120" x2="${100+(i-5)*80}" y2="300" stroke="rgba(0,210,255,.1)" stroke-width=".8"/>`).join('')}
          <rect x="5" y="50" width="30" height="130" fill="none" stroke="#00d2ff" stroke-width="1" opacity=".5"/>
          <rect x="8" y="55" width="24" height="20" fill="rgba(0,210,255,.05)"/>
          <rect x="165" y="60" width="30" height="120" fill="none" stroke="#ff00aa" stroke-width="1" opacity=".5"/>
          <rect x="60" y="30" width="20" height="140" fill="none" stroke="#00d2ff" stroke-width=".8" opacity=".4"/>
          <rect x="120" y="40" width="20" height="130" fill="none" stroke="#ff00aa" stroke-width=".8" opacity=".4"/>
          <circle cx="100" cy="80" r="20" fill="#001428" stroke="#00d2ff" stroke-width="1.5"/>
          <rect x="84" y="98" width="32" height="50" rx="4" fill="#001428" stroke="#00d2ff" stroke-width="1"/>
          <line x1="120" y1="60" x2="165" y2="25" stroke="#00d2ff" stroke-width="2"/>
          <line x1="120" y1="60" x2="118" y2="110" stroke="#333" stroke-width="4"/>
          <circle cx="100" cy="80" r="30" fill="rgba(0,210,255,.05)"/>
          <circle cx="100" cy="80" r="50" fill="rgba(255,0,170,.03)"/>
          ${Array.from({length:15}, (_,i) => `<rect x="0" y="${i*20}" width="200" height="1" fill="rgba(0,0,0,.15)"/>`).join('')}
          <rect x="0" y="220" width="200" height="80" fill="url(#tb3)"/>
          <defs><linearGradient id="tb3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="transparent"/><stop offset="100%" stop-color="#000d1a"/></linearGradient></defs>
        `
      },
      {
        title: "THE LAST FOREST",
        genre: "ADVENTURE · DRAMA",
        rating: "⭐ 8.9",
        cta: "Beli Tiket",
        bg: ["#0a1f0a","#1a4a1a","#2d8a3e"],
        render: () => `
          <defs>
            <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0a1a0a"/>
              <stop offset="50%" stop-color="#0d2e0d"/>
              <stop offset="100%" stop-color="#0a1f0a"/>
            </linearGradient>
          </defs>
          <rect width="200" height="300" fill="url(#g4)"/>
          <circle cx="155" cy="45" r="22" fill="#e8f0d8" opacity=".9"/>
          <circle cx="148" cy="40" r="18" fill="#0d2510" opacity=".8"/>
          <ellipse cx="100" cy="200" rx="120" ry="30" fill="rgba(200,255,200,.04)"/>
          <ellipse cx="80" cy="170" rx="100" ry="20" fill="rgba(200,255,200,.03)"/>
          ${[15,35,60,80,100,130,155,175].map((x,i) => `
            <rect x="${x}" y="${60+i%3*15}" width="${6+i%3*2}" height="${160-i%3*10}" fill="#0a180a" opacity=".9"/>
          `).join('')}
          ${[15,60,100,155].map((x,i) => `
            <ellipse cx="${x+5}" cy="${50+i*10}" rx="${18+i*3}" ry="${30+i*4}" fill="#0d2a0d" opacity=".8"/>
          `).join('')}
          <ellipse cx="100" cy="230" rx="90" ry="20" fill="rgba(40,180,60,.08)"/>
          ${Array.from({length:12}, (_,i) => `<circle cx="${20+(i*17)%170}" cy="${140+(i*13)%60}" r="${.8+i%2*.6}" fill="#aaff44" opacity="${.4+.4*(i%3)/3}"/>`).join('')}
          <rect x="94" y="185" width="12" height="28" rx="2" fill="#050e05"/>
          <circle cx="100" cy="180" r="7" fill="#050e05"/>
          <circle cx="100" cy="190" r="15" fill="rgba(255,160,20,.07)"/>
          <rect x="0" y="220" width="200" height="80" fill="url(#tb4)"/>
          <defs><linearGradient id="tb4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="transparent"/><stop offset="100%" stop-color="#0a1a0a"/></linearGradient></defs>
        `
      },
      {
        title: "FROZEN HORIZON",
        genre: "MYSTERY · THRILLER",
        rating: "⭐ 8.5",
        cta: "Beli Tiket",
        bg: ["#0a0f1a","#1a2a4a","#4a7ab5"],
        render: () => `
          <defs>
            <linearGradient id="g5" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0a0f1a"/>
              <stop offset="60%" stop-color="#1a2a4a"/>
              <stop offset="100%" stop-color="#0f1e30"/>
            </linearGradient>
          </defs>
          <rect width="200" height="300" fill="url(#g5)"/>
          <path d="M0 60 Q50 40 100 65 Q150 90 200 55" fill="none" stroke="rgba(80,200,180,.25)" stroke-width="18"/>
          <path d="M0 80 Q60 55 120 80 Q160 95 200 70" fill="none" stroke="rgba(100,180,255,.2)" stroke-width="12"/>
          <path d="M20 50 Q80 35 140 60 Q170 72 200 48" fill="none" stroke="rgba(150,100,255,.15)" stroke-width="8"/>
          ${Array.from({length:25}, (_,i) => `<circle cx="${(i*31+7)%200}" cy="${(i*19+5)%100}" r="${i%4==0?1.5:.7}" fill="white" opacity="${.2+.5*(i%3)/3}"/>`).join('')}
          <polygon points="0,300 0,200 50,140 80,170 100,120 130,165 160,130 200,175 200,300" fill="#0d1e35"/>
          <polygon points="50,140 80,170 100,120 130,165 160,130" fill="#162840" opacity=".8"/>
          <polygon points="95,120 100,108 105,120" fill="white" opacity=".6"/>
          <polygon points="155,130 160,118 165,130" fill="white" opacity=".5"/>
          <polygon points="45,140 50,128 55,140" fill="white" opacity=".5"/>
          <ellipse cx="100" cy="275" rx="80" ry="15" fill="rgba(80,150,200,.15)"/>
          <rect x="95" y="240" width="10" height="22" rx="2" fill="#0a1525"/>
          <circle cx="100" cy="235" r="6" fill="#0a1525"/>
          <rect x="0" y="220" width="200" height="80" fill="url(#tb5)"/>
          <defs><linearGradient id="tb5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="transparent"/><stop offset="100%" stop-color="#0a0f1a"/></linearGradient></defs>
        `
      }
    ];

    /* ════════════════════════════════════
       BILLBOARD INIT
    ════════════════════════════════════ */
    let currentSlide = 0;
    let billboardTimer = null;

    function initBillboard() {
      const slidesEl = document.getElementById('billboard-slides');
      const dotsEl   = document.getElementById('billboard-dots');

      // Build slides
      movies.forEach((m, i) => {
        // Slide
        const slide = document.createElement('div');
        slide.className = 'billboard-slide' + (i === 0 ? ' active' : '');
        slide.innerHTML = `
          <svg class="slide-poster-svg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
            ${m.render()}
          </svg>
          <div class="slide-overlay"></div>
          <div class="billboard-info">
            <div class="billboard-genre">${m.genre}</div>
            <div class="billboard-title">${m.title}</div>
            <div class="billboard-cta">${m.cta}</div>
          </div>
        `;
        slidesEl.appendChild(slide);

        // Dot
        const dot = document.createElement('div');
        dot.className = 'bdot' + (i === 0 ? ' active' : '');
        dot.onclick = () => goToSlide(i);
        dotsEl.appendChild(dot);
      });

      // Update rating for first slide
      document.getElementById('billboard-rating').textContent = movies[0].rating;

      // Start auto-rotation
      billboardTimer = setInterval(nextSlide, 3500);
    }

    function goToSlide(idx) {
      const slides = document.querySelectorAll('.billboard-slide');
      const dots   = document.querySelectorAll('.bdot');
      const shine  = document.getElementById('billboard-shine');
      const rating = document.getElementById('billboard-rating');

      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');

      currentSlide = idx;

      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
      rating.textContent = movies[currentSlide].rating;

      // Trigger shine sweep
      shine.classList.remove('sweep');
      void shine.offsetWidth; // reflow
      shine.classList.add('sweep');

      // Reset timer
      clearInterval(billboardTimer);
      billboardTimer = setInterval(nextSlide, 3500);
    }

    function nextSlide() {
      goToSlide((currentSlide + 1) % movies.length);
    }

    initBillboard();


    /* ════════════════════════════════════
       FORM LOGIC (unchanged)
    ════════════════════════════════════ */
    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.form-view').forEach(v => v.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
      document.getElementById('view-' + tab).classList.add('active');
      const titleEl = document.getElementById('form-title');
      const subEl   = document.getElementById('form-subtitle');
      if (tab === 'login') {
        titleEl.textContent = 'SELAMAT DATANG';
        subEl.textContent   = 'Masuk untuk melanjutkan ke platform.';
      } else {
        titleEl.textContent = 'BUAT AKUN';
        subEl.textContent   = 'Daftar gratis dan mulai berburu tiket.';
      }
      clearErrors();
    }

    function togglePw(id, btn) {
      const inp = document.getElementById(id);
      if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
      else { inp.type = 'password'; btn.textContent = '👁'; }
    }

    function setError(fieldId, msg) {
      const f = document.getElementById(fieldId);
      f.classList.add('has-error');
      if (msg) f.querySelector('.field-error').textContent = msg;
    }
    function clearError(fieldId) {
      document.getElementById(fieldId)?.classList.remove('has-error');
    }
    function clearErrors() {
      document.querySelectorAll('.field').forEach(f => f.classList.remove('has-error'));
    }
    function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    let toastTimer;
    function showToast(msg, type = '') {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className   = 'show ' + type;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { t.className = ''; }, 3500);
    }

    function setLoading(btnId, on) {
      document.getElementById(btnId).classList.toggle('loading', on);
    }

    async function apiCall(url, body) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    }

    async function handleLogin() {
      clearErrors();
      const email = document.getElementById('login-email').value.trim();
      const pw    = document.getElementById('login-pw').value;
      let valid = true;
      if (!isEmail(email)) { setError('f-email-login'); valid = false; }
      if (!pw)              { setError('f-pw-login');    valid = false; }
      if (!valid) return;
      setLoading('btn-login', true);
      try {
        const { ok, data } = await apiCall('/api/auth/login', { email, password: pw });
        if (ok) {
          showToast('✅ Login berhasil! Mengalihkan...', 'success');
          setTimeout(() => { window.location.href = '/home.html'; }, 1200);
        } else {
          showToast('❌ ' + (data.message || 'Email atau password salah.'), 'error');
        }
      } catch (err) {
        showToast('⚠️ Tidak dapat terhubung ke server.', 'error');
      } finally {
        setLoading('btn-login', false);
      }
    }

    async function handleRegister() {
      clearErrors();
      const name  = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const pw    = document.getElementById('reg-pw').value;
      const pw2   = document.getElementById('reg-pw2').value;
      let valid = true;
      if (name.length < 3)  { setError('f-name');       valid = false; }
      if (!isEmail(email))  { setError('f-email-reg');   valid = false; }
      if (pw.length < 8)    { setError('f-pw-reg');      valid = false; }
      if (pw !== pw2)       { setError('f-pw-confirm', 'Password tidak cocok.'); valid = false; }
      if (!valid) return;
      setLoading('btn-register', true);
      try {
        const { ok, data } = await apiCall('/api/auth/register', { name, email, password: pw });
        if (ok) {
          showToast('🎉 Akun berhasil dibuat! Silakan login.', 'success');
          setTimeout(() => switchTab('login'), 1500);
        } else {
          showToast('❌ ' + (data.message || 'Registrasi gagal.'), 'error');
        }
      } catch (err) {
        showToast('⚠️ Tidak dapat terhubung ke server.', 'error');
      } finally {
        setLoading('btn-register', false);
      }
    }

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const loginActive = document.getElementById('view-login').classList.contains('active');
      if (loginActive) handleLogin(); else handleRegister();
    });