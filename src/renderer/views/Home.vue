<template>
    <div class="container">
        <div id="preview" />
        <RecordButton
            class="mt-5"
            :is-recording="isRecording"
            @click="isRecording = !isRecording"
        />
    </div>
</template>

<script>
import RecordButton from "../components/RecordButton.vue";

export default {
    name: "Home",

    components: {
        RecordButton,
    },

    data() {
        return {
            isRecording: false,
        };
    },

    mounted() {
        window.ipc.on("resize-preview", (payload) => {
            console.log(payload.height);
            const previewContainer = document.getElementById("preview");
            previewContainer.style = `height: ${payload.height}px`;
        });

        window.ipc.send("initialize-obs");

        const previewContainer = document.getElementById("preview");
        const { width, height, x, y } =
            previewContainer.getBoundingClientRect();

        window.ipc.send("initialize-obs-preview", {
            width,
            height,
            x,
            y,
        });

        var ro = new ResizeObserver(this.resizePreview);
        ro.observe(document.querySelector("body"));
    },

    methods: {
        async resizePreview() {
            console.log("resize");
            const previewContainer = document.getElementById("preview");
            const { width, height, x, y } =
                previewContainer.getBoundingClientRect();

            window.ipc.send("resize-obs-preview", {
                width,
                height,
                x,
                y,
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.container {
    padding: 2rem;

    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;

    #preview {
        width: 400px;
        height: 225px;
        background-color: $background-dark-5;
    }
}
</style>
