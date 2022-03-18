<template>
    <div class="modal-card" style="width: auto">
        <section class="modal-card-body">
            <b-field label="Select a window">
                <b-select v-model="game" placeholder="Select" expanded>
                    <option
                        v-for="process in activeProcesses"
                        :key="process.id"
                        :value="process"
                    >
                        {{ process.title }}
                    </option>
                </b-select>
            </b-field>
        </section>
        <footer class="modal-card-foot">
            <b-button label="Close" size="is-small" @click="$emit('close')" />
            <b-button
                label="Add Game"
                type="is-primary"
                size="is-small"
                @click="add"
            />
        </footer>
    </div>
</template>

<script>
export default {
    name: 'AddGameForm',

    data() {
        return {
            game: null,
            activeProcesses: [],
        };
    },

    created() {
        this.getActiveProcesses();
    },

    methods: {
        /**
         * Get active processes
         */
        async getActiveProcesses() {
            this.activeProcesses = await window.ipc.invoke(
                'get-active-processes'
            );
        },

        /**
         * Add game
         */
        add() {
            this.$emit('add', {
                title: this.game.title,
                name: this.game.name,
                isCustomAdded: true,
            });
            this.game = null;
        },
    },
};
</script>

<style lang="scss" scoped></style>
