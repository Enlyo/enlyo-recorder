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
            <AddGameForm @add="addGame" @close="closeAddGameModal" />
        </b-modal>
    </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppNavigation from '@/components/layout/AppNavigation.vue';
import AppContent from '@/components/layout/AppContent.vue';
import SectionHead from '@/components/SectionHead.vue';
import AddGameForm from '@/components/AddGameForm.vue';

export default {
    name: 'AutoRecording',

    components: {
        AppLayout,
        AppHeader,
        AppNavigation,
        AppContent,
        SectionHead,
        AddGameForm,
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
