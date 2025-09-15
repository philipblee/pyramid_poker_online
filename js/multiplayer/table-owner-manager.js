// table-owner-manager.js - ONLY for updating button state
async function tableOwnerManager(playerCount, playersArray, tableId) {
    const startBtn = document.getElementById('startGameBtn') ||
                    document.querySelector('button[onclick*="startGame"]') ||
                    document.getElementById('startGame');

    if (!startBtn || !playersArray || !Array.isArray(playersArray)) {
        return;
    }

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    // Find our player in the existing players array (don't create new player)
    const ourPlayer = playersArray.find(p =>
        p.name === currentUser.email ||
        p.name.includes(currentUser.email.split('@')[0])
    );

    if (!ourPlayer) {
        console.log('Our player not found in array');
        return;
    }

    // Use the isOwner flag that was already set in joinTable()
    const isOwner = ourPlayer.isOwner;

    console.log('🔍 Button update check:', {
        ourPlayerName: ourPlayer.name,
        isOwner: isOwner
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
