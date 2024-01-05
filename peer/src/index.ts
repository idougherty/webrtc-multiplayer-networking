import { ClientSignaler } from './client_signaler'
import { Lobby } from './lobby';
import { SignalerError } from './signaler_error';

let newLobbyTitle = document.getElementById("create-lobby-title") as HTMLInputElement;
let newLobbyBtn = document.getElementById("create-lobby-btn") as HTMLButtonElement;

let joinLobbyTitle = document.getElementById("join-lobby-title") as HTMLInputElement;
let joinLobbyBtn = document.getElementById("join-lobby-btn") as HTMLButtonElement;

let lobby: Lobby;
let clientSignaler: ClientSignaler;

let hostChannel: RTCDataChannel | null = null;
let clientChannel: RTCDataChannel | null = null;

document.addEventListener("keypress", e => {
    let channel = hostChannel ?? clientChannel;
    if(channel == null) return;
    console.log(`sending: ${e.key}`);
    console.log(channel.readyState)
    channel.send(e.key);
})

newLobbyBtn.addEventListener("click", async e => {

    if(lobby != null)
        throw new Error("Lobby already created.");

    let lobbyId = newLobbyTitle.value;
    console.log(`Creating lobby '${lobbyId}'.`);

    lobby = new Lobby(lobbyId);

    try {
        const callback = (pc: RTCPeerConnection, dc: RTCDataChannel) => {
            console.log("Data channel connected!");
            dc.onmessage = e => console.log(`received: ${e.data}`);
            dc.send("Message from host!");
            hostChannel = dc;
        };

        await lobby.init(callback)
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
        clientSignaler.onclient = (pc: RTCPeerConnection, dc: RTCDataChannel) => {
            console.log("Data channel connected!");
            dc.onmessage = e => console.log(`received: ${e.data}`);
            dc.send("Message from client!");
            clientChannel = dc;
        };

        await clientSignaler.init(lobbyId)
    } catch (e) {
        if(e instanceof SignalerError) {
            alert(e.message);
        }
    }

});