// build-version.js - Run this before serving/deploying
const { execSync } = require('child_process');
const fs = require('fs');

function generateVersion() {
    try {
        // Get full version with tag, commits ahead, and hash
        const fullVersion = execSync('git describe --tags --always --dirty', { encoding: 'utf8' }).trim();

        // Get just the short commit hash
        const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

        // Get branch name
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

        // Get last commit date
        const lastCommit = execSync('git log -1 --format=%cd --date=iso', { encoding: 'utf8' }).trim();

        const versionInfo = {
            version: fullVersion,
            commit: commitHash,
            branch: branch,
            buildDate: new Date().toISOString(),
            lastCommit: lastCommit
        };

        // Write version.json for the game to load
        fs.writeFileSync('version.json', JSON.stringify(versionInfo, null, 2));

        console.log('Version generated:', fullVersion);
        return versionInfo;

    } catch (error) {
        console.warn('Git not available, using fallback version');
        const fallback = {
            version: 'dev-build',
            commit: 'unknown',
            branch: 'unknown',
            buildDate: new Date().toISOString(),
            lastCommit: 'unknown'
        };
        fs.writeFileSync('version.json', JSON.stringify(fallback, null, 2));
        return fallback;
    }
}

if (require.main === module) {
    generateVersion();
}

module.exports = generateVersion;