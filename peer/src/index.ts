import { ClientSignaler } from './client_signaler'
import { Lobby } from './lobby';
import { SignalerError } from './signaler_error';

let newLobbyTitle = document.getElementById("create-lobby-title") as HTMLInputElement;
let newLobbyBtn = document.getElementById("create-lobby-btn") as HTMLButtonElement;

let joinLobbyTitle = document.getElementById("join-lobby-title") as HTMLInputElement;
let joinLobbyBtn = document.getElementById("join-lobby-btn") as HTMLButtonElement;

let lobby: Lobby;
let clientSignaler: ClientSignaler;

newLobbyBtn.addEventListener("click", async e => {

    if(lobby != null)
        throw new Error("Lobby already created.");

    let lobbyId = newLobbyTitle.value;
    console.log(`Creating lobby '${lobbyId}'.`);

    lobby = new Lobby(lobbyId);

    try {
        await lobby.init((c: RTCPeerConnection) => console.log(c))
    } catch (e) {
        if(e instanceof SignalerError) {
            alert(e.message);
        }
    }

});

joinLobbyBtn.addEventListener("click", async e => {

    if(clientSignaler != null)
        throw new Error("Already in a lobby.");

    let lobbyId = joinLobbyTitle.value;
    console.log(`Joining lobby '${lobbyId}'.`);

    clientSignaler = new ClientSignaler();

    try {
        await clientSignaler.init(lobbyId, (c: RTCPeerConnection) => console.log(c))
    } catch (e) {
        if(e instanceof SignalerError) {
            alert(e.message);
        }
    }

});