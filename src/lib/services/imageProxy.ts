/**
 * Converts an image URL to a blob URL that can be used in the PDF
 * This helps bypass CORS restrictions when loading images
 */
export const getProxiedImageUrl = async (imageUrl: string): Promise<string> => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`Attempt ${attempt + 1} to proxy image URL:`, imageUrl);

      // Fetch the image with proper headers for Firebase Storage
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*, */*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        console.error('Image fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      console.log('Image fetch successful, converting to blob...');
      const blob = await response.blob();
      console.log('Blob created:', {
        size: blob.size,
        type: blob.type || 'unknown'
      });

      if (blob.size === 0) {
        throw new Error('Retrieved blob is empty');
      }

      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);
      console.log('Blob URL created:', blobUrl);

      // Verify the blob URL works by loading it in an Image object
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load created blob URL'));
        img.src = blobUrl;
      });

      return blobUrl;
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('All attempts to proxy image failed:', {
          error,
          originalUrl: imageUrl
        });
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Failed to proxy image after all retries');
}; 