const MockDB = {
    bins: [
        { id: "BIN-001", sector: "School", areaType: "residential", location: "Central Campus Dr", lat: 28.6139, lng: 77.2090, fillLevel: 0, lastUpdated: "Connecting...", status: "connecting", temp: 0, hum: 0, isIoT: true },
        { id: "BIN-002", sector: "Office", areaType: "office", location: "Tech Plaza East", lat: 28.6145, lng: 77.2080, fillLevel: 45, lastUpdated: "12 mins ago", status: "medium" },
        { id: "BIN-003", sector: "Industrial", areaType: "market", location: "Warehouse Block C", lat: 28.6150, lng: 77.2070, fillLevel: 10, lastUpdated: "2 mins ago", status: "empty" },
        { id: "BIN-004", sector: "Public", areaType: "market", location: "City Square Mall", lat: 28.6160, lng: 77.2100, fillLevel: 95, lastUpdated: "1 min ago", status: "full" },
        { id: "BIN-005", sector: "School", areaType: "residential", location: "Main Library", lat: 28.6130, lng: 77.2110, fillLevel: 60, lastUpdated: "5 mins ago", status: "medium" },
        { id: "BIN-006", sector: "Public", areaType: "market", location: "Kartavya Path", lat: 28.6125, lng: 77.2125, fillLevel: 72, lastUpdated: "Just now", status: "medium" },
        { id: "BIN-007", sector: "Office", areaType: "office", location: "Delhi Gate St", lat: 28.6100, lng: 77.2100, fillLevel: 31, lastUpdated: "8 mins ago", status: "empty" },
        { id: "BIN-008", sector: "Industrial", areaType: "market", location: "Rouse Ave", lat: 28.6180, lng: 77.2150, fillLevel: 88, lastUpdated: "4 mins ago", status: "full" },
        { id: "BIN-009", sector: "Public", areaType: "market", location: "Mandi House", lat: 28.6165, lng: 77.2180, fillLevel: 22, lastUpdated: "12 mins ago", status: "empty" },
        { id: "BIN-010", sector: "Office", areaType: "office", location: "Connaught Place", lat: 28.6200, lng: 77.2100, fillLevel: 55, lastUpdated: "3 mins ago", status: "medium" },
        { id: "BIN-011", sector: "School", areaType: "residential", location: "Shastri Bhawan", lat: 28.6140, lng: 77.2150, fillLevel: 68, lastUpdated: "Just now", status: "medium" },
        { id: "BIN-012", sector: "Public", areaType: "market", location: "Indira Chowk", lat: 28.6210, lng: 77.2140, fillLevel: 42, lastUpdated: "7 mins ago", status: "medium" },
        { id: "BIN-013", sector: "Industrial", areaType: "market", location: "Minto Rd", lat: 28.6250, lng: 77.2180, fillLevel: 91, lastUpdated: "1 min ago", status: "full" },
        { id: "BIN-014", sector: "Office", areaType: "office", location: "Barakhamba", lat: 28.6220, lng: 77.2220, fillLevel: 15, lastUpdated: "20 mins ago", status: "empty" },
        { id: "BIN-015", sector: "Public", areaType: "market", location: "Janpath Market", lat: 28.6180, lng: 77.2120, fillLevel: 79, lastUpdated: "Just now", status: "medium" }
    ].map(bin => {
        bin.priority = bin.fillLevel > 70 ? 'High' : (bin.fillLevel >= 40 ? 'Medium' : 'Low');
        return bin;
    }),
    alerts: [
        { id: 1, type: "critical", msg: "BIN-004 is critically full (95%)", time: "2 mins ago" },
        { id: 2, type: "warning", msg: "BIN-001 reached 85% capacity", time: "10 mins ago" },
        { id: 3, type: "critical", msg: "Sensor Failure on BIN-008", time: "1 hr ago" }
    ],
    listeners: [],
    onChange: function (callback) { this.listeners.push(callback); },
    trigger: function () { this.listeners.forEach(cb => cb()); },
    getBins: () => Promise.resolve(MockDB.bins),
    getAlerts: () => Promise.resolve(MockDB.alerts)
};

// Start simple simulator
setInterval(() => {
    let changed = false;
    MockDB.bins.forEach(bin => {
        if (Math.random() > 0.8) {
            bin.fillLevel += Math.floor(Math.random() * 5);
            if (bin.fillLevel >= 100) bin.fillLevel = 0;
            bin.priority = bin.fillLevel > 70 ? 'High' : (bin.fillLevel >= 40 ? 'Medium' : 'Low');
            
            if (bin.fillLevel >= 90) bin.status = 'full';
            else if (bin.fillLevel >= 50) bin.status = 'medium';
            else bin.status = 'empty';
            changed = true;
        }
    });
    if (changed) MockDB.trigger();
}, 5000);

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

        // Listen for Real-Time data simulated from Firebase/ESP32
        MockDB.onChange(() => this.updateRealTimeData());

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

        if (mode === 'signup') {
            submitBtn.innerText = 'Create Account';
            switchText.innerText = 'Sign up for user access';
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            if (nameGroup) nameGroup.style.display = 'block';
            if (roleGroup) roleGroup.style.display = 'none';
        } else {
            submitBtn.innerText = 'Login to Dashboard';
            switchText.innerText = 'Access for Admin or Registered Users';
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            if (nameGroup) nameGroup.style.display = 'none';
            if (roleGroup) roleGroup.style.display = 'block';
        }
    }

    async handleAuth(e) {
        e.preventDefault();
        const email = document.getElementById('auth-username').value.trim();
        const pass = document.getElementById('auth-password').value.trim();

        if (this.authMode === 'signup') {
            const name = document.getElementById('auth-name').value.trim();
            if (!name || !email || !pass) { alert('Please fill all fields.'); return; }
            const users = this.getUsers();
            if (users.find(u => u.email === email)) { alert('Email already registered. Please login.'); return; }
            users.push({ name, email, pass });
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
                    this.initiateDashboard('user', match.name);
                } else if (email.length > 0 && pass.length > 0) {
                    // Allow any email/pass as guest user
                    this.initiateDashboard('user', email);
                } else {
                    alert('Invalid credentials!');
                }
            }
        }
    }

    initiateDashboard(role, username = 'User') {
        this.role = role;
        this.username = username;

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
        const list = document.getElementById('notification-list');
        const alerts = await MockDB.getAlerts();
        document.getElementById('notification-badge').innerText = alerts.length;
        list.innerHTML = alerts.map(a => `
            <div class="alert-item ${a.type}">
                <i class="fa-solid ${a.type === 'critical' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}"></i>
                <div class="alert-content">
                    <h4>${a.msg}</h4>
                    <p>${a.time}</p>
                </div>
            </div>
        `).join('');
    }

    async updateRealTimeData() {
        const bins = await MockDB.getBins();

        let alerts = await MockDB.getAlerts();
        document.getElementById('notification-badge').innerText = alerts.length;

        // Smart partial-updates based on view, without destroying chart/map states.
        if (this.currentView === 'admin-overview') {
            // Update live chart values
            if (this.charts['overviewChart']) {
                this.charts['overviewChart'].data.datasets[0].data = bins.map(b => b.fillLevel);
                this.charts['overviewChart'].data.datasets[0].backgroundColor = bins.map(b => b.priority === 'High' ? '#E53935' : (b.priority === 'Medium' ? '#FFB300' : '#4CAF50'));
                this.charts['overviewChart'].update();
            }

            // Update sector chart
            if (this.charts['sectorChart']) {
                const sectorCounts = bins.reduce((acc, b) => { acc[b.sector] = (acc[b.sector] || 0) + 1; return acc; }, {});
                this.charts['sectorChart'].data.datasets[0].data = Object.values(sectorCounts);
                this.charts['sectorChart'].update();
            }

            // Update Live Alerts
            const alertsList = document.getElementById('admin-alerts');
            if (alertsList) {
                const alerts = await MockDB.getAlerts();
                alertsList.innerHTML = alerts.map(a => `
                    <div class="alert-item ${a.type}">
                        <div class="alert-content">
                            <h4>${a.msg}</h4>
                            <p>${a.time}</p>
                        </div>
                    </div>
                `).join('');
            }

            // Re-calculate stats silently
            const statValues = document.querySelectorAll('#dashboard-view.active .stat-value');
            if (statValues.length >= 2) {
                statValues[1].innerText = bins.filter(b => b.fillLevel >= 90).length; // Full bins count
            }
        }
        else if (this.currentView === 'user-home') {
            this.initUserHome(); // safe to re-render DOM list
        }
        else if (this.currentView === 'admin-bins') {
            this.initAdminBins();
        }
        else if (this.currentView === 'admin-routes') {
            this.refreshRouteMarkers();
        }
        else if (this.currentView === 'admin-overview') {
            // already handled above
        }

        // If notifications dropdown is open, update it
        if (document.getElementById('notifications-dropdown').classList.contains('active')) {
            this.loadNotifications();
        }
    }

    async initUserHome() {
        const bins = await MockDB.getBins();
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
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        this.maps['userMap'] = map;
        setTimeout(() => map.invalidateSize(), 100);

        const bins = await MockDB.getBins();

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
        const bins = await MockDB.getBins();

        // Live stats
        const total = bins.length;
        const full = bins.filter(b => b.fillLevel >= 90).length;
        const medium = bins.filter(b => b.fillLevel >= 40 && b.fillLevel < 90).length;
        const el = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val; };
        el('mon-total', total); el('mon-full', full); el('mon-medium', medium);

        // Hide status distribution chart for users
        const sectorCard = document.getElementById('sector-chart-card');
        if (sectorCard && this.role === 'user') sectorCard.style.display = 'none';

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

        // Pie chart — status distribution
        const sCtx = document.getElementById('sector-chart').getContext('2d');
        const statusCounts = { Full: full, Medium: medium, Empty: total - full - medium };
        this.charts['sectorChart'] = new Chart(sCtx, {
            type: 'pie',
            data: { labels: Object.keys(statusCounts), datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#E53935', '#FFB300', '#4CAF50'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });

        // Alerts
        const alertsList = document.getElementById('admin-alerts');
        const alerts = await MockDB.getAlerts();
        if (alertsList) alertsList.innerHTML = alerts.map(a => `
            <div class="alert-item ${a.type}"><div class="alert-content"><h4>${a.msg}</h4><p>${a.time}</p></div></div>
        `).join('');
    }

    async initAdminRoutes() {
        // Init Map
        const map = L.map('admin-route-map').setView([28.6139, 77.2090], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        this.maps['routeMap'] = map;
        this.routeMarkers = {};
        setTimeout(() => map.invalidateSize(), 100);

        // Show existing pins initially
        const bins = await MockDB.getBins();
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
        MockDB.getBins().then(bins => {
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
        const bins = await MockDB.getBins();
        bins.forEach(bin => {
            if (bin.areaType === 'market') bin.fillLevel = Math.min(100, bin.fillLevel + 25);
            else if (bin.areaType === 'office') bin.fillLevel = Math.min(100, bin.fillLevel + 15);
            else bin.fillLevel = Math.min(100, bin.fillLevel + 10);
            bin.priority = bin.fillLevel > 70 ? 'High' : (bin.fillLevel >= 40 ? 'Medium' : 'Low');
            bin.status = bin.fillLevel >= 90 ? 'full' : (bin.fillLevel >= 50 ? 'medium' : 'empty');
        });
        console.log('[simulateDay] bins updated, triggering refresh');
        MockDB.trigger();
        this.showToast('Day simulated! Market +25%, Office +15%, Residential +10%', 'info');
        this.refreshRouteMarkers();
    }

    async generateRoute() {
        console.log('[generateRoute] called');
        const bins = await MockDB.getBins();
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

        const bins = await MockDB.getBins();
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
                target.fillLevel = 0;
                target.status = 'empty';
                MockDB.trigger(); // Refresh UI
                currentStop++;
                setTimeout(moveTruck, 1500); // 1.5s per stop
            }, 1000);
        };

        moveTruck();
    }

    async initAdminBins() {
        const tbody = document.getElementById('bins-table-body');
        const bins = await MockDB.getBins();
        const isUser = this.role === 'user';

        // Hide sector column header for users
        const sectorTh = document.getElementById('bins-sector-th');
        if (sectorTh) sectorTh.style.display = isUser ? 'none' : '';

        tbody.innerHTML = bins.map(bin => `
            <tr>
                <td><strong>${bin.id}</strong></td>
                ${isUser ? '' : `<td><small style="padding:4px 8px;background:var(--bg-color);border-radius:4px;font-weight:bold">${bin.sector}</small></td>`}
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
        const bin = MockDB.bins.find(b => b.id === id);
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
            bin.location = document.getElementById('edit-bin-loc').value.trim() || bin.location;
            bin.areaType = document.getElementById('edit-bin-area').value;
            bin.fillLevel = Math.min(100, Math.max(0, parseInt(document.getElementById('edit-bin-fill').value) || bin.fillLevel));
            bin.priority = bin.fillLevel > 70 ? 'High' : bin.fillLevel >= 40 ? 'Medium' : 'Low';
            bin.status = bin.fillLevel >= 90 ? 'full' : bin.fillLevel >= 50 ? 'medium' : 'empty';
            this.closeModal();
            this.showToast(`Bin ${id} updated!`, 'success');
            this.initAdminBins();
            MockDB.trigger();
        };
        modal.classList.add('active');
    }

    deleteBin(id) {
        if (!confirm(`Remove bin ${id} from the system?`)) return;
        MockDB.bins = MockDB.bins.filter(b => b.id !== id);
        this.showToast(`Bin ${id} removed.`, 'info');
        this.initAdminBins();
        MockDB.trigger();
    }

    initAdminAreas() {
        const areas = JSON.parse(localStorage.getItem('eco_areas') || '{"market":25,"residential":10,"office":15}');
        const tbody = document.getElementById('area-config-body');
        if (!tbody) return;
        const bins = MockDB.bins;
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

    saveAreaConfig() {
        const name = document.getElementById('area-name-input').value.trim().toLowerCase();
        const mult = parseInt(document.getElementById('area-mult-input').value);
        if (!name || !mult || mult < 1 || mult > 100) { alert('Enter valid area name and multiplier (1-100).'); return; }
        const areas = JSON.parse(localStorage.getItem('eco_areas') || '{"market":25,"residential":10,"office":15}');
        areas[name] = mult;
        localStorage.setItem('eco_areas', JSON.stringify(areas));
        this.showToast(`Area "${name}" saved with ${mult}% multiplier.`, 'success');
        this.initAdminAreas();
    }

    deleteArea(name) {
        const areas = JSON.parse(localStorage.getItem('eco_areas') || '{}');
        delete areas[name];
        localStorage.setItem('eco_areas', JSON.stringify(areas));
        this.showToast(`Area "${name}" removed.`, 'info');
        this.initAdminAreas();
    }

    initAdminThresholds() {
        const saved = JSON.parse(localStorage.getItem('eco_thresholds') || '{"high":70,"medium":40}');
        const highEl = document.getElementById('thresh-high');
        const medEl = document.getElementById('thresh-med');
        if (highEl) { highEl.value = saved.high; document.getElementById('thresh-high-val').innerText = saved.high + '%'; }
        if (medEl) { medEl.value = saved.medium; document.getElementById('thresh-med-val').innerText = saved.medium + '%'; }
    }

    saveThresholds() {
        const high = parseInt(document.getElementById('thresh-high').value);
        const medium = parseInt(document.getElementById('thresh-med').value);
        if (medium >= high) { alert('Medium threshold must be lower than High threshold.'); return; }
        localStorage.setItem('eco_thresholds', JSON.stringify({ high, medium }));
        // Apply to all bins immediately
        MockDB.bins.forEach(bin => {
            bin.priority = bin.fillLevel > high ? 'High' : bin.fillLevel >= medium ? 'Medium' : 'Low';
        });
        MockDB.trigger();
        this.showToast(`Thresholds applied: High >${high}%, Medium >=${medium}%`, 'success');
    }

    async initAdminPredictions() {
        const bins = await MockDB.getBins();

        let maxRiskBin = bins[0];
        let totalFillHrs = 0;

        const predictedBins = bins.map(bin => {
            // Simulated historic fill rate: random deterministic % per hour
            let rate = (bin.id.charCodeAt(bin.id.length - 1) % 5) + 3.5;

            let remainingSpace = 100 - bin.fillLevel;
            let hrsTillFull = (remainingSpace / rate).toFixed(1);
            if (hrsTillFull < 0) hrsTillFull = 0;

            if (parseFloat(hrsTillFull) < parseFloat((100 - maxRiskBin.fillLevel) / ((maxRiskBin.id.charCodeAt(maxRiskBin.id.length - 1) % 5) + 3.5))) {
                maxRiskBin = bin;
            }

            totalFillHrs += parseFloat(hrsTillFull);

            return {
                ...bin,
                predictedHrs: hrsTillFull,
                fillRate: rate.toFixed(1)
            };
        });

        predictedBins.sort((a, b) => parseFloat(a.predictedHrs) - parseFloat(b.predictedHrs));

        const elem = document.getElementById('pred-risk-bin');
        if (elem) elem.innerText = maxRiskBin.id;

        const insightsList = document.getElementById('smart-insights-list');
        if (insightsList) {
            insightsList.innerHTML = `
                <li><i class="fa-solid fa-triangle-exclamation" style="color:var(--status-red); font-size:1.2rem;"></i> <div><strong>${predictedBins[0].id}</strong> will overflow in ~${predictedBins[0].predictedHrs} hrs! Schedule priority collection.</div></li>
                <li><i class="fa-solid fa-bolt" style="color:var(--status-yellow); font-size:1.2rem;"></i> <div><strong>${predictedBins[1].id}</strong> has a high fill rate of ${predictedBins[1].fillRate}%/hr due to high traffic area.</div></li>
                <li><i class="fa-solid fa-leaf" style="color:var(--status-green); font-size:1.2rem;"></i> <div>Route Optimization can safely skip <strong>${predictedBins[predictedBins.length - 1].id}</strong> today.</div></li>
            `;
        }

        const cardsContainer = document.getElementById('prediction-cards-container');
        if (cardsContainer) {
            cardsContainer.innerHTML = predictedBins.map(b => {
                let urgency = b.predictedHrs <= 5 ? 'full' : (b.predictedHrs <= 12 ? 'medium' : 'empty');
                let colorStr = urgency === 'full' ? 'var(--status-red)' : (urgency === 'medium' ? 'var(--status-yellow)' : 'var(--status-green)');
                return `
                 <div class="bin-card ${urgency}">
                    <div class="bin-header">
                        <h4><i class="fa-solid fa-chart-line"></i> ${b.id}</h4>
                        <span class="fill-badge" style="color:${colorStr}; background:${colorStr}20">In ${b.predictedHrs} Hrs</span>
                    </div>
                    <div class="progress-bar-container" style="height:4px;"><div class="progress-bar" style="width:${b.fillLevel}%;background-color:${colorStr};"></div></div>
                    <div class="bin-details-text mt-2">
                        <span>Fill: ${b.fillLevel}%</span>
                        <span>Rate: ${b.fillRate}%/hr</span>
                    </div>
                 </div>
                 `;
            }).join('');
        }

        const chartCanvas = document.getElementById('prediction-line-chart');
        if (!chartCanvas) return;
        const ctx = chartCanvas.getContext('2d');
        const labels = ['-5h', '-4h', '-3h', '-2h', '-1h', 'Now', '+1h', '+2h', '+3h', '+4h', '+5h'];

        let currentFill = maxRiskBin.fillLevel;
        let rate = (maxRiskBin.id.charCodeAt(maxRiskBin.id.length - 1) % 5) + 3.5;

        let pastData = [];
        for (let i = 5; i >= 1; i--) pastData.push(Math.max(0, currentFill - (rate * i)));
        pastData.push(currentFill);

        let futureData = [null, null, null, null, null, currentFill];
        for (let i = 1; i <= 5; i++) futureData.push(Math.min(100, currentFill + (rate * i)));

        this.charts['predLineChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `Historical (${maxRiskBin.id})`,
                        data: pastData.concat([null, null, null, null, null]),
                        borderColor: '#A5D6A7',
                        backgroundColor: 'rgba(165, 214, 167, 0.2)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: `AI Predicted Trend`,
                        data: futureData,
                        borderColor: '#E53935',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
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

        MockDB.bins.push({ id, location: loc, lat, lng, fillLevel: 0, lastUpdated: 'Just now', status: 'empty', areaType: 'residential', sector: 'Public', priority: 'Low' });
        this.closeModal();
        this.showToast(`Bin ${id} added successfully!`, 'success');
        if (this.currentView === 'admin-bins') this.initAdminBins();
        MockDB.trigger();
    }

    /* ================== Toast Notifications ================== */
    showToast(message, type = 'warning', binId = null) {
        // Don't show notifications if not logged in
        if (!this.role) return;

        // If we are a standard user, only block binId-specific toasts for other bins
        if (this.role === 'user' && binId && binId !== 'BIN-001') {
            return;
        }

        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = 'fa-circle-exclamation';
        if (type === 'critical') {
            icon = 'fa-triangle-exclamation';
            toast.classList.add('critical-pulse');
        }
        else if (type === 'info') icon = 'fa-circle-info';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

        // Update notification badge
        this.incrementBadge();

        // Remove on click
        toast.onclick = () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        };

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 400);
            }
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
        if (dropdown && dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
        }
    }
});
