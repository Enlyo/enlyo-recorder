<template>
    <div class="user-menu">
        <b-dropdown
            class="user-menu-dropdown"
            aria-role="list"
            position="is-bottom-left"
            :mobile-modal="false"
        >
            <template #trigger>
                <EnAvatar
                    :name="user.username"
                    :avatar="user.avatar"
                    size="is-small"
                    class="pointer"
                />
            </template>

            <b-dropdown-item @click="copyHandle">
                <div class="user-box">
                    <EnAvatar
                        :name="user.username"
                        :avatar="user.avatar"
                        class="pointer"
                    />
                    <div class="user-handle-box">
                        <div class="username-box">
                            {{ user.username }}
                        </div>
                        <div class="unique-id-box">#{{ user.unique_id }}</div>
                    </div>
                </div>
            </b-dropdown-item>

            <b-dropdown-item separator aria-role="listitem" />

            <b-dropdown-item
                aria-role="listitem"
                class="drop-down"
                @click="goToSupport"
            >
                Support
            </b-dropdown-item>

            <b-dropdown-item separator aria-role="listitem" />

            <b-dropdown-item
                aria-role="listitem"
                class="drop-down"
                @click="logout"
            >
                Logout
            </b-dropdown-item>
        </b-dropdown>
    </div>
</template>

<script>
import { ToastProgrammatic as Toast } from 'buefy';
import EnAvatar from './EnAvatar';

import { mapGetters } from 'vuex';

export default {
    name: 'UserMenu',

    components: {
        EnAvatar,
    },

    computed: {
        ...mapGetters({
            user: 'auth/user',
        }),
    },

    methods: {
        async logout() {
            await this.$store.dispatch('auth/logout');
            this.$router.push('/login');
        },

        copyHandle() {
            const textNode = document.createTextNode(this.user.handle);
            const textarea = document.createElement('textarea');
            textarea.setAttribute('style', 'height:0;');
            textarea.appendChild(textNode);
            document.body.appendChild(textarea);

            textarea.select();
            document.execCommand('Copy');

            textarea.parentNode.removeChild(textarea);

            this.showToast('User handle has been copied to the clipboard');
        },

        goToSupport() {
            window.open('https://enlyo.helpscoutdocs.com/', '_blank').focus();
        },

        showToast(message) {
            Toast.open({
                message,
                type: 'is-white',
                duration: 2000,
                position: 'is-bottom',
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.user-menu-dropdown {
    cursor: pointer;

    ::v-deep .dropdown-menu {
        .dropdown-item {
            .user-box {
                display: flex;
                flex-direction: row;
                align-items: center;

                .user-handle-box {
                    margin-left: 1rem;

                    .username-box {
                        font-size: 18px;
                        line-height: 18px;
                        font-weight: bold;
                    }

                    .unique-id-box {
                        margin-top: 0.3rem;
                        font-size: 16px;
                        line-height: 16px;
                        color: $text-grey;
                    }
                }
            }

            &:hover {
                color: $text-white;
            }
        }
    }
}
</style>
