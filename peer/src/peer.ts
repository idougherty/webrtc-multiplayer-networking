import io, { Socket } from 'socket.io-client'
import{ CONFIG } from './conf'

export class Peer {
    turnServerAddr: string;
    matchingServerAddr: string;

    matchingServer: Socket;

    config: RTCConfiguration;
    pc: RTCPeerConnection;

    constructor() {
        this.turnServerAddr = CONFIG.TURN_SERVER;
        this.matchingServerAddr = CONFIG.MATCHING_SERVER;

        this.matchingServer = io(this.matchingServerAddr);

        this.config = {}
        this.pc = new RTCPeerConnection();
    }

    async init() {
        // Fetch the TURN server credentials
        const iceServers = await fetch(this.turnServerAddr);
        this.config.iceServers = await iceServers.json();
        this.pc.setConfiguration(this.config);

        // Create local session description
        await this.pc.setLocalDescription();
    }

    onConnection() {
        console.log('Connected to matching server.');
    }

    onMessage(message: MessageEvent) {
        console.log(`Received message from server: ${message}`);
    };

    onClose() {
        console.log('Disconnected from server');
    };
}