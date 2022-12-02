let video;

function initialize() {
    video = window.document.querySelector('video');

    window.ipc.on('set-cam', (data) => {
        if (!navigator.mediaDevices.getUserMedia) return;

        let errorCallback = (error) => {
            console.log(
                `There was an error connecting to the video stream: ${error.message}`
            );
        };

        let selectedDevice = null;
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                devices.forEach((device) => {
                    if (device.kind === 'videoinput') {
                        console.log(device.label);
                        console.log(data.label);
                        if (device.label === data.label) {
                            console.log('the same');
                            selectedDevice = {
                                label: device.label,
                                deviceId: device.deviceId,
                            };
                        }
                    }
                });

                console.log(selectedDevice);

                if (!selectedDevice) return;

                navigator.mediaDevices
                    .getUserMedia({
                        video: { deviceId: selectedDevice.deviceId },
                    })
                    .then(function (stream) {
                        video.srcObject = stream;
                    })
                    .catch(function (err0r) {
                        console.log('Something went wrong!');
                    });
            })
            .catch((err) => {
                console.error(`${err.name}: ${err.message}`);
            });
    });
}

window.onload = initialize;
