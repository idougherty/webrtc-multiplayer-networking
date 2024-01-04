import io, { Socket } from 'socket.io-client'

import{ CONFIG } from './conf'
import { SignalerError } from './signaler_error';

type ClientId = string;

/***
 * Initiates a connection with the matching server and exposes
 * this instance as the host of a lobby. Plays the role of the
 * 'answerer' in the WebRTC offer-answer negotiation. The host
 * signaler can negotiate multiple potential connections 
 * concurrently. When a connection is established the host
 * signaler relinquishes ownership of the connection to any
 * listeners using the onclient callback.
***/
export class HostSignaler {

    private onclient: Function; // TODO: look into creating an event listener system
    private pendingConnections: Map<ClientId, RTCPeerConnection>;

    private turnServerAddr: string;
    private matchingServerAddr: string;

    private matchingServer: Socket;

    constructor() {

        this.onclient = () => {};
        this.pendingConnections = new Map();
        
        // Load server addresses from config
        this.turnServerAddr = CONFIG.TURN_SERVER;
        this.matchingServerAddr = CONFIG.MATCHING_SERVER;

        // Connect to matching server
        this.matchingServer = io(this.matchingServerAddr);
        this.matchingServer.on("client offer", this.handleOffer);
        this.matchingServer.on("client candidate", this.handleCandidate);

    }

    // Exposes host to matching server
    public async init(lobbyId: string, clientCallback: Function) {

        this.onclient = clientCallback;

        const request = { lobbyId };
        const response = await this.matchingServer.emitWithAck("init host", request);

        if(!response.ok)
            throw new SignalerError(response.data);
    }

    private async handleOffer(data: any, callback: Function) {
        
        const { socketId, sessionDescription } = data;
        
        console.log(`Received client offer. [client=${socketId}]`);

        if(socketId == null || sessionDescription == null) {
            console.warn("Bad request in 'client offer'");
            return callback({ ok: false, data: "Bad request." });
        }

        const pc = new RTCPeerConnection();
        this.pendingConnections.set(socketId, pc);
        
        // TODO: error handling here?
        this.initConnection(pc);
        await pc.setRemoteDescription(sessionDescription);
        await pc.setLocalDescription();
        
        return callback({ ok: true, data: pc.localDescription?.toJSON() });
    }

    private initConnection(pc: RTCPeerConnection) {

        // TODO: figure out options
        pc.createDataChannel("data-channel", { negotiated: true, id: 0 });

        // Create lobby initiates connection negotiation
        // pc.onnegotiationneeded = e => submitOffer(lobbyId);

        // Handle ICE candidate events
        pc.onicecandidate = ({ candidate }) => this.submitCandidate(candidate);
        pc.onicecandidateerror = e => console.warn(e);

        // Other events
        // TODO: remove after debugging
        pc.onconnectionstatechange = e => console.log(e);
        pc.oniceconnectionstatechange = e => console.log(e);
        pc.onicegatheringstatechange = e => console.log(e);
        pc.onsignalingstatechange = e => console.log(e);

    }

    private async submitAnswer() {
        
    }

    private handleCandidate(data: any, callback: Function) {

    }

    private async submitCandidate(candidate: RTCIceCandidate | null) {
        
        console.log("Submitting new ice candidate.", candidate);
        
        if(candidate == null)
            return;
    
        const response = await this.matchingServer.emitWithAck("host candidate", candidate.toJSON());

        if(!response.ok)
            throw new SignalerError(response.data);

    }
    
};