import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useDimensions } from "@hooks/useDimensions";
import { getItemWidth, SPACING } from "@constants/layout.constants";
import type { Image } from "../types/image.types";

interface ImageItemProps {
  image: Image;
}

export const ImageItem: React.FC<ImageItemProps> = ({ image }) => {
  const { width } = useDimensions();
  const [aspectRatio, setAspectRatio] = useState(1);

  const itemWidth = getItemWidth(width);

  // Use localPath if available (cached), otherwise use network URL
  const imageSource = image.localPath
    ? { uri: `file://${image.localPath}` }
    : { uri: image.thumbnailUrl };

  return (
    <View style={[styles.container, { width: itemWidth }]}>
      <ExpoImage
        source={imageSource}
        style={[styles.image, { aspectRatio }]}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        onLoad={(event) => {
          const { width, height } = event.source;
          setAspectRatio(width / height);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING,
  },
  image: {
    width: "100%",
    borderRadius: 8,
  },
});
