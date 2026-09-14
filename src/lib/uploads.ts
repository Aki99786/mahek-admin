import { api } from "@/http/api";

/**
 * Image uploads go through the API (POST /uploads/images), which stores them in
 * Google Cloud Storage and returns public URLs. The browser never talks to the
 * storage provider directly.
 */

const NOT_CONFIGURED_MESSAGE = "Image uploads are not configured yet";

function uploadErrorMessage(err: unknown): string {
  const anyErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
  const status = anyErr?.response?.status;
  if (status === 503) return NOT_CONFIGURED_MESSAGE;
  if (status === 413) return "Image is too large (max 5 MB)";
  return anyErr?.response?.data?.message ?? anyErr?.message ?? "Image upload failed";
}

export async function uploadImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  try {
    // Let the browser set the multipart boundary.
    const response = await api.post<{ urls: string[] }>("uploads/images", formData, {
      headers: { "Content-Type": undefined },
    });
    const urls = response.data?.urls;
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error("Invalid response: missing urls");
    }
    return urls;
  } catch (err) {
    throw new Error(uploadErrorMessage(err));
  }
}

export async function uploadImage(file: File): Promise<string> {
  const [url] = await uploadImages([file]);
  return url;
}
