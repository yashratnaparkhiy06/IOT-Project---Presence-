import { database } from './config.js';
import { ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Initialize real-time monitoring
export function initializeESP32Monitoring() {
    console.log('Initializing ESP32 monitoring...');
    
    // Monitor ESP32 status
    const esp32Ref = ref(database, 'esp32_status');
    onValue(esp32Ref, (snapshot) => {
        updateESP32Status(snapshot.val());
    });

    // Monitor active devices
    const devicesRef = ref(database, 'esp32_attendance/active_devices');
    const studentsRef = ref(database, 'esp32_attendance/students');
    
    onValue(devicesRef, async (deviceSnapshot) => {
        console.log('Active devices updated:', deviceSnapshot.val());
        if (deviceSnapshot.exists()) {
            const activeDevices = deviceSnapshot.val();
            
            // Get students data
            const studentSnapshot = await get(studentsRef);
            if (studentSnapshot.exists()) {
                const students = studentSnapshot.val();
                updateAttendance(activeDevices, students);
            }
        }
    });

    // Initial load of student data
    get(studentsRef).then((snapshot) => {
        if (snapshot.exists()) {
            updateStudentsList(snapshot.val());
        }
    });
}

// Update ESP32 status display
function updateESP32Status(status) {
    const statusElement = document.getElementById('esp32Status');
    const lastUpdateElement = document.getElementById('lastUpdateTime');
    
    if (statusElement && lastUpdateElement) {
        if (status && status.connected) {
            statusElement.textContent = 'Connected';
            statusElement.className = 'status-connected';
            lastUpdateElement.textContent = new Date(status.lastUpdate).toLocaleTimeString();
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'status-disconnected';
            lastUpdateElement.textContent = 'N/A';
        }
    }
}

// Update attendance based on active devices
function updateAttendance(activeDevices, students) {
    const now = new Date();
    const cutoffTime = now.getTime() - (5 * 60 * 1000); // 5 minutes ago
    let presentCount = 0;
    let totalCount = 0;

    // Update student statuses
    Object.entries(students).forEach(([studentId, student]) => {
        totalCount++;
        const deviceData = activeDevices[student.mac_address];
        
        // Check if device is recently active
        if (deviceData) {
            const lastSeen = new Date(deviceData.last_seen).getTime();
            const isPresent = lastSeen > cutoffTime;
            
            if (isPresent) presentCount++;
            
            // Update student status in database
            set(ref(database, `esp32_attendance/students/${studentId}/status`), 
                isPresent ? 'present' : 'absent');
            set(ref(database, `esp32_attendance/students/${studentId}/last_seen`),
                deviceData.last_seen);
        }
    });

    // Update counters
    updateCounters(presentCount, totalCount - presentCount, totalCount);
    updateStudentsList(students);
}

// Update attendance counters
function updateCounters(present, absent, total) {
    const presentElement = document.getElementById('presentCount');
    const absentElement = document.getElementById('absentCount');
    const totalElement = document.getElementById('totalCount');
    
    if (presentElement) presentElement.textContent = present;
    if (absentElement) absentElement.textContent = absent;
    if (totalElement) totalElement.textContent = total;
}

// Update students list
function updateStudentsList(students) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = Object.entries(students)
        .map(([id, student]) => `
            <tr class="${student.status || 'absent'}">
                <td>${student.roll_no}</td>
                <td>${student.name}</td>
                <td>
                    <span class="status-badge ${student.status || 'absent'}">
                        ${student.status || 'Absent'}
                    </span>
                </td>
                <td>${student.last_seen ? new Date(student.last_seen).toLocaleString() : 'Never'}</td>
                <td>${student.mac_address}</td>
            </tr>
        `).join('');
}

// Filter students list
window.filterStudents = function(filter) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    const rows = tbody.getElementsByTagName('tr');
    for (let row of rows) {
        if (filter === 'all' || row.classList.contains(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.onclick.toString().includes(filter));
    });
};