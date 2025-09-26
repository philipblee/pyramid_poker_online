class UserStatsDisplay {
    constructor() {
        this.isVisible = false;
        this.statsManager = window.userStatsManager;
        this.auth = window.firebaseAuth;
        this.init();
    }

    init() {
        this.createStatsModal();
        this.attachEventListeners();

        // Update stats display when auth state changes
        if (this.auth) {
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.refreshStats();
                }
            });
        }
    }

    createStatsModal() {
//        console.log('📊 Creating stats modal...');

        // Create the main modal container
        const modal = document.createElement('div');
        modal.id = 'statsModal';
        modal.className = 'stats-modal';
        modal.style.display = 'none';

        // Create the modal content
        modal.innerHTML = `
            <div class="stats-modal-content">
                <div class="stats-header">
                    <h2>📊 Your Statistics</h2>
                    <button class="stats-close" onclick="userStatsDisplay.hide()">×</button>
                </div>

                <div class="stats-body">
                    <div id="statsLoading" class="stats-loading">
                        Loading your statistics...
                    </div>

                    <div id="statsContent" class="stats-content" style="display: none;">
                        ${this.createStatsContentHTML()}
                    </div>

                    <div id="statsError" class="stats-error" style="display: none;">
                        Failed to load statistics. Please try again.
                    </div>
                </div>

                <div class="stats-footer">
                    <button class="btn btn-primary" onclick="userStatsDisplay.refreshStats()">Refresh</button>
                    <button class="btn btn-secondary" onclick="userStatsDisplay.hide()">Close</button>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(modal);

        // Verify creation
        const testElement = document.getElementById('gamesPlayed');
        if (testElement) {
//            console.log('✅ Stats modal created successfully with all elements');
        } else {
            console.error('❌ Stats modal created but missing inner elements');
        }
    }

    createStatsContentHTML() {
        return `
            <!-- Overview Stats -->
            <div class="stats-section">
                <h3>🎮 Game Overview</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="gamesPlayed">--</div>
                        <div class="stat-label">Games Played</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="winRate">--%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="currentStreak">--</div>
                        <div class="stat-label">Current Streak</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="bestStreak">--</div>
                        <div class="stat-label">Best Streak</div>
                    </div>
                </div>
            </div>

            <!-- Scoring Stats -->
            <div class="stats-section">
                <h3>🏆 Scoring Performance</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="highScore">--</div>
                        <div class="stat-label">High Score</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="averageScore">--</div>
                        <div class="stat-label">Average Score</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="totalScore">--</div>
                        <div class="stat-label">Total Score</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="lowScore">--</div>
                        <div class="stat-label">Low Score</div>
                    </div>
                </div>
            </div>

            <!-- Game Mode Stats -->
            <div class="stats-section">
                <h3>🎯 Game Modes</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="multiPlayerGames">--</div>
                        <div class="stat-label">Multiplayer Games</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="singlePlayerGames">--</div>
                        <div class="stat-label">Singleplayer Games</div>
                    </div>
                </div>
            </div>

            <!-- Wild Card Stats -->
            <div class="stats-section">
                <h3>🃏 Wild Card Performance</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="noWildGames">--</div>
                        <div class="stat-label">No Wild Cards</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="oneWildGames">--</div>
                        <div class="stat-label">One Wild Card</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="twoWildGames">--</div>
                        <div class="stat-label">Two Wild Cards</div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="stats-section">
                <h3>🕒 Activity</h3>
                <div class="stats-info">
                    <div class="info-row">
                        <span>Last Game:</span>
                        <span id="lastGameAt">--</span>
                    </div>
                    <div class="info-row">
                        <span>Member Since:</span>
                        <span id="memberSince">--</span>
                    </div>
                </div>
            </div>
        `;
    }


    attachEventListeners() {
        // Close modal when clicking outside
        document.getElementById('statsModal').addEventListener('click', (e) => {
            if (e.target.id === 'statsModal') {
                this.hide();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    async show() {
        const modal = document.getElementById('statsModal');
        modal.style.display = 'block';
        this.isVisible = true;

        // Load stats when modal opens
        await this.loadStats();
    }

    hide() {
        const modal = document.getElementById('statsModal');
        modal.style.display = 'none';
        this.isVisible = false;
    }

    async loadStats() {
        const loadingElement = document.getElementById('statsLoading');
        const contentElement = document.getElementById('statsContent');
        const errorElement = document.getElementById('statsError');

        // Show loading state
        loadingElement.style.display = 'block';
        contentElement.style.display = 'none';
        errorElement.style.display = 'none';

        try {
            const stats = await this.statsManager.getUserStats();

            if (stats) {
                this.displayStats(stats);
                loadingElement.style.display = 'none';
                contentElement.style.display = 'block';
            } else {
                this.showNoStats();
            }
        } catch (error) {
            console.error('❌ Failed to load user stats:', error);
            loadingElement.style.display = 'none';
            errorElement.style.display = 'block';
        }
    }

    displayStats(stats) {
        // Helper function to safely set text content
        const setTextSafely = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Element with id '${id}' not found for stats display`);
            }
        };

        // Overview Stats
        setTextSafely('gamesPlayed', stats.gamesPlayed || 0);
        setTextSafely('winRate', `${stats.winRate || 0}%`);
        setTextSafely('currentStreak', stats.currentStreak || 0);
        setTextSafely('bestStreak', stats.bestStreak || 0);

        // Scoring Stats
        setTextSafely('highScore', stats.highScore || 0);
        setTextSafely('averageScore', stats.averageScore || 0);
        setTextSafely('totalScore', stats.totalScore || 0);
        setTextSafely('lowScore', stats.lowScore ?? '--');

        // Game Mode Stats
        setTextSafely('multiPlayerGames', stats.multiPlayerGames || 0);
        setTextSafely('singlePlayerGames', stats.singlePlayerGames || 0);

        // Wild Card Stats
        setTextSafely('noWildGames', stats.noWildGames || 0);
        setTextSafely('oneWildGames', stats.oneWildGames || 0);
        setTextSafely('twoWildGames', stats.twoWildGames || 0);

        // Activity
        setTextSafely('lastGameAt', stats.lastGameAt ?
            this.formatDate(stats.lastGameAt.toDate()) : 'Never');
        setTextSafely('memberSince', stats.createdAt ?
            this.formatDate(stats.createdAt.toDate()) : 'Unknown');
    }
    showNoStats() {
        const contentElement = document.getElementById('statsContent');
        contentElement.innerHTML = `
            <div class="no-stats">
                <h3>🎮 No Games Played Yet</h3>
                <p>Play your first game to start tracking statistics!</p>
            </div>
        `;
        document.getElementById('statsLoading').style.display = 'none';
        contentElement.style.display = 'block';
    }

    async refreshStats() {
//        console.log('🔄 Refreshing user stats...');
        await this.loadStats();
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.userStatsDisplay = new UserStatsDisplay();
//    console.log('📊 User Stats Display initialized');
});
