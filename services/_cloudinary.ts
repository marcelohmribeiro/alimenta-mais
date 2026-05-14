import { settings } from "@/settings";
import {
  CloudinaryImageUploadResult,
  CloudinaryUploadApiResponse,
  CloudinaryUploadOptions,
  DonationPhotoInput,
  ParsedCloudinaryResponse,
} from "@/types";
import { Platform } from "react-native";

export class CloudinaryServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudinaryServiceError";
  }
}

const getCloudinaryConfig = () => {
  if (!settings.hasCloudinarySettings) {
    throw new CloudinaryServiceError(
      "Cloudinary não está configurado. Preencha EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME e EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  return {
    cloudName: settings.CLOUDINARY_CLOUD_NAME,
    uploadPreset: settings.CLOUDINARY_UPLOAD_PRESET,
  };
};

const parseResponse = async (
  response: Response,
): Promise<ParsedCloudinaryResponse> => {
  const rawText = await response.text();

  try {
    return {
      payload: JSON.parse(rawText) as CloudinaryUploadApiResponse,
      rawText,
    };
  } catch {
    return {
      payload: null,
      rawText,
    };
  }
};

const getResponseErrorMessage = (
  payload: CloudinaryUploadApiResponse | null,
  fallbackMessage: string,
) => {
  return payload?.error?.message?.trim() || fallbackMessage;
};

const buildUploadUrl = (cloudName: string) =>
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

const buildDeleteByTokenUrl = (cloudName: string) =>
  `https://api.cloudinary.com/v1_1/${cloudName}/delete_by_token`;

const uriToBlob = async (uri: string): Promise<Blob> => {
  try {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error(`Falha ao ler arquivo local: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Erro ao converter imagem em blob:", error);
    throw new CloudinaryServiceError(
      "Não foi possível preparar uma das fotos para envio.",
    );
  }
};

const getNormalizedMimeType = (asset: DonationPhotoInput) =>
  asset.mimeType?.trim() || "image/jpeg";

const getNormalizedFileName = (asset: DonationPhotoInput) =>
  asset.fileName?.trim() || "donation-photo.jpg";

const getUploadFilePart = async (asset: DonationPhotoInput) => {
  const mimeType = getNormalizedMimeType(asset);
  const fileName = getNormalizedFileName(asset);

  if (Platform.OS === "web") {
    if (asset.file) {
      return asset.file;
    }

    const blob = await uriToBlob(asset.uri);
    return blob;
  }

  return {
    uri: asset.uri,
    type: mimeType,
    name: fileName,
  } as any;
};

const appendUploadFile = async (
  formData: FormData,
  asset: DonationPhotoInput,
) => {
  const uploadFile = await getUploadFilePart(asset);

  if (Platform.OS === "web" && !asset.file) {
    formData.append("file", uploadFile, getNormalizedFileName(asset));
    return;
  }

  formData.append("file", uploadFile);
};

const rollbackUploads = async (uploads: CloudinaryImageUploadResult[]) => {
  await Promise.allSettled(
    uploads.map((upload) =>
      upload.deleteToken
        ? deleteByToken(upload.deleteToken)
        : Promise.resolve(),
    ),
  );
};

export const uploadImage = async (
  asset: DonationPhotoInput,
  options: CloudinaryUploadOptions = {},
): Promise<CloudinaryImageUploadResult> => {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const formData = new FormData();

  await appendUploadFile(formData, asset);
  formData.append("upload_preset", uploadPreset);

  if (options.folder) {
    formData.append("folder", options.folder);
  }

  const response = await fetch(buildUploadUrl(cloudName), {
    method: "POST",
    body: formData,
  });
  const { payload, rawText } = await parseResponse(response);

  if (
    !response.ok ||
    !payload?.asset_id ||
    !payload.public_id ||
    !payload.secure_url
  ) {
    console.error("Erro Cloudinary upload:", {
      status: response.status,
      assetUri: asset.uri,
      mimeType: asset.mimeType ?? null,
      fileName: asset.fileName ?? null,
      payload,
      rawText,
    });
    throw new CloudinaryServiceError(
      getResponseErrorMessage(
        payload,
        "Não foi possível enviar uma das fotos para o Cloudinary.",
      ),
    );
  }

  return {
    assetId: payload.asset_id,
    publicId: payload.public_id,
    secureUrl: payload.secure_url,
    deleteToken: payload.delete_token ?? null,
  };
};

export const uploadImages = async (
  assets: DonationPhotoInput[],
  options: CloudinaryUploadOptions = {},
): Promise<CloudinaryImageUploadResult[]> => {
  const uploads: CloudinaryImageUploadResult[] = [];

  try {
    for (const asset of assets) {
      uploads.push(await uploadImage(asset, options));
    }

    return uploads;
  } catch (error) {
    await rollbackUploads(uploads);

    if (error instanceof CloudinaryServiceError) {
      throw error;
    }

    console.error("Erro ao enviar fotos para o Cloudinary:", error);
    throw new CloudinaryServiceError(
      "Não foi possível enviar as fotos da doação.",
    );
  }
};

export const deleteByToken = async (token: string): Promise<void> => {
  const { cloudName } = getCloudinaryConfig();
  const formData = new FormData();

  formData.append("token", token);

  const response = await fetch(buildDeleteByTokenUrl(cloudName), {
    method: "POST",
    body: formData,
  });
  const { payload, rawText } = await parseResponse(response);

  if (!response.ok || payload?.result !== "ok") {
    console.error("Erro Cloudinary delete_by_token:", {
      status: response.status,
      payload,
      rawText,
    });
    throw new CloudinaryServiceError(
      getResponseErrorMessage(
        payload,
        "Não foi possível remover um arquivo enviado ao Cloudinary.",
      ),
    );
  }
};

