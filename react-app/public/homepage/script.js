document.addEventListener('DOMContentLoaded', () => {
    // Modal elements
    const modals = document.querySelectorAll('.modal');
    const triggerBtns = document.querySelectorAll('.trigger-btn');
    const closeBtns = document.querySelectorAll('.close');
    const tabBtns = document.querySelectorAll('.tab-btn');
      // Check authentication status immediately and periodically
    checkAuthStatus();
    setInterval(checkAuthStatus, 5000);

    async function checkAuthStatus() {
        try {
            const response = await fetch('http://localhost:5000/api/session-check', {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Auth status:', data);
            updateUIBasedOnAuth(data.authenticated);
        } catch (error) {
            console.error('Session check failed:', error);
            updateUIBasedOnAuth(false);
        }
    }

    function updateUIBasedOnAuth(isAuthenticated) {
        try {
            // Get all auth items (Sign Up, Login) and logged items (Dashboard, Logout)
            const authItems = document.querySelectorAll('.auth-item');
            const loggedItems = document.querySelectorAll('.logged-item');
    
            // Update visibility based on authentication status
            authItems.forEach(item => {
                item.style.display = isAuthenticated ? 'none' : 'block';
            });
    
            loggedItems.forEach(item => {
                item.style.display = isAuthenticated ? 'block' : 'none';
            });
    
            console.log('UI updated:', isAuthenticated);
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    // Handle logout
    document.querySelectorAll('.logout-btn').forEach(button => {
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


    async function fetchExchangeRate() {
        try {
            // Get current date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];

            // Check localStorage for saved exchange rate and date
            const savedData = JSON.parse(localStorage.getItem('exchangeRateData'));

            if (savedData && savedData.date === today) {
                // Use cached data if it's from today
                document.getElementById('exchangeRate').textContent = `LKR ${parseFloat(savedData.rate).toFixed(2)}`;
                console.log("Using cached exchange rate:", savedData.rate);
                return;
            }

            // If no valid cached data, fetch from API
            const apiUrl = 'https://fcsapi.com/api-v3/forex/latest?symbol=USD/LKR&access_key=OdGhIdCptw9P4Nd6GvHoOTwjz';
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.response && data.response[0]) {
                // Extract the USD to LKR rate from the "c" field
                const usdToLkrRate = data.response[0].c;

                // Update the HTML element with the fetched rate
                document.getElementById('exchangeRate').textContent = `LKR ${parseFloat(usdToLkrRate).toFixed(2)}`;

                // Save the fetched rate and today's date in localStorage
                localStorage.setItem(
                    'exchangeRateData',
                    JSON.stringify({ rate: usdToLkrRate, date: today })
                );

                console.log("Fetched and saved new exchange rate:", usdToLkrRate);
            } else {
                document.getElementById('exchangeRate').textContent = 'Data unavailable';
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            document.getElementById('exchangeRate').textContent = 'Error loading data';
        }
    }

    // Call the function on page load
    fetchExchangeRate();

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
