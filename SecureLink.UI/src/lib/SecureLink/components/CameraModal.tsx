import { createPortal } from "react-dom";

export const CameraModal = ({
  videoRef,
  canvasRef,
  onCapture,
  onClose,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCapture: () => void;
  onClose: () => void;
}) => {
  const modalContent = (
    <div className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md overflow-hidden">
      <div className="absolute inset-0 pointer-events-none scanlines opacity-20" />
      <div className="terminal-card w-full max-w-2xl p-4 glow-secondary mx-4 relative z-10">
        <div className="flex justify-between items-center mb-4 border-b border-secondary/30 pb-2">
          <h2 className="font-[var(--font-pixel)] text-secondary text-sm">
            {">"} BIOMETRIC_SCAN_INITIATED
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-error font-mono text-xs"
          >
            [ EXIT_X ]
          </button>
        </div>

        <div className="relative aspect-video bg-black border border-secondary overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }} // Mirror for natural feel
          />

          <canvas ref={canvasRef} className="hidden" />

          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent border-t-secondary/20 border-b-secondary/20" />
          <div className="absolute top-4 left-4 bg-secondary text-background px-2 py-1 font-mono text-[10px] animate-pulse">
            REC ● LIVE_FEED
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={onCapture}
            className="font-mono text-sm text-background bg-secondary hover:bg-secondary/90 px-6 py-3 glow-secondary transition-all"
          >
            [ CAPTURE_BIOMETRICS ]
          </button>
          <button
            onClick={onClose}
            className="font-mono text-sm text-error border border-error hover:bg-error/10 px-6 py-3 transition-all"
          >
            [ ABORT_SCAN ]
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
