import React, { useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useImages } from "@hooks/useImages";
import { ImageItem } from "@components/ImageItem";
import { SPACING, COLUMN_COUNT } from "@constants/layout.constants";
import type { Image } from "../types/image.types";

export const ImageList: React.FC = () => {
  const {
    images,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useImages();

  const renderItem = useCallback(
    ({ item }: { item: Image }) => <ImageItem image={item} />,
    []
  );

  // Smart prefetching: Load next page when user is 10 items away from end
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (!hasNextPage || isFetchingNextPage || images.length === 0) return;

      const lastVisibleIndex =
        viewableItems[viewableItems.length - 1]?.index || 0;
      const prefetchThreshold = images.length - 10;

      // Fetch next page when user reaches 10 items before end
      if (lastVisibleIndex >= prefetchThreshold) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, images.length, fetchNextPage]
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading images...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load images</Text>
        <Text style={styles.errorSubtext}>{(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={images}
        masonry
        renderItem={renderItem}
        numColumns={COLUMN_COUNT}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: SPACING,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e74c3c",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
});
