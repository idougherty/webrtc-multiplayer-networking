import { Server, Socket } from 'socket.io'
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
    processConnection(socket);

    socket.on("message", processMessage);
    socket.on("close", processClose);
});

function processConnection(socket: Socket) {
    console.log("Connection initiated");

    socket.emit("hello", "turd");
}

function processMessage(data: any) {
    console.log(`Message received: ${data}`);
}

function processClose() {
    console.log("Connection closed");
}

// app.use(cors(corsOptions));
// app.use(bodyParser.json());

// app.listen(http_port, () => {
//     console.log(`HTTP server listening on port ${http_port}!`);
// });

// // Test endpoint
// app.get("/", async (req: Request, res: Response) => {
//     return res.status(200).json({ ok: true, data: "Hello world!" });
// });

// // Serve lobby info
// app.get("/lobby/:id", async (req: Request, res: Response) => {
//     const {id} = req.params;

//     if(!lobbyMap.has(id))
//         return res.status(200).json({ ok: true, data: null });

//     return res.status(200).json({ ok: true, data: lobbyMap.get(id) });
// });

// // Create new lobby by submitting a session description
// app.post("/lobby/create", async (req: Request, res: Response) => {
//     const { title, sessionDescription } = req.body;

//     console.log(title, sessionDescription);

//     if(lobbyMap.has(title))
//         return res.status(500).json({ ok: false, data: "Lobby already exists." });

//     lobbyMap.set(title, {
//         "name": title,
//         "host": {
//             "sessionDescription": sessionDescription,
//             "candidates": []
//         }
//     });

//     return res.status(200).json({ ok: true, data: null });
// });

// // Add candidates to lobby
// app.post("/lobby/:id/candidates", async (req: Request, res: Response) => {
//     const {id} = req.params;
//     const data = req.body;

//     console.log(data);

//     return res.status(200).json({ ok: true, data: "nice" });
// });

/*** Test lobby information ***/

const lobbyMap = new Map();

lobbyMap.set("abc123", {
    "name": "Test Lobby",
    "host": {
        "sessionDescription": {
            "type": "offer",
            "sdp": "v=0\r\no=- 850867386561808716 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n"
        },
        "candidates": [
            {
                "candidate": "candidate:2516483527 1 udp 16785407 216.39.253.22 63069 typ relay raddr 73.45.219.31 rport 50740 generation 0 ufrag d4GO network-cost 999",
                "sdpMid":"0",
                "sdpMLineIndex":0,
                "usernameFragment":"d4GO"
            },
            {
                "candidate":"candidate:2516483527 1 udp 16785919 216.39.253.22 53925 typ relay raddr 73.45.219.31 rport 56110 generation 0 ufrag d4GO network-cost 999",
                "sdpMid":"0",
                "sdpMLineIndex":0,
                "usernameFragment":"d4GO"
            }
        ]
    }
});