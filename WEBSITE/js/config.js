import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Replace these values with your actual Firebase configuration
// You can find these in your Firebase Console under Project Settings
const firebaseConfig = {
    apiKey: "AIzaSyAYJOTmOqzFuCWW7Q3lmXzGabq32O_9cZU",
    authDomain: "presence-38724.firebaseapp.com",
    databaseURL: "https://presence-38724-default-rtdb.firebaseio.com",
    projectId: "presence-38724",
    storageBucket: "presence-38724.firebasestorage.app",
    messagingSenderId: "146866913600",
    appId: "1:146866913600:web:d33885e2bf79330d5bfaa5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Debug: Log Firebase initialization
console.log('Firebase initialized:', {
    app: app.name,
    auth: auth.app.name,
    database: database.app.name
});