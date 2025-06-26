// js/utils/version.js
// Version loading and display functionality

async function loadVersionInfo() {
    try {
        const response = await fetch('./version.json');
        const versionInfo = await response.json();

        // Update the existing version-tag element
        const versionElement = document.getElementById('version-info');
        if (versionElement) {
            versionElement.textContent = `Enhanced Edition - ${versionInfo.version}`;
            versionElement.title = `Build Details:
Branch: ${versionInfo.branch}
Commit: ${versionInfo.commit}
Built: ${new Date(versionInfo.buildDate).toLocaleString()}
Last Commit: ${new Date(versionInfo.lastCommit).toLocaleString()}

Click to copy version info`;

            // Add click handler to copy version info
            versionElement.style.cursor = 'pointer';
            versionElement.addEventListener('click', () => {
                const versionText = `Pyramid Poker Online v${versionInfo.version}\nCommit: ${versionInfo.commit}\nBranch: ${versionInfo.branch}\nBuilt: ${versionInfo.buildDate}`;
                navigator.clipboard.writeText(versionText).then(() => {
                    const originalText = versionElement.textContent;
                    versionElement.textContent = 'Copied to clipboard!';
                    setTimeout(() => {
                        versionElement.textContent = originalText;
                    }, 2000);
                });
            });
        }

        // Log for debugging
        console.log('🎮 Pyramid Poker Online Version Info:', versionInfo);

    } catch (error) {
        console.warn('Could not load version info:', error);
        // Fallback to static version
        const versionElement = document.getElementById('version-info');
        if (versionElement) {
            versionElement.textContent = 'Enhanced Edition - v2.0';
        }
    }
}