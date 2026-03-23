
/**
 * Cloudflare R2 Storage Service
 * Handles file uploads via the backend presigned URL endpoint.
 */

export const uploadFileToR2 = async (file: File): Promise<string> => {
  try {
    // 1. Get presigned URL from backend
    const response = await fetch(`/api/storage/upload-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`);
    if (!response.ok) throw new Error('Failed to get upload URL');
    
    const { uploadUrl, publicUrl } = await response.json();

    // 2. Upload file directly to R2 using the presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) throw new Error('Failed to upload file to R2');

    return publicUrl;
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw error;
  }
};
