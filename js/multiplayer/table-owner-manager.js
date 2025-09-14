// table-owner-manager.js

async function tableOwnerManager(playerCount, playersArray, tableId) {
    const startBtn = document.getElementById('startGameBtn') ||
                    document.querySelector('button[onclick*="startGame"]') ||
                    document.getElementById('startGame');

    if (!startBtn || !playersArray || !Array.isArray(playersArray)) {
        return;
    }

    const currentUser = firebase.auth().currentUser;
    const currentPlayer = playersArray.find(p => p.name.includes(currentUser.email.split('@')[0]));
    const currentUserName = currentPlayer ? currentPlayer.name : currentUser.email;
    if (!currentUser) return;

    // Sort players by join time to find the owner (first player)
    const sortedPlayers = [...playersArray].sort((a, b) => a.joinedAt - b.joinedAt);

    // Check if current user is the first player (owner)
    const isOwner = await claimOwnershipIfNeeded(tableId, currentUserName);
    const playerInfo = {
        id: 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: currentUserName,
        joinedAt: Date.now(),
        ready: false,
        isOwner: isOwner
    };

    console.log('🔍 Ownership check:', {
        currentUserName,
        firstPlayer: sortedPlayers[0]?.name,
        isOwner
    });

    if (playerCount >= 2) {
        if (isOwner) {
            startBtn.disabled = false;
            startBtn.textContent = '👑 Start Game';
            startBtn.title = 'You are the table owner';
        } else {
            startBtn.disabled = true;
            startBtn.textContent = 'Waiting for Owner';
            startBtn.title = 'Only the table owner can start';
        }
    }
}
