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
        clientSockets: [],
    };

    hostMap.set(socket.id, lobbyInfo);
    lobbyMap.set(lobbyId, lobbyInfo);

    return callback({ ok: true, data: null });
}

// Stores new ice candidates and broadcasts them to currently connecting clients
function handleHostCandidate(socket: Socket, data: any, callback: Function) {
    return callback({ ok: false, data: "Not implemented." });

    // const { candidate } = data;
    // const lobbyInfo = hostMap.get(socket.id);
    
    // console.log(`Adding new ice candidate. [host=${socket.id}] [lobby=${lobbyInfo?.id}]`);

    // if(candidate == null) {
    //     console.warn(`Bad request in 'add candidate'.`)
    //     return callback({ ok: false, data: "Bad request." });
    // }

    // if(lobbyInfo == null) {
    //     console.warn(`Bad request in 'add candidate'.`)
    //     return callback({ ok: false, data: "No lobby associated with this socket." });
    // }

    // // Broadcast candidate to currently connecting clients
    // for(const client of lobbyInfo.clientSockets)
    //     client.emit("add candidate", candidate);

    // return callback({ ok: true, data: null });
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

    const request = { socketId: socket.id, sessionDescription };
    const response = await lobbyInfo.hostSocket.emitWithAck("client offer", request);

    return callback(response);
}

function handleClientCandidate(socket: Socket, data: any, callback: Function) {

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

interface RTCInfo {
    sessionDescription: {
        type: string;
        sdp: string;
    };
    candidates: Array<{
        candidate: string;
        sdpMid: string;
        sdpMLineIndex: number;
        usernameFragment: string;
    }>;
}

interface LobbyInfo {
    id: LobbyId;
    clientCount: number;
    hostSocket: Socket;
    clientSockets: Array<Socket>;   // Actively connecting sockets, removed after signaling ends
}

/*** Test lobby information ***/

const clientMap = new Map<SocketId, LobbyInfo>();   // Maps socket ids to lobby info
const hostMap = new Map<SocketId, LobbyInfo>();     // Maps socket ids to lobby info
const lobbyMap = new Map<LobbyId, LobbyInfo>();     // Maps lobby names to lobby info