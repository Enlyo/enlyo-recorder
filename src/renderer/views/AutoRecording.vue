<template>
    <AppLayout>
        <AppHeader title="Enlyo" />

        <AppNavigation />

        <AppContent>
            <SectionHead title="Auto record games" class="pt-0" />

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
        </AppContent>

        <b-modal
            :active.sync="showAddGameModal"
            :width="300"
            has-modal-card
            trap-focus
            @close="closeAddGameModal"
        >
            <div class="modal-card" style="width: auto">
                <section class="modal-card-body">
                    <b-field label="Select a window">
                        <b-select
                            v-model="newGame"
                            placeholder="Select"
                            expanded
                        >
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
                    <b-button
                        label="Close"
                        size="is-small"
                        @click="closeAddGameModal"
                    />
                    <b-button
                        label="Add Game"
                        type="is-primary"
                        size="is-small"
                        @click="addGame"
                    />
                </footer>
            </div>
        </b-modal>
    </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppNavigation from '@/components/layout/AppNavigation.vue';
import AppContent from '@/components/layout/AppContent.vue';
import SectionHead from '@/components/SectionHead.vue';

export default {
    name: 'AutoRecording',

    components: {
        AppLayout,
        AppHeader,
        AppNavigation,
        AppContent,
        SectionHead,
    },

    data() {
        return {
            availableGames: [
                {
                    name: 'League of Legends.exe',
                    title: 'League of Legends',
                },
            ],
            customRecordProcesses: [],
            autoRecordProcesses: [],

            activeProcesses: [],
            showAddGameModal: false,
            newGame: null,
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
         * Update auto record proceses settings
         */
        async updateAutoRecordProcesses() {
            await window.ipc.invoke('set-setting', {
                key: 'autoRecordProcesses',
                value: this.autoRecordProcesses,
            });
        },

        /**
         * Update custom record proceses settings
         */
        async updateCustomRecordProcesses() {
            await window.ipc.invoke('set-setting', {
                key: 'customRecordProcesses',
                value: this.customRecordProcesses,
            });
        },

        /**
         * Get active processes
         */
        async getActiveProcesses() {
            this.activeProcesses = await window.ipc.invoke(
                'get-active-processes'
            );
        },

        /* -------------------------------------------------------------------------- */
        /*                              Add new game                                  */
        /* -------------------------------------------------------------------------- */

        /**
         * Open add game modal
         */
        async openAddGameModal() {
            await this.getActiveProcesses();
            this.showAddGameModal = true;
        },

        /**
         * Close add game modal
         */
        closeAddGameModal() {
            this.showAddGameModal = false;
            this.newGame = null;
        },

        /**
         * Add custom game
         */
        addGame() {
            const data = {
                title: this.newGame.title,
                name: this.newGame.name,
                isCustomAdded: true,
            };
            this.autoRecordProcesses.push(data);
            this.customRecordProcesses.push(data);
            this.updateAutoRecordProcesses();
            this.updateCustomRecordProcesses();
            this.closeAddGameModal();
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
</style>
