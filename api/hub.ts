import { Camera, DetectionEvent, Recording } from "@/types";
import { Platform } from "react-native";

const DEFAULT_HUB_URL = "http://localhost:8080";
const HUB_URL = process.env.EXPO_PUBLIC_HUB_URL ?? DEFAULT_HUB_URL;
const API_BASE = process.env.EXPO_PUBLIC_HUB_API_BASE ?? "/api";

const buildUrl = (path: string) => {
  if (path.startsWith("http")) {
    return path;
  }
  return `${HUB_URL}${path}`;
};

const buildApiUrl = (path: string) => buildUrl(`${API_BASE}${path}`);

const toQueryString = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(
    ([, value]) => value && value.length > 0,
  );
  if (entries.length === 0) {
    return "";
  }
  const query = entries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value ?? "")}`,
    )
    .join("&");
  return `?${query}`;
};

export type EnrollmentPhotoPayload = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

export const getRecordings = async (cameraId?: string, date?: string) => {
  const query = toQueryString({ cameraId, date });
  const response = await fetch(buildApiUrl(`/videos${query}`));
  if (!response.ok) {
    throw new Error(`Failed to load recordings: ${response.status}`);
  }
  return (await response.json()) as Recording[];
};

export const getCameras = async () => {
  const response = await fetch(buildApiUrl("/cameras"));
  if (!response.ok) {
    throw new Error(`Failed to load cameras: ${response.status}`);
  }
  return (await response.json()) as Camera[];
};

export const getEvents = async (params?: {
  since?: string;
  cameraId?: string;
  profileId?: string;
}) => {
  const query = toQueryString({
    since: params?.since,
    cameraId: params?.cameraId,
    profileId: params?.profileId,
  });
  const response = await fetch(buildApiUrl(`/events${query}`));
  if (!response.ok) {
    throw new Error(`Failed to load events: ${response.status}`);
  }
  return (await response.json()) as DetectionEvent[];
};

export const startRecording = async (cameraId: string) => {
  const response = await fetch(
    buildApiUrl(`/cameras/${cameraId}/recordings/start`),
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to start recording: ${response.status}`);
  }
  return response.json();
};

export const stopRecording = async (cameraId: string) => {
  const response = await fetch(
    buildApiUrl(`/cameras/${cameraId}/recordings/stop`),
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to stop recording: ${response.status}`);
  }
  return response.json();
};

export const uploadEnrollmentPhotos = async (
  profileId: string,
  photos: EnrollmentPhotoPayload[],
) => {
  const formData = new FormData();
  photos.forEach((photo, index) => {
    const extension = photo.fileName?.split(".").pop() || "jpg";
    const fileName =
      photo.fileName ?? `enroll-${profileId}-${index}.${extension}`;
    const mimeType = photo.mimeType ?? "image/jpeg";

    formData.append("photos", {
      uri: photo.uri,
      name: fileName,
      type: mimeType,
    } as any);
  });

  formData.append("platform", Platform.OS);

  const response = await fetch(
    buildApiUrl(`/profiles/${profileId}/enrollment`),
    {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to upload photos: ${response.status}`);
  }

  return response.json();
};
