import { Peer } from './peer'

export class HostPeer extends Peer {

    async createLobby(lobbyName: string) {

        // // Submit lobby details to matching server
        // const envelope = await fetch(`${this.matchingServer}/lobby/create`,
        // {
        //     method: "POST",
        //     body: JSON.stringify({
        //         title: lobbyName,
        //         sessionDescription: this.pc.localDescription?.toJSON()
        //     }),
        //     headers: {
        //         "Content-type": "application/json; charset=UTF-8"
        //     }
        // });
        
        // const response = await envelope.json();
        
        // if(!response.ok)
        //     throw new Error(response.data);
    
        // console.log(response.data);

        // this.pc.onicecandidate = ({ candidate }) => this.submitIceCandidate(candidate);
    }

    // async submitIceCandidate(candidate: RTCIceCandidate | null) {
    //     if(candidate == null)
    //         return;

    //     const response = await fetch(`${this.matchingServer}/lobby/${this.lobbyId}/candidates`,
    //     {
    //         method: "POST",
    //         body: JSON.stringify(candidate.toJSON()),
    //         headers: {
    //             "Content-type": "application/json; charset=UTF-8"
    //         }
    //     });

    // }
};

// pc.onnegotiationneeded = async () => {
//     try {
//         makingOffer = true;
//         await pc.setLocalDescription();
//         signaler.send({ description: pc.localDescription });
//     } catch (err) {
//         console.error(err);
//     } finally {
//         makingOffer = false;
//     }
// };

// pc.oniceconnectionstatechange = () => {
//     if (pc.iceConnectionState === "failed") {
//         pc.restartIce();
//     }
// };

// pc.onicecandidate = ({ candidate }) => signaler.send({ candidate });

// let channel = pc.createDataChannel("channel1", { negotiated: true, id: 0 });

// channel.onmessage = (event) => {
//     console.log(`received: ${event.data}`);
// };

// channel.onopen = () => {
//     console.log("datachannel open");
// };

// channel.onclose = () => {
//     console.log("datachannel close");
// };