<template>
    <div class="login">
        <div class="columns is-centered">
            <div class="column is-6-tablet is-5-desktop is-4-widescreen">
                <div class="login-box">
                    <h1 class="title is-3 has-text-centered">Login</h1>

                    <form class="login-form">
                        <b-message v-if="error.detail" type="is-danger">
                            <span v-html="error.detail" />
                        </b-message>

                        <b-field
                            :type="
                                error.email.length > 0 ? 'is-danger' : 'email'
                            "
                            :message="error.email.join(', ')"
                        >
                            <b-input
                                v-model="form.email"
                                size="is-medium"
                                type="email"
                                placeholder="Email"
                                autocomplete="email"
                                name="Email"
                                @input="clearErrors"
                                @keyup.enter.native="login"
                            />
                        </b-field>

                        <b-field
                            :type="
                                error.password.length > 0
                                    ? 'is-danger'
                                    : 'password'
                            "
                            :message="error.password.join(', ')"
                        >
                            <b-input
                                v-model="form.password"
                                class="password"
                                size="is-medium"
                                type="password"
                                password-reveal
                                placeholder="Password"
                                name="Password"
                                @input="clearErrors"
                                @keyup.enter.native="login"
                            />
                        </b-field>

                        <b-button
                            size="is-medium"
                            :loading="isLoading"
                            type="is-primary"
                            expanded
                            @click="login"
                        >
                            Login
                        </b-button>
                    </form>

                    <div class="account-message mt-6">
                        Don't have an account?
                        <a
                            href="https://app.enlyo.com/register/"
                            target="_blank"
                        >
                            Sign up
                        </a>
                    </div>
                    <a
                        href="https://app.enlyo.com/forgot-password/"
                        target="_blank"
                    >
                        Forgot password?
                    </a>
                </div>
            </div>
        </div>
        <div class="columns">
            <div class="column">
                <div class="logo-box">
                    <img
                        class="logo"
                        src="../assets/figureLogo.svg"
                        alt="Enlyo"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Login',

    data() {
        return {
            form: {
                email: '',
                password: '',
            },
            error: {
                email: [],
                password: [],
                detail: '',
            },
            isLoading: false,
        };
    },

    methods: {
        /**
         * Login
         */
        async login() {
            this.setLoading(true);

            const response = await this.$store.dispatch(
                'auth/login',
                this.form
            );

            if (response.status) {
                this.setLoading(false);
                this.$router.push('/');

                return;
            }

            const { data } = response;

            for (const key in data) {
                this.$set(this.error, key, data[key]);
            }

            this.setLoading(false);
            return;
        },

        /**
         * Clear errors
         */
        clearErrors() {
            this.error = {
                email: [],
                password: [],
                detail: '',
            };
        },

        /**
         * Set loading
         */
        setLoading(bool) {
            this.isLoading = bool;
        },
    },
};
</script>

<style lang="scss" scoped>
.login {
    .login-box {
        margin-top: 40%;
        display: flex;
        flex-direction: column;
        align-items: center;

        @include mobile {
            margin-top: 25%;
        }

        .title {
            margin-bottom: 2.5rem;
        }

        .login-form {
            max-width: 360px;
            width: 100%;

            ::v-deep .input {
                border-radius: 6px;
            }

            .password {
                margin-top: 1rem;
                display: block;
            }

            ::v-deep .button {
                margin-top: 1.5rem;
                border-radius: 6px;
            }
        }

        .forgot-password {
            font-size: $s-15px;
            color: $white;

            &:hover {
                text-decoration: underline;
            }
        }

        .account-message {
            font-size: $s-15px;

            .account-login {
                font-weight: bold;

                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }

    .logo-box {
        margin-top: 3rem;
        display: flex;
        justify-content: center;
    }
}
</style>
