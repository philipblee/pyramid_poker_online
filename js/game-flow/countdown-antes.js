// Encode email for Firebase path
function encodeEmailForFirebase(email) {
    // For AI players: replace spaces with underscores
    if (email.includes(' AI')) {
        return email.replace(/ /g, '_');
    }
    // For human emails: periods → commas, @ → _at_
    return email.replace(/\./g, ',').replace(/@/g, '_at_');
}

// Collect antes from all players
async function collectAntes(players) {
    const config = window.gameConfig?.config;

    if (config.stakesAnteAmount <= 0) {
        return 0;  // No antes configured
    }

    console.log(`💰 Collecting ${config.stakesAnteAmount} chip antes from ${players.length} players...`);

    let totalPot = 0;

    for (const player of players) {
        // Skip AI players - they don't have Firebase chip balances
        if (player.isAI) {
            console.log(`🤖 Skipping AI player: ${player.name}`);
            continue;
        }

        const playerId = player.name || player.id || player.email;
        const encodedPlayerId = encodeEmailForFirebase(playerId);
        const playerRef = firebase.database().ref(`players/${encodedPlayerId}`);

        const snapshot = await playerRef.once('value');
        const playerData = snapshot.val();

        if (playerData) {
            const currentChips = playerData.chips || 0;
            const newChips = currentChips - config.stakesAnteAmount;

            await playerRef.update({ chips: newChips });
            totalPot += config.stakesAnteAmount;

            console.log(`  💳 ${playerId}: ${currentChips} → ${newChips}`);
        } else {
            console.log(`❌ No chip data for player: ${encodedPlayerId}`);
        }
    }

    console.log(`✅ Pot: ${totalPot} chips`);
    return totalPot;
}
