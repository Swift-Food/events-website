// services/image.service.ts
import apiClient from '@/lib/auth/apiClient';

class ImageService {
  /**
   * Upload an image file
   * @param file - The image file to upload
   * @returns The URL of the uploaded image
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('upload', file); // Key is 'upload' not 'image'

    const response = await apiClient.post(
      '/image-upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // The response is the URL string directly
    return response.data;
  }

  /**
   * Upload an image from a blob URL (after cropping)
   * @param blobUrl - The blob URL of the cropped image
   * @param fileName - The original file name
   * @returns The URL of the uploaded image
   */
  async uploadImageFromBlob(blobUrl: string, fileName: string = 'image.jpg'): Promise<string> {
    // Fetch the blob from the URL
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    // Create a File object from the blob
    const file = new File([blob], fileName, { type: 'image/jpeg' });

    // Upload the file
    return this.uploadImage(file);
  }
}

export const imageService = new ImageService();
export default imageService;
