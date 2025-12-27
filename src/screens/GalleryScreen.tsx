import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { imageRepository } from "@repositories/image.repository";
import { ImageList } from "@components/ImageList";

export const GalleryScreen: React.FC = () => {
  useEffect(() => {
    imageRepository.initialize();
  }, []);

  return (
    <View style={styles.container}>
      <ImageList />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
