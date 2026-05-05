import { useState, useCallback, DragEvent, useRef } from "react";
import {
  Local_Storage_Keys,
  UploadLog,
  useAuth,
  useFileUpload,
} from "@/lib/SecureLink";
import { Link } from "react-router-dom";

interface SearchResult {
  id: string;
  thumbnail: string;
  matchScore: number;
}

const loadingMessages = [
  "scanning face geometry...",
  "querying the matrix...",
  "calculating similarity scores...",
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const {
    selectedFiles,
    setSelectedFiles,
    uploadLogs,
    isUploading,
    handleUpload,
    counts,
  } = useFileUpload();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingLogs: UploadLog[] = counts
    ? [
        {
          message: `generating thumbnails... ${counts.thumbnailDone}/${counts.total}`,
          status: counts.thumbnailDone === counts.total ? "done" : "processing",
        },
        {
          message: `indexing faces... ${counts.embeddingDone}/${counts.total}`,
          status: counts.embeddingDone === counts.total ? "done" : "processing",
        },
        ...(counts.failed > 0
          ? [
              {
                message: `${counts.failed} files failed`,
                status: "error" as const,
              },
            ]
          : []),
      ]
    : [];

  const allLogs = [...uploadLogs, ...processingLogs];

  const simulateSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchResults([]);
    setHasSearched(true);

    for (let i = 0; i < loadingMessages.length; i++) {
      setSearchStep(i);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Mock results
    setSearchResults([
      {
        id: "1",
        thumbnail: "https://picsum.photos/seed/face1/200/200",
        matchScore: 98,
      },
      {
        id: "2",
        thumbnail: "https://picsum.photos/seed/face2/200/200",
        matchScore: 94,
      },
      {
        id: "3",
        thumbnail: "https://picsum.photos/seed/face3/200/200",
        matchScore: 87,
      },
      {
        id: "4",
        thumbnail: "https://picsum.photos/seed/face4/200/200",
        matchScore: 82,
      },
      {
        id: "5",
        thumbnail: "https://picsum.photos/seed/face5/200/200",
        matchScore: 76,
      },
      {
        id: "6",
        thumbnail: "https://picsum.photos/seed/face6/200/200",
        matchScore: 71,
      },
    ]);

    setIsSearching(false);
  }, []);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer!.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  return (
    <div className="min-h-screen bg-background scanlines">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="font-[var(--font-pixel)] text-primary text-sm cursor-blink hover:text-glow-primary transition-all"
            >
              {">"} SECURELINK_
            </Link>
            <button
              className="font-mono text-sm text-muted hover:text-secondary transition-colors border border-border px-3 py-1 hover:border-secondary"
              onClick={() =>
                logout(localStorage.getItem(Local_Storage_Keys.refreshToken)!)
              }
            >
              [ LOGOUT ]
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-[var(--font-pixel)] text-lg sm:text-xl text-primary cursor-blink">
              {">"} HELLO, {user?.username}_
            </h1>
          </div>

          {/* Info Section */}
          <div className="terminal-card p-6 mb-8">
            <p className="font-mono text-sm text-muted leading-relaxed">
              // Upload your event photos. Then find yourself in them using just
              a selfie.
              <br />
              // No manual tagging. No scrolling. Just faces and math.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Upload Photos Card */}
            <div className="terminal-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📷</span>
                <h2 className="font-[var(--font-pixel)] text-sm text-foreground">
                  UPLOAD_PHOTOS.exe
                </h2>
              </div>
              <p className="font-mono text-sm text-muted mb-6">
                Drop your event photos here. We&apos;ll index every face.
              </p>

              {selectedFiles.length === 0 && (
                <>
                  <div
                    className="border-2 border-dashed border-border hover:border-primary transition-colors p-8 text-center mb-4 cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <p className="font-mono text-sm text-muted">
                      {isUploading ? "PROCESSING..." : "DROP FILES HERE"}
                    </p>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full font-mono text-sm text-primary border border-primary hover:bg-primary hover:text-background disabled:opacity-50 px-4 py-2 transition-all"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setSelectedFiles(Array.from(e.target.files || []))
                      }
                    />
                    [ SELECT FILES ]
                  </button>
                </>
              )}

              {selectedFiles.length > 0 && (
                <>
                  <div className="border-2 border-dashed border-border hover:border-primary transition-colors p-8 text-center mb-4 cursor-pointer overflow-y-auto">
                    {selectedFiles.map((f) => (
                      <p className="font-mono text-sm text-muted">{`${f.name}   [x]`}</p>
                    ))}
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full font-mono text-sm text-primary border border-primary hover:bg-primary hover:text-background disabled:opacity-50 px-4 py-2 transition-all"
                  >[ CONFIRM ]</button>
                </>
              )}

              {/* Upload Logs */}
              {allLogs.length > 0 && (
                <div className="mt-4 bg-background border border-border p-4 font-mono text-xs max-h-40 overflow-y-auto">
                  {allLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-muted">{log.message}</span>
                      {log.status === "done" && (
                        <span className="text-primary">DONE ✓</span>
                      )}
                      {log.status === "processing" && (
                        <span className="text-secondary animate-pulse">
                          PROCESSING ⟳
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Find My Photos Card */}
            <div className="terminal-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔍</span>
                <h2 className="font-[var(--font-pixel)] text-sm text-foreground">
                  FIND_ME.exe
                </h2>
              </div>
              <p className="font-mono text-sm text-muted mb-6">
                Upload a selfie. We&apos;ll find every photo with your face in
                it.
              </p>

              <div
                className="border-2 border-dashed border-border hover:border-secondary transition-colors p-8 text-center mb-4 cursor-pointer"
                onClick={simulateSearch}
              >
                <p className="font-mono text-sm text-muted">
                  {isSearching ? "SCANNING..." : "DROP SELFIE HERE"}
                </p>
              </div>

              <button
                onClick={simulateSearch}
                disabled={isSearching}
                className="w-full font-mono text-sm text-background bg-secondary hover:bg-secondary/90 disabled:opacity-50 px-4 py-2 glow-secondary transition-all"
              >
                [ SCAN MY FACE ]
              </button>
            </div>
          </div>

          {/* Results Section */}
          {(isSearching || hasSearched) && (
            <div className="terminal-card p-6">
              <h2 className="font-[var(--font-pixel)] text-sm text-primary mb-6 cursor-blink">
                {">"} MATCHES_FOUND:{" "}
                {isSearching ? "..." : searchResults.length}
              </h2>

              {isSearching ? (
                <div className="text-center py-8">
                  <div className="font-mono text-sm text-muted space-y-2">
                    {loadingMessages.map((msg, i) => (
                      <p
                        key={msg}
                        className={
                          i <= searchStep ? "text-primary" : "text-muted"
                        }
                      >
                        {i <= searchStep ? "> " : "  "}
                        {msg}
                        {i === searchStep && (
                          <span className="animate-pulse">_</span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className={`relative group cursor-pointer ${
                        result.matchScore >= 90 ? "glow-primary" : ""
                      }`}
                    >
                      <img
                        src={result.thumbnail}
                        alt={`Match ${result.id}`}
                        className="w-full aspect-square object-cover border border-border group-hover:border-primary transition-colors"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-background/90 px-2 py-1">
                        <p
                          className={`font-mono text-[10px] ${
                            result.matchScore >= 90
                              ? "text-primary"
                              : result.matchScore >= 80
                                ? "text-secondary"
                                : "text-muted"
                          }`}
                        >
                          MATCH: {result.matchScore}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="font-mono text-sm text-muted">
                    NO_MATCHES_FOUND — try a clearer photo or lower your
                    standards :)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
