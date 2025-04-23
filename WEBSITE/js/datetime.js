import { auth, database } from './config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Function to update datetime display
function updateDateTime() {
    const now = new Date();
    
    // Format date components for UTC time
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');

    // Get current user's email
    const currentUser = auth.currentUser ? auth.currentUser.email : '';

    // Create formatted string
    const formatted = 
        'Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): ' +
        `${year}-${month}-${day} ${hours}:${minutes}:${seconds}\n` +
        'Current User\'s Login: ' + currentUser;

    // Update the display
    document.getElementById('currentDateTime').innerText = formatted;
}

// Start real-time updates when authenticated
auth.onAuthStateChanged((user) => {
    if (user) {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Load real-time attendance data
        const today = new Date().toISOString().split('T')[0];
        const attendanceRef = ref(database, `attendance/${today}`);
        
        onValue(attendanceRef, (snapshot) => {
            if (snapshot.exists()) {
                updateAttendanceDisplay(snapshot.val());
            }
        });
    }
});

// Function to update attendance display
function updateAttendanceDisplay(attendanceData) {
    const attendanceList = document.getElementById('todayLectureList');
    if (!attendanceList) return;

    attendanceList.innerHTML = '';
    
    Object.entries(attendanceData).forEach(([hour, students]) => {
        const presentCount = Object.values(students).filter(s => s.status === 'present').length;
        
        const lectureCard = document.createElement('div');
        lectureCard.className = 'lecture-card';
        lectureCard.innerHTML = `
            <div class="lecture-info">
                <h3>Lecture at ${hour}:00</h3>
                <p>Present: ${presentCount}/${Object.keys(students).length}</p>
                <p>Attendance: ${((presentCount/Object.keys(students).length) * 100).toFixed(2)}%</p>
            </div>
            <div class="lecture-actions">
                <button onclick="markAttendanceForHour('${hour}')" class="action-button">
                    Mark Attendance
                </button>
            </div>
        `;
        attendanceList.appendChild(lectureCard);
    });
}