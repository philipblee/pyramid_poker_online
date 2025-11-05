class LoginModal {
    constructor() {
        this.isVisible = false;
        this.firebaseAuth = window.firebaseAuthManager;
        this.init();
    }

    init() {
        this.createModal(); // Add this line
        this.attachEventListeners();

        // Listen for Firebase auth state changes
        if (this.firebaseAuth) {
            window.firebaseAuth.onAuthStateChanged((user) => {
                this.updateLoginState(user);
                // Initialize lobby when user is logged in
                if (user) {
                    PyramidPokerLobby.initializeLobby(user.displayName || user.email || 'Player');
                }
            });
        }
    }

    createModal() {
        const modalHTML = `
            <div id="loginModal" class="login-modal" style="display: none;">
                <div class="login-content">
                    <div class="login-header">
                        <h2 id="modalTitle">🔐 Login</h2>
                        <button class="login-close">×</button>
                    </div>
                    <div class="login-body">
                        <form class="login-form" id="loginForm">
                            <div class="form-group">
                                <label for="emailInput">Email Address:</label>
                                <input type="email" id="emailInput" placeholder="Enter your email" required>
                            </div>
                            <div class="form-group">
                                <label for="passcodeInput">4-Digit Passcode:</label>
                                <input type="text" id="passcodeInput" class="passcode-input" placeholder="••••" maxlength="4" required>
                            </div>

                            <!-- ADD THIS NEW MESSAGE -->
                            <div class="login-info-message">
                                <div class="info-icon">ℹ️</div>
                                <div class="info-text">
                                    <strong>New users:</strong> Your email and passcode will automatically create a new account on first login.
                                </div>
                            </div>


                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="rememberEmail" checked>
                                    <span class="checkmark"></span>
                                    Remember my email address
                                </label>
                            </div>
                            <div id="modalStatus" class="modal-status" style="display: none;"></div>
                        </form>
                    </div>
                    <div class="login-footer">
                        <button class="login-btn-modal" id="submitBtn">Login</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    attachEventListeners() {
//        console.log('🔧 Setting up event listeners...');

        // Connect the main login button in the UI
        const loginButton = document.getElementById('loginButton');
//        console.log('🔧 Login button found:', loginButton);

        if (loginButton) {
            loginButton.addEventListener('click', async () => {  // Make it async
                console.log('🔧 Login button clicked!');

                const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;

                if (currentUser) {
                    // User is logged in - clean up table first, then logout

                    // Clean up table membership before logging out
                    if (typeof currentTable !== 'undefined' && currentTable) {
                        console.log('🧹 Cleaning up table membership before logout...');
                        try {
                            await leaveTable();
                        } catch (error) {
                            console.error('❌ Error cleaning up table:', error);
                        }
                    }

                    // Now proceed with logout
                    this.logout();
                } else {
                    // User is logged out - show login modal
                    this.show();
                }
            });

        //Do you have a logout() method in your login-modal.js? If not, we'll need to add one:

//            console.log('🔧 Login button connected!');
        } else {
            console.log('🔧 WARNING: Login button not found!');
        }

        const existingCloseBtn = document.querySelector('.login-close');
        const existingSubmitBtn = document.getElementById('submitBtn');
        
        if (existingCloseBtn) {
            existingCloseBtn.addEventListener('click', () => this.hide());
        }
        
        if (existingSubmitBtn) {
            existingSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Enter key support
        const passcodeInput = document.getElementById('passcodeInput');
        if (passcodeInput) {
            passcodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }

        // Close modal when clicking outside
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target.id === 'loginModal') {
                    this.hide();
                }
            });
        }
    }

    show() {
        document.getElementById('loginModal').style.display = 'block';
        this.isVisible = true;
        document.getElementById('emailInput').focus();

    }

    updateLoginState(user) {
        // Update any existing UI elements based on login state
        if (user) {
            console.log('🔑 User logged in:', user.email);
            // Show stats button for logged-in users
            this.showStatsButton(user);
        } else {
            console.log('🔑 User logged out');
            this.hideStatsButton();
        }

        // ADD THIS LINE:
        this.updateLoginButtonText();
    }

    showStatsButton(user) {
        // Remove existing buttons if any
        this.hideStatsButton();

        // Add stats button next to login button
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            // Stats button
            const statsButton = document.createElement('button');
            statsButton.id = 'statsButton';
            statsButton.className = 'btn btn-info';
            statsButton.textContent = '📊 Stats';
            statsButton.onclick = () => window.userStatsDisplay.show();
            statsButton.style.marginRight = '-50px'; // Your positioning

            // Leaderboard button
            const leaderboardButton = document.createElement('button');
            leaderboardButton.id = 'leaderboardButton';
            leaderboardButton.className = 'btn btn-warning';
            leaderboardButton.textContent = '🏆 Leaderboard';
            leaderboardButton.onclick = () => window.leaderboardDisplay.show();
            leaderboardButton.style.marginLeft = '10px';

            // Insert buttons
            loginButton.parentNode.insertBefore(statsButton, loginButton);
            loginButton.parentNode.insertBefore(leaderboardButton, loginButton);
        }
    }

    hideStatsButton() {
        const existingStatsButton = document.getElementById('statsButton');
        const existingLeaderboardButton = document.getElementById('leaderboardButton');

        if (existingStatsButton) {
            existingStatsButton.remove();
        }
        if (existingLeaderboardButton) {
            existingLeaderboardButton.remove();
        }
    }

    // Utility methods that work with your existing modal
    showStatus(message, type) {
        const statusElement = document.getElementById('modalStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `modal-status ${type}`;
            statusElement.style.display = 'block';
        }
    }

    clearStatus() {
        const statusElement = document.getElementById('modalStatus');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    }

    showLoading() {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;
        }
    }

    hideLoading() {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.textContent = 'Login';
            submitBtn.disabled = false;
        }
    }

    async handleLogin() {
        const email = document.getElementById('emailInput').value.trim();
        const passcode = document.getElementById('passcodeInput').value.trim();
        const remember = document.getElementById('rememberEmail').checked;

        if (!email || !passcode) {
            this.showStatus('Please enter both email and passcode', 'error');
            return;
        }

        if (passcode.length !== 4) {
            this.showStatus('Passcode must be 4 digits', 'error');
            return;
        }

        // Convert 4-digit passcode to password for Firebase
        const password = `pass_${passcode}`;
        console.log(`🔑 Attempting login for: ${email} with password: ${password}`);

        try {
            this.showLoading();

            // Try login first
            let result = await this.firebaseAuth.login(email, password);
            console.log('🔑 Login result:', result);

            // If login fails, try registration
            if (!result.success) {
                console.log(`🔑 Login failed: ${result.error}`);

                if (result.error.includes('user-not-found') || result.error.includes('invalid-login-credentials')) {
                    console.log('🔑 User not found, attempting registration...');
                    result = await this.firebaseAuth.register(email, password);
                    console.log('🔑 Registration result:', result);

                    if (result.success) {
                        this.showStatus('Account created and logged in!', 'success');
                    } else {
                        this.showStatus('Registration failed: ' + result.error, 'error');
                    }
                } else {
                    this.showStatus(result.error || 'Login failed', 'error');
                }
            } else {
                this.showStatus('Login successful!', 'success');
            }

            if (result.success) {
                // Save remember preference
                if (remember) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // ADD THIS LINE:
                this.updateLoginButtonText();

                // FIXED:
                setTimeout(() => {
                    if (window.loginModal) {
                        window.loginModal.hide();
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('🔑 Login error:', error);
            this.showStatus('Login failed: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    hide() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.isVisible = false;
        if (this.clearStatus) {
            this.clearStatus();
        }
    }

    updateLoginButtonText() {
        const loginButton = document.getElementById('loginButton');
        const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;

        if (loginButton && currentUser) {
            const emailPrefix = currentUser.email.split('@')[0];
            loginButton.textContent = `Logout (${emailPrefix})`;
            console.log('🔧 Updated button to show logged-in user:', emailPrefix);
        } else if (loginButton) {
            // ADD THIS PART:
            loginButton.textContent = 'Login';
            console.log('🔧 Updated button to show logged-out state');
        }
    }

    logout() {
        firebase.auth().signOut().then(() => {
            console.log('🔧 User logged out successfully');
            this.updateLoginButtonText();
            this.hideStatsButton();

            // Clear all user email displays
            const userInfoElement = document.querySelector('.user-info');
            if (userInfoElement) {
                userInfoElement.textContent = '';
            }

            const currentUserElement = document.getElementById('currentUser');
            if (currentUserElement) {
                currentUserElement.textContent = '';
            }

            const lobbyHeaderElement = document.querySelector('.lobby-header');
            if (lobbyHeaderElement) {
                lobbyHeaderElement.textContent = '🏛️ Game Lobby';
            }

        }).catch((error) => {
            console.error('🔧 Logout error:', error);
        });
    }

}

// Global functions for your existing onclick handlers
function openLoginModal() {
    if (window.loginModal) {
        window.loginModal.show();
    }

}

function handleLoginSubmit() {
    // This gets called by your existing onclick
    if (window.loginModal) {
        window.loginModal.handleLogin();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.loginModal = new LoginModal();
//    console.log('🔑 Login Modal initialized with existing HTML');
});
