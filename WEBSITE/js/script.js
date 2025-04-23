// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, getDocs, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAYJOTmOqzFuCWW7Q3lmXzGabq32O_9cZU",
    authDomain: "presence-38724.firebaseapp.com",
    databaseURL: "https://presence-38724-default-rtdb.firebaseio.com",
    projectId: "presence-38724",
    storageBucket: "presence-38724.firebasestorage.app",
    messagingSenderId: "146866913600",
    appId: "1:146866913600:web:d33885e2bf79330d5bfaa5",
    measurementId: "G-XRLQZGGNYH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Show/Hide Sections Function
window.showSection = function(sectionId) {
    // Hide all sections first
    const sections = ['overview', 'todayLectures', 'previousRecords', 'overallRecords'];
    sections.forEach(section => {
        document.getElementById(section).style.display = 'none';
    });

    // Show selected section
    document.getElementById(sectionId).style.display = 'block';

    // Update active state in navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Load section specific data
    switch(sectionId) {
        case 'todayLectures':
            loadTodayLectures();
            break;
        case 'previousRecords':
            loadPreviousRecords();
            break;
        case 'overallRecords':
            loadOverallStats();
            break;
    }
};

// Load Today's Lectures
async function loadTodayLectures() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    try {
        const q = query(
            collection(db, "attendance"),
            where("timestamp", ">=", todayStart),
            where("timestamp", "<=", todayEnd),
            orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const todayLecturesList = document.getElementById('todayLectureList');
        todayLecturesList.innerHTML = '';

        const lectures = {};
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const hour = data.timestamp.toDate().getHours();
            if (!lectures[hour]) {
                lectures[hour] = {
                    present: 0,
                    total: 0,
                    time: data.timestamp.toDate()
                };
            }
            lectures[hour].present++;
            lectures[hour].total++;
        });

        Object.entries(lectures).forEach(([hour, data]) => {
            const lectureCard = document.createElement('div');
            lectureCard.className = 'lecture-card content-section';
            lectureCard.innerHTML = `
                <div class="lecture-info">
                    <h3>Lecture at ${data.time.getHours()}:00</h3>
                    <p>Present: ${data.present}/${data.total}</p>
                    <p>Attendance: ${((data.present/data.total) * 100).toFixed(2)}%</p>
                </div>
                <div class="lecture-actions">
                    <button onclick="markAttendance(${hour})" class="action-button">
                        <i class="bi bi-plus-circle"></i> Mark Attendance
                    </button>
                </div>
            `;
            todayLecturesList.appendChild(lectureCard);
        });
    } catch (error) {
        console.error("Error loading today's lectures:", error);
    }
}

// Load Previous Records
async function loadPreviousRecords() {
    const fromDate = document.getElementById("from-date")?.value;
    const toDate = document.getElementById("to-date")?.value;

    let q;
    if (fromDate && toDate) {
        const fromTimestamp = new Date(fromDate);
        const toTimestamp = new Date(toDate);
        toTimestamp.setHours(23, 59, 59);
        
        q = query(
            collection(db, "attendance"),
            where("timestamp", ">=", fromTimestamp),
            where("timestamp", "<=", toTimestamp),
            orderBy("timestamp", "desc")
        );
    } else {
        q = query(
            collection(db, "attendance"),
            orderBy("timestamp", "desc")
        );
    }

    try {
        const querySnapshot = await getDocs(q);
        const tableBody = document.getElementById('attendance-table');
        tableBody.innerHTML = '';

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp.toDate();
            const row = `
                <tr>
                    <td>${date.toLocaleDateString()}</td>
                    <td>${date.toLocaleTimeString()}</td>
                    <td>${data.student_name || data.name || 'N/A'}</td>
                    <td>${data.rollNo || 'N/A'}</td>
                    <td>${data.status || 'Present'}</td>
                    <td>
                        <button onclick="viewDetails('${doc.id}')" class="action-button secondary">
                            <i class="bi bi-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error loading previous records:", error);
    }
}

// Load Overall Statistics
async function loadOverallStats() {
    try {
        const q = query(collection(db, "attendance"));
        const querySnapshot = await getDocs(q);
        
        let totalAttendance = 0;
        let totalStudents = 0;
        let totalDays = new Set();
        let studentAttendance = {};

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp.toDate().toDateString();
            totalDays.add(date);
            
            totalAttendance++;
            
            if (data.student_name || data.name) {
                const studentName = data.student_name || data.name;
                if (!studentAttendance[studentName]) {
                    studentAttendance[studentName] = 0;
                }
                studentAttendance[studentName]++;
                totalStudents++;
            }
        });

        const statsContainer = document.querySelector('.overall-stats');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Total Days</h3>
                    <p class="stat-number">${totalDays.size}</p>
                </div>
                <i class="bi bi-calendar3 stat-icon"></i>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Total Attendance</h3>
                    <p class="stat-number">${totalAttendance}</p>
                </div>
                <i class="bi bi-person-check stat-icon"></i>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Average Attendance</h3>
                    <p class="stat-number">${((totalAttendance/totalStudents) * 100).toFixed(2)}%</p>
                </div>
                <i class="bi bi-graph-up stat-icon"></i>
            </div>
        `;
    } catch (error) {
        console.error("Error loading overall stats:", error);
    }
}

// Authentication State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        // Show overview by default
        showSection('overview');
    } else {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }
});
// Add this to your existing script.js
auth.onAuthStateChanged((user) => {
    if (user) {
        // Update the updateDateTime function to use the actual user's email
        function updateDateTime() {
            const now = new Date();
            
            // Format date parts
            const year = now.getUTCFullYear();
            const month = String(now.getUTCMonth() + 1).padStart(2, '0');
            const day = String(now.getUTCDate()).padStart(2, '0');
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            const seconds = String(now.getUTCSeconds()).padStart(2, '0');

            // Use the actual user's email
            const currentUser = user.email;

            // Create formatted string
            const formatted = 
                'Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): ' +
                `${year}-${month}-${day} ${hours}:${minutes}:${seconds}\n` +
                'Current User\'s Login: ' + currentUser;

            document.getElementById('currentDateTime').innerText = formatted;
        }

        // Start the datetime updates
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }
});

// Make sure your HTML includes these sections
// Add this to your dashboard content area in index.html: