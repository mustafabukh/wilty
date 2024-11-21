import { useState } from 'react';
import MediaControls from './components/Media';
import { useWebRTCConnection } from './components/WebRTCHandler';

const App = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const { initiateCall, remoteStream, peerId } = useWebRTCConnection(localStream);

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">P2P Video Chat</h1>
        
        {/* Local Stream Controls */}
        <MediaControls onMediaStream={setLocalStream} />

        {/* Call Controls */}
        {localStream && (
          <div className="flex justify-center mt-4">
            <button 
              onClick={initiateCall}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Start Call
            </button>
          </div>
        )}

        {/* Remote Stream */}
        {remoteStream && (
          <div className="mt-6">
            <h2 className="text-white mb-2">Remote Stream</h2>
            <video 
              autoPlay 
              playsInline
              ref={video => {
                if (video) video.srcObject = remoteStream;
              }}
              className="w-full aspect-video bg-slate-800 rounded-lg"
            />
          </div>
        )}

        {/* Peer ID Display */}
        <div className="mt-4 text-slate-400 text-sm text-center">
          Your ID: {peerId}
        </div>
      </div>
    </div>
  );
};

export default App;