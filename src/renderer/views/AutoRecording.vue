<template>
    <div class="auto-recording">
        <SectionHead title="Games" class="pt-0" />

        <SectionCard>
            <div>
                <b-field
                    v-for="item in gamesAndCustomProcessesList"
                    :key="item.name"
                >
                    <b-checkbox
                        v-model="autoRecordProcesses"
                        :native-value="item"
                        size="is-medium"
                    >
                        {{ item.title }}
                        <span
                            v-if="item.isCustomAdded"
                            class="delete-link ml-2"
                            @click="confirmDeleteCustomRecordProcess(item)"
                        >
                            delete
                        </span>
                    </b-checkbox>
                </b-field>

                <p class="game-not-available-text">
                    Not seeing your game?
                    <span
                        class="game-not-available-link"
                        @click="openAddGameModal"
                    >
                        Add it!
                    </span>
                </p>
            </div>
        </SectionCard>

        <b-modal
            :active.sync="showAddGameModal"
            :width="300"
            has-modal-card
            trap-focus
            @close="closeAddGameModal"
        >
            <AddGameForm @add="addGame" @close="closeAddGameModal" />
        </b-modal>
    </div>
</template>

<script>
import SectionHead from '@/components/SectionHead.vue';
import AddGameForm from '@/components/AddGameForm.vue';
import SectionCard from '@/components/SectionCard.vue';

export default {
    name: 'AutoRecording',

    components: {
        SectionHead,
        AddGameForm,
        SectionCard,
    },

    data() {
        return {
            availableGames: [
                {
                    title: 'League of Legends',
                    name: 'League of Legends.exe',
                },
                {
                    title: 'Valorant',
                    name: 'VALORANT-Win64-Shipping.exe',
                },
            ],
            customRecordProcesses: [],
            autoRecordProcesses: [],

            showAddGameModal: false,
        };
    },

    computed: {
        gamesAndCustomProcessesList() {
            return [...this.availableGames, ...this.customRecordProcesses].sort(
                (a, b) =>
                    a.title.toLowerCase().localeCompare(b.title.toLowerCase())
            );
        },
    },

    watch: {
        autoRecordProcesses: {
            immediate: false,
            deep: true,
            handler() {
                this.updateAutoRecordProcesses();
            },
        },
    },

    created() {
        this.getSettings();
    },

    methods: {
        /* -------------------------------------------------------------------------- */
        /*                              Settings                                      */
        /* -------------------------------------------------------------------------- */
        async getSettings() {
            const { autoRecordProcesses, customRecordProcesses } =
                await window.ipc.invoke('get-store-value', 'settings');

            this.autoRecordProcesses = autoRecordProcesses;
            this.customRecordProcesses = customRecordProcesses;
        },

        /**
         * Update auto record processes settings
         */
        async updateAutoRecordProcesses() {
            await window.ipc.invoke('set-setting', {
                key: 'autoRecordProcesses',
                value: this.autoRecordProcesses,
            });
        },

        /**
         * Update custom record processes settings
         */
        async updateCustomRecordProcesses() {
            await window.ipc.invoke('set-setting', {
                key: 'customRecordProcesses',
                value: this.customRecordProcesses,
            });
        },

        /**
         * Show confirm dialog for delete custom record processes
         */
        confirmDeleteCustomRecordProcess(process) {
            this.$buefy.dialog.confirm({
                message: `Are you sure you want to <b>delete</b> this game?`,
                confirmText: `Delete`,
                type: 'is-danger',
                onConfirm: () => this.deleteCustomRecordProcess(process),
            });
        },

        /**
         * Delete custom record process
         */
        deleteCustomRecordProcess(process) {
            // Remove record from auto record processes
            this.autoRecordProcesses = this.autoRecordProcesses.filter(
                (item) => item.name !== process.name
            );
            // Remove record from custom record processes
            this.customRecordProcesses = this.customRecordProcesses.filter(
                (item) => item.name !== process.name
            );
            this.updateAutoRecordProcesses();
            this.updateCustomRecordProcesses();

            this.resetProcessMonitor();
        },

        /* -------------------------------------------------------------------------- */
        /*                              Add new game                                  */
        /* -------------------------------------------------------------------------- */

        /**
         * Open add game modal
         */
        async openAddGameModal() {
            this.showAddGameModal = true;
        },

        /**
         * Close add game modal
         */
        closeAddGameModal() {
            this.showAddGameModal = false;
        },

        /**
         * Add custom game
         */
        addGame(data) {
            this.autoRecordProcesses.push(data);
            this.customRecordProcesses.push(data);
            this.updateAutoRecordProcesses();
            this.updateCustomRecordProcesses();
            this.closeAddGameModal();

            this.resetProcessMonitor();
        },

        /**
         * Reset process monitor
         */
        resetProcessMonitor() {
            window.ipc.send('stop-process-monitor');
            window.ipc.send('start-process-monitor');
        },
    },
};
</script>

<style lang="scss" scoped>
.game-not-available-text {
    color: $text-grey;
    font-size: $s-14px;
}

.game-not-available-link {
    color: $highlight-purple;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
}

.delete-link {
    display: none;
    color: $text-grey;
    font-size: $s-12px;

    &:hover {
        text-decoration: underline;
    }
}

.field {
    &:hover {
        .delete-link {
            display: inline;
        }
    }
}
</style>
