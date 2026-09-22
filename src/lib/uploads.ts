import { api } from "@/http/api";

/**
 * Media uploads go through the API (POST /uploads/images | /uploads/videos),
 * which stores them in Google Cloud Storage and returns public URLs.
 * The browser never talks to the storage provider directly.
 */

const NOT_CONFIGURED_MESSAGE = "Media uploads are not configured yet";

function uploadErrorMessage(err: unknown, kind: "image" | "video"): string {
  const anyErr = err as {
    response?: { status?: number; data?: { message?: string } };
    message?: string;
  };
  const status = anyErr?.response?.status;
  if (status === 503) return NOT_CONFIGURED_MESSAGE;
  if (status === 413) {
    return kind === "video"
      ? "Video is too large (max 50 MB)"
      : "Image is too large (max 5 MB)";
  }
  return (
    anyErr?.response?.data?.message ??
    anyErr?.message ??
    `${kind === "video" ? "Video" : "Image"} upload failed`
  );
}

async function postUpload(
  path: string,
  fieldName: string,
  files: File[],
  kind: "image" | "video",
): Promise<string[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append(fieldName, file));

  try {
    // Let the browser set the multipart boundary.
    const response = await api.post<{ urls: string[] }>(path, formData, {
      headers: { "Content-Type": undefined },
    });
    const urls = response.data?.urls;
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error("Invalid response: missing urls");
    }
    return urls;
  } catch (err) {
    throw new Error(uploadErrorMessage(err, kind));
  }
}

export async function uploadImages(files: File[]): Promise<string[]> {
  return postUpload("uploads/images", "images", files, "image");
}

export async function uploadImage(file: File): Promise<string> {
  const [url] = await uploadImages([file]);
  return url;
}

export async function uploadVideos(files: File[]): Promise<string[]> {
  return postUpload("uploads/videos", "videos", files, "video");
}

export async function uploadVideo(file: File): Promise<string> {
  const [url] = await uploadVideos([file]);
  return url;
}

/** Upload an image or video file and return its public URL. */
export async function uploadMedia(file: File): Promise<string> {
  if (file.type.startsWith("video/")) {
    return uploadVideo(file);
  }
  return uploadImage(file);
}
