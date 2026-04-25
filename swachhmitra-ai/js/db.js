/**
 * FirebaseDB — Firestore-backed data layer.
 * Auto-seeds all collections on first load if empty.
 */

const SEED_BINS = [
    { id:"BIN-001", sector:"School",      areaType:"residential", location:"Central Campus Dr",  lat:28.6139, lng:77.2090, fillLevel:0,  lastUpdated:"Just now",    status:"empty",  temp:28, hum:60, isIoT:true  },
    { id:"BIN-002", sector:"Office",      areaType:"office",      location:"Tech Plaza East",     lat:28.6145, lng:77.2080, fillLevel:45, lastUpdated:"12 mins ago", status:"medium", temp:30, hum:55, isIoT:false },
    { id:"BIN-003", sector:"Industrial",  areaType:"market",      location:"Warehouse Block C",   lat:28.6150, lng:77.2070, fillLevel:10, lastUpdated:"2 mins ago",  status:"empty",  temp:32, hum:50, isIoT:false },
    { id:"BIN-004", sector:"Public",      areaType:"market",      location:"City Square Mall",    lat:28.6160, lng:77.2100, fillLevel:95, lastUpdated:"1 min ago",   status:"full",   temp:29, hum:58, isIoT:false },
    { id:"BIN-005", sector:"School",      areaType:"residential", location:"Main Library",        lat:28.6130, lng:77.2110, fillLevel:60, lastUpdated:"5 mins ago",  status:"medium", temp:27, hum:62, isIoT:false },
    { id:"BIN-006", sector:"Public",      areaType:"market",      location:"Kartavya Path",       lat:28.6125, lng:77.2125, fillLevel:72, lastUpdated:"Just now",    status:"medium", temp:31, hum:53, isIoT:false },
    { id:"BIN-007", sector:"Office",      areaType:"office",      location:"Delhi Gate St",       lat:28.6100, lng:77.2100, fillLevel:31, lastUpdated:"8 mins ago",  status:"empty",  temp:28, hum:57, isIoT:false },
    { id:"BIN-008", sector:"Industrial",  areaType:"market",      location:"Rouse Ave",           lat:28.6180, lng:77.2150, fillLevel:88, lastUpdated:"4 mins ago",  status:"full",   temp:33, hum:48, isIoT:false },
    { id:"BIN-009", sector:"Public",      areaType:"market",      location:"Mandi House",         lat:28.6165, lng:77.2180, fillLevel:22, lastUpdated:"12 mins ago", status:"empty",  temp:29, hum:60, isIoT:false },
    { id:"BIN-010", sector:"Office",      areaType:"office",      location:"Connaught Place",     lat:28.6200, lng:77.2100, fillLevel:55, lastUpdated:"3 mins ago",  status:"medium", temp:30, hum:54, isIoT:false },
    { id:"BIN-011", sector:"School",      areaType:"residential", location:"Shastri Bhawan",      lat:28.6140, lng:77.2150, fillLevel:68, lastUpdated:"Just now",    status:"medium", temp:28, hum:61, isIoT:false },
    { id:"BIN-012", sector:"Public",      areaType:"market",      location:"Indira Chowk",        lat:28.6210, lng:77.2140, fillLevel:42, lastUpdated:"7 mins ago",  status:"medium", temp:31, hum:52, isIoT:false },
    { id:"BIN-013", sector:"Industrial",  areaType:"market",      location:"Minto Rd",            lat:28.6250, lng:77.2180, fillLevel:91, lastUpdated:"1 min ago",   status:"full",   temp:34, hum:47, isIoT:false },
    { id:"BIN-014", sector:"Office",      areaType:"office",      location:"Barakhamba",          lat:28.6220, lng:77.2220, fillLevel:15, lastUpdated:"20 mins ago", status:"empty",  temp:29, hum:56, isIoT:false },
    { id:"BIN-015", sector:"Public",      areaType:"market",      location:"Janpath Market",      lat:28.6180, lng:77.2120, fillLevel:79, lastUpdated:"Just now",    status:"medium", temp:30, hum:55, isIoT:false }
];

const SEED_ALERTS = [
    { id:1, type:"critical", msg:"BIN-004 is critically full (95%)",  time:"2 mins ago",  dismissed:false },
    { id:2, type:"warning",  msg:"BIN-001 reached 85% capacity",      time:"10 mins ago", dismissed:false },
    { id:3, type:"critical", msg:"Sensor Failure on BIN-008",         time:"1 hr ago",    dismissed:false }
];

const SEED_AREAS = [
    { name:"market",      multiplier:25 },
    { name:"residential", multiplier:10 },
    { name:"office",      multiplier:15 }
];

const SEED_USERS = [
    { name:"Administrator", email:"admin", pass:"admin123", role:"admin" }
];

const FirebaseDB = {
    bins: [],
    alerts: [],
    collectionsToday: 0,
    co2Saved: 0,

    _listeners: [],
    _unsubBins: null,
    _unsubAlerts: null,

    // ── Public API ─────────────────────────────────────────────────────────
    getBins()   { return Promise.resolve(this.bins); },
    getAlerts() { return Promise.resolve(this.alerts.filter(a => !a.dismissed)); },
    onChange(cb){ this._listeners.push(cb); },
    trigger()   { this._listeners.forEach(cb => cb()); },

    // ── Init: seed if empty, then start listeners ──────────────────────────
    async init() {
        try {
            await this._seedIfEmpty();
            this._startListeners();
        } catch(e) {
            console.error('[FirebaseDB] init error:', e);
        }
    },

    async _seedIfEmpty() {
        const snap = await binsRef.limit(1).get();
        if (!snap.empty) {
            console.log('[FirebaseDB] Collections already exist, skipping seed.');
            return;
        }
        console.log('[FirebaseDB] Empty database detected — seeding all collections...');

        const batch = db.batch();

        // bins
        SEED_BINS.forEach(bin => {
            const priority = bin.fillLevel > 70 ? 'High' : bin.fillLevel >= 40 ? 'Medium' : 'Low';
            batch.set(binsRef.doc(), { ...bin, priority });
        });

        // alerts
        SEED_ALERTS.forEach(alert => {
            batch.set(alertsRef.doc(), alert);
        });

        // areas
        SEED_AREAS.forEach(area => {
            batch.set(areasRef.doc(), area);
        });

        // users
        SEED_USERS.forEach(user => {
            batch.set(usersRef.doc(), user);
        });

        // config/thresholds
        batch.set(configRef.doc('thresholds'), { high: 70, medium: 40 });

        await batch.commit();
        console.log('[FirebaseDB] Seed complete — all collections created.');
    },

    _startListeners() {
        this._unsubBins = binsRef.orderBy('id').onSnapshot(snap => {
            this.bins = snap.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
            this.trigger();
        }, err => console.error('[FirebaseDB] bins error:', err));

        this._unsubAlerts = alertsRef.orderBy('id').onSnapshot(snap => {
            this.alerts = snap.docs.map(doc => ({ _docId: doc.id, dismissed: false, ...doc.data() }));
            this.trigger();
        }, err => console.error('[FirebaseDB] alerts error:', err));
    },

    // ── Bin CRUD ───────────────────────────────────────────────────────────
    async addBin(bin) {
        const fill = bin.fillLevel || 0;
        await binsRef.add({
            ...bin,
            priority: fill > 70 ? 'High' : fill >= 40 ? 'Medium' : 'Low',
            status:   fill >= 90 ? 'full' : fill >= 50 ? 'medium' : 'empty'
        });
    },

    async updateBin(docId, fields) {
        if (!docId) return;
        // Only recalculate priority/status if fillLevel is being updated
        if (fields.fillLevel !== undefined) {
            const fill = fields.fillLevel;
            fields.priority = fill > 70 ? 'High' : fill >= 40 ? 'Medium' : 'Low';
            fields.status   = fill >= 90 ? 'full' : fill >= 50 ? 'medium' : 'empty';
        }
        await binsRef.doc(docId).update(fields);
    },

    async deleteBin(docId) {
        if (!docId) return;
        await binsRef.doc(docId).delete();
    },

    // ── Alert CRUD ─────────────────────────────────────────────────────────
    async dismissAlert(docId) {
        if (!docId) return;
        await alertsRef.doc(docId).update({ dismissed: true });
    },

    async addAlert(alert) {
        await alertsRef.add({ ...alert, dismissed: false });
    },

    // ── User CRUD ──────────────────────────────────────────────────────────
    async getUsers() {
        const snap = await usersRef.get();
        return snap.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
    },

    async addUser(user) {
        await usersRef.add(user);
    },

    async findUser(email, pass) {
        const snap = await usersRef
            .where('email', '==', email)
            .where('pass', '==', pass)
            .limit(1).get();
        return snap.empty ? null : { _docId: snap.docs[0].id, ...snap.docs[0].data() };
    },

    // ── Area config ────────────────────────────────────────────────────────
    async getAreas() {
        const snap = await areasRef.get();
        const result = {};
        snap.docs.forEach(doc => { result[doc.data().name] = doc.data().multiplier; });
        return result;
    },

    async saveArea(name, multiplier) {
        const snap = await areasRef.where('name', '==', name).get();
        if (snap.empty) {
            await areasRef.add({ name, multiplier });
        } else {
            await areasRef.doc(snap.docs[0].id).update({ multiplier });
        }
    },

    async deleteArea(name) {
        const snap = await areasRef.where('name', '==', name).get();
        snap.docs.forEach(doc => doc.ref.delete());
    },

    // ── Threshold config ───────────────────────────────────────────────────
    async getThresholds() {
        const doc = await configRef.doc('thresholds').get();
        return doc.exists ? doc.data() : { high: 70, medium: 40 };
    },

    async saveThresholds(high, medium) {
        await configRef.doc('thresholds').set({ high, medium });
    }
};
