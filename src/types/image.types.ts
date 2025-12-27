/**
 * Unsplash image response structure
 * https://unsplash.com/documentation#get-a-random-image
 */
export interface UnsplashImage {
  id: string;
  created_at: string;
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string; // 1080px width - GOOD for display
    small: string; // 400px width - GOOD for thumbnails
    thumb: string; // 200px width
  };
  user: {
    id: string;
    username: string;
    name: string;
  };
}

/**
 * Simplified image structure for our app
 * We normalize Unsplash data to this format
 */
export interface Image {
  id: string;
  title: string;
  imageUrl: string; // Regular size for display
  thumbnailUrl: string; // Small size for grid
  author: string;
  localPath?: string; // Local file path if cached (populated by repository)
}
