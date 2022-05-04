const EventEmitter = require('events').EventEmitter;

import Pusher from 'pusher-js';
import SimplePeer from 'simple-peer';

/**
 * Signal Server
 */
export default class SignalServer extends EventEmitter {
    constructor(pf) {
        super();

        this._pusher = null;
        this._pf = pf;
        this._id = null;
        this._peers = {};
        this._channel = null;
    }

    /* -------------------------------------------------------------------------- */
    /*                              PUBLIC FUNCTIONS                              */
    /* -------------------------------------------------------------------------- */

    /**
     * Start
     */
    start(id, token) {
        this._id = id;

        this._pusher = new Pusher(process.env.VUE_APP_PUSHER_SECRET, {
            cluster: 'eu',
            authEndpoint: process.env.VUE_APP_PUSHER_AUTH_ENDPOINT,
            auth: {
                headers: {
                    Authorization: `JWT ${token}`,
                },
            },
        });

        this.subscribe(id);
    }

    /**
     * Stop
     */
    stop() {
        this.unsubscribe();
        this._pusher = null;
        this._peers = {};
        this._id = null;
    }

    /**
     * Send
     */
    send(message, toId = null) {
        if (!this._channel) {
            return;
        }
        // toId makes it possible to send a message to a specific member
        message.toId = toId;
        this._channel.trigger(`client-${message.type}`, message);
    }

    /**
     * Upload
     */
    upload(id, { fileId, file }) {
        const peer = this._peers[id];
        return this._pf.send(peer, fileId, file);
    }

    /**
     * Download
     */
    download(peerId, { fileId }) {
        const peer = this._peers[peerId];

        return this._pf.receive(peer, fileId);
    }

    /* -------------------------------------------------------------------------- */
    /*                         PRIVATE - SETUP AND DESTROY                        */
    /* -------------------------------------------------------------------------- */

    /**
     * Subscribe
     */
    subscribe(id) {
        if (!this._pusher) {
            return;
        }
        this._channel = this._pusher.subscribe(`presence-${id}`);

        this._channel.bind('pusher:subscription_succeeded', (members) => {
            this.setUpListeners();

            this.addMembers(members);
        });
    }

    /**
     * Set up listeners
     */
    setUpListeners() {
        this._channel.bind('pusher:member_added', (member) => {
            this.handleMemberJoined(member);
        });

        this._channel.bind('pusher:member_removed', (member) => {
            this.handleMemberLeft(member);
        });

        this._channel.bind(
            'client-signal-' + this.getMyMemberId(),
            (signal) => {
                this.handleSignal(signal);
            }
        );

        this._channel.bind(
            'client-addSharedWithMeFileRequest',
            (data, metaData) => {
                this.handleAddSharedWithMeFileRequest(
                    data,
                    this.getMemberFromMetaData(metaData)
                );
            }
        );

        this._channel.bind('client-removeSharedWithMeFileRequest', (data) => {
            this.handleRemoveSharedWithMeFileRequest(data);
        });

        this._channel.bind(
            'client-sendSharedFilesRequest',
            (data, metaData) => {
                this.handleSendSharedFilesRequest(
                    data,
                    this.getMemberFromMetaData(metaData)
                );
            }
        );

        this._channel.bind(
            'client-uploadSharedFileRequest',
            (data, metaData) => {
                this.handleUploadSharedFileRequest(
                    data,
                    this.getMemberFromMetaData(metaData)
                );
            }
        );

        this._channel.bind('client-finishedDownloading', (data, metaData) => {
            this.handleFinishedDownloading(
                data,
                this.getMemberFromMetaData(metaData)
            );
        });

        this._channel.bind('client-leaveRoomRequest', () => {
            this.handleLeaveRoomRequest();
        });
    }

    /**
     * Unsubscribe
     */
    unsubscribe() {
        if (!this._pusher) {
            return;
        }
        this._pusher.unsubscribe(`presence-${this._id}`);
        this._channel = null;
    }

    /* -------------------------------------------------------------------------- */
    /*                          PRIVATE - EVENT HANDLERS                          */
    /* -------------------------------------------------------------------------- */

    /**
     * Handle member joined
     */
    handleMemberJoined(member) {
        this.addMember(member);
    }

    /**
     * Handle member left
     */
    handleMemberLeft(member) {
        this.removeMember(member);
    }

    /**
     * Handle signal
     */
    handleSignal(signal) {
        this.completeP2PConnection(signal);
    }

    /**
     * Handle add shared with me file request
     */
    handleAddSharedWithMeFileRequest(msg, member) {
        if (msg.toId && msg.toId != this.getMyMemberId()) return;

        this.addSharedWithMeFile(msg, member);
    }

    /**
     * Handle remove shared with me file request
     */
    handleRemoveSharedWithMeFileRequest(msg) {
        this.removeSharedWithMeFile(msg);
    }

    /**
     * Handle send shared files request
     */
    handleSendSharedFilesRequest(message, member) {
        if (message.toId != this.getMyMemberId()) return;

        this.sendSharedFiles(member);
    }

    /**
     * Handle upload shared file request
     */
    handleUploadSharedFileRequest(message, member) {
        if (message.toId != this.getMyMemberId()) return;

        this.uploadSharedFile(message, member);
    }

    /**
     * Handle finished downloading
     */
    handleFinishedDownloading(message, member) {
        this.emit('finishedDownloading', {
            id: member.id,
            fileId: message.fileId,
        });
    }

    /**
     * Leave room
     */
    handleLeaveRoomRequest() {
        this.emit('leaveRoom');
    }

    /* -------------------------------------------------------------------------- */
    /*                              PRIVATE - MEMBERS                             */
    /* -------------------------------------------------------------------------- */

    /**
     * Add members
     */
    addMembers(members, showNotification = false) {
        members.each((member) => {
            this.addMember(member, showNotification, false);
        });
    }

    /**
     * Add member
     */
    addMember(member, showNotification = true, initiateP2PConnection = true) {
        if (member.id === this.getMyMemberId) return;

        this.emit('addMember', {
            id: member.id,
            data: {
                id: member.id,
                username: member.info.username,
                handle: member.info.handle,
                avatar: member.info.avatar,
            },
            showNotification,
        });

        if (initiateP2PConnection) this.initiateP2PConnection(member);
    }

    /**
     * Remove member
     */
    removeMember(member) {
        this.emit('removeMember', { id: member.id });
    }

    /* -------------------------------------------------------------------------- */
    /*                      PRIVATE - PEER TO PEER CONNECTION                     */
    /* -------------------------------------------------------------------------- */

    /**
     * Initiate P2P connection
     */
    initiateP2PConnection(member) {
        this._peers[member.id] = new SimplePeer({ initiator: true });
        this._peers[member.id].on('signal', (data) => {
            this._channel.trigger('client-signal-' + member.id, {
                userId: this.getMyMemberId(),
                data: data,
            });
        });
    }

    /**
     * Complete P2P connection
     */
    completeP2PConnection(signal) {
        if (!this._peers[signal.userId]) {
            this._peers[signal.userId] = new SimplePeer();

            this._peers[signal.userId].on('signal', (data) => {
                this._channel.trigger('client-signal-' + signal.userId, {
                    userId: this.getMyMemberId(),
                    data: data,
                });
            });
        }

        this._peers[signal.userId].signal(signal.data);
    }

    /* -------------------------------------------------------------------------- */
    /*                       PRIVATE - SHARED WITH ME FILES                       */
    /* -------------------------------------------------------------------------- */

    /**
     * Add shared with me file
     */
    addSharedWithMeFile(msg, member) {
        const showNotification = msg.showNotification;

        delete msg.type;
        delete msg.showNotification;

        this.emit('addSharedWithMeFile', {
            id: msg.shareID,
            data: {
                ...msg,
                member: member,
                status: 'toDownload',
            },
            showNotification,
        });
    }

    /**
     * Remove shared with me file
     */
    removeSharedWithMeFile(msg) {
        this.emit('removeSharedWithMeFile', {
            id: msg.id,
        });
    }

    /* -------------------------------------------------------------------------- */
    /*                           PRIVATE - SHARED FILES                           */
    /* -------------------------------------------------------------------------- */

    /**
     * Send shared files
     */
    sendSharedFiles(member) {
        this.emit('sendSharedFiles', { id: member.id });
    }

    /**
     * Upload shared file
     */
    uploadSharedFile(message, member) {
        this.emit('uploadSharedFile', {
            id: member.id,
            fileId: message.fileId,
        });
    }

    /* -------------------------------------------------------------------------- */
    /*                                   HELPERS                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * Get member from metadata
     */
    getMemberFromMetaData({ user_id }) {
        if (!user_id) {
            return null;
        }
        const member = this._channel.members.get(user_id);
        return {
            id: member.id,
            ...member.info,
        };
    }

    /**
     * Get my member id
     */
    getMyMemberId() {
        if (!this._channel) {
            return null;
        }
        return this._channel.members.myID;
    }
}
