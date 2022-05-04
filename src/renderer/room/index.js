import { v4 as uuidv4 } from 'uuid';
import PeerFiles from 'simple-peer-files';

import SignalServer from './signalServer';
import api from '../api';
import store from '../store';

export default {
    signalServer: new SignalServer(
        new PeerFiles(),
        store.getters['auth/tokens'].access
    ),

    get sharedFiles() {
        return store.getters['room/sharedFiles'];
    },

    /* -------------------------------------------------------------------------- */
    /*                              SETUP AND DESTROY                             */
    /* -------------------------------------------------------------------------- */

    /**
     * Join
     */
    async join(id) {
        const response = await api.room.show(id);

        if (response.status) {
            this.startSignalServer(id);
            return { status: true };
        }

        return { status: false };
    },

    /**
     * Leave
     */
    leave() {
        this.signalServer.stop();

        store.dispatch('room/removeSharedFiles');

        this.removeSignalServerListeners();
    },

    /**
     * Start signal server
     */
    startSignalServer(id) {
        this.signalServer.start(id);

        this.setupSignalServerListeners();
    },

    /**
     * Setup signal server listers
     */
    setupSignalServerListeners() {
        this.signalServer.on(
            'sendSharedFiles',
            this.sendSharedFiles.bind(this)
        );
        this.signalServer.on(
            'uploadSharedFile',
            this.uploadSharedFile.bind(this)
        );
        this.signalServer.on('leaveRoom', this.leaveRoom.bind(this));
    },

    /**
     * Remove signal server listeners
     */
    removeSignalServerListeners() {
        this.signalServer.removeAllListeners();
    },

    /* -------------------------------------------------------------------------- */
    /*                                   MEMBERS                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * Leave room
     */
    async leaveRoom() {
        // TODO: Check how to handle this
    },

    /* -------------------------------------------------------------------------- */
    /*                                SHARED FILES                                */
    /* -------------------------------------------------------------------------- */

    /**
     * Share files
     */
    shareFiles(files) {
        for (const key in files) {
            this.shareFile(files[key]);
        }
    },

    /**
     * Share file
     */
    shareFile(file) {
        const id = uuidv4();
        const data = {
            shareID: id,
            file,
            name: file.name,
            size: file.size,
            downloadedBy: [],
            owner: {
                username: store.getters['auth/user'].username,
                handle: store.getters['auth/user'].handle,
                avatar: store.getters['auth/user'].avatar,
            },
        };

        store.dispatch('room/addSharedFile', { id, data });

        this._shareFile(data);
    },

    _shareFile(data) {
        data = {
            ...data,
            type: 'addSharedWithMeFileRequest',
            showNotification: true,
        };
        delete data.file;

        this.signalServer.send(data);
    },

    /**
     * Remove shared file
     */
    removeSharedFile(file) {
        const id = file.shareID;

        store.dispatch('room/removeSharedFile', {
            id,
        });

        this.signalServer.send({
            id,
            type: 'removeSharedWithMeFileRequest',
        });
    },

    /**
     * Send shared files
     */
    sendSharedFiles({ id }) {
        for (const key in this.sharedFiles) {
            let sharedFile = this.sharedFiles[key];

            this.signalServer.send(
                {
                    ...sharedFile,
                    type: 'addSharedWithMeFileRequest',
                    showNotification: false,
                },
                id
            );
        }
    },

    /**
     * Upload shared file
     */
    uploadSharedFile({ id, fileId }) {
        const file = this.sharedFiles[fileId];

        if (file && file.file) {
            this.signalServer
                .upload(id, { fileId, file: file.file })
                .then((transfer) => {
                    transfer.start();
                });
        }
    },
};
