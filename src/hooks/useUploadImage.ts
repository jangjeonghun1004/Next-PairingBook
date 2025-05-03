// @/hooks/useUploadImage.ts
export function useUploadImage(bucket: string) {
    /**
     * 파일 하나를 Supabase에 업로드하고 public URL을 반환
     */
    async function uploadImage(file: File): Promise<string> {
      const formData = new FormData();
      formData.append("file", file);
  
      const res = await fetch(`/api/upload-image/${bucket}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Upload failed");
      }
      const { url } = await res.json();
      return url;
    }
  
    return { uploadImage };
  }
  