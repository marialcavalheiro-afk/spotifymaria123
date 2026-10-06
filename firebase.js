import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDh2L9C2Chxlazgb4AZfNIvY6Y9Uh492Uw",
  authDomain: "clone-spotify-b1d3c.firebaseapp.com",
  databaseURL: "https://clone-spotify-b1d3c-default-rtdb.firebaseio.com",
  projectId: "clone-spotify-b1d3c",
  storageBucket: "clone-spotify-b1d3c.firebasestorage.app",
  messagingSenderId: "110354625577",
  appId: "1:110354625577:web:71ac3225103825d9a6d838",
  measurementId: "G-DVJ7FK35E3"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
