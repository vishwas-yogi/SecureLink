import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getBatchStatus, uploadFiles } from "../api";

export type UploadLog = {
  message: string;
  status: "done" | "processing" | "error";
};

export const useFileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([]);

  const addLog = (message: string, status: UploadLog["status"]) => {
    setUploadLogs((prev) => [...prev, { message, status }]);
  };

  const updateLastLog = (status: UploadLog["status"]) => {
    setUploadLogs((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], status };
      return updated;
    });
  };

  const { data: statuses } = useQuery({
    queryKey: ["fileStatuses", uploadedFileIds],
    queryFn: () => getBatchStatus({ fileIds: uploadedFileIds }),
    enabled: uploadedFileIds.length > 0, // Query runs only when there are some uploaded fileIds
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      const allDone = data.statuses.every(
        (s) =>
          s.processingStatus === "EmbeddingCompleted" ||
          s.processingStatus === "Failed",
      );
      return allDone ? false : 3000;
    },
  });

  const counts = statuses
    ? {
        total: uploadedFileIds.length,
        thumbnailDone: statuses.statuses.filter((s) =>
          [
            "ThumbnailCompleted",
            "EmbeddingQueued",
            "EmbeddingCompleted",
          ].includes(s.processingStatus),
        ).length,
        embeddingDone: statuses.statuses.filter(
          (s) => s.processingStatus === "EmbeddingCompleted",
        ).length,
        failed: statuses.statuses.filter((s) => s.processingStatus === "Failed")
          .length,
      }
    : null;

  const { mutate: upload, isPending } = useMutation({
    mutationFn: (formData: FormData) => uploadFiles(formData),
    onSuccess: (response) => {
      const successfulIds = response.filter((r) => !r.isError).map((r) => r.id);

      setUploadedFileIds(successfulIds);
      updateLastLog("done");
    },
    onError: () => {
      updateLastLog("error");
      addLog("upload failed! Please try again", "error");
    },
  });

  const handleUpload = useCallback(() => {
    if (selectedFiles.length === 0) return;
    setUploadLogs([]);
    const formData = new FormData();
    selectedFiles.forEach((file, i) => formData.append(`file${i + 1}`, file));
    addLog(`uploading ${selectedFiles.length} files...`, "processing");
    upload(formData);
    setSelectedFiles([]);
  }, [selectedFiles, upload]);

  return {
    selectedFiles,
    setSelectedFiles,
    uploadLogs,
    isUploading: isPending,
    handleUpload,
    counts,
  };
};
