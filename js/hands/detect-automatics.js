// js/hands/detect-automatics.js
// Encapsulates UI handling for detecting and playing automatic hands

(function attachAutomaticHandlers() {

    function detectAutomatics() {

        console.log('🎯 detectAutomatics CALLED');
        console.log('🎯 window.currentAutomatic:', window.currentAutomatic);

        // GUARD: If automatic already detected, do nothing
        if (window.currentAutomatic) {
            console.log('⚠️ Automatic already detected, ignoring duplicate call');
            return;
        }

        // Pool all cards back to staging regardless of current arrangement
        const currentPlayer = window.game.playerManager.getCurrentPlayer();
        const playerData = window.game.playerHands.get(currentPlayer.name);
        if (playerData) {
        playerData.cards = [
            ...playerData.cards,
            ...playerData.back,
            ...playerData.middle,
            ...playerData.front
        ].map(c => (c.isWild || c.wasWild) ?
            { ...c, rank: '', suit: '', value: 0, isWild: true, wasWild: false } : c);
            playerData.back = [];
            playerData.middle = [];
            playerData.front = [];
            window.game.loadCurrentPlayerHand();

            const wildCheck = playerData.cards.find(c => c.isWild);
            console.log('🃏 Wild after reset:', JSON.stringify(wildCheck));
        }

        window.game.autoArrangeUsed = false;
        document.getElementById('autoArrange').textContent = 'BEST';
        document.getElementById('prevArrangement').style.display = 'none';
        document.getElementById('nextArrangement').style.display = 'none';
        document.getElementById('arrangementCounter').style.display = 'none';
        window.topArrangements = [];
        window.topArrangementIndex = 0;

        const stagingArea = document.getElementById('playerHand');

        if (!stagingArea) {
            console.error('❌ playerHand element not found');
            showAutomaticMessage('❌ Error: Staging area not found');
            return;
        }

        const cardElements = stagingArea.querySelectorAll('.card');
        if (cardElements.length === 0) {
            showAutomaticMessage('❌ No cards in staging area');
            return;
        }

        const allCards = Array.from(cardElements).map(cardEl => {
            const card = JSON.parse(cardEl.dataset.card);
            card.element = cardEl;
            return card;
        });
        console.log('🃏 Wild in allCards:', JSON.stringify(allCards.find(c => c.isWild)));

        console.log('🔍 Searching for automatics with', allCards.length, 'cards...');
        const result = findAndArrangeBestAutomatic(allCards);

        if (result) {
            const automaticName = result.type.replace(/-/g, ' ').toUpperCase();
            showAutomaticMessage(`✨ Automatic Found: ${automaticName}`);

            if (result.variants) {
                // Three-flush with unused wild — populate scroller
                const currentPlayer = window.game.playerManager.getCurrentPlayer();
                const playerData = window.game.playerHands.get(currentPlayer.name);

                const stripElement = cards => cards.map(({element, ...cardData}) => cardData);

                window.topArrangements = result.variants.map(v => ({
                    arrangement: {
                        back:        { cards: stripElement(v.arrangement.back.cards) },
                        middle:      { cards: stripElement(v.arrangement.middle.cards) },
                        front:       { cards: stripElement(v.arrangement.front.cards) },
                        stagingCards: stripElement(v.arrangement.stagingCards)
                    },
                    score: v.score
                }));
                window.topArrangementIndex = 0;

                const first = window.topArrangements[0].arrangement;
                if (playerData) {
                    playerData.back   = first.back.cards;
                    playerData.middle = first.middle.cards;
                    playerData.front  = first.front.cards;
                    playerData.cards  = first.stagingCards;
                }

                window.game.loadCurrentPlayerHand();

                document.getElementById('prevArrangement').style.display = 'inline-block';
                document.getElementById('nextArrangement').style.display = 'inline-block';
                document.getElementById('arrangementCounter').style.display = 'inline-block';
                document.getElementById('arrangementCounter').textContent = `1/${result.variants.length}`;

                window.currentAutomatic = result.type;
                window.game.validateHands();
                console.log(`✅ Arranged ${result.type} with ${result.variants.length} wild variants`);

            } else {
                // Standard automatic — move DOM elements directly
                result.arrangement.back.forEach(card => {
                    document.getElementById('backHand').appendChild(card.element);
                });
                result.arrangement.middle.forEach(card => {
                    document.getElementById('middleHand').appendChild(card.element);
                });
                result.arrangement.front.forEach(card => {
                    document.getElementById('frontHand').appendChild(card.element);
                });

                const currentPlayer = window.game.playerManager.getCurrentPlayer();
                const playerData = window.game.playerHands.get(currentPlayer.name);

                if (playerData) {
                    const movedCards = [...result.arrangement.back, ...result.arrangement.middle, ...result.arrangement.front];
                    const movedCardIds = new Set(movedCards.map(c => c.id));
                    playerData.cards = playerData.cards.filter(c => !movedCardIds.has(c.id));

                    playerData.back   = result.arrangement.back.map(c =>   { const {element, ...d} = c; return d; });
                    playerData.middle = result.arrangement.middle.map(c => { const {element, ...d} = c; return d; });
                    playerData.front  = result.arrangement.front.map(c =>  { const {element, ...d} = c; return d; });
                }

                window.currentAutomatic = result.type;
                window.game.validateHands();
                console.log(`✅ Arranged ${result.type}`);
            }

        } else {
            showAutomaticMessage('❌ No automatic possible with these cards');

            // Do not move any cards; just reset state/button
            window.currentAutomatic = null;

            const autoButton = document.getElementById('detectAutomatics');
            if (autoButton) {
                autoButton.textContent = 'FIND-AUTO';
                autoButton.title = '';
            }

        }
    }

    function showAutomaticMessage(message) {
        const messageDiv = document.getElementById('automaticMessage');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.style.display = 'block';
        } else {
            console.log(message);
        }
    }

    function hideAutomaticMessage() {
        const messageDiv = document.getElementById('automaticMessage');
        if (messageDiv) {
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
        }
    }
    window.hideAutomaticMessage = hideAutomaticMessage;

    function playAutomatic() {
        if (!window.currentAutomatic) return;

        // Clear flag
        window.currentAutomatic = null;

        // Submit using existing method
        window.game.playAutomatic();

        console.log(`🎯 Submitted automatic`);
    }

    function resetAutomaticButton() {
        const autoButton = document.getElementById('detectAutomatics');
        if (autoButton) {
            autoButton.textContent = 'FIND-AUTO';
            // DON'T set onclick - addEventListener already handles routing
            autoButton.title = '';
            autoButton.disabled = false;
        }
        window.currentAutomatic = null;
    }

    // Expose to global scope
    window.showAutomaticMessage = showAutomaticMessage;
    window.detectAutomatics = detectAutomatics;
    window.playAutomatic = playAutomatic;
    window.resetAutomaticButton = resetAutomaticButton;
})();
