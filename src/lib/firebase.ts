import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDntGC2EYJXuB8Cw9BSeaVtWHHSnhrRJoQ",
  authDomain: "mun-web-d11b6.firebaseapp.com",
  databaseURL: "https://mun-web-d11b6-default-rtdb.firebaseio.com",
  projectId: "mun-web-d11b6",
  storageBucket: "mun-web-d11b6.firebasestorage.app",
  messagingSenderId: "209579669797",
  appId: "1:209579669797:web:47a8120d2564066ad9c2cc",
  measurementId: "G-CD8EZMFZE8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);