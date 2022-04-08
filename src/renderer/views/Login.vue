<template>
    <div class="login">
        <div class="columns is-centered">
            <div class="column is-6-tablet is-5-desktop is-4-widescreen">
                <div class="login-box">
                    <h1 class="title is-3 has-text-centered">Login</h1>

                    <form class="login-form">
                        <b-message v-if="isError" type="is-danger">
                            <span v-html="errorMessage" />
                        </b-message>

                        <b-input
                            v-model="form.email"
                            rules="required|email"
                            type="email"
                            size="is-medium"
                            placeholder="Email"
                            autocomplete="email"
                            name="Email"
                        />

                        <b-input
                            v-model="form.password"
                            class="password"
                            rules="required"
                            type="password"
                            size="is-medium"
                            password-reveal
                            placeholder="Password"
                            name="Password"
                            @keyup.enter.native="login"
                        />

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
            isError: false,
            errorMessage: `Something went wrong, please try again`,
            isLoading: false,
        };
    },

    methods: {
        /**
         * Login
         */
        async login() {
            this.setLoading(true);
            this.setError(false);

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

            if ('detail' in data) {
                this.setErrorMessage(data.detail);
            } else {
                this.setErrorMessage(response.data);
            }

            this.setError(true);
            this.setLoading(false);
            return;
        },

        /**
         * Set error
         */
        setError(bool) {
            this.isError = bool;
        },

        /**
         * Set error message
         */
        setErrorMessage(string) {
            this.errorMessage = string;
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
