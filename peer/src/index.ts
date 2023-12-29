import { HostPeer } from './host_peer'
import { ClientPeer } from './client_peer'

let newLobbyTitle = document.getElementById("create-lobby-title") as HTMLInputElement;
let newLobbyBtn = document.getElementById("create-lobby-btn") as HTMLButtonElement;

let joinLobbyTitle = document.getElementById("join-lobby-title") as HTMLInputElement;
let joinLobbyBtn = document.getElementById("join-lobby-btn") as HTMLButtonElement;

let hostPeer: HostPeer;
let clientPeer: ClientPeer;

newLobbyBtn.addEventListener("click", async e => {
    if(hostPeer != null)
        throw new Error("Lobby already created");

    let lobbyName = newLobbyTitle.value;
    console.log(`Creating lobby ${lobbyName}`);

    hostPeer = new HostPeer();
    await hostPeer.init();
    await hostPeer.createLobby(lobbyName);
});

joinLobbyBtn.addEventListener("click", async e => {
    if(clientPeer != null)
        throw new Error("Already in a lobby");

    let lobbyName = joinLobbyTitle.value;
    console.log(`Joining lobby ${lobbyName}`);

    clientPeer = new ClientPeer();
    await clientPeer.init();
    await clientPeer.joinLobby(lobbyName);
});