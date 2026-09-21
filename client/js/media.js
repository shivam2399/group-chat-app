/**
 * Media attachment handling, validation, and direct S3 uploads
 */

import { formatFileSize, getApiBaseUrl } from "./utils.js";

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
];

export function validateFile(file) {
  if (!file) {
    return { valid: false, message: "Please select a file" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, message: "File size cannot exceed 25 MB" };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, message: "This file type is not supported" };
  }

  return { valid: true };
}

export function getMessageType(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

export function renderAttachmentPreview(file, previewContainer, onRemove) {
  previewContainer.innerHTML = "";
  previewContainer.hidden = false;

  const previewContent = document.createElement("div");
  previewContent.classList.add("attachment-preview-content");

  if (file.type.startsWith("image/")) {
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = file.name;
    image.classList.add("attachment-preview-image");
    previewContent.appendChild(image);
  } else {
    const fileIcon = document.createElement("div");
    fileIcon.classList.add("attachment-preview-icon");
    fileIcon.textContent = "📄";
    previewContent.appendChild(fileIcon);
  }

  const fileInfo = document.createElement("div");
  fileInfo.classList.add("attachment-preview-info");

  const fileName = document.createElement("div");
  fileName.classList.add("attachment-preview-name");
  fileName.textContent = file.name;

  const fileSize = document.createElement("div");
  fileSize.classList.add("attachment-preview-size");
  fileSize.textContent = formatFileSize(file.size);

  fileInfo.appendChild(fileName);
  fileInfo.appendChild(fileSize);
  previewContent.appendChild(fileInfo);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "×";
  removeButton.classList.add("attachment-preview-remove");
  removeButton.addEventListener("click", () => {
    previewContainer.innerHTML = "";
    previewContainer.hidden = true;
    if (typeof onRemove === "function") {
      onRemove();
    }
  });

  previewContent.appendChild(removeButton);
  previewContainer.appendChild(previewContent);
}

/**
 * Upload file directly to S3 via pre-signed URL (zero server RAM overhead)
 * with graceful fallback to multipart server upload.
 */
export async function uploadMediaFile(file, token) {
  const baseUrl = getApiBaseUrl();

  try {
    // 1. Request presigned upload URL
    const presignResponse = await fetch(`${baseUrl}/media/presign-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    });

    const presignResult = await presignResponse.json();

    if (presignResponse.ok && presignResult.data?.uploadUrl) {
      const { uploadUrl, mediaKey } = presignResult.data;

      // 2. Direct S3 binary upload
      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!s3Response.ok) {
        throw new Error(`Direct S3 upload failed: HTTP ${s3Response.status}`);
      }

      return {
        mediaKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };
    }

    // 3. Fallback to multipart buffer upload
    const formData = new FormData();
    formData.append("file", file);

    const fallbackResponse = await fetch(`${baseUrl}/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const fallbackResult = await fallbackResponse.json();

    if (!fallbackResponse.ok) {
      throw new Error(fallbackResult.message || "Failed to upload file");
    }

    return fallbackResult.data;
  } catch (error) {
    console.error("Media upload error:", error);
    throw error;
  }
}
