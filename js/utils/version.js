// js/utils/version.js
// Version loading and display functionality

const EXPECTED_VERSION = 'v8.2';

function showUpdateBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ff6b6b;color:white;text-align:center;padding:12px;font-size:18px;z-index:9999;cursor:pointer;';
    banner.innerHTML = '⚠️ New version available — tap here to update';
    banner.addEventListener('click', () => window.location.reload(true));
    document.body.appendChild(banner);
}

async function loadVersionInfo() {
    try {
        const response = await fetch('./version.json?t=' + Date.now());
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

        if (!versionInfo.version.startsWith(EXPECTED_VERSION)) {
            showUpdateBanner();
        }

        // Log for debugging
//        console.log('🎮 Pyramid Poker Online Version Info:', versionInfo);

    } catch (error) {
        console.warn('Could not load version info:', error);
        // Fallback to static version
        const versionElement = document.getElementById('version-info');
        if (versionElement) {
            versionElement.textContent = 'Enhanced Edition - v2.0';
        }
    }
}
