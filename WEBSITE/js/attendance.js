// Format attendance data
function formatAttendanceData(attendanceData) {
    const formattedData = {};
    
    Object.keys(attendanceData).forEach(hour => {
        const hourData = attendanceData[hour];
        formattedData[hour] = {
            present: Object.values(hourData).filter(a => a.status === 'present').length,
            total: Object.keys(hourData).length,
            records: hourData
        };
    });
    
    return formattedData;
}

// Update attendance display
async function updateAttendanceDisplay() {
    const todayAttendance = await getTodayAttendance();
    const formattedData = formatAttendanceData(todayAttendance);
    
    const attendanceContainer = document.getElementById('todayLectureList');
    attendanceContainer.innerHTML = '';
    
    Object.keys(formattedData).forEach(hour => {
        const hourData = formattedData[hour];
        const lectureCard = createLectureCard(hour, hourData);
        attendanceContainer.appendChild(lectureCard);
    });
}

// Create lecture card element
function createLectureCard(hour, data) {
    const card = document.createElement('div');
    card.className = 'lecture-card';
    card.innerHTML = `
        <div class="lecture-info">
            <h3>Lecture at ${hour}:00</h3>
            <p>Present: ${data.present}/${data.total}</p>
            <p>Attendance: ${((data.present/data.total) * 100).toFixed(2)}%</p>
        </div>
        <div class="lecture-actions">
            <button onclick="markAttendanceForHour('${hour}')" class="action-button">
                Mark Attendance
            </button>
        </div>
    `;
    return card;
}