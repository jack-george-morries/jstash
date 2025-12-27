import { unsplashAPI } from "../api/unsplash.api";
import { imageCacheService } from "@services/imageCache.service";
import type { Image } from "../types/image.types";
import { IMAGES_PER_PAGE } from "@constants/layout.constants";

class ImageRepository {
  async initialize(): Promise<void> {
    await imageCacheService.initialize();
  }

  async fetchImages(count: number = IMAGES_PER_PAGE): Promise<Image[]> {
    // 1. Fetch from Unsplash API
    const images = await unsplashAPI.fetchRandomImages(count);

    // 2. Download all images in background (fire and forget)
    this.downloadImagesInBackground(images);

    // 3. Enrich images with cached paths
    const enrichedImages = await this.enrichWithLocalPaths(images);

    return enrichedImages;
  }

  private downloadImagesInBackground(images: Image[]): void {
    // Fire and forget - don't await
    images.forEach((image) => {
      imageCacheService
        .getImage(image.thumbnailUrl)
        .catch((err) =>
          console.error(`Background download failed for ${image.id}:`, err)
        );
    });
  }

  private async enrichWithLocalPaths(images: Image[]): Promise<Image[]> {
    // Get cached paths for all images (parallel)
    return Promise.all(
      images.map(async (image) => {
        try {
          const result = await imageCacheService.getImage(image.thumbnailUrl);
          return {
            ...image,
            localPath: result.localPath,
          };
        } catch (err) {
          // If cache fails, return image without localPath
          console.error(`Failed to get cached path for ${image.id}:`, err);
          return image;
        }
      })
    );
  }

  async getCacheStats() {
    return imageCacheService.getCacheStats();
  }

  async clearCache(): Promise<void> {
    await imageCacheService.clearCache();
  }
}

export const imageRepository = new ImageRepository();
