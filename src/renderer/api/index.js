import AuthService from './AuthService';
import RoomService from './RoomService';
import VideoService from './VideoService';

const auth = new AuthService('auth/', 'User');
const room = new RoomService('rooms/', 'Room');
const video = new VideoService('videos/', 'Video');

export default {
    auth,
    room,
    video,
};
