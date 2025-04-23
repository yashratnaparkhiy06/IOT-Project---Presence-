import { auth } from './config.js';
import { initializeESP32Monitoring } from './database.js';

// Initialize application
export function initializeApp(user) {
    console.log('Initializing app for user:', user.email);
    updateDateTime();
    setInterval(updateDateTime, 1000);
    initializeESP32Monitoring(); // Initialize real-time data
    loadInitialSection();
}

// Load initial section
function loadInitialSection() {
    const defaultSection = 'overview';
    showSection(defaultSection);
}

// Show selected section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(sectionId)) {
            item.classList.add('active');
        }
    });
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString();
    const userEmail = auth.currentUser ? auth.currentUser.email : 'Not logged in';
    document.getElementById('currentDateTime').textContent = `${dateTimeString}\nCurrent User: ${userEmail}`;
}

// Make showSection available globally
window.showSection = showSection;