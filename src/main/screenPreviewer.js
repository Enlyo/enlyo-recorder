const { desktopCapturer, Menu } = require('electron');

// Get the available video sources
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['screen'],
    });

    return inputSources;

    console.debug(inputSources);

    return selectSource(navigator, inputSources[0]);
}

// Change the videoSource window to record
async function selectSource(navigator, source) {
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
            },
        },
    };

    console.debug(navigator);

    // Create a Stream
    return await navigator.mediaDevices.getUserMedia(constraints);
}

module.exports.getVideoSources = getVideoSources;
