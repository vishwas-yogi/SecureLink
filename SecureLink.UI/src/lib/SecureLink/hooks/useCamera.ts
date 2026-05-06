import { useState, useRef, useCallback, useEffect } from "react";

export const useCamera = () => {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      // 1. Store the stream and flip the active switch IMMEDIATELY
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      setError("CAMERA_ACCESS_DENIED");
      setIsActive(false);
    }
  }, []);

  // 2. Reactively attach the stream whenever the video element mounts
  useEffect(() => {
    if (isActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isActive, stream]);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsActive(false);
  }, [stream]);

  const capture = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) return resolve(null);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `scan_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          resolve(file);
        } else {
          resolve(null);
        }
      }, "image/jpeg");
    });
  }, []);

  return { isActive, error, videoRef, canvasRef, start, stop, capture };
};
