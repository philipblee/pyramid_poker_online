// removed DisconnectionManager from multi-device-integration created DisconnectionManager class

// NEW: Disconnection handling
class disconnectionManager {
    startDisconnectionTimer(userId) {
        console.log(`⏰ Starting 60-second timer for ${userId}`);

        const timer = setTimeout(async () => {
            console.log(`🤖 Auto-arranging for disconnected player: ${userId}`);

            // Get player's current cards
            const playerHand = await this.getPlayerHand(userId);

            // Use existing findBestSetup for auto-arrange
            const autoArrangement = window.findBestSetup(playerHand.cards);

            // Submit auto-arranged hand
            await this.submitPlayerHand(userId, autoArrangement, true); // isAutoSubmit = true

            // Update table status
            await this.updateTableStatus(`${playerName} auto-submitted (disconnected)`);

        }, 60000); // 60 seconds

        this.reconnectionTimers.set(userId, timer);
    }

    cancelDisconnectionTimer(userId) {
        const timer = this.reconnectionTimers.get(userId);
        if (timer) {
            clearTimeout(timer);
            this.reconnectionTimers.delete(userId);
            console.log(`✅ ${userId} reconnected - cancelled auto-arrange timer`);
        }
    }
}
