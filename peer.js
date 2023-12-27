let polite = true;
let makingOffer = false;

// TODO implement signaling channel
class SignalingChannel {
    send(data) {
        console.log(data);
        let json = {};
        
        for(const key of Object.keys(data)) 
            if(data[key])
                json[key] = data[key].toJSON();

        console.log(JSON.stringify(JSON.stringify(json)));
    }

    async recv(data) {
        const {description, candidate} = JSON.parse(data);

        let ignoreOffer = false;

        try {
            if (description) {
                const offerCollision =
                    description.type === "offer" &&
                    (makingOffer || pc.signalingState !== "stable");
                    
                ignoreOffer = !polite && offerCollision;
                if (ignoreOffer)
                    return;

                await pc.setRemoteDescription(description);
                if (description.type === "offer") {
                    await pc.setLocalDescription();
                    signaler.send({ description: pc.localDescription });
                }
            } else if (candidate) {
                try {
                    await pc.addIceCandidate(candidate);
                } catch (err) {
                    if (!ignoreOffer) {
                        throw err;
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
};

async function start() {
    // Calling the REST API TO fetch the TURN Server Credentials
    const response = await fetch("https://idougherty.metered.live/api/v1/turn/credentials?apiKey=3b0f9651f119bc2b20a25c4874af63f17e46");

    // Saving the response in the iceServers array
    const config = {
        iceServers: await response.json(),
    };

    console.log(config);

    signaler = new SignalingChannel();
    pc = new RTCPeerConnection(config);

    pc.onnegotiationneeded = async () => {
        try {
            makingOffer = true;
            await pc.setLocalDescription();
            signaler.send({ description: pc.localDescription });
        } catch (err) {
            console.error(err);
        } finally {
            makingOffer = false;
        }
    };

    pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
            pc.restartIce();
        }
    };

    pc.onicecandidate = ({ candidate }) => signaler.send({ candidate });

    let channel = pc.createDataChannel("channel1", { negotiated: true, id: 0 });

    channel.onmessage = (event) => {
        console.log(`received: ${event.data}`);
    };
    
    channel.onopen = () => {
        console.log("datachannel open");
    };

    channel.onclose = () => {
        console.log("datachannel close");
    };

    document.addEventListener("keypress", e => {
        console.log(`sending: ${e.key}`);
        channel.send(e.key);
    })
}

start();