import { HostSignaler } from "./host_signaler";

export type LobbyId = string; 

/*** 
 * Provides a management layer for the host signaler. The lobby
 * captures clients that have finished negotiation and provides
 * utilities for sending and receiving data.
 ***/
export class Lobby {
    
    readonly lobbyId: LobbyId;
    private signaler: HostSignaler;
    readonly clients: Array<RTCPeerConnection>;

    constructor(lobbyId: LobbyId) {
        
        this.lobbyId = lobbyId;
        this.signaler = new HostSignaler();
        this.clients = [];

    }

    public async init(clientCallback: Function) {

        const callback = (client: RTCPeerConnection) => this.addNewClient(client, clientCallback);
        await this.signaler.init(this.lobbyId, callback);

    }

    private addNewClient(client: RTCPeerConnection, clientCallback: Function) {
        this.clients.push(client);
        clientCallback(client);
    }

    public broadcast(data: any) {
        // TODO: implement broadcast
    }

}