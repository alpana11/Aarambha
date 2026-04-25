import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAnalytics }  from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            'AIzaSyDd_MF2vGDe8HsLwX3fTu7rP41WVgOnipA',
  authDomain:        'swachhmitraai-c3721.firebaseapp.com',
  projectId:         'swachhmitraai-c3721',
  storageBucket:     'swachhmitraai-c3721.firebasestorage.app',
  messagingSenderId: '323033084407',
  appId:             '1:323033084407:web:7d894bbb47cb5526d93ef2',
  measurementId:     'G-CN2GXYFY62',
};

const app       = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
