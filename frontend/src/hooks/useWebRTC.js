import { useCallback, useEffect, useRef } from "react";
import { useStateWithCallback } from "./useStateWithCallback";
import { socketInit } from '../socket';
import { ACTIONS } from "../actions";
import freeice from 'freeice';

/*
const users = [
  {
    id: 1,
    name: "Parag Dudeja",
  },
  {
    id: 2,
    name: "John Doe",
  }
];
*/

export const useWebRTC = (roomId, user) => {
  const [clients, setClients] = useStateWithCallback([]);
  const audioElements = useRef({});
  const connections = useRef({});
  const localMediaStream = useRef(null);
  const socket = useRef(null);
  const clientsRef = useRef([]);

  const provideRef = (instance, userId) => {
    audioElements.current[userId] = instance;
  }

  useEffect(() => {
    socket.current = socketInit();
  }, [])

  const addNewClient = useCallback(
    (newClient, cb) => {
      const lookingFor = clients.find((client) => client.id === newClient.id);
      if(lookingFor === undefined) {
        setClients((existingClients) => [...existingClients, newClient], cb)
      }
    },
    [clients, setClients],
  )

  // Capture Media
  useEffect(() => {
    const startCapture = async () => {
      localMediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true
    })
    };

    startCapture().then(() => {
      addNewClient({...user, muted: true}, () => {
        const localElement = audioElements.current[user.id];
        if (localElement) {
          localElement.volume = 0;
          localElement.srcObject = localMediaStream.current;
        }

        // Socket emit join
        socket.current.emit(ACTIONS.JOIN, { roomId, user });
      });
    });

    return () => {
      // Leave room
      localMediaStream.current.getTracks()
        .forEach(track => track.stop());
      
      socket.current.emit(ACTIONS.LEAVE, { roomId });
    }
  }, []);
  
  useEffect(() => {
    const handleNewPeer = async ({peerId, createOffer, user: remoteUser}) => {
      // If already connected
      if(peerId in connections.current) {
        return console.warn(`Already coonnected with ${peerId} (${user.name})`);
      } 

      connections.current[peerId] = new RTCPeerConnection({
        iceServers: freeice()
      });

      // handle new ice candidate
      connections.current[peerId].onicecandidate = (event) => {
        socket.current.emit(ACTIONS.RELAY_ICE, {
          peerId,
          icecandidate: event.candidate
        });
      }
      // handle on track on this connection
      connections.current[peerId].ontrack = ({
        streams: [remoteStream]
      }) => {
        addNewClient({...remoteUser, muted: true}, () => {
          if(audioElements.current[remoteUser.id]) {
            audioElements.current[remoteUser.id].srcObject = remoteStream
          } else {
            let settled = false;
            const interval = setInterval(() => {
              if(audioElements.current[remoteUser.id]) {
                audioElements.current[remoteUser.id].srcObject = remoteStream
                settled = true;
              }
              if(settled) {
                clearInterval(interval);
              }
            }, 1000);
          }
        });
      };
      // Add local track to remote
      localMediaStream.current.getTracks().forEach((track) => {
        connections.current[peerId].addTrack(
          track,
          localMediaStream.current
        );
      });

      // create offer
      if(createOffer) {
        const offer = await connections.current[peerId].createOffer();

        await connections.current[peerId].setLocalDescription(offer);
        // send offer to other client
        socket.current.emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: offer
        })
      }
    };

    socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);

    return () => {
      socket.current.off(ACTIONS.ADD_PEER)
    }
  }, []);

  // handle ice candidate
  useEffect(() => {
    socket.current.on(ACTIONS.ICE_CANDIDATE, ({peerId, icecandidate}) => {
      if(icecandidate) {
        connections.current[peerId].addIceCandidate(icecandidate);
      }
    });

    return () => {
      socket.current.off(ACTIONS.ICE_CANDIDATE);
    }
  }, []);

  // handle SDP
  useEffect(() => {
    const handleRemoteSDP = async ({peerId, sessionDescription: remoteSessionDescription}) => {
      connections.current[peerId].setRemoteDescription(
        new RTCSessionDescription(remoteSessionDescription)
      )

      // if sdp is offer create answer
      if(remoteSessionDescription.type === 'offer') {
        const connection = connections.current[peerId];
        const answer = await connection.createAnswer();

        connection.setLocalDescription(answer);

        socket.current.emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: answer,
        })
      }
    };

    socket.current.on(ACTIONS.SESSION_DESCRIPTION, handleRemoteSDP);

    return () => {
      socket.current.off(ACTIONS.SESSION_DESCRIPTION);
    }
  }, []);

  // handle remove peer
  useEffect(() => {
    const handleRemovePeer = async ({peerId, userId}) => {
      if(connections.current[peerId]) {
        connections.current[peerId].close();

        delete connections.current[peerId];
        delete audioElements.current[peerId];
        setClients(list => list.filter(client => client.id !== userId));
      }
    } 

    socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

    return () => {
      socket.current.off(ACTIONS.REMOVE_PEER);
    }
  }, []);

  const handleMute = (isMute, userId) => {
    let settled = false;

    let interval = setInterval(() => {
      if(localMediaStream.current) {
        localMediaStream.current.getTracks()[0].enabled = !isMute;
        if(isMute) {
          socket.current.emit(ACTIONS.MUTE, {
            roomId,
            userId,
          })
        } else {
          socket.current.emit(ACTIONS.UNMUTE, {
            roomId,
            userId,
          })
        }
        settled = true;
      }
      if(settled) {
        clearInterval(interval);
      }
    }, 200);
  }

  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  // listen for mute unmute
  useEffect(() => {
    socket.current.on(ACTIONS.MUTE, ({ peerId, userId }) => {
      setMute(true, userId);
    });

    socket.current.on(ACTIONS.UNMUTE, ({ peerId, userId }) => {
      setMute(false, userId);
    });

    const setMute = (mute, userId) => {
      const clientIndex = clientsRef.current.map(client => client.id).indexOf(userId);

      const connectedClients = JSON.parse(JSON.stringify(clientsRef.current));
      if(clientIndex > -1) {
        connectedClients[clientIndex].muted = mute;
        setClients(connectedClients);
      }
    }
  }, []);

  return { clients, provideRef, handleMute };

}