document.addEventListener('DOMContentLoaded', () => {
    // Modal elements
    const modals = document.querySelectorAll('.modal');
    const triggerBtns = document.querySelectorAll('.trigger-btn');
    const closeBtns = document.querySelectorAll('.close');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const otpInputs = document.querySelectorAll('.otp-input');
    const loginForm = document.querySelector('#login form');
    const signupForm = document.querySelector('#signup form');

    // Check authentication status immediately and periodically
    checkAuthStatus();
    setInterval(checkAuthStatus, 5000); // Check every 5 seconds


    async function checkAuthStatus() {
        try {
            const response = await fetch('http://localhost:5000/api/session-check', {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Auth status:', data); // Debug log
            updateUIBasedOnAuth(data.authenticated);
        } catch (error) {
            console.error('Session check failed:', error);
            updateUIBasedOnAuth(false);
        }
    }

    function updateUIBasedOnAuth(isAuthenticated) {
        try {
            // Update main navigation
            const mainAuthButtons = document.querySelector('#auth-buttons-main');
            const mainDashboardLink = document.querySelector('#dashboard-link-main');
            const mainLogoutButton = document.querySelector('#logout-button-main');

            // Update scroll navigation
            const scrollAuthButtons = document.querySelector('#auth-buttons-scroll');
            const scrollDashboardLink = document.querySelector('#dashboard-link-scroll');
            const scrollLogoutButton = document.querySelector('#logout-button-scroll');

            // Main navigation updates
            if (mainAuthButtons) mainAuthButtons.style.display = isAuthenticated ? 'none' : 'block';
            if (mainDashboardLink) mainDashboardLink.style.display = isAuthenticated ? 'block' : 'none';
            if (mainLogoutButton) mainLogoutButton.style.display = isAuthenticated ? 'block' : 'none';

            // Scroll navigation updates
            if (scrollAuthButtons) scrollAuthButtons.style.display = isAuthenticated ? 'none' : 'block';
            if (scrollDashboardLink) scrollDashboardLink.style.display = isAuthenticated ? 'block' : 'none';
            if (scrollLogoutButton) scrollLogoutButton.style.display = isAuthenticated ? 'block' : 'none';

            console.log('UI updated:', isAuthenticated); // Debug log
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }
    

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            try {
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const modal = document.querySelector('.modal');
                    if (modal) modal.style.display = 'none';
                    await checkAuthStatus();
                    window.location.href = '/dashboard';
                } else {
                    const data = await response.json();
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }

    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = signupForm.querySelector('input[name="username"]').value;
            const email = signupForm.querySelector('input[type="email"]').value;
            const password = signupForm.querySelector('input[type="password"]').value;

            try {
                const response = await fetch('http://localhost:5000/api/signup', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });

                if (response.ok) {
                    alert('Signup successful! Please login.');
                    const modal = document.querySelector('.modal');
                    if (modal) modal.style.display = 'none';
                    const loginTab = document.querySelector('[data-tab="login"]');
                    if (loginTab) loginTab.click();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Signup failed');
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert('Signup failed. Please try again.');
            }
        });
    }

    // Handle logout
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('http://localhost:5000/api/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                if (response.ok) {
                    await checkAuthStatus();
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    });

    // Modal handling
    triggerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('nav').querySelector('.modal');
            if (modal) modal.style.display = 'block';
        });
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Tab handling
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabsContainer = btn.closest('.tabs');
            const modalContent = btn.closest('.modal-content');
            
            tabsContainer.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            btn.classList.add('active');
            
            const tabId = btn.dataset.tab;
            modalContent.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            modalContent.querySelector(`#${tabId}`).style.display = 'block';
        });
    });

    // OTP handling
    otpInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            } else if (e.key === 'Backspace') {
                if (index > 0) {
                    otpInputs[index - 1].focus();
                }
            }
        });
    });

    // Timer functionality
    function startTimer(duration, display) {
        let timer = duration;
        let minutes, seconds;
        
        let countdown = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);
            
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            
            display.textContent = minutes + ":" + seconds;
            
            if (--timer < 0) {
                clearInterval(countdown);
                document.querySelector('.resend-btn').disabled = false;
            }
        }, 1000);
    }

    // Start timer when verification page loads
    const timerDisplay = document.querySelector('#countdown');
    if (timerDisplay) startTimer(120, timerDisplay);
});

// Scroll menu handling
window.addEventListener('scroll', () => {
    const scrollMenu = document.querySelector('.scroll_menu');
    if (window.scrollY > 50) {
        scrollMenu.classList.add('visible');
    } else {
        scrollMenu.classList.remove('visible');
    }
});
