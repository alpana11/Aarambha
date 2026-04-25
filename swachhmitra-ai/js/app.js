// FirebaseDB is loaded from js/db.js — used everywhere below instead of MockDB
const DB = FirebaseDB;

class DashboardApp {
    constructor() {
        this.role = localStorage.getItem('eco_role');
        this.username = localStorage.getItem('eco_username');
        this.currentLang = 'en';
        this.currentView = null;
        this.maps = {};
        this.charts = {};
        this.routeMarkers = {};
        this.currentRouteLine = null;
        this.authMode = 'login'; // login or signup
        this.quantumMode = false;

        // Add overlay to body for mobile sidebar
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = () => this.toggleSidebar();
        document.body.appendChild(overlay);
        this.overlay = overlay;

        // Init alerts
        this.loadNotifications();
        this.newAlertsCount = 0;

        // Init Firebase real-time listeners
        DB.init();

        // Listen for real-time Firestore updates
        DB.onChange(() => this.updateRealTimeData());

        // GSAP Splash Screen Animation
        window.addEventListener('load', () => {
            const tl = gsap.timeline({ defaults: { ease: "power4.inOut" } });

            tl.to(".progress-fill", { width: "100%", duration: 2.5 })
                .to(".splash-content", { y: -50, opacity: 0, scale: 0.9, duration: 1 }, "+=0.5")
                .to("#splash-screen", { y: "-100%", duration: 1.2, ease: "expo.inOut" })
                .set("#splash-screen", { display: "none" });
        });

        // Global Button Ripple Listener
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn, .btn');
            if (btn) {
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                btn.appendChild(ripple);

                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
                ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

                setTimeout(() => ripple.remove(), 600);
            }
        });

        // Check for existing session
        if (this.role) {
            setTimeout(() => this.initiateDashboard(this.role, this.username), 100);
        }
    }

    animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // --- User Registry (localStorage) ---
    getUsers() {
        return JSON.parse(localStorage.getItem('eco_users') || '[]');
    }
    saveUsers(users) {
        localStorage.setItem('eco_users', JSON.stringify(users));
    }

    setAuthMode(mode) {
        this.authMode = mode;
        const submitBtn = document.getElementById('auth-submit-btn');
        const switchText = document.getElementById('auth-switch-text');
        const tabLogin = document.getElementById('tab-login');
        const tabSignup = document.getElementById('tab-signup');
        const nameGroup = document.getElementById('signup-name-group');
        const roleGroup = document.getElementById('login-role-group');

        const phoneGroup   = document.getElementById('signup-phone-group');
        const addressGroup = document.getElementById('signup-address-group');
        if (mode === 'signup') {
            submitBtn.innerText = 'Create Account';
            switchText.innerText = 'Sign up for user access';
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            if (nameGroup)    nameGroup.style.display    = 'block';
            if (phoneGroup)   phoneGroup.style.display   = 'block';
            if (addressGroup) addressGroup.style.display = 'block';
            if (roleGroup)    roleGroup.style.display    = 'none';
        } else {
            submitBtn.innerText = 'Login to Dashboard';
            switchText.innerText = 'Access for Admin or Registered Users';
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            if (nameGroup)    nameGroup.style.display    = 'none';
            if (phoneGroup)   phoneGroup.style.display   = 'none';
            if (addressGroup) addressGroup.style.display = 'none';
            if (roleGroup)    roleGroup.style.display    = 'block';
        }
    }

    async handleAuth(e) {
        e.preventDefault();
        const email = document.getElementById('auth-username').value.trim();
        const pass = document.getElementById('auth-password').value.trim();

        if (this.authMode === 'signup') {
            const name    = document.getElementById('auth-name').value.trim();
            const phone   = document.getElementById('auth-phone').value.trim();
            const address = document.getElementById('auth-address').value.trim();
            if (!name || !email || !pass) { alert('Please fill all fields.'); return; }
            const users = this.getUsers();
            if (users.find(u => u.email === email)) { alert('Email already registered. Please login.'); return; }
            users.push({ name, email, pass, phone, address, role: 'user', ecoPoints: 350 });
            this.saveUsers(users);
            alert(`Account created for ${name}! Please login.`);
            this.setAuthMode('login');
        } else {
            const role = document.getElementById('auth-role').value;
            if (role === 'admin') {
                if (email === 'admin' && pass === 'admin123') {
                    this.initiateDashboard('admin', 'Administrator');
                } else {
                    alert('Invalid admin credentials! Use: admin / admin123');
                }
            } else {
                const users = this.getUsers();
                const match = users.find(u => u.email === email && u.pass === pass);
                if (match) {
                    this.initiateDashboard('user', match.name, match);
                } else if (email.length > 0 && pass.length > 0) {
                    this.initiateDashboard('user', email);
                } else {
                    alert('Invalid credentials!');
                }
            }
        }
    }

    initiateDashboard(role, username = 'User', userObj = null) {
        this.role     = role;
        this.username = username;
        this.userObj  = userObj;

        localStorage.setItem('eco_role', role);
        localStorage.setItem('eco_username', username);

        document.getElementById('auth-view').classList.remove('active');
        document.getElementById('dashboard-view').classList.add('active');
        this.setupNavigation();

        // Both admin and user land on same starting page
        if (role === 'admin') {
            this.navigate('admin-overview', 'Dashboard Overview');
        } else {
            this.navigate('admin-overview', 'Dashboard Overview');
        }

        const chatbot = document.getElementById('chatbot-wrapper');
        if (chatbot) chatbot.style.display = 'block';

        // Populate profile dropdown
        this._updateProfileDropdown();
    }

    _updateProfileDropdown() {
        const users = this.getUsers();
        const u = users.find(u => u.email === this.username) || this.userObj || {};
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val || '--'; };
        set('profile-name',    u.name    || this.username || 'User');
        set('profile-email',   u.email   || this.username || '--');
        set('profile-phone',   u.phone   || '--');
        set('profile-address', u.address || '--');
        set('profile-points',  u.ecoPoints || 350);
        const badge = document.getElementById('profile-role-badge');
        if (badge) {
            badge.innerText = this.role === 'admin' ? 'Admin' : 'User';
            badge.style.background = this.role === 'admin' ? '#e3f2fd' : '#e8f5e9';
            badge.style.color      = this.role === 'admin' ? '#1565c0' : '#2e7d32';
        }
    }

    toggleProfileDropdown() {
        const dd = document.getElementById('profile-dropdown');
        if (!dd) return;
        const isOpen = dd.style.display === 'block';
        // close notifications if open
        document.getElementById('notifications-dropdown').classList.remove('active');
        dd.style.display = isOpen ? 'none' : 'block';
    }
    logout() {
        this.role = null;
        this.username = null;
        localStorage.removeItem('eco_role');
        localStorage.removeItem('eco_username');

        document.getElementById('dashboard-view').classList.remove('active');
        document.getElementById('auth-view').classList.add('active');
        this.cleanup();

        // Hide chatbot on logout
        const chatbot = document.getElementById('chatbot-wrapper');
        if (chatbot) chatbot.style.display = 'none';
    }

    setupNavigation() {
        const nav = document.getElementById('nav-links');
        nav.innerHTML = '';

        let links = [];
        if (this.role === 'admin') {
            links = [
                { id: 'admin-overview', icon: 'fa-gauge-high', text: 'System Monitor' },
                { id: 'admin-bins', icon: 'fa-trash-can', text: 'Bin Management' },
                { id: 'admin-areas', icon: 'fa-map-location-dot', text: 'Area Config' },
                { id: 'admin-thresholds', icon: 'fa-sliders', text: 'Thresholds' },
                { id: 'admin-routes', icon: 'fa-route', text: 'Route Optimizer' },
                { id: 'admin-predictions', icon: 'fa-chart-line', text: 'Analytics' }
            ];
        } else {
            links = [
                { id: 'admin-overview', icon: 'fa-table-columns', text: this.t('dashboard') },
                { id: 'admin-bins', icon: 'fa-trash-can', text: this.t('bins') },
                { id: 'admin-routes', icon: 'fa-route', text: this.t('routes') },
                { id: 'admin-predictions', icon: 'fa-brain', text: this.t('predictions') },
                { id: 'user-map', icon: 'fa-map-location-dot', text: this.t('map') },
                { id: 'user-segregation', icon: 'fa-recycle', text: this.t('sorting') }
            ];
        }

        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.id = `nav-${link.id}`;
            a.innerHTML = `<i class="fa-solid ${link.icon}"></i> ${link.text}`;
            a.onclick = (e) => {
                e.preventDefault();
                this.navigate(link.id, link.text);
                if (window.innerWidth <= 768) this.toggleSidebar();
            };
            li.appendChild(a);
            nav.appendChild(li);
        });
    }

    navigate(viewId, title) {
        this.currentView = viewId;
        // Update Title
        document.getElementById('page-title').innerText = title;

        // Update Nav Active State
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        const activeNav = document.getElementById(`nav-${viewId}`);
        if (activeNav) activeNav.classList.add('active');

        // Cleanup before navigating
        this.cleanup();

        // Load Template
        const template = document.getElementById(`tpl-${viewId}`);
        const wrapper = document.getElementById('content-wrapper');

        if (template) {
            wrapper.innerHTML = '';
            wrapper.appendChild(template.content.cloneNode(true));

            // Apply Translations
            this.translatePage();

            // GSAP Page Reveal
            gsap.from("#content-wrapper > *", {
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.1,
                ease: "power3.out"
            });
        }

        // Initialize specific logic for loaded page
        setTimeout(() => {
            switch (viewId) {
                case 'user-home': this.initUserHome(); break;
                case 'user-map': this.initUserMap(); break;
                case 'admin-overview': this.initAdminOverview(); break;
                case 'admin-routes': this.initAdminRoutes(); break;
                case 'admin-bins': this.initAdminBins(); break;
                case 'admin-predictions': this.initAdminPredictions(); break;
                case 'admin-areas': this.initAdminAreas(); break;
                case 'admin-thresholds': this.initAdminThresholds(); break;
            }
        }, 50);
    }

    cleanup() {
        Object.keys(this.maps).forEach(k => { if (this.maps[k]) this.maps[k].remove(); });
        this.maps = {};
        Object.keys(this.charts).forEach(k => { if (this.charts[k]) this.charts[k].destroy(); });
        this.charts = {};
        this.routeMarkers = {};
        this.currentRouteLine = null;
    }

    /* ================== General UI Toggles ================== */
    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
        this.overlay.classList.toggle('active');
    }

    toggleNotifications() {
        document.getElementById('notifications-dropdown').classList.toggle('active');
    }

    async loadNotifications() {
        const list  = document.getElementById('notification-list');
        const badge = document.getElementById('notification-badge');
        if (!list) return;

        const alerts   = await DB.getAlerts();
        const fullBins = DB.bins.filter(b => b.status === 'full');

        const total = alerts.length + fullBins.length;
        if (badge) badge.innerText = total;

        // Haversine distance from depot
        const dist = (lat, lng) => {
            const R = 6371, dLat = (lat - 28.6139) * Math.PI / 180, dLng = (lng - 77.2090) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(28.6139*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLng/2)**2;
            return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
        };

        const fullBinHTML = fullBins.length === 0 ? '' : `
            <div style="padding:8px 12px 4px;font-size:0.7rem;font-weight:700;color:#E53935;text-transform:uppercase;letter-spacing:0.05em;">
                <i class="fa-solid fa-trash-can"></i> Full Bins (${fullBins.length})
            </div>
            ${fullBins.map(b => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid #fef2f2;">
                <div style="width:32px;height:32px;border-radius:8px;background:#fef2f2;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fa-solid fa-trash-can" style="color:#E53935;font-size:0.85rem;"></i>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:0.82rem;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.location || b.id}</div>
                    <div style="font-size:0.72rem;color:#9e9e9e;margin-top:1px;">${b.areaType || ''} &nbsp;·&nbsp; ${b.lat && b.lng ? dist(b.lat, b.lng) + ' km away' : ''}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                    <div style="font-size:0.85rem;font-weight:800;color:#E53935;">${b.fillLevel}%</div>
                    <div style="font-size:0.68rem;color:#9e9e9e;">${b.lastUpdated || ''}</div>
                </div>
            </div>`).join('')}`;

        const alertHTML = alerts.length === 0 ? '' : `
            <div style="padding:8px 12px 4px;font-size:0.7rem;font-weight:700;color:#FF8F00;text-transform:uppercase;letter-spacing:0.05em;">
                <i class="fa-solid fa-triangle-exclamation"></i> System Alerts (${alerts.length})
            </div>
            ${alerts.map(a => `
            <div class="alert-item ${a.type}" style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:8px 12px;">
                <div style="display:flex;gap:10px;align-items:flex-start;flex:1;">
                    <i class="fa-solid ${a.type === 'critical' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}" style="margin-top:3px;"></i>
                    <div class="alert-content"><h4>${a.msg}</h4><p>${a.time}</p></div>
                </div>
                <button onclick="app.dismissAlert(${a.id})" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.9rem;" title="Dismiss"><i class="fa-solid fa-xmark"></i></button>
            </div>`).join('')}`;

        list.innerHTML = total === 0
            ? `<p style="text-align:center;color:var(--text-muted);padding:16px;">No active alerts.</p>`
            : fullBinHTML + alertHTML;
    }

    async updateRealTimeData() {
        const bins   = await DB.getBins();
        const alerts = await DB.getAlerts();
        const fullBins = bins.filter(b => b.status === 'full');

        // Update badge = full bins + system alerts
        const badge = document.getElementById('notification-badge');
        if (badge) {
            const total = fullBins.length + alerts.length;
            badge.innerText  = total;
            badge.style.display = total > 0 ? 'block' : 'none';
        }

        // Toast once per session per full bin — only for NEW full bins, not on initial load
        if (this._initialLoadDone) {
            fullBins.forEach(b => {
                const key = `notified_full_${b._docId}`;
                if (!sessionStorage.getItem(key)) {
                    sessionStorage.setItem(key, '1');
                    this.showToast(`🗑 ${b.location || b.id} is FULL (${b.fillLevel}%) — needs collection`, 'critical', true);
                }
            });
        } else {
            // Seed sessionStorage on first load so existing full bins don't toast
            fullBins.forEach(b => sessionStorage.setItem(`notified_full_${b._docId}`, '1'));
            this._initialLoadDone = true;
        }
        // Clear flag when bin is no longer full
        Object.keys(sessionStorage).forEach(key => {
            if (!key.startsWith('notified_full_')) return;
            const docId = key.replace('notified_full_', '');
            if (!fullBins.some(b => b._docId === docId)) sessionStorage.removeItem(key);
        });

        // Refresh bell dropdown if open
        if (document.getElementById('notifications-dropdown').classList.contains('active')) {
            this.loadNotifications();
        }

        // View-specific live updates
        if (this.currentView === 'admin-overview') {
            if (this.charts['overviewChart']) {
                this.charts['overviewChart'].data.datasets[0].data = bins.map(b => b.fillLevel);
                this.charts['overviewChart'].data.datasets[0].backgroundColor = bins.map(b => b.priority === 'High' ? '#E53935' : (b.priority === 'Medium' ? '#FFB300' : '#4CAF50'));
                this.charts['overviewChart'].update();
            }
            this.renderAdminAlerts();
            this.renderDrivers();
            const statValues = document.querySelectorAll('#dashboard-view.active .stat-value');
            if (statValues.length >= 2) statValues[1].innerText = fullBins.length;
        } else if (this.currentView === 'user-home') {
            this.initUserHome();
        } else if (this.currentView === 'admin-bins') {
            this.initAdminBins();
        } else if (this.currentView === 'admin-routes') {
            this.refreshRouteMarkers();
        }
    }

    async initUserHome() {
        const bins = await DB.getBins();
        const myBin = bins[0];

        // 1. Update 3D Liquid Visual
        const liquid = document.getElementById('visual-liquid');
        if (liquid) {
            // Mapping fillLevel to the visual window of the 3D asset
            const visualHeight = (myBin.fillLevel * 0.45); // Adjust multiplier to fit window
            const color = myBin.priority === 'High' ? '#E53935' : (myBin.priority === 'Medium' ? '#FFB300' : '#4CAF50');

            gsap.to(liquid, {
                height: `${visualHeight}%`,
                background: `linear-gradient(to top, ${color}, #fff)`,
                duration: 1.5,
                ease: "elastic.out(1, 0.5)"
            });
        }

        // 2. Update Metadata
        const meta = document.getElementById('user-bin-visual-meta');
        if (meta) {
            meta.innerHTML = `
                <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary-dark);">${myBin.fillLevel}%</div>
                <div style="display:flex; gap:10px; margin-top:5px;">
                     ${myBin.isIoT ? `<span class="iot-badge"><i class="fa-solid fa-microchip"></i> Live IoT</span>` : ''}
                </div>
                <div style="margin-top:15px; color:var(--text-muted); font-size:0.9rem;">
                     <i class="fa-solid fa-location-dot"></i> ${myBin.location}
                </div>
            `;
        }

        // 3. Update Hero Footer Sensors
        const footer = document.getElementById('hero-sensor-readouts');
        if (footer) {
            footer.innerHTML = `
                <div class="sensor-readout glass-morph" style="padding:10px 20px; border-radius:12px; flex:1; display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid fa-temperature-half" style="color: #ff7043; font-size:1.2rem;"></i>
                    <div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">${this.t('temp')}</div>
                        <div style="font-weight:700;">${myBin.temp || '--'}°C</div>
                    </div>
                </div>
                <div class="sensor-readout glass-morph" style="padding:10px 20px; border-radius:12px; flex:1; display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid fa-droplet" style="color: #42a5f5; font-size:1.2rem;"></i>
                    <div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">${this.t('hum')}</div>
                        <div style="font-weight:700;">${myBin.hum || '--'}%</div>
                    </div>
                </div>
            `;
        }
    }

    async initUserMap() {
        const map = L.map('user-map').setView([28.6139, 77.2090], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
        this.maps['userMap'] = map;
        setTimeout(() => map.invalidateSize(), 100);

        const bins = await DB.getBins();

        // 1. Plot Bins
        bins.forEach(bin => {
            const isMyBin = bin.id === 'BIN-001';
            let color = bin.priority === 'High' ? '#E53935' : (bin.priority === 'Medium' ? '#FFB300' : '#4CAF50');

            const icon = L.divIcon({
                className: isMyBin ? 'my-bin-icon' : 'neighbor-bin-icon',
                html: isMyBin ?
                    `<div class="route-pulse" style="background:${color}; width:28px; height:28px; border-radius:50%; border:3px solid white; display:flex; align-items:center; justify-content:center; color:white;"><i class="fa-solid fa-house-chimney"></i></div>` :
                    `<div style="background:${color}; width:12px; height:12px; border-radius:50%; border:2px solid white; opacity:0.7;"></div>`,
                iconSize: isMyBin ? [32, 32] : [15, 15]
            });

            L.marker([bin.lat, bin.lng], { icon }).addTo(map)
                .bindPopup(isMyBin ? `<b>Your Home Bin</b><br>Currently ${bin.fillLevel}% full` : `Community Bin`);
        });

        // 2. Multi-Truck Simulation (Fleet Mode)
        const fleet = [
            {
                id: 'my-truck',
                waypoints: [
                    [28.6185, 77.2155], [28.6175, 77.2135], [28.6155, 77.2125],
                    [28.6135, 77.2120], [bins[0].lat + 0.001, bins[0].lng + 0.001], [bins[0].lat, bins[0].lng]
                ],
                isPrimary: true
            },
            {
                id: 'truck-2',
                waypoints: [[28.6120, 77.2080], [28.6140, 77.2070], [28.6160, 77.2060]],
                isPrimary: false
            },
            {
                id: 'truck-3',
                waypoints: [[28.6150, 77.2140], [28.6140, 77.2160], [28.6130, 77.2180]],
                isPrimary: false
            }
        ];

        // Helper: Calculate Rotation Angle (Perfectly Matched to SVG Facing East)
        const getAngle = (start, end) => {
            const dy = end[0] - start[0]; // Lat (Y - North/South)
            const dx = end[1] - start[1]; // Lng (X - East/West)

            // atan2(y, x) returns angle in radians from x-axis.
            // Since SVG faces Right (Positive X), 0 radians = East.
            // Map rotation is clockwise, so we invert the angle.
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return -angle; // Negative because CSS rotation is clockwise while Lat/Lng is counter-clockwise
        };

        fleet.forEach(truckData => {
            const trail = L.polyline([], {
                color: truckData.isPrimary ? '#4CAF50' : '#81C784',
                weight: truckData.isPrimary ? 6 : 4,
                opacity: truckData.isPrimary ? 0.8 : 0.4,
                className: truckData.isPrimary ? 'moving-route-trail' : ''
            }).addTo(map);

            const truckWidth = truckData.isPrimary ? 100 : 70;
            const truckHeight = truckData.isPrimary ? 60 : 42;

            const truckIcon = L.divIcon({
                className: 'truck-3d-marker',
                html: `<div class="truck-inner" style="opacity: ${truckData.isPrimary ? 1 : 0.7}; transition: transform 0.2s linear;">
                        <img src="assets/eco-truck.svg" style="width:${truckWidth}px; height:${truckHeight}px;">
                       </div>`,
                iconSize: [truckWidth, truckHeight],
                iconAnchor: [truckWidth / 2, truckHeight / 2] // FIXED: Perfectly centered anchor
            });

            const truckMarker = L.marker(truckData.waypoints[0], { icon: truckIcon, zIndexOffset: truckData.isPrimary ? 1000 : 500 }).addTo(map);

            let currentWaypoint = 0;
            let progress = 0;
            const speed = 0.003 + (Math.random() * 0.002);

            const animate = () => {
                if (currentWaypoint < truckData.waypoints.length - 1) {
                    const start = truckData.waypoints[currentWaypoint];
                    const end = truckData.waypoints[currentWaypoint + 1];

                    const lat = start[0] + (end[0] - start[0]) * progress;
                    const lng = start[1] + (end[1] - start[1]) * progress;

                    const currentPos = [lat, lng];
                    truckMarker.setLatLng(currentPos);

                    if (truckData.isPrimary) {
                        const currentTrail = truckData.waypoints.slice(0, currentWaypoint + 1);
                        currentTrail.push(currentPos);
                        trail.setLatLngs(currentTrail);
                    }

                    // FIXED: Rotation and steering physics
                    const angle = getAngle(start, end);
                    const inner = truckMarker._icon.querySelector('.truck-inner');
                    if (inner) inner.style.transform = `rotate(${angle}deg)`;

                    progress += speed;
                    if (progress >= 1) {
                        progress = 0;
                        currentWaypoint++;

                        if (currentWaypoint === truckData.waypoints.length - 1 && truckData.isPrimary) {
                            truckMarker._icon.classList.add('truck-pulse');
                            L.popup({ closeButton: false, offset: [0, -20], className: 'collecting-popup' })
                                .setLatLng(currentPos)
                                .setContent('<div class="collecting-badge">🌿 Collecting Waste...</div>')
                                .openOn(map);
                            return;
                        }
                    }
                    requestAnimationFrame(animate);
                }
            };
            setTimeout(animate, Math.random() * 1000);
        });
    }

    /* ================== Admin Logic ================== */
    async initAdminOverview() {
        const bins = await DB.getBins();

        // Live stats
        const total = bins.length;
        const full = bins.filter(b => b.fillLevel >= 90).length;
        const medium = bins.filter(b => b.fillLevel >= 40 && b.fillLevel < 90).length;
        const onlineBins = bins.filter(b => b.status !== 'connecting').length;
        const healthPct = Math.round((onlineBins / total) * 100);

        const el = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val; };
        el('mon-total', total); el('mon-full', full); el('mon-medium', medium);
        el('mon-health', healthPct + '%');

        // Bar chart — fill levels
        const ctx = document.getElementById('fill-level-chart').getContext('2d');
        this.charts['overviewChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.map(b => b.id),
                datasets: [{ label: 'Fill Level (%)', data: bins.map(b => b.fillLevel), backgroundColor: bins.map(b => b.fillLevel >= 90 ? '#E53935' : b.fillLevel >= 50 ? '#FFB300' : '#4CAF50'), borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
        });

        // Dismissable Alerts
        this.renderAdminAlerts();
        this.renderDrivers();
    }

    async renderDrivers() {
        const list = document.getElementById('drivers-list');
        const badge = document.getElementById('active-driver-count');
        if (!list) return;

        const drivers = await DB.getDrivers();
        const online  = drivers.filter(d => d.isOnline);

        if (badge) {
            badge.innerText = `${online.length} online`;
            badge.style.background = online.length > 0 ? '#e8f5e9' : '#f5f5f5';
            badge.style.color      = online.length > 0 ? '#2e7d32' : '#9e9e9e';
        }

        if (drivers.length === 0) {
            list.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px 0;">No drivers registered yet.</p>`;
            return;
        }

        list.innerHTML = drivers.map(d => {
            const isOnline  = !!d.isOnline;
            const lastSeen  = d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
            const dotColor  = isOnline ? '#4CAF50' : '#9e9e9e';
            const bgColor   = isOnline ? '#f1f8f4' : '#fafafa';
            const border    = isOnline ? '1px solid #c8e6c9' : '1px solid #eeeeee';
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;background:${bgColor};border:${border};">
                <div style="position:relative;flex-shrink:0;">
                    <div style="width:38px;height:38px;border-radius:50%;background:#e8f5e9;display:flex;align-items:center;justify-content:center;">
                        <i class="fa-solid fa-user" style="color:#2e7d32;"></i>
                    </div>
                    <div style="position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:${dotColor};border:2px solid white;"></div>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:0.9rem;color:var(--text-color,#222);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.name || 'Unknown'}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted,#888);margin-top:2px;">
                        <i class="fa-solid fa-truck" style="font-size:0.7rem;"></i> ${d.truckNumber || '--'} &nbsp;·&nbsp;
                        <i class="fa-solid fa-location-dot" style="font-size:0.7rem;"></i> ${d.zone || '--'}
                    </div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                    <div style="font-size:0.75rem;font-weight:700;color:${dotColor};">${isOnline ? 'ON SHIFT' : 'OFFLINE'}</div>
                    <div style="font-size:0.7rem;color:var(--text-muted,#aaa);margin-top:2px;">Last seen ${lastSeen}</div>
                </div>
            </div>`;
        }).join('');
    }

    async renderAdminAlerts() {
        const alertsList = document.getElementById('admin-alerts');
        if (!alertsList) return;
        const alerts = await DB.getAlerts();
        if (alerts.length === 0) {
            alertsList.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);"><i class="fa-solid fa-circle-check" style="color:var(--status-green);font-size:2rem;"></i><p style="margin-top:8px;">All clear! No active alerts.</p></div>`;
            return;
        }
        alertsList.innerHTML = alerts.map(a => `
            <div class="alert-item ${a.type}" id="alert-${a.id}" style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
                <div style="display:flex;gap:10px;align-items:flex-start;flex:1;">
                    <i class="fa-solid ${a.type === 'critical' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}" style="margin-top:3px;color:${a.type === 'critical' ? 'var(--status-red)' : 'var(--status-yellow)'}"></i>
                    <div class="alert-content">
                        <h4>${a.msg}</h4>
                        <p>${a.time}</p>
                    </div>
                </div>
                <button onclick="app.dismissAlert(${a.id})" title="Dismiss" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1rem;padding:2px 6px;border-radius:4px;transition:0.2s;" onmouseover="this.style.color='var(--status-red)'" onmouseout="this.style.color='var(--text-muted)'">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join('');
    }

    dismissAlert(id) {
        const alertEl = document.getElementById(`alert-${id}`);
        if (alertEl) {
            alertEl.classList.add('fade-dismiss');
            setTimeout(async () => {
                await DB.dismissAlert(DB.alerts.find(a => a.id === id)?._docId);
                this.renderAdminAlerts();
                const activeAlerts = DB.alerts.filter(a => !a.dismissed).length;
                const badge = document.getElementById('notification-badge');
                if (badge) badge.innerText = activeAlerts;
                this.showToast('Alert dismissed.', 'info');
            }, 300);
        }
    }

    async initAdminRoutes() {
        // Init Map
        const map = L.map('admin-route-map').setView([28.6139, 77.2090], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
        this.maps['routeMap'] = map;
        this.routeMarkers = {};
        setTimeout(() => map.invalidateSize(), 100);

        // Show existing pins initially
        const bins = await DB.getBins();
        bins.forEach(bin => {
            const color = bin.priority === 'High' ? '#E53935' : (bin.priority === 'Medium' ? '#FFB300' : '#4CAF50');
            const icon = L.divIcon({
                className: 'neighbor-bin-icon',
                html: `<div style="background:${color}; width:15px; height:15px; border-radius:50%; border:2px solid white; opacity:0.8;"></div>`,
                iconSize: [15, 15]
            });
            const marker = L.marker([bin.lat, bin.lng], { icon }).addTo(map)
                .bindPopup(`<b>${bin.id}</b><br>Priority: <b style="color:${color}">${bin.priority}</b><br>Fill: ${bin.fillLevel}%`);
            this.routeMarkers[bin.id] = marker;
        });
    }

    refreshRouteMarkers() {
        if (!this.maps['routeMap'] || !this.routeMarkers) return;
        DB.getBins().then(bins => {
            bins.forEach(bin => {
                const marker = this.routeMarkers[bin.id];
                if (!marker) return;
                const color = bin.priority === 'High' ? '#E53935' : (bin.priority === 'Medium' ? '#FFB300' : '#4CAF50');
                const icon = L.divIcon({
                    className: 'neighbor-bin-icon',
                    html: `<div style="background:${color}; width:15px; height:15px; border-radius:50%; border:2px solid white; opacity:0.8;"></div>`,
                    iconSize: [15, 15]
                });
                marker.setIcon(icon);
                marker.setPopupContent(`<b>${bin.id}</b><br>Priority: <b style="color:${color}">${bin.priority}</b><br>Fill: ${bin.fillLevel}%`);
            });
        });
    }

    async simulateDay() {
        console.log('[simulateDay] called');
        const bins = await DB.getBins();
        await Promise.all(bins.map(bin => {
            let fill = bin.fillLevel;
            if (bin.areaType === 'market') fill = Math.min(100, fill + 25);
            else if (bin.areaType === 'office') fill = Math.min(100, fill + 15);
            else fill = Math.min(100, fill + 10);
            return DB.updateBin(bin._docId, { fillLevel: fill });
        }));
        this.showToast('Day simulated! Market +25%, Office +15%, Residential +10%', 'info');
        this.refreshRouteMarkers();
    }

    async generateRoute() {
        console.log('[generateRoute] called');
        const bins = await DB.getBins();
        const overlay = document.getElementById('route-loading');

        if (overlay) {
            overlay.style.cssText = 'display:flex; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.92); z-index:999; flex-direction:column; align-items:center; justify-content:center; gap:10px;';
        }

        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';

            // Always get fresh map reference inside timeout
            const map = this.maps['routeMap'];
            if (!map) {
                console.error('[generateRoute] map not ready');
                this.showToast('Map not ready. Please wait and try again.', 'warning');
                return;
            }

            const urgentBins = bins.filter(b => b.priority === 'High' || b.priority === 'Medium');
            console.log('[generateRoute] urgent bins:', urgentBins.length);

            if (urgentBins.length === 0) {
                this.showToast('No urgent bins found. Try Simulate Day first.', 'info');
                return;
            }

            // Nearest neighbor from depot
            let current = { lat: 28.6139, lng: 77.2090 };
            let route = [];
            let unvisited = [...urgentBins];

            while (unvisited.length > 0) {
                let nearestIdx = 0, minDist = Infinity;
                for (let i = 0; i < unvisited.length; i++) {
                    const d = Math.pow(unvisited[i].lat - current.lat, 2) + Math.pow(unvisited[i].lng - current.lng, 2);
                    if (d < minDist) { minDist = d; nearestIdx = i; }
                }
                current = unvisited[nearestIdx];
                route.push(current);
                unvisited.splice(nearestIdx, 1);
            }

            console.log('[generateRoute] route computed, stops:', route.length);
            this.renderStops(route);
            this.drawAnimatedRoute(map, route);

            // Impact analytics
            const originalDist = (route.length * 2.5).toFixed(1);
            const optimizedDist = (route.length * 1.8).toFixed(1);
            const efficiency = Math.round(((originalDist - optimizedDist) / originalDist) * 100);
            const fuelSaved = ((originalDist - optimizedDist) * 0.15).toFixed(1);

            document.getElementById('stat-time').innerText = (route.length * 8) + ' mins';
            document.getElementById('stat-urgent').innerText = route.length;
            document.getElementById('stat-dist-before').innerText = originalDist + ' km';
            document.getElementById('stat-dist-after').innerText = optimizedDist + ' km';
            document.getElementById('stat-efficiency').innerText = '+' + efficiency + '%';
            document.getElementById('stat-fuel').innerText = fuelSaved + ' L';

            // AI Insights
            const insightsBox = document.getElementById('ai-insights-panel');
            if (insightsBox) {
                const highCount = route.filter(b => b.priority === 'High').length;
                const marketCount = route.filter(b => b.areaType === 'market').length;
                insightsBox.innerHTML = `<ul style="margin:0;padding-left:20px;">
                    <li>High waste detected in ${marketCount} market areas.</li>
                    <li>${highCount} bins require urgent collection.</li>
                    <li>Route optimized for ${efficiency}% efficiency.</li>
                </ul>`;
            }
        }, 1500);
    }

    renderStops(bins) {
        const stopsContainer = document.getElementById('route-stops');
        if (!stopsContainer) return;
        stopsContainer.innerHTML = bins.map((b, i) => `
            <li class="reveal-anim" style="animation-delay: ${0.1 * i}s">
                <div style="background:var(--primary);color:var(--white);border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:0.8rem">${i + 1}</div>
                <div>
                    <strong>Stop ${i + 1} &rarr; ${b.id}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted)">${b.location} | Priority: <span style="color: ${b.priority === 'High' ? 'var(--status-red)' : 'var(--status-yellow)'}">${b.priority}</span></div>
                </div>
            </li>
        `).join('');
    }

    drawAnimatedRoute(map, bins) {
        if (bins.length === 0) return;

        // Clear existing route if any
        if (this.currentRouteLine) {
            map.removeLayer(this.currentRouteLine);
        }

        const fullRoute = L.polyline([], { color: '#00e5ff', weight: 4, dashArray: '10, 10' }).addTo(map);
        this.currentRouteLine = fullRoute;

        let i = 0;
        const addNextStop = () => {
            if (i >= bins.length) {
                map.fitBounds(fullRoute.getBounds(), { padding: [50, 50] });
                return;
            }

            const b = bins[i];
            fullRoute.addLatLng([b.lat, b.lng]);

            const icon = L.divIcon({
                className: 'route-icon',
                html: `<div class="route-pulse" style="background:#00e5ff;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;font-size:12px;line-height:22px;font-weight:bold;transform:scale(0);animation:fadeInUp 0.5s forwards; border: 2px solid white;">${i + 1}</div>`,
                iconSize: [22, 22]
            });

            L.marker([b.lat, b.lng], { icon }).addTo(map).bindPopup(`<b>${b.id}</b><br>Priority Stop #${i + 1}`);

            i++;
            setTimeout(addNextStop, 400);
        };
        addNextStop();
    }

    async assignRoute() {
        this.showToast("Route assigned successfully", "success");
        this.dispatchTruck();
    }

    async dispatchTruck() {
        const map = this.maps['routeMap'];
        if (!map) return;

        const bins = await DB.getBins();
        const urgentBins = bins.filter(b => b.fillLevel > 70);
        if (urgentBins.length === 0) {
            this.showToast("No urgent bins to collect!", "info");
            return;
        }

        const truckIcon = L.divIcon({
            className: 'truck-anim-icon',
            html: `<div style="background:var(--primary-dark); color:#fff; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 10px rgba(0,0,0,0.3); animation: pulse-glow 1.5s infinite;"><i class="fa-solid fa-truck"></i></div>`,
            iconSize: [30, 30]
        });

        const truck = L.marker([urgentBins[0].lat, urgentBins[0].lng], { icon: truckIcon }).addTo(map);
        this.showToast("Truck Dispatched! Optimizing route...", "success");

        let currentStop = 0;
        const moveTruck = () => {
            if (currentStop >= urgentBins.length) {
                setTimeout(() => {
                    truck.remove();
                    this.showToast("Collection Route Completed!", "success");
                }, 1000);
                return;
            }

            const target = urgentBins[currentStop];
            truck.setLatLng([target.lat, target.lng]);
            map.panTo([target.lat, target.lng]);

            // Mark bin as collected/empty after visiting
            setTimeout(() => {
                DB.updateBin(target._docId, { fillLevel: 0, status: 'empty', priority: 'Low' });
                currentStop++;
                setTimeout(moveTruck, 1500); // 1.5s per stop
            }, 1000);
        };

        moveTruck();
    }

    async initAdminBins() {
        const tbody = document.getElementById('bins-table-body');
        const bins = await DB.getBins();
        const isUser = this.role === 'user';

        tbody.innerHTML = bins.map(bin => `
            <tr>
                <td><strong>${bin.id}</strong></td>
                <td>${bin.location}</td>
                <td><span style="padding:3px 8px;border-radius:12px;font-size:0.8rem;background:${bin.areaType==='market'?'#fff3e0':bin.areaType==='office'?'#e3f2fd':'#e8f5e9'};color:${bin.areaType==='market'?'#e65100':bin.areaType==='office'?'#1565c0':'#2e7d32'}">${bin.areaType}</span></td>
                <td><span class="status-badge ${bin.status}">${bin.fillLevel}% - ${bin.status.toUpperCase()}</span></td>
                <td>${bin.lastUpdated}</td>
                <td>
                    <button class="action-btn" onclick="app.editBin('${bin.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" onclick="app.deleteBin('${bin.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    editBin(id) {
        const bin = DB.bins.find(b => b.id === id);
        if (!bin) return;
        const modal = document.getElementById('common-modal');
        document.getElementById('modal-title').innerText = `Edit Bin ${id}`;
        document.getElementById('modal-body').innerHTML = `
            <div class="form-group"><label>Location</label><input type="text" id="edit-bin-loc" value="${bin.location}" style="width:100%;padding:8px 12px;border:1.5px solid var(--border-color,#ddd);border-radius:8px;"></div>
            <div class="form-group"><label>Area Type</label>
                <select id="edit-bin-area" style="width:100%;padding:8px 12px;border:1.5px solid var(--border-color,#ddd);border-radius:8px;">
                    <option value="market" ${bin.areaType==='market'?'selected':''}>Market</option>
                    <option value="residential" ${bin.areaType==='residential'?'selected':''}>Residential</option>
                    <option value="office" ${bin.areaType==='office'?'selected':''}>Office</option>
                </select>
            </div>
            <div class="form-group"><label>Fill Level (%)</label><input type="number" id="edit-bin-fill" value="${bin.fillLevel}" min="0" max="100" style="width:100%;padding:8px 12px;border:1.5px solid var(--border-color,#ddd);border-radius:8px;"></div>
        `;
        document.querySelector('#common-modal .modal-footer .primary-btn').onclick = () => {
            const loc = document.getElementById('edit-bin-loc').value.trim() || bin.location;
            const areaType = document.getElementById('edit-bin-area').value;
            const fillLevel = Math.min(100, Math.max(0, parseInt(document.getElementById('edit-bin-fill').value) || bin.fillLevel));
            DB.updateBin(bin._docId, { location: loc, areaType, fillLevel }).then(() => {
                this.showToast(`Bin ${id} updated!`, 'success');
            });
            this.closeModal();
        };
        modal.classList.add('active');
    }

    deleteBin(id) {
        if (!confirm(`Remove bin ${id} from the system?`)) return;
        const bin = DB.bins.find(b => b.id === id);
        if (!bin) return;
        DB.deleteBin(bin._docId).then(() => this.showToast(`Bin ${id} removed.`, 'info'));
    }

    async initAdminAreas() {
        const areas = await DB.getAreas();
        const tbody = document.getElementById('area-config-body');
        if (!tbody) return;
        const bins = DB.bins;
        tbody.innerHTML = Object.entries(areas).map(([name, mult]) => {
            const count = bins.filter(b => b.areaType === name).length;
            return `<tr>
                <td><strong style="text-transform:capitalize">${name}</strong></td>
                <td><span style="color:var(--primary);font-weight:700">${mult}%</span></td>
                <td>${count} bins</td>
                <td><button class="action-btn delete" onclick="app.deleteArea('${name}')"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`;
        }).join('');
    }

    async saveAreaConfig() {
        const name = document.getElementById('area-name-input').value.trim().toLowerCase();
        const mult = parseInt(document.getElementById('area-mult-input').value);
        if (!name || !mult || mult < 1 || mult > 100) { alert('Enter valid area name and multiplier (1-100).'); return; }
        await DB.saveArea(name, mult);
        this.showToast(`Area "${name}" saved with ${mult}% multiplier.`, 'success');
        this.initAdminAreas();
    }

    async deleteArea(name) {
        await DB.deleteArea(name);
        this.showToast(`Area "${name}" removed.`, 'info');
        this.initAdminAreas();
    }

    async initAdminThresholds() {
        const saved = await DB.getThresholds();
        const highEl = document.getElementById('thresh-high');
        const medEl = document.getElementById('thresh-med');
        if (highEl) { highEl.value = saved.high; document.getElementById('thresh-high-val').innerText = saved.high + '%'; }
        if (medEl) { medEl.value = saved.medium; document.getElementById('thresh-med-val').innerText = saved.medium + '%'; }
    }

    async saveThresholds() {
        const high = parseInt(document.getElementById('thresh-high').value);
        const medium = parseInt(document.getElementById('thresh-med').value);
        if (medium >= high) { alert('Medium threshold must be lower than High threshold.'); return; }
        await DB.saveThresholds(high, medium);
        await Promise.all(DB.bins.map(bin => {
            const priority = bin.fillLevel > high ? 'High' : bin.fillLevel >= medium ? 'Medium' : 'Low';
            return DB.updateBin(bin._docId, { priority });
        }));
        this.showToast(`Thresholds applied: High >${high}%, Medium >=${medium}%`, 'success');
    }

    async initAdminPredictions(range = 5) {
        // Update active range button
        document.querySelectorAll('.pred-range-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.range) === range);
        });
        const bins = await DB.getBins();
        this._predRange = range;

        // Efficiency summary
        const totalCollections = DB.collectionsToday + bins.filter(b => b.fillLevel < 10).length;
        const co2 = (totalCollections * 2.4).toFixed(1);
        const fuelSaved = (totalCollections * 0.8).toFixed(1);
        const el = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val; };
        el('eff-collections', totalCollections);
        el('eff-co2', co2 + ' kg');
        el('eff-fuel', fuelSaved + ' L');
        el('eff-accuracy', '92%');

        let maxRiskBin = bins[0];
        const predictedBins = bins.map(bin => {
            const rate = (bin.id.charCodeAt(bin.id.length - 1) % 5) + 3.5;
            const hrsTillFull = Math.max(0, ((100 - bin.fillLevel) / rate)).toFixed(1);
            if (parseFloat(hrsTillFull) < parseFloat(((100 - maxRiskBin.fillLevel) / ((maxRiskBin.id.charCodeAt(maxRiskBin.id.length - 1) % 5) + 3.5)))) {
                maxRiskBin = bin;
            }
            return { ...bin, predictedHrs: hrsTillFull, fillRate: rate.toFixed(1) };
        });
        predictedBins.sort((a, b) => parseFloat(a.predictedHrs) - parseFloat(b.predictedHrs));

        el('pred-risk-bin', maxRiskBin.id);

        const insightsList = document.getElementById('smart-insights-list');
        if (insightsList) {
            insightsList.innerHTML = `
                <li><i class="fa-solid fa-triangle-exclamation" style="color:var(--status-red);font-size:1.2rem;"></i><div><strong>${predictedBins[0].id}</strong> will overflow in ~${predictedBins[0].predictedHrs} hrs! Schedule priority collection.</div></li>
                <li><i class="fa-solid fa-bolt" style="color:var(--status-yellow);font-size:1.2rem;"></i><div><strong>${predictedBins[1].id}</strong> has a high fill rate of ${predictedBins[1].fillRate}%/hr due to high traffic area.</div></li>
                <li><i class="fa-solid fa-leaf" style="color:var(--status-green);font-size:1.2rem;"></i><div>Route Optimization can safely skip <strong>${predictedBins[predictedBins.length - 1].id}</strong> today.</div></li>
            `;
        }

        const cardsContainer = document.getElementById('prediction-cards-container');
        if (cardsContainer) {
            cardsContainer.innerHTML = predictedBins.map(b => {
                const urgency = parseFloat(b.predictedHrs) <= 5 ? 'full' : (parseFloat(b.predictedHrs) <= 12 ? 'medium' : 'empty');
                const colorStr = urgency === 'full' ? 'var(--status-red)' : (urgency === 'medium' ? 'var(--status-yellow)' : 'var(--status-green)');
                return `<div class="bin-card ${urgency}">
                    <div class="bin-header">
                        <h4><i class="fa-solid fa-chart-line"></i> ${b.id}</h4>
                        <span class="fill-badge" style="color:${colorStr};background:${colorStr}20">In ${b.predictedHrs} Hrs</span>
                    </div>
                    <div class="progress-bar-container" style="height:4px;"><div class="progress-bar" style="width:${b.fillLevel}%;background-color:${colorStr};"></div></div>
                    <div class="bin-details-text mt-2"><span>Fill: ${b.fillLevel}%</span><span>Rate: ${b.fillRate}%/hr</span></div>
                </div>`;
            }).join('');
        }

        // Trend line chart with dynamic range
        const chartCanvas = document.getElementById('prediction-line-chart');
        if (chartCanvas) {
            if (this.charts['predLineChart']) this.charts['predLineChart'].destroy();
            const ctx = chartCanvas.getContext('2d');
            const r = range;
            const labels = [];
            for (let i = -r; i <= r; i++) labels.push(i === 0 ? 'Now' : (i < 0 ? `${i}h` : `+${i}h`));
            const currentFill = maxRiskBin.fillLevel;
            const rate = (maxRiskBin.id.charCodeAt(maxRiskBin.id.length - 1) % 5) + 3.5;
            const pastData = [];
            for (let i = r; i >= 1; i--) pastData.push(Math.max(0, currentFill - (rate * i)));
            pastData.push(currentFill);
            const futureData = Array(r).fill(null);
            futureData.push(currentFill);
            for (let i = 1; i <= r; i++) futureData.push(Math.min(100, currentFill + (rate * i)));
            this.charts['predLineChart'] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: `Historical (${maxRiskBin.id})`, data: pastData.concat(Array(r).fill(null)), borderColor: '#A5D6A7', backgroundColor: 'rgba(165,214,167,0.2)', fill: true, tension: 0.3 },
                        { label: 'AI Predicted Trend', data: futureData, borderColor: '#E53935', borderDash: [5, 5], fill: false, tension: 0.3 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
            });
        }

        // Sector-wise analytics bar chart
        const sectorCanvas = document.getElementById('sector-analytics-chart');
        if (sectorCanvas) {
            if (this.charts['sectorAnalyticsChart']) this.charts['sectorAnalyticsChart'].destroy();
            const sCtx = sectorCanvas.getContext('2d');
            const sectors = [...new Set(bins.map(b => b.sector))];
            const sectorData = sectors.map(s => {
                const sb = bins.filter(b => b.sector === s);
                return {
                    avg: Math.round(sb.reduce((sum, b) => sum + b.fillLevel, 0) / sb.length),
                    high: sb.filter(b => b.priority === 'High').length,
                    total: sb.length
                };
            });
            this.charts['sectorAnalyticsChart'] = new Chart(sCtx, {
                type: 'bar',
                data: {
                    labels: sectors,
                    datasets: [
                        { label: 'Avg Fill %', data: sectorData.map(d => d.avg), backgroundColor: '#4CAF50', borderRadius: 4 },
                        { label: 'High Priority Bins', data: sectorData.map(d => d.high), backgroundColor: '#E53935', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, max: Math.max(100, ...sectorData.map(d => d.total)) } },
                    plugins: { legend: { position: 'top' } }
                }
            });
        }
    }

    exportAnalyticsCSV() {
        DB.getBins().then(bins => {
            const rows = [['Bin ID', 'Sector', 'Area Type', 'Location', 'Fill Level (%)', 'Priority', 'Status', 'Last Updated']];
            bins.forEach(b => rows.push([b.id, b.sector, b.areaType, b.location, b.fillLevel, b.priority, b.status, b.lastUpdated]));
            const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `swachhmitra_analytics_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Analytics exported as CSV!', 'info');
        });
    }

    addBinModal() {
        const modal = document.getElementById('common-modal');
        const body = document.getElementById('modal-body');
        document.getElementById('modal-title').innerText = 'Add New Smart Bin';
        const isUser = this.role === 'user';

        body.innerHTML = `
            <div class="form-group">
                <label>Bin ID (e.g., BIN-016)</label>
                <input type="text" id="new-bin-id" placeholder="BIN-XXX">
            </div>
            <div class="form-group">
                <label>Location Name</label>
                <input type="text" id="new-bin-loc" placeholder="Street Name, Park, etc.">
            </div>
            ${isUser ? '' : `
            <div style="display:flex;gap:10px;">
                <div class="form-group" style="flex:1">
                    <label>Latitude</label>
                    <input type="number" step="0.0001" id="new-bin-lat" value="28.6139">
                </div>
                <div class="form-group" style="flex:1">
                    <label>Longitude</label>
                    <input type="number" step="0.0001" id="new-bin-lng" value="77.2090">
                </div>
            </div>`}
        `;
        document.querySelector('#common-modal .modal-footer .primary-btn').onclick = () => app.submitModal();
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('common-modal').classList.remove('active');
    }

    async submitModal() {
        const id = document.getElementById('new-bin-id').value.trim();
        const loc = document.getElementById('new-bin-loc').value.trim();
        const latEl = document.getElementById('new-bin-lat');
        const lngEl = document.getElementById('new-bin-lng');
        const lat = latEl ? parseFloat(latEl.value) : 28.6139 + (Math.random() * 0.02 - 0.01);
        const lng = lngEl ? parseFloat(lngEl.value) : 77.2090 + (Math.random() * 0.02 - 0.01);

        if (!id || !loc) { alert('Please fill in all fields.'); return; }

        await DB.addBin({ id, location: loc, lat, lng, fillLevel: 0, lastUpdated: 'Just now', areaType: 'residential', sector: 'Public' });
        this.closeModal();
        this.showToast(`Bin ${id} added successfully!`, 'success');
    }

    /* ================== Toast Notifications ================== */
    showToast(message, type = 'warning', isBinAlert = false) {
        if (!this.role) return;
        if (this.role === 'user' && type === 'critical') return;

        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = 'fa-circle-exclamation';
        if (type === 'critical') { icon = 'fa-triangle-exclamation'; toast.classList.add('critical-pulse'); }
        else if (type === 'info') icon = 'fa-circle-info';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

        // Only increment badge for real bin alerts, not routine action toasts
        if (isBinAlert) this.incrementBadge();

        toast.onclick = () => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 400); };
        container.appendChild(toast);
        setTimeout(() => {
            if (document.body.contains(toast)) { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 400); }
        }, 5000);
    }

    incrementBadge() {
        this.newAlertsCount++;
        const badge = document.querySelector('.notification-bell .badge');
        if (badge) {
            badge.innerText = this.newAlertsCount;
            badge.style.display = 'block';
            badge.classList.remove('badge-anim');
            void badge.offsetWidth; // trigger reflow
            badge.classList.add('badge-anim');
        }
    }

    resetBadge() {
        this.newAlertsCount = 0;
        const badge = document.querySelector('.notification-bell .badge');
        if (badge) badge.style.display = 'none';
        this.loadNotifications();
    }

    /* ================== Chatbot Logic ================== */
    toggleChat() {
        document.getElementById('chatbot-window').classList.toggle('active');
    }

    sendChatMessage() {
        const input = document.getElementById('chatbot-input');
        const text = input.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        input.value = '';

        // Mock Bot Response
        setTimeout(() => {
            let response = "I'm not sure about that. Try asking about 'bins', 'pickup', or 'points'.";
            const lowerText = text.toLowerCase();

            if (lowerText.includes('bin') || lowerText.includes('full')) {
                response = "You can check bin fill levels in the Home or Overview tabs. Bins above 90% are marked red.";
            } else if (lowerText.includes('pickup') || lowerText.includes('collection')) {
                response = "Pickups are scheduled based on fill levels. You can request an early pickup in the Quick Actions section.";
            } else if (lowerText.includes('points') || lowerText.includes('eco')) {
                response = "You earn Eco Points by recycling properly and reducing waste. Check your balance on the User Home page.";
            } else if (lowerText.includes('hi') || lowerText.includes('hello')) {
                response = "Hello! I'm NovaBot, your AI Waste assistant. How can I help you manage your bins today?";
            }

            this.addMessage(response, 'bot');
        }, 600);
    }

    addMessage(text, side) {
        const container = document.getElementById('chatbot-messages');
        const div = document.createElement('div');
        div.className = `message ${side}-message`;
        if (text.includes('<img') || text.includes('**')) {
            // Support formatted text/images
            div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } else {
            div.innerText = text;
        }
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    handleChatImage(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                // Display the user's uploaded image
                this.addMessage(`<div class="image-msg"><img src="${e.target.result}" style="width:100%; border-radius:10px; margin-top:5px;"></div>`, 'user');

                // Bot Response Logic
                setTimeout(() => {
                    const botResponse = `Thank you for your effort! 📸 Our AI has analyzed the report. We have dispatched a local cleanup unit to this location. **50 Eco Points** will be credited to your account after verification. Together, let's keep our city green! 🌿✨`;
                    this.addMessage(botResponse, 'bot');
                    this.showToast("Waste report submitted successfully!", "success");
                    this.incrementBadge();
                }, 1500);
            };

            reader.readAsDataURL(file);
            // Reset input
            input.value = '';
        }
    }

    searchWaste(query) {
        const resultDiv = document.getElementById('segregation-result');
        if (!query || query.length < 2) {
            resultDiv.style.display = 'none';
            return;
        }

        const searchTerm = query.toLowerCase();

        // Comprehensive AI Categorization Mapping
        const categories = [
            {
                bin: 'organic',
                icon: 'fa-apple-whole',
                keywords: ['pizza', 'apple', 'banana', 'peel', 'food', 'bread', 'veggie', 'meat', 'eggshell', 'leftover', 'leaf', 'grass', 'compost', 'tea', 'coffee', 'fruit', 'rice', 'pasta', 'bones', 'flowers', 'twigs', 'nuts', 'seeds', 'cereal', 'cake', 'scraps', 'corn', 'potato', 'onion', 'garlic', 'dairy', 'cheese', 'wood'],
                tip: "Organic waste is converted into high-quality compost for city gardens!"
            },
            {
                bin: 'recyclable',
                icon: 'fa-recycle',
                keywords: ['milk', 'bottle', 'plastic', 'glass', 'paper', 'cardboard', 'can', 'tin', 'aluminum', 'newspaper', 'magazine', 'carton', 'box', 'metal', 'jar', 'envelope', 'wine', 'beer', 'soda', 'shampoo', 'detergent', 'textile', 'cloth', 'fabric', 'denim', 'shirt', 'pants', 'towel', 'cotton', 'wool', 'linen', 'iron', 'steel', 'copper', 'book', 'notebook', 'brochure', 'flyer', 'post', 'card'],
                tip: "Make sure to rinse containers and flatten cardboard boxes to save space."
            },
            {
                bin: 'hazardous',
                icon: 'fa-skull-crossbones',
                keywords: ['battery', 'medicine', 'paint', 'oil', 'chemical', 'toxic', 'bulb', 'electronics', 'phone', 'charger', 'syringe', 'acid', 'mercury', 'wire', 'e-waste', 'mask', 'glove', 'sanitary', 'diaper', 'aerosol', 'spray', 'lighter', 'match', 'pesticide', 'bleach', 'cleaner', 'solvent', 'ink', 'toner', 'cartridge', 'thermometer', 'glue', 'adhesive'],
                tip: "Hazardous waste requires special processing. Do not mix with regular garbage!"
            }
        ];

        let match = categories.find(cat => cat.keywords.some(k => searchTerm.includes(k)));

        if (match) {
            resultDiv.style.display = 'flex';
            resultDiv.className = `segregation-result ${match.bin}`;
            resultDiv.innerHTML = `
                <div class="bin-icon-result">
                    <i class="fa-solid ${match.icon}"></i>
                </div>
                <div class="result-text">
                    <h3>This belongs in the ${match.bin.toUpperCase()} bin.</h3>
                    <p><b>🔍 Pro-Tip:</b> ${match.tip}</p>
                </div>
            `;
        } else {
            resultDiv.style.display = 'flex';
            resultDiv.className = `segregation-result`;
            resultDiv.style.background = '#f5f5f5';
            resultDiv.innerHTML = `<p>AI is analyzing... If unsure, put in 'Hazardous' for safety or ask NovaBot!</p>`;
        }
    }

    t(key) {
        return (translations && translations[this.currentLang] && translations[this.currentLang][key]) || key;
    }

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = this.t(key);

            // Handle different element types
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translated;
            } else if (el.tagName === 'SPAN' || el.tagName.startsWith('H') || el.tagName === 'P' || el.tagName === 'BUTTON') {
                const icon = el.querySelector('i');
                if (icon) {
                    el.innerHTML = '';
                    el.appendChild(icon);
                    el.appendChild(document.createTextNode(' ' + translated));
                } else {
                    el.innerText = translated;
                }
            } else {
                el.innerText = translated;
            }
        });
    }

    setLanguage(lang) {
        this.currentLang = lang;

        // 1. Update Navigation
        if (this.role) this.setupNavigation();

        // 2. Re-render Current View if any
        if (this.currentView) {
            const titleElement = document.getElementById('page-title');
            const viewTitle = this.t(this.currentView.split('-')[1]);
            // fallback: check specific keys
            let translatedTitle = viewTitle;
            if (this.currentView.includes('overview')) translatedTitle = this.t('dashboard');
            else if (this.currentView.includes('home')) translatedTitle = this.t('home');
            else if (this.currentView.includes('bins')) translatedTitle = this.t('bins');
            else if (this.currentLang === 'hi' && this.currentView === 'admin-routes') translatedTitle = "AI रूट";

            this.navigate(this.currentView, translatedTitle);
        }

        // 3. Update Auth Screen text if visible
        this.updateAuthTranslations();

        // 5. Update All static elements
        this.translatePage();
    }

    updateAuthTranslations() {
        const authView = document.getElementById('auth-view');
        if (!authView || !authView.classList.contains('active')) return;
        const submitBtn = document.getElementById('auth-submit-btn');
        if (this.authMode === 'login') {
            submitBtn.innerText = 'Login to Dashboard';
        } else {
            submitBtn.innerText = 'Create Account';
        }
    }

    tiltCard(e, el) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        el.onmouseleave = () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        };
    }
}

// Initialize App
const app = new DashboardApp();

// Close notifications when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.notification-bell') && !e.target.closest('.notifications-dropdown')) {
        const dropdown = document.getElementById('notifications-dropdown');
        if (dropdown && dropdown.classList.contains('active')) dropdown.classList.remove('active');
    }
    if (!e.target.closest('.profile-pic') && !e.target.closest('#profile-dropdown')) {
        const pd = document.getElementById('profile-dropdown');
        if (pd) pd.style.display = 'none';
    }
});
