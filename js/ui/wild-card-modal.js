// js/ui/wild-card-modal.js
// Modal for manually assigning wild cards to specific rank and suit

class WildCardModal {
    constructor() {
        this.currentCard = null;
        this.selectedSuit = null;
        this.selectedRank = null;
        this.isOpen = false;
        this.createModal();
        this.addStyles();
        this.attachEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div id="wildCardModal" class="wild-card-modal" style="display: none;">
                <div class="wild-card-content">
                    <div class="wild-card-header">
                        <h2>🃏 Assign Wild Card</h2>
                        <button class="wild-card-close" id="wildCardClose">×</button>
                    </div>

                    <div class="wild-card-body">
                        <div class="selection-section">
                            <h3>Select Suit:</h3>
                            <div class="suit-selector">
                                <button class="suit-btn" data-suit="♠">♠</button>
                                <button class="suit-btn" data-suit="♥">♥</button>
                                <button class="suit-btn" data-suit="♦">♦</button>
                                <button class="suit-btn" data-suit="♣">♣</button>
                            </div>
                        </div>

                        <div class="selection-section">
                            <h3>Select Rank:</h3>
                            <div class="rank-selector">
                                <button class="rank-btn" data-rank="A">A</button>
                                <button class="rank-btn" data-rank="K">K</button>
                                <button class="rank-btn" data-rank="Q">Q</button>
                                <button class="rank-btn" data-rank="J">J</button>
                                <button class="rank-btn" data-rank="10">10</button>
                                <button class="rank-btn" data-rank="9">9</button>
                                <button class="rank-btn" data-rank="8">8</button>
                                <button class="rank-btn" data-rank="7">7</button>
                                <button class="rank-btn" data-rank="6">6</button>
                                <button class="rank-btn" data-rank="5">5</button>
                                <button class="rank-btn" data-rank="4">4</button>
                                <button class="rank-btn" data-rank="3">3</button>
                                <button class="rank-btn" data-rank="2">2</button>
                            </div>
                        </div>
                    </div>

                    <div class="wild-card-footer">
                        <button class="btn btn-secondary" id="wildCardCancel">Cancel</button>
                        <button class="btn btn-primary" id="wildCardOk" disabled>OK</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    addStyles() {
        if (document.getElementById('wildCardStyles')) return;

        const styles = `
            <style id="wildCardStyles">
                .wild-card-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .wild-card-content {
                    background: linear-gradient(135deg, #2c3e50, #34495e);
                    border-radius: 15px;
                    border: 2px solid #4ecdc4;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    color: white;
                }

                .wild-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }

                .wild-card-header h2 {
                    margin: 0;
                    color: #ffd700;
                    font-size: 24px;
                }

                .wild-card-close {
                    background: none;
                    border: none;
                    color: #ff6b6b;
                    font-size: 28px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    line-height: 1;
                }

                .wild-card-close:hover {
                    color: #ff5252;
                }

                .wild-card-body {
                    padding: 25px;
                }

                .selection-section {
                    margin-bottom: 25px;
                }

                .selection-section h3 {
                    color: #4ecdc4;
                    margin-bottom: 12px;
                    font-size: 16px;
                }

                .suit-selector {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }

                .suit-btn {
                    width: 70px;
                    height: 70px;
                    font-size: 36px;
                    border: 2px solid #555;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .suit-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: #4ecdc4;
                }

                .suit-btn.selected {
                    background: #4ecdc4;
                    border-color: #4ecdc4;
                    box-shadow: 0 0 15px rgba(78, 205, 196, 0.5);
                }

                .suit-btn[data-suit="♥"],
                .suit-btn[data-suit="♦"] {
                    color: #ff6b6b;
                }

                .suit-btn[data-suit="♥"].selected,
                .suit-btn[data-suit="♦"].selected {
                    color: white;
                }

                .rank-selector {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                }

                .rank-btn {
                    height: 50px;
                    font-size: 18px;
                    font-weight: bold;
                    border: 2px solid #555;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .rank-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: #4ecdc4;
                }

                .rank-btn.selected {
                    background: #4ecdc4;
                    border-color: #4ecdc4;
                    box-shadow: 0 0 15px rgba(78, 205, 196, 0.5);
                }

                .wild-card-footer {
                    padding: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                }

                .wild-card-footer .btn {
                    padding: 12px 30px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    transition: all 0.3s ease;
                }

                .wild-card-footer .btn-secondary {
                    background: #555;
                    color: white;
                }

                .wild-card-footer .btn-secondary:hover {
                    background: #666;
                }

                .wild-card-footer .btn-primary {
                    background: #4ecdc4;
                    color: white;
                }

                .wild-card-footer .btn-primary:hover:not(:disabled) {
                    background: #45b7aa;
                    transform: translateY(-1px);
                }

                .wild-card-footer .btn-primary:disabled {
                    background: #555;
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                @media (max-width: 600px) {
                    .rank-selector {
                        grid-template-columns: repeat(5, 1fr);
                    }

                    .suit-btn {
                        width: 60px;
                        height: 60px;
                        font-size: 30px;
                    }

                    .rank-btn {
                        height: 45px;
                        font-size: 16px;
                    }
                }

                .card.wild.wild-undefined {
                    animation: wild-pulse 1.5s ease-in-out infinite !important;
                    box-shadow: 0 0 25px rgba(255, 215, 0, 1) !important;
                    border: 3px solid gold !important;
                }

                .card.wild.wild-assigned {
                    background: #ffd700 !important;
                    border: 2px solid #ffa500 !important;
                }

                @keyframes wild-pulse {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(255, 215, 0, 0.7);
                        transform: scale(.85);
                        border-color: gold;
                    }
                    50% {
                        box-shadow: 0 0 40px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 215, 0, 0.5);
                        transform: scale(1.0);
                        border-color: #ffed4e;
                    }
                }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    attachEventListeners() {
        // Close button
        document.getElementById('wildCardClose').addEventListener('click', () => this.close());

        // Cancel button
        document.getElementById('wildCardCancel').addEventListener('click', () => this.close());

        // OK button
        document.getElementById('wildCardOk').addEventListener('click', () => this.handleOk());

        // Suit selection
        document.querySelectorAll('.suit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSuit(e.target.dataset.suit));
        });

        // Rank selection
        document.querySelectorAll('.rank-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectRank(e.target.dataset.rank));
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close on backdrop click
        document.getElementById('wildCardModal').addEventListener('click', (e) => {
            if (e.target.id === 'wildCardModal') {
                this.close();
            }
        });
    }

    show(cardObject) {
        if (!cardObject || (!cardObject.isWild && !cardObject.wasWild)) {
            console.error('Can only assign wild cards');
            return;
        }

        this.currentCard = cardObject;
        this.selectedSuit = null;
        this.selectedRank = null;

        // Reset UI
        document.querySelectorAll('.suit-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.rank-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('wildCardOk').disabled = true;

        // Show modal
        this.isOpen = true;
        document.getElementById('wildCardModal').style.display = 'flex';
    }

    selectSuit(suit) {
        this.selectedSuit = suit;

        // Update UI
        document.querySelectorAll('.suit-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.suit === suit);
        });

        this.updateOkButton();
    }

    selectRank(rank) {
        this.selectedRank = rank;

        // Update UI
        document.querySelectorAll('.rank-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.rank === rank);
        });

        this.updateOkButton();
    }

    updateOkButton() {
        const okBtn = document.getElementById('wildCardOk');
        okBtn.disabled = !(this.selectedSuit && this.selectedRank);
    }

    handleOk() {
    if (!this.selectedSuit || !this.selectedRank || !this.currentCard) return;

    assignWildCard(this.currentCard, this.selectedRank, this.selectedSuit);

    if (window.game) window.game.validateHands();

    this.close();
}

    close() {
        this.isOpen = false;
        this.currentCard = null;
        this.selectedSuit = null;
        this.selectedRank = null;
        document.getElementById('wildCardModal').style.display = 'none';
    }
}

// Global instance
window.wildCardModal = new WildCardModal();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🃏 Wild Card Modal initialized');
});
