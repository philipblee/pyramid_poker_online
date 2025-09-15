async function tableOwnerManager(playerCount, playersArray, tableId) {
    const startBtn = document.getElementById('startGameBtn') ||
                    document.querySelector('button[onclick*="startGame"]') ||
                    document.getElementById('startGame');

    if (!startBtn || !playersArray || !Array.isArray(playersArray)) {
        return;
    }

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    // Use the same logic as the working isTableOwner() method
    const humanPlayer = window.game.players.find(p => !p.isAI);
    const ourPlayerName = humanPlayer ? humanPlayer.name : currentUser.email;
    const ourPlayer = playersArray.find(p => p.name === ourPlayerName);

    if (!ourPlayer) {
        console.log('Our player not found in array:', ourPlayerName);
        return;
    }

    const isOwner = ourPlayer.isOwner;

    if (playerCount >= 2) {
        if (isOwner) {
            startBtn.disabled = false;
            startBtn.textContent = '👑 Start Game';
        } else {
            startBtn.disabled = true;
            startBtn.textContent = 'Waiting for Owner';
        }
    }
}
