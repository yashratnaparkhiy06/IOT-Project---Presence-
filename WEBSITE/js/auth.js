import { auth } from './config.js';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeApp } from './app.js';

// Debug: Check if auth is properly initialized
console.log('Auth object:', auth);

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    const errorDiv = document.getElementById('login-error');
    const loginButton = document.getElementById('loginButton');
    
    console.log('Login attempt with:', { email, password: '***', rememberMe });
    
    try {
        // Show loading state
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Logging in...';
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        
        // Validate email format
        if (!isValidEmail(email)) {
            throw new Error('auth/invalid-email');
        }
        
        console.log('Attempting Firebase authentication...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful:', userCredential.user);
        
        // Store remember me preference
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('lastEmail', email);
        } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('lastEmail');
        }
        
        // Hide login form, show dashboard
        console.log('Switching to dashboard view...');
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    } catch (error) {
        console.error('Login error details:', {
            code: error.code,
            message: error.message,
            fullError: error
        });
        errorDiv.textContent = getErrorMessage(error.code || error.message);
        errorDiv.style.display = 'block';
    } finally {
        // Reset button state
        loginButton.disabled = false;
        loginButton.innerHTML = '<i class="bi bi-box-arrow-in-right"></i><span>Login</span>';
    }
});

// Logout handler
window.logout = async () => {
    try {
        await signOut(auth);
        console.log('Logged out successfully');
        // Clear any stored credentials
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('lastEmail');
        // Redirect to login page
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error during logout. Please try again.');
    }
};

// Forgot password handler
window.showForgotPassword = async () => {
    const email = document.getElementById('email').value.trim();
    const errorDiv = document.getElementById('login-error');
    
    if (!email || !isValidEmail(email)) {
        errorDiv.textContent = 'Please enter a valid email address.';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        errorDiv.textContent = 'Password reset email sent. Please check your inbox.';
        errorDiv.style.display = 'block';
        errorDiv.classList.add('success');
    } catch (error) {
        errorDiv.textContent = getErrorMessage(error.code);
        errorDiv.style.display = 'block';
    }
};

// Password visibility toggle
window.togglePasswordVisibility = () => {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.replace('bi-eye-slash', 'bi-eye');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.replace('bi-eye', 'bi-eye-slash');
    }
};

// Auth state observer
auth.onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? {
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified
    } : 'logged out');
    
    if (user) {
        // User is signed in
        console.log('User is signed in, showing dashboard...');
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        initializeApp(user);
    } else {
        // User is signed out
        console.log('User is signed out, showing login form...');
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
        
        // Check for remember me
        const rememberMe = localStorage.getItem('rememberMe');
        const lastEmail = localStorage.getItem('lastEmail');
        if (rememberMe && lastEmail) {
            document.getElementById('remember').checked = true;
            document.getElementById('email').value = lastEmail;
        }
    }
});

// Helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getErrorMessage(errorCode) {
    console.log('Error code received:', errorCode);
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return `An error occurred during login: ${errorCode}`;
    }
}