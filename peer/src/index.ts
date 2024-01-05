import { ClientSignaler } from './client_signaler';
import { Lobby } from './lobby';
import { SignalerError } from './signaler_error';

/*** Get references to DOM elements ***/

let lobbyTitle = document.getElementById("lobby-title") as HTMLInputElement;
let newLobbyBtn = document.getElementById("create-lobby-btn") as HTMLButtonElement;
let joinLobbyBtn = document.getElementById("join-lobby-btn") as HTMLButtonElement;

let statusText = document.getElementById("connection-status") as HTMLParagraphElement;
let lastMessage = document.getElementById("last-message") as HTMLParagraphElement;

/*** Demo setup ***/

let lobby: Lobby;
let clientSignaler: ClientSignaler;

let hostChannel: RTCDataChannel | null = null;
let clientChannel: RTCDataChannel | null = null;

document.addEventListener("keypress", e => {
    let channel = hostChannel ?? clientChannel;
    if(channel == null) return;
    console.log(`sending: ${e.key}`);
    channel.send(e.key);
})

newLobbyBtn.addEventListener("click", async e => {

    if(lobby != null)
        throw new Error("Lobby already created.");

    let lobbyId = lobbyTitle.value;
    console.log(`Creating lobby '${lobbyId}'.`);

    lobby = new Lobby(lobbyId);

    try {
        const callback = (pc: RTCPeerConnection, dc: RTCDataChannel) => {
            console.log("Data channel connected!");
            dc.onmessage = e => lastMessage.textContent = e.data;
            dc.send("Message from host!");
            hostChannel = dc;
            statusText.textContent = "Connected!"
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

    let lobbyId = lobbyTitle.value;
    console.log(`Joining lobby '${lobbyId}'.`);

    clientSignaler = new ClientSignaler();

    try {
        clientSignaler.onclient = (pc: RTCPeerConnection, dc: RTCDataChannel) => {
            console.log("Data channel connected!");
            dc.onmessage = e => lastMessage.textContent = e.data;
            dc.send("Message from client!");
            clientChannel = dc;
            statusText.textContent = "Connected!"
        };

        await clientSignaler.init(lobbyId)
    } catch (e) {
        if(e instanceof SignalerError) {
            alert(e.message);
        }
    }

});