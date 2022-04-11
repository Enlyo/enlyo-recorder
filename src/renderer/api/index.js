import AuthService from './AuthService';
import VideoService from './VideoService';

const auth = new AuthService('auth/', 'User');
const video = new VideoService('videos/', 'Video');

export default {
    auth,
    video,
};
