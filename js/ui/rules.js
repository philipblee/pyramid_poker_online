// Game Rules Modal Implementation
// file name ui/rules.js file

/**
 * Create and manage the game rules modal
 */
class RulesUI {
    constructor() {
        this.isOpen = false;
        this.createRulesModal();
        this.setupEventListeners();
    }

    createRulesModal() {
        // Create modal HTML if it doesn't exist
        if (document.getElementById('rulesModal')) return;

        const modalHTML = `
            <div id="rulesModal" class="rules-modal" style="display: none;">
                <div class="rules-content">
                    <div class="rules-header">
                        <h2>🎯 Pyramid Poker Rules</h2>
                        <button class="rules-close" id="rulesClose">×</button>
                    </div>
                    <div class="rules-body">

                        <!-- Quick Overview -->
                        <div class="rules-section">
                            <h3>🎮 Game Overview</h3>
                            <p>Pyramid Poker is a strategic card arrangement game based on Chinese Poker. You receive 17 cards and must arrange them into three hands with specific strength requirements.</p>
                        </div>

                        <!-- Hand Requirements -->
                        <div class="rules-section">
                            <h3>🃏 Hand Requirements</h3>
                            <div class="hand-rule">
                                <strong>🏆 Back Hand (5-8 cards):</strong> Your strongest hand
                            </div>
                            <div class="hand-rule">
                                <strong>🥈 Middle Hand (5-7 cards):</strong> Medium strength
                            </div>
                            <div class="hand-rule">
                                <strong>🥉 Front Hand (3 or 5 cards):</strong> Your weakest hand
                            </div>
                            <div class="rules-note">
                                <strong>Golden Rule:</strong> Back ≥ Middle ≥ Front (in strength)
                            </div>
                        </div>

                        <!-- Special Hands -->
                        <div class="rules-section">
                            <h3>⭐ 6 to 8 Card Hands (Unique to Pyramid Poker)</h3>
                            <div class="hand-rule">
                                <strong>6,7,8 of a Kind:</strong> Six, seven, or eight cards of the same rank
                            </div>
                            <div class="hand-rule">
                                <strong>6,7,8 Card Straight Flush:</strong> Six, seven, or eight consecutive cards of the same suit
                            </div>
                            <div class="rules-note">
                                Special hands are worth significantly more points.
                            </div>
                        </div>

                        <!-- Wild Cards -->
                        <div class="rules-section">
                            <h3>🃏 Wild Cards</h3>
                            <p>Wild cards (jokers) can become any card you need to complete hands. They're especially powerful for creating special hands and high-value combinations.</p>
                            <div class="rules-tip">
                                <strong>💡 Tip:</strong> Use the "Auto" to see the best set-up by AI, then use "Undo Auto" if you want to try a different strategy.
                            </div>
                        </div>

                        <!-- Scoring -->
                        <div class="rules-section">
                            <h3>🏆 Scoring</h3>
                            <p>You play against every other player individually. For each hand position (back, middle, front), the stronger hand wins points based on the hand type:</p>

                            <div class="scoring-table">

                                <h4>Back Hand Specials:</h4>
                                <div class="score-row">4 of a Kind:           +4 pts</div>
                                <div class="score-row">5 Card Straight Flush: +5 pts</div>
                                <div class="score-row">5 of a Kind:           +6 pts</div>
                                <div class="score-row">6-Card Straight Flush: +8 pts</div>
                                <div class="score-row">6 of a Kind:           +10 pts</div>
                                <div class="score-row">7-Card Straight Flush: +11 pts</div>
                                <div class="score-row">7 of a Kind:           +14 pts</div>
                                <div class="score-row">8-Card Straight Flush: +14 pts</div>
                                <div class="score-row">8 of a Kind:           +18 pts</div>

                                <h4>Middle Hand Specials:</h4>
                                <div class="score-row">Full House:            +2 pts</div>
                                <div class="score-row">4 of a Kind:           +8 pts</div>
                                <div class="score-row">5 Card Straight Flush: +10 pts</div>
                                <div class="score-row">5 of a Kind:           +12 pts</div>
                                <div class="score-row">6-Card Straight Flush: +16 pts</div>
                                <div class="score-row">6 of a Kind:           +20 pts</div>
                                <div class="score-row">7-Card Straight Flush: +22 pts</div>
                                <div class="score-row">7 of a Kind:           +28 pts</div>

                                <h4>Front Hand Specials:</h4>
                                <div class="score-row">Three of a Kind:       +3 pts</div>
                                <div class="score-row">Straight/Flush:        +4 pts</div>
                                <div class="score-row">Full House:            +5 pts</div>
                                <div class="score-row">Four of a Kind:        +12 pts</div>
                                <div class="score-row">Straight Flush:        +15 pts</div>

                            </div>

                            <div class="rules-note">
                                Your final score is the sum of all your wins minus all your losses across all opponents.
                            </div>
                        </div>

                        <!-- Strategy Tips -->
                        <div class="rules-section">
                            <h3>💡 Strategy Tips</h3>
                            <div class="strategy-tip">
                                <strong>Maximize Front Hand:</strong> Front hands can score the most points per hand strength
                            </div>
                            <div class="strategy-tip">
                                <strong>Look for Special Hands:</strong> 6-8 card hands are worth massive points
                            </div>
                            <div class="strategy-tip">
                                <strong>Use Auto-Arrange:</strong> Let the computer find optimal arrangements, then modify if needed
                            </div>
                            <div class="strategy-tip">
                                <strong>Wild Card Strategy:</strong> Save wilds for your highest-scoring opportunities
                            </div>
                        </div>

                        <!-- Game Flow -->
                        <div class="rules-section">
                            <h3>🎯 How to Play</h3>
                            <ol class="play-steps">
                                <li>Receive 17 cards in your staging area</li>
                                <li>Arrange cards into three hands following the strength rule</li>
                                <li>Use "Auto" for suggestions or arrange manually</li>
                                <li>Submit when your arrangement is valid</li>
                                <li>Compare hands against all other players</li>
                                <li>Win points for stronger hands, lose points for weaker hands</li>
                                <li>Player with highest total score wins!</li>
                            </ol>
                        </div>

                    </div>
                    <div class="rules-footer">
                        <button id="rulesOk" class="btn btn-primary">Got It!</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addRulesStyles();
    }

    addRulesStyles() {
        if (document.getElementById('rulesStyles')) return;

        const styles = `
            <style id="rulesStyles">
                .rules-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .rules-content {
                    background: linear-gradient(135deg, #2c3e50, #34495e);
                    border-radius: 15px;
                    border: 2px solid #4ecdc4;
                    max-width: 700px;
                    width: 95%;
                    max-height: 85vh;
                    overflow-y: auto;
                    color: white;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                }

                .rules-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    position: sticky;
                    top: 0;
                    background: linear-gradient(135deg, #2c3e50, #34495e);
                    border-radius: 13px 13px 0 0;
                }

                .rules-header h2 {
                    margin: 0;
                    color: #ffd700;
                    font-size: 24px;
                }

                .rules-close {
                    background: none;
                    border: none;
                    color: #ff6b6b;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .rules-close:hover {
                    background: rgba(255, 107, 107, 0.2);
                }

                .rules-body {
                    padding: 20px;
                    line-height: 1.6;
                }

                .rules-section {
                    margin-bottom: 25px;
                }

                .rules-section h3 {
                    color: #4ecdc4;
                    margin-bottom: 15px;
                    font-size: 18px;
                    border-bottom: 1px solid rgba(78, 205, 196, 0.3);
                    padding-bottom: 8px;
                }

                .rules-section h4 {
                    color: #ffd700;
                    margin: 15px 0 10px 0;
                    font-size: 14px;
                }

                .rules-section p {
                    margin-bottom: 12px;
                    color: #ecf0f1;
                }

                .hand-rule {
                    background: rgba(78, 205, 196, 0.1);
                    padding: 10px;
                    margin: 8px 0;
                    border-radius: 6px;
                    border-left: 3px solid #4ecdc4;
                }

                .rules-note {
                    background: rgba(255, 215, 0, 0.1);
                    padding: 12px;
                    margin: 12px 0;
                    border-radius: 6px;
                    border-left: 3px solid #ffd700;
                    font-style: italic;
                }

                .rules-tip {
                    background: rgba(52, 152, 219, 0.1);
                    padding: 12px;
                    margin: 12px 0;
                    border-radius: 6px;
                    border-left: 3px solid #3498db;
                }

                .strategy-tip {
                    background: rgba(155, 89, 182, 0.1);
                    padding: 8px 12px;
                    margin: 6px 0;
                    border-radius: 6px;
                    border-left: 3px solid #9b59b6;
                    font-size: 14px;
                }

                .scoring-table {
                    background: rgba(52, 73, 94, 0.3);
                    padding: 15px;
                    border-radius: 8px;
                    margin: 10px 0;
                }

                .score-row {
                    padding: 4px 0;
                    color: #4ecdc4;
                    font-family: monospace;
                    font-size: 13px;
                }

                .play-steps {
                    background: rgba(52, 73, 94, 0.3);
                    padding: 15px 15px 15px 35px;
                    border-radius: 8px;
                    margin: 10px 0;
                }

                .play-steps li {
                    margin: 8px 0;
                    color: #ecf0f1;
                }

                .rules-footer {
                    padding: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                    text-align: center;
                    position: sticky;
                    bottom: 0;
                    background: linear-gradient(135deg, #2c3e50, #34495e);
                    border-radius: 0 0 13px 13px;
                }

                .rules-footer .btn {
                    padding: 12px 30px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    background: #4ecdc4;
                    color: white;
                    font-size: 16px;
                }

                .rules-footer .btn:hover {
                    background: #45b7aa;
                    transform: translateY(-1px);
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .rules-content {
                        max-width: 95%;
                        margin: 10px;
                    }

                    .rules-header {
                        padding: 15px;
                    }

                    .rules-body {
                        padding: 15px;
                    }

                    .rules-header h2 {
                        font-size: 20px;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'rulesClose' || e.target.id === 'rulesOk') {
                this.close();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'rulesModal') {
                this.close();
            }
        });
    }

    show() {
        this.isOpen = true;
        const modal = document.getElementById('rulesModal');
        modal.style.display = 'flex';

        // Focus for accessibility
        const closeButton = document.getElementById('rulesClose');
        if (closeButton) {
            closeButton.focus();
        }
    }

    close() {
        this.isOpen = false;
        document.getElementById('rulesModal').style.display = 'none';
    }
}

// Global rules UI instance
window.rulesUI = new RulesUI();

// Global function to open rules
function openGameRules() {
    window.rulesUI.show();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Rules UI initializes automatically
    console.log('🎯 Game Rules modal ready');
});