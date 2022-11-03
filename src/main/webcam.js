let video;

function initialize() {
    video = window.document.querySelector('video');
    let errorCallback = (error) => {
        console.log(
            `There was an error connecting to the video stream: ${error.message}`
        );
    };

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
            })
            .catch(function (err0r) {
                console.log('Something went wrong!');
            });
    }
}

window.onload = initialize;
