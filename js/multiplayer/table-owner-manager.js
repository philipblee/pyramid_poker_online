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

    // Don't generate - just find our existing player in the array
    // Player 0 should be found by their stored name 'joe@gmail.com'
    const ourPlayer = playersArray.find(p => {
        // Check if this player's name matches our original email OR contains our email prefix
        return p.name === currentUser.email ||
               (p.name.includes(currentUser.email.split('@')[0]) && p.name.includes('@'));
    });

    console.log('🔍 Looking for player with email:', currentUser.email);
    console.log('🔍 Available players:', playersArray.map(p => p.name));
    console.log('🔍 Found our player:', ourPlayer);

    if (!ourPlayer) {
        console.log('Our player not found in array');
        return;
    }

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
