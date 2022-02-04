const { desktopCapturer, Menu } = require('electron');

// Get the available video sources
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['screen'],
    });

    console.debug(inputSources);

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map((source) => {
            return {
                label: source.name,
                click: () => selectSource(source),
            };
        })
    );

    videoOptionsMenu.popup();
}

// Change the videoSource window to record
async function selectSource(source) {
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
            },
        },
    };

    // Create a Stream
    return await navigator.mediaDevices.getUserMedia(constraints);
}

module.exports.getVideoSources = getVideoSources;
