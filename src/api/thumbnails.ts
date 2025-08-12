import { getBearerToken, validateJWT } from "../auth";
import { respondWithJSON } from "./json";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig } from "../config";
import type { BunRequest } from "bun";
import { BadRequestError, NotFoundError, UserForbiddenError } from "./errors";
import { getThumbnailURL } from "./assets";

type Thumbnail = {
    data: ArrayBuffer;
    mediaType: string;
};

const videoThumbnails: Map<string, Thumbnail> = new Map();

export async function handlerGetThumbnail(cfg: ApiConfig, req: BunRequest) {
    const { videoId } = req.params as { videoId?: string };
    if (!videoId) {
        throw new BadRequestError("Invalid video ID");
    }

    const video = getVideo(cfg.db, videoId);
    if (!video) {
        throw new NotFoundError("Couldn't find video");
    }

    const thumbnail = videoThumbnails.get(videoId);
    if (!thumbnail) {
        throw new NotFoundError("Thumbnail not found");
    }

    return new Response(thumbnail.data, {
        headers: {
            "Content-Type": thumbnail.mediaType,
            "Cache-Control": "no-store",
        },
    });
}

export async function handlerUploadThumbnail(cfg: ApiConfig, req: BunRequest) {
    const { videoId } = req.params as { videoId?: string };
    if (!videoId) {
        throw new BadRequestError("Invalid video ID");
    }

    const token = getBearerToken(req.headers);
    const userID = validateJWT(token, cfg.jwtSecret);

    const formData = await req.formData();
    const file = formData.get("thumbnail");
    if (!(file instanceof File)) {
        throw new BadRequestError("Unable to parse form file");
    }

    const MAX_UPLOAD_SIZE = 10 << 20;
    if (file.size > MAX_UPLOAD_SIZE) {
        throw new BadRequestError("Thumbnail is too large");
    }

    const mediaType = file.type;
    const imageData = await file.arrayBuffer();

    const video = getVideo(cfg.db, videoId);
    if (!video) {
        throw new NotFoundError("Unable to get video");
    }

    if (video.userID != userID) {
        throw new UserForbiddenError("Unauthorized");
    }

    videoThumbnails.set(videoId, {
        data: imageData,
        mediaType,
    });

    video.thumbnailURL = getThumbnailURL(cfg, videoId);
    updateVideo(cfg.db, video);

    return respondWithJSON(200, video);
}
