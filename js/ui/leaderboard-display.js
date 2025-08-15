class LeaderboardDisplay {
    constructor() {
        this.isVisible = false;
        this.leaderboardManager = window.leaderboardManager;
        this.currentCategory = 'highScore';
        this.init();
    }

    init() {
        this.createLeaderboardModal();
        this.attachEventListeners();
    }

    createLeaderboardModal() {
        const modalHTML = `
            <div id="leaderboardModal" class="leaderboard-modal" style="display: none;">
                <div class="leaderboard-modal-content">
                    <div class="leaderboard-header">
                        <h2>🏆 Global Leaderboards</h2>
                        <button class="leaderboard-close" onclick="leaderboardDisplay.hide()">×</button>
                    </div>

                    <div class="leaderboard-nav">
                        <button class="leaderboard-tab active" data-category="highScore">High Score</button>
                        <button class="leaderboard-tab" data-category="winRate">Win Rate</button>
                        <button class="leaderboard-tab" data-category="gamesPlayed">Most Active</button>
                        <button class="leaderboard-tab" data-category="bestStreak">Best Streak</button>
                        <button class="leaderboard-tab" data-category="averageScore">Average Score</button>
                    </div>

                    <div class="leaderboard-body">
                        <div id="leaderboardLoading" class="leaderboard-loading">
                            Loading leaderboards...
                        </div>

                        <div id="leaderboardContent" class="leaderboard-content" style="display: none;">
                            <div class="user-rank-section" id="userRankSection">
                                <!-- User's rank will appear here -->
                            </div>

                            <div class="leaderboard-list" id="leaderboardList">
                                <!-- Leaderboard entries will appear here -->
                            </div>
                        </div>

                        <div id="leaderboardError" class="leaderboard-error" style="display: none;">
                            Failed to load leaderboards. Please try again.
                        </div>
                    </div>

                    <div class="leaderboard-footer">
                        <button class="btn btn-primary" onclick="leaderboardDisplay.refresh()">Refresh</button>
                        <button class="btn btn-secondary" onclick="leaderboardDisplay.hide()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchCategory(category);
            });
        });

        // Close modal when clicking outside
        document.getElementById('leaderboardModal').addEventListener('click', (e) => {
            if (e.target.id === 'leaderboardModal') {
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
        const modal = document.getElementById('leaderboardModal');
        modal.style.display = 'block';
        this.isVisible = true;

        // Load leaderboards when modal opens
        await this.loadLeaderboard(this.currentCategory);
    }

    hide() {
        const modal = document.getElementById('leaderboardModal');
        modal.style.display = 'none';
        this.isVisible = false;
    }

    async switchCategory(category) {
        // Update active tab
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        this.currentCategory = category;
        await this.loadLeaderboard(category);
    }

    async loadLeaderboard(category) {
        const loadingElement = document.getElementById('leaderboardLoading');
        const contentElement = document.getElementById('leaderboardContent');
        const errorElement = document.getElementById('leaderboardError');

        // Show loading state
        loadingElement.style.display = 'block';
        contentElement.style.display = 'none';
        errorElement.style.display = 'none';

        try {
            // Load leaderboard data and user rank
            const [leaderboardData, userRank] = await Promise.all([
                this.getLeaderboardData(category),
                this.leaderboardManager.getUserRank(category)
            ]);

            this.displayLeaderboard(leaderboardData, category);
            this.displayUserRank(userRank, category);

            loadingElement.style.display = 'none';
            contentElement.style.display = 'block';
        } catch (error) {
            console.error('❌ Failed to load leaderboard:', error);
            loadingElement.style.display = 'none';
            errorElement.style.display = 'block';
        }
    }

    async getLeaderboardData(category) {
        switch (category) {
            case 'highScore':
                return await this.leaderboardManager.getTopPlayersByHighScore(10);
            case 'winRate':
                return await this.leaderboardManager.getTopPlayersByWinRate(10);
            case 'gamesPlayed':
                return await this.leaderboardManager.getTopPlayersByGamesPlayed(10);
            case 'bestStreak':
                return await this.leaderboardManager.getTopPlayersByBestStreak(10);
            case 'averageScore':
                return await this.leaderboardManager.getTopPlayersByAverageScore(10);
            default:
                throw new Error(`Unknown category: ${category}`);
        }
    }

    displayLeaderboard(data, category) {
        const listElement = document.getElementById('leaderboardList');

        if (!data || data.length === 0) {
            listElement.innerHTML = `
                <div class="no-leaderboard-data">
                    <h3>🎮 No Players Yet</h3>
                    <p>Be the first to appear on this leaderboard!</p>
                </div>
            `;
            return;
        }

        const categoryInfo = this.getCategoryInfo(category);

        let html = `
            <div class="leaderboard-header-info">
                <h3>${categoryInfo.title}</h3>
                <p>${categoryInfo.description}</p>
            </div>
            <div class="leaderboard-entries">
        `;

        data.forEach((player, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

            html += `
                <div class="leaderboard-entry ${rankClass}">
                    <div class="rank">
                        <span class="rank-number">${medal || player.rank}</span>
                    </div>
                    <div class="player-info">
                        <div class="player-name">${player.displayName}</div>
                        <div class="player-stats">${player.gamesPlayed} games • Last active ${this.formatDate(player.lastActive)}</div>
                    </div>
                    <div class="player-value">
                        ${this.formatValue(player.value, category)}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        listElement.innerHTML = html;
    }

    displayUserRank(userRank, category) {
        const userRankElement = document.getElementById('userRankSection');

        if (!userRank || !window.firebaseAuth.currentUser) {
            userRankElement.style.display = 'none';
            return;
        }

        const categoryInfo = this.getCategoryInfo(category);

        userRankElement.innerHTML = `
            <div class="user-rank-card">
                <div class="user-rank-header">Your Ranking</div>
                <div class="user-rank-content">
                    <div class="user-rank-position">
                        <span class="rank-large">#${userRank.rank}</span>
                        <span class="rank-total">of ${userRank.totalPlayers}</span>
                    </div>
                    <div class="user-rank-value">
                        <span class="value-large">${this.formatValue(userRank.value, category)}</span>
                        <span class="value-label">${categoryInfo.unit}</span>
                    </div>
                </div>
            </div>
        `;
        userRankElement.style.display = 'block';
    }

    getCategoryInfo(category) {
        const info = {
            'highScore': {
                title: 'Highest Single Game Score',
                description: 'Players with the best individual game performance',
                unit: 'points'
            },
            'winRate': {
                title: 'Best Win Rate',
                description: 'Players with highest win percentage (minimum 5 games)',
                unit: 'win rate'
            },
            'gamesPlayed': {
                title: 'Most Active Players',
                description: 'Players who have played the most games',
                unit: 'games'
            },
            'bestStreak': {
                title: 'Longest Win Streaks',
                description: 'Players with the most consecutive wins',
                unit: 'win streak'
            },
            'averageScore': {
                title: 'Highest Average Score',
                description: 'Players with best average performance (minimum 10 games)',
                unit: 'avg score'
            }
        };
        return info[category] || { title: 'Leaderboard', description: '', unit: '' };
    }

    formatValue(value, category) {
        switch (category) {
            case 'winRate':
                return `${value}%`;
            case 'averageScore':
                return value.toFixed(1);
            default:
                return value.toString();
        }
    }

    formatDate(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    async refresh() {
        console.log('🔄 Refreshing leaderboards...');
        this.leaderboardManager.clearCache();
        await this.loadLeaderboard(this.currentCategory);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardDisplay = new LeaderboardDisplay();
    console.log('🏆 Leaderboard Display initialized');
});
