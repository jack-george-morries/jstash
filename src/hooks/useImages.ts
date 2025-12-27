import { useInfiniteQuery } from "@tanstack/react-query";
import { imageRepository } from "@repositories/image.repository";
import { IMAGES_PER_PAGE } from "@constants/layout.constants";
import type { Image } from "../types/image.types";

export const useImages = () => {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["images"],
    queryFn: () => imageRepository.fetchImages(IMAGES_PER_PAGE),
    getNextPageParam: (_lastPage, allPages) => allPages.length + 1,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const images: Image[] = data?.pages.flat() || [];

  return {
    images,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
