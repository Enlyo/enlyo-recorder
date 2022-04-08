import axios from 'axios';
import AuthService from './AuthService';

const ctx = { $axios: axios };

const auth = AuthService('auth/', 'User', ctx);

export default {
    auth,
};
