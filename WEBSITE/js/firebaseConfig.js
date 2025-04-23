// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYJOTmOqzFuCWW7Q3lmXzGabq32O_9cZU",
    authDomain: "presence-38724.firebaseapp.com",
    databaseURL: "https://presence-38724-default-rtdb.firebaseio.com",
    projectId: "presence-38724",
    storageBucket: "presence-38724.appspot.com",
    messagingSenderId: "146866913600",
    appId: "1:146866913600:web:d33885e2bf79330d5bfaa5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Make them available globally
window.database = database;
window.auth = auth;