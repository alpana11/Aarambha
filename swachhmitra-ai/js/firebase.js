// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDd_MF2vGDe8HsLwX3fTu7rP41WVgOnipA",
    authDomain: "swachhmitraai-c3721.firebaseapp.com",
    projectId: "swachhmitraai-c3721",
    storageBucket: "swachhmitraai-c3721.firebasestorage.app",
    messagingSenderId: "323033084407",
    appId: "1:323033084407:web:7d894bbb47cb5526d93ef2",
    measurementId: "G-CN2GXYFY62"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// Collection references
const binsRef   = db.collection('bins');
const alertsRef = db.collection('alerts');
const usersRef  = db.collection('users');
const areasRef  = db.collection('areas');
const configRef = db.collection('config');
