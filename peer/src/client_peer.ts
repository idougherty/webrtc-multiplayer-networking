import { Peer } from './peer'

export class ClientPeer extends Peer {
    async joinLobby(lobbyName: string) {
        const {host} = await this.fetchLobbyInfo(lobbyName);
        console.log(host);

        this.pc.setRemoteDescription(host.sessionDescription);
        this.submitSessionDescription(lobbyName);
    }

    async fetchLobbyInfo(lobbyName: string) {
        const envelope = await fetch(`${this.matchingServer}/lobby/${lobbyName}`);
        const response = await envelope.json();

        if(!response.ok)
            throw new Error(response.data);
        
        if(response.data == null)
            throw new Error("Lobby does not exist");

        return response.data;
    }

    async submitSessionDescription(lobbyName: string) {

    }
}