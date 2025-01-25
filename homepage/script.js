document.addEventListener('DOMContentLoaded', () => {
    // Modal elements
    const modals = document.querySelectorAll('.modal');
    const triggerBtns = document.querySelectorAll('.trigger-btn');
    const closeBtns = document.querySelectorAll('.close');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const otpInputs = document.querySelectorAll('.otp-input');

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

    // OTP input handling
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
