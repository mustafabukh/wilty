import { useRef, useState } from 'react';
import { Camera, Mic, MicOff, VideoOff } from 'lucide-react';

const MediaControls = ({ onMediaStream }: { onMediaStream: (stream: MediaStream) => void }) => {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleMedia = async (mediaType: 'video' | 'audio') => {
    try {
      if (mediaType === 'video') {
        if (!isVideoOn) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: isAudioOn 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          streamRef.current = stream;
          onMediaStream?.(stream);
        } else {
          streamRef.current?.getTracks()
            .filter(track => track.kind === 'video')
            .forEach(track => track.stop());
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
        setIsVideoOn(!isVideoOn);
      } else {
        if (!isAudioOn) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true,
            video: isVideoOn 
          });
          streamRef.current = stream;
          onMediaStream?.(stream);
        } else {
          streamRef.current?.getTracks()
            .filter(track => track.kind === 'audio')
            .forEach(track => track.stop());
        }
        setIsAudioOn(!isAudioOn);
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="relative mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-video bg-slate-900 rounded-lg"
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-4 bg-slate-800/80 p-2 rounded-lg">
            <button
              onClick={() => toggleMedia('video')}
              className={`p-2 rounded-full ${
                isVideoOn ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            >
              {isVideoOn ? <Camera className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
            <button
              onClick={() => toggleMedia('audio')}
              className={`p-2 rounded-full ${
                isAudioOn ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            >
              {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaControls;