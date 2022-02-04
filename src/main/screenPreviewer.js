const { desktopCapturer } = require('electron');

// Get the available video sources
async function getVideoSources() {
    return await desktopCapturer.getSources({
        types: ['screen'],
    });
}

module.exports.getVideoSources = getVideoSources;
