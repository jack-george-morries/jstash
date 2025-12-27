import axios from "axios";
import { UnsplashImage, Image } from "../types";

const UNSPLASH_API_URL = "https://api.unsplash.com";
const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || "";

class UnsplashAPI {
  private axiosInstance = axios.create({
    baseURL: UNSPLASH_API_URL,
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
    },
  });

  async fetchRandomImages(count: number = 30): Promise<Image[]> {
    const response = await this.axiosInstance.get<UnsplashImage[]>(
      "/photos/random",
      {
        params: {
          count,
          orientation: "portrait",
        },
      }
    );

    return response.data.map(this.normalizeImage);
  }

  private normalizeImage(UnsplashImage: UnsplashImage): Image {
    return {
      id: UnsplashImage.id,
      title:
        UnsplashImage.alt_description ||
        UnsplashImage.description ||
        "Untitled",
      imageUrl: UnsplashImage.urls.regular,
      thumbnailUrl: UnsplashImage.urls.small,
      author: UnsplashImage.user.name,
    };
  }
}

export const unsplashAPI = new UnsplashAPI();
