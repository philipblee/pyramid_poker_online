// js/core/resume-session.js
// Detects and resumes an open session at the current table (owner only)

async function checkForOpenSession() {
    console.log('🔍 checkForOpenSession called, isOwner:', window.isOwner, 'tableId:', currentTable?.id);
    if (!window.isOwner) return;
    if (!currentTable?.id) return;

    const snap = await firebase.firestore().collection('sessions')
        .where('tableId', '==', currentTable.id)
        .where('ended', '==', false)
        .get();

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const openSessionsToday = snap.docs.filter(doc => {
        const s = doc.data();
        const d = new Date(s.startedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return key === todayKey;
    });

    console.log('🔍 checkForOpenSession results — snap.size:', snap.size, 'openSessionsToday:', openSessionsToday.length, 'todayKey:', todayKey);

    const btn = document.getElementById('resumeSessionBtn');
    if (openSessionsToday.length > 0) {
        window.openSessionsForResume = openSessionsToday;
        if (btn) btn.style.display = 'inline-block';
    } else {
        window.openSessionsForResume = [];
        if (btn) btn.style.display = 'none';
    }
}

function showResumeSessionModal() {
    const sessions = window.openSessionsForResume || [];
    if (sessions.length === 0) return;

    const modal = document.createElement('div');
    modal.id = 'resumeSessionModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); z-index: 1001;
        display: flex; align-items: center; justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #2c3e50, #34495e);
        border-radius: 15px; border: 2px solid #ffd700;
        max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
        color: white; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        padding: 30px;
    `;

    let html = `<h2 style="color: #ffd700; margin-bottom: 20px;">🔄 Resume Open Session</h2>`;

    sessions.forEach(doc => {
        const s = doc.data();
        const tournamentKeys = Object.keys(s.tournaments || {}).map(Number);
        const tournamentCount = tournamentKeys.length;
        const highestNumber = tournamentKeys.length > 0 ? Math.max(...tournamentKeys) : 0;
        const players = (s.players || []).map(p => p.includes('@') ? p.split('@')[0] : p).join(', ');
        const startedTime = new Date(s.startedAt).toLocaleTimeString();

        html += `
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 12px;">
                <div style="color: #4ecdc4; font-weight: bold;">Started ${startedTime}</div>
                <div style="font-size: 14px; margin: 5px 0;">Players: ${players}</div>
                <div style="font-size: 14px; margin-bottom: 10px;">Tournaments completed: ${tournamentCount} (next will be #${highestNumber + 1})</div>
                <button onclick="resumeSession('${doc.id}', ${highestNumber})"
                        style="background: #4ecdc4; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    Resume Session
                </button>
            </div>
        `;
    });

    html += `<button onclick="document.getElementById('resumeSessionModal').remove()"
                style="background: #555; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                Cancel
            </button>`;

    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);
}

async function resumeSession(sessionId, highestTournamentNumber) {
    window.currentSessionId = sessionId;
    window.sessionDocCreated = true;
    window.game.tournamentNumber = highestTournamentNumber;

    // Non-owner devices fetch sessionId from tables doc — must match what we just set
    await firebase.firestore().collection('tables').doc(currentTable.id.toString()).update({
        currentSessionId: sessionId
    });

    document.getElementById('resumeSessionModal')?.remove();

    setTableState(TABLE_STATES.SESSION_RESUME);
}
