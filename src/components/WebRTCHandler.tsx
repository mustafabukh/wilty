import { useEffect, useRef, useState } from 'react';
import Gun from 'gun';

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun']
});

interface PeerState {
  id: string;
  status: 'available' | 'in-call';
  timestamp: number;
}

export const useWebRTCConnection = (localStream: MediaStream | null) => {
  const [peerId] = useState(`peer-${Math.random().toString(36).slice(2)}`);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const connectionTimeout = useRef<number>(0);
  
  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    peerConnection.current = pc;
    return pc;
  };

  const registerAsPeer = () => {
    const peerState: PeerState = {
      id: peerId,
      status: 'available',
      timestamp: Date.now()
    };
    gun.get('peers').get(peerId).put(peerState);
  };

  const findRandomPeer = async () => {
    return new Promise<string | null>((resolve) => {
      gun.get('peers').once((peers) => {
        if (!peers) return resolve(null);
        
        const availablePeers = Object.entries(peers)
          .filter(([id, peer]: [string, any]) => {
            return peer.status === 'available' && 
                   id !== peerId &&
                   Date.now() - peer.timestamp < 30000;
          })
          .map(([id]) => id);

        if (availablePeers.length > 0) {
          const randomPeer = availablePeers[Math.floor(Math.random() * availablePeers.length)];
          resolve(randomPeer);
        } else {
          resolve(null);
        }
      });
    });
  };

  const initiateCall = async () => {
    const pc = initializePeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    connectionTimeout.current = setTimeout(async () => {
      const randomPeerId = await findRandomPeer();
      if (randomPeerId) {
        gun.get('calls').get(randomPeerId).put({
          from: peerId,
          offer: JSON.stringify(offer)
        });
      }
    }, 10000);

    gun.get('calls').get(peerId).on((data) => {
      if (data?.answer) {
        clearTimeout(connectionTimeout.current);
        const answer = JSON.parse(data.answer);
        pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
  };

  const listenForCalls = () => {
    gun.get('calls').get(peerId).on(async (data) => {
      if (data?.offer) {
        const pc = initializePeerConnection();
        const offer = JSON.parse(data.offer);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        gun.get('calls').get(data.from).put({
          answer: JSON.stringify(answer)
        });

        gun.get('peers').get(peerId).put({
          status: 'in-call',
          timestamp: Date.now()
        });
      }
    });
  };

  useEffect(() => {
    registerAsPeer();
    listenForCalls();

    return () => {
      peerConnection.current?.close();
      clearTimeout(connectionTimeout.current);
      gun.get('peers').get(peerId).put(null);
    };
  }, []);

  return {
    initiateCall,
    remoteStream,
    peerId
  };
};