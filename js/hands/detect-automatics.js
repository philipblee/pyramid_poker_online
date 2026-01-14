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

        console.log('🔍 Searching for automatics with', allCards.length, 'cards...');
        const result = findAndArrangeBestAutomatic(allCards);

        if (result) {
            const automaticName = result.type.replace(/-/g, ' ').toUpperCase();
            showAutomaticMessage(`✨ Automatic Found: ${automaticName}`);

            // Update DOM (visual)
            result.arrangement.back.forEach(card => {
                document.getElementById('backHand').appendChild(card.element);
            });
            result.arrangement.middle.forEach(card => {
                document.getElementById('middleHand').appendChild(card.element);
            });
            result.arrangement.front.forEach(card => {
                document.getElementById('frontHand').appendChild(card.element);
            });

            // Update this.playerHands (data store)
            const currentPlayer = window.game.playerManager.getCurrentPlayer();
            const playerData = window.game.playerHands.get(currentPlayer.name);

            if (playerData) {
                // Get IDs of moved cards
                const movedCards = [...result.arrangement.back, ...result.arrangement.middle, ...result.arrangement.front];
                const movedCardIds = new Set(movedCards.map(c => c.id));

                // Remove moved cards from staging
                playerData.cards = playerData.cards.filter(c => !movedCardIds.has(c.id));

                // Store card data WITHOUT .element property
                playerData.back = result.arrangement.back.map(c => {
                    const {element, ...cardData} = c;
                    return cardData;
                });
                playerData.middle = result.arrangement.middle.map(c => {
                    const {element, ...cardData} = c;
                    return cardData;
                });
                playerData.front = result.arrangement.front.map(c => {
                    const {element, ...cardData} = c;
                    return cardData;
                });
            }

            // Store automatic type
            window.currentAutomatic = result.type;

            console.log('🔍 About to call validateHands, window.game:', window.game);
            console.log('🔍 validateHands function exists?', typeof window.game.validateHands);

            // Trigger validation to update displays and PLAY-A button
            window.game.validateHands();

            console.log(`✅ Arranged ${result.type}`);

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

            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 10000);
        } else {
            console.log(message); // Fallback
        }
    }

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
