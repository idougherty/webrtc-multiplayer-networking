import { Server, Socket } from 'socket.io'
import type { SocketId } from "socket.io-adapter";
import * as dotenv from 'dotenv';

/*** Load config ***/

dotenv.config();
const port = parseInt(process.env.PORT ?? "8181");

/*** Start WebSocket server ***/

const io = new Server(port, {
    cors: {
        // TODO: enable only through dev environment
        origin: "http://localhost:8080"
    }
});

console.log("Server started on port: " + port);

io.on("connection", socket => {

    // Host endpoints
    socket.on("init host", (d, c) => createLobby(socket, d, c));   
    socket.on("host candidate", (d, c) => handleHostCandidate(socket, d, c));

    // Client endpoints
    socket.on("client offer", (d, c) => handleClientOffer(socket, d, c));
    socket.on("client candidate", (d, c) => handleClientCandidate(socket, d, c));

    // Handle disconnects
    socket.on("disconnect", () => handleDisconnect(socket));

});

// Initialize a lobby
function createLobby(socket: Socket, data: any, callback: Function) {

    let { lobbyId } = data;

    console.log(`Creating new lobby. [host=${socket.id}] [lobby=${lobbyId}]`);

    if(lobbyId == null) {
        console.warn(`Bad request in 'create lobby'.`)
        return callback({ ok: false, data: "Bad request." });
    }

    if(lobbyMap.has(lobbyId)) {
        console.warn(`Bad request in 'create lobby'.`)
        return callback({ ok: false, data: "Lobby name already in use." });
    }

    if(hostMap.has(socket.id)) {
        console.warn(`Bad request in 'create lobby'.`)
        return callback({ ok: false, data: "A host may only have one lobby." });
    }

    // Initialize lobby information
    const lobbyInfo = {
        id: lobbyId,
        clientCount: 0,
        hostSocket: socket,
        clientSockets: new Map(),
    };

    hostMap.set(socket.id, lobbyInfo);
    lobbyMap.set(lobbyId, lobbyInfo);

    return callback({ ok: true, data: null });
}

function handleHostCandidate(socket: Socket, data: any, callback: Function) {

    let { clientId, candidate } = data;
    let lobbyInfo = hostMap.get(socket.id);
    let client = lobbyInfo?.clientSockets.get(clientId);

    console.log(`Host candidate proposed. [client=${socket.id}]`);

    if(clientId == null || candidate == null) {
        console.warn(`Bad request in 'host candidate'.`)
        return callback({ ok: false, data: "Bad request." });
    }

    if(lobbyInfo == null || client == null) {
        console.warn(`Bad request in 'host candidate'.`)
        return callback({ ok: false, data: "No lobby associated with host." });
    }
    
    client.emit("host candidate", { candidate });

    return callback({ ok: true, data: null });

}

async function handleClientOffer(socket: Socket, data: any, callback: Function) {

    let { lobbyId, sessionDescription } = data;
    let lobbyInfo = lobbyMap.get(lobbyId);

    console.log(`Initiating connection negotiation. [client=${socket.id}] [lobby=${lobbyId}]`);

    if(lobbyId == null || sessionDescription == null) {
        console.warn(`Bad request in 'client offer'.`)
        return callback({ ok: false, data: "Bad request." });
    }

    if(clientMap.has(socket.id)) {
        console.warn(`Bad request in 'client offer'.`)
        return callback({ ok: false, data: "Client is already connecting to a lobby." });
    }

    if(lobbyInfo == null) {
        console.warn(`Bad request in 'client offer'.`)
        return callback({ ok: false, data: "Lobby name not found." });
    }

    clientMap.set(socket.id, lobbyInfo);
    lobbyInfo.clientSockets.set(socket.id, socket);

    const request = { clientId: socket.id, sessionDescription };
    const response = await lobbyInfo.hostSocket.emitWithAck("client offer", request);

    return callback(response);

}

function handleClientCandidate(socket: Socket, data: any, callback: Function) {

    let { candidate } = data;
    let lobbyInfo = clientMap.get(socket.id);

    console.log(`Client candidate proposed. [client=${socket.id}]`);

    if(candidate == null) {
        console.warn(`Bad request in 'client candidate'.`)
        return callback({ ok: false, data: "Bad request." });
    }

    if(lobbyInfo == null) {
        console.warn(`Bad request in 'client candidate'.`)
        return callback({ ok: false, data: "No lobby associated with client." });
    }

    const request = { clientId: socket.id, candidate };
    lobbyInfo.hostSocket.emit("client candidate", request);

    return callback({ ok: true, data: null });

}

function handleDisconnect(socket: Socket) {

    const lobbyInfo = hostMap.get(socket.id);

    if(lobbyInfo == null)
        return;

    // TODO: persist lobbies on host disconnect
    // Handle host disconnect
    console.log(`Host disconnected, removing lobby. [host=${socket.id}] [lobby=${lobbyInfo.id}]`);

    hostMap.delete(socket.id);
    lobbyMap.delete(lobbyInfo.id);

}

/*** Connection Types ***/

type LobbyId = string;

interface LobbyInfo {
    id: LobbyId;
    clientCount: number;
    hostSocket: Socket;
    clientSockets: Map<SocketId, Socket>;   // Actively connecting sockets, removed after signaling ends
}

/*** Test lobby information ***/

const clientMap = new Map<SocketId, LobbyInfo>();   // Maps socket ids to lobby info
const hostMap = new Map<SocketId, LobbyInfo>();     // Maps socket ids to lobby info
const lobbyMap = new Map<LobbyId, LobbyInfo>();     // Maps lobby names to lobby info