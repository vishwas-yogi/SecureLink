import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SearchMatch } from "../types";
import { findMatches } from "../api";

export const useFileSearch = () => {
  const [selfie, setSelfie] = useState<File | null>(null);
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);

  const {
    mutate: search,
    isPending,
    isError,
    reset,
  } = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("selfie", file);
      return findMatches(formData);
    },
    onSuccess: (data) => {
      setSearchMatches(data.matches);
    },
    onError: () => {
      setSearchMatches([]);
    },
  });

  const handleSearch = useCallback(() => {
    if (!selfie) return;
    reset();
    search(selfie);
    setSelfie(null);
  }, [selfie, reset, search]);

  return {
    selfie,
    setSelfie,
    searchMatches,
    isSearching: isPending,
    isError,
    handleSearch,
  };
};
