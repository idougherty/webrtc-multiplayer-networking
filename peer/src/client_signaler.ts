import { Socket, io } from "socket.io-client";
import { CONFIG } from "./conf";
import { SignalerError } from "./signaler_error";

export class ClientSignaler {

    private onclient: Function; // TODO: look into creating an event listener system
    private pc: RTCPeerConnection;

    private turnServerAddr: string;
    private matchingServerAddr: string;

    private matchingServer: Socket;

    constructor() {

        this.onclient = () => {};
        this.pc = new RTCPeerConnection();

        // Load server addresses from config
        this.turnServerAddr = CONFIG.TURN_SERVER;
        this.matchingServerAddr = CONFIG.MATCHING_SERVER;

        // Connect to matching server
        this.matchingServer = io(this.matchingServerAddr);
        this.matchingServer.on("host candidate", this.handleCandidate);

    }

    public async init(lobbyId: string, clientCallback: Function) {

        this.onclient = clientCallback;
        
        // TODO: figure out options
        this.pc.createDataChannel("data-channel", { negotiated: true, id: 0 });

        // Create lobby initiates connection negotiation
        this.pc.onnegotiationneeded = e => this.submitOffer(lobbyId);

        // Handle ICE candidate events
        this.pc.onicecandidate = ({ candidate }) => this.submitCandidate(candidate);
        this.pc.onicecandidateerror = e => console.warn(e);

        // Other events
        // TODO: remove after debugging
        this.pc.onconnectionstatechange = e => console.log(e);
        this.pc.oniceconnectionstatechange = e => console.log(e);
        this.pc.onicegatheringstatechange = e => console.log(e);
        this.pc.onsignalingstatechange = e => console.log(e);

    }

    private async submitOffer(lobbyId: string) {

        // Create local session description
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        // Submit lobby details to matching server
        const request = {
            lobbyId,
            sessionDescription: this.pc.localDescription?.toJSON()
        }

        const response = await this.matchingServer.emitWithAck("client offer", request);
        
        if(!response.ok)
            throw new SignalerError(response.data);

        // Fetch the TURN server credentials
        // ICE candidates are discovered after this step
        const iceServers = await fetch(this.turnServerAddr);
        const config = { iceServers: await iceServers.json() };
        this.pc.setConfiguration(config);

        this.handleAnswer(response.data);
    }

    private handleAnswer(data: any) {
        console.log(data);
    }

    private async submitCandidate(candidate: RTCIceCandidate | null) {
        
        console.log("Submitting new ice candidate.", candidate);
        
        if(candidate == null)
            return;
    
        const response = await this.matchingServer.emitWithAck("host candidate", candidate.toJSON());

        if(!response.ok)
            throw new SignalerError(response.data);

    }

    private handleCandidate(data: any, callback: Function) {

    }

    public remove() {
        this.matchingServer.disconnect();
    }
}