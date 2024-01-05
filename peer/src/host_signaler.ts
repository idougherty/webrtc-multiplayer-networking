import io, { Socket } from 'socket.io-client'

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

    public onclient: Function; // TODO: look into creating an event listener system
    private pendingConnections: Map<ClientId, RTCPeerConnection>;

    private turnServerAddr: string;
    private matchingServerAddr: string;

    private matchingServer: Socket;

    constructor() {

        this.onclient = () => {};
        this.pendingConnections = new Map();
        
        // Load server addresses from config
        this.turnServerAddr = process.env.TURN_SERVER ?? "";
        this.matchingServerAddr = process.env.MATCHING_SERVER ?? "";

        // Connect to matching server
        this.matchingServer = io(this.matchingServerAddr);
        this.matchingServer.on("connect_error", (err) => {
          console.log(`connect_error due to ${err.message}`);
        });
        console.log(this.matchingServer)
        this.matchingServer.on("client offer", (d, c) => this.handleOffer(d, c));
        this.matchingServer.on("client candidate", d => this.handleCandidate(d));

    }

    // Exposes host to matching server
    public async init(lobbyId: string) {

        const request = { lobbyId };
        const response = await this.matchingServer.emitWithAck("init host", request);

        if(!response.ok)
            throw new SignalerError(response.data);

    }

    private async handleOffer(data: any, callback: Function) {
        
        const { clientId, sessionDescription } = data;
        
        console.log(`Received client offer. [client=${clientId}]`);

        if(clientId == null || sessionDescription == null) {
            console.warn("Bad request in 'client offer'");
            return callback({ ok: false, data: "Bad request." });
        }

        const pc = new RTCPeerConnection();
        this.pendingConnections.set(clientId, pc);
        
        // TODO: is error handling necessary here?
        this.initConnection(clientId, pc);
        await pc.setRemoteDescription(sessionDescription);
        await pc.setLocalDescription();

        // Fetch the TURN server credentials
        // ICE candidates are discovered after this step
        const iceServers = await fetch(this.turnServerAddr);
        const config = { iceServers: await iceServers.json() };
        pc.setConfiguration(config);

        const response = { sessionDescription: pc.localDescription?.toJSON() };
        return callback({ ok: true, data: response });
    }

    private async handleCandidate(data: any) {

        const { clientId, candidate } = data;
        const pc = this.pendingConnections.get(clientId);

        console.log(`Received client candidate. [client=${clientId}]`);
        console.log(candidate);

        if(candidate == null || pc == null)
            return;

        await pc.addIceCandidate(candidate);
        
    }

    private async submitCandidate(clientId: string, candidate: RTCIceCandidate | null) {
        
        console.log("Submitting new ICE candidate.", candidate);
        
        if(candidate == null)
            return;
    
        const request = { clientId, candidate: candidate.toJSON() };
        const response = await this.matchingServer.emitWithAck("host candidate", request);

        if(!response.ok)
            throw new SignalerError(response.data);

    }

    private initConnection(clientId: string, pc: RTCPeerConnection) {

        // Initialize data channel
        const dc = pc.createDataChannel("data-channel", { negotiated: true, id: 0 });
        dc.onopen = e => this.dataChannelOpen(clientId, pc, dc);

        // Handle ICE candidate events
        pc.onicecandidate = ({ candidate }) => this.submitCandidate(clientId, candidate);
        pc.onicecandidateerror = e => console.warn(e);

        // Handle connection changes
        // pc.onconnectionstatechange = e => this.connectionStateChange(e, pc);
        
        // TODO: remove after debugging
        pc.onconnectionstatechange = e => console.log(e);
        pc.oniceconnectionstatechange = e => console.log(e);
        pc.onicegatheringstatechange = e => console.log(e);
        pc.onsignalingstatechange = e => console.log(e);

    }

    private dataChannelOpen(clientId: string, pc: RTCPeerConnection, dc: RTCDataChannel) {

        this.pendingConnections.delete(clientId);
        this.onclient(pc, dc);

    }
    
};