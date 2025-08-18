// To GO ONLINE, use cloudNewGame()

async function cloudNewGame() {
    try {
        console.log("🌥️ Starting Cloud Single Player Game...");

        // Show some user feedback
        const button = document.getElementById('cloudGameButton');
        if (button) {
            button.textContent = 'Initializing...';
            button.disabled = true;
        }

        // Execute your exact console commands
        const table = new TableManager();
        await table.initialize('user123', 'TestPlayer');

        const tableId = await table.createTable({
            name: "Cloud Single Player",
            maxPlayers: 6,
            fillWithAI: true
        });

        // Test the updated flow
        const multiDevice = new MultiDeviceIntegration();
        await multiDevice.initialize(table);

        console.log("✅ Cloud game setup complete! Click 'New Game' to start.");

        // Re-enable button and update text
        if (button) {
            button.textContent = 'GO ONLINE!';
            setTimeout(() => {
                button.textContent = 'GO ONLINE';
                button.disabled = false;
            }, 2000);
        }

        // Optionally auto-click the New Game button
        // document.querySelector('[onclick*="startNewGame"]')?.click();

    } catch (error) {
        console.error("❌ Error setting up cloud game:", error);

        // Reset button on error
        const button = document.getElementById('cloudGameButton');
        if (button) {
            button.textContent = 'Error - Try Again';
            button.disabled = false;
        }
    }
}