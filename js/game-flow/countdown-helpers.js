function showCountdownModal(startNumber) {
    const modal = document.getElementById('countdownModal');
    const number = document.getElementById('countdownNumber');
    if (modal && number) {
        number.textContent = startNumber;
        modal.style.display = 'flex';
    }
}

function updateCountdownNumber(num) {
    const number = document.getElementById('countdownNumber');
    if (number) {
        number.textContent = num;
    }
}

function hideCountdownModal() {
    const modal = document.getElementById('countdownModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
