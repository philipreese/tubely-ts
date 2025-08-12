import { getBearerToken, validateJWT } from "../auth";
import { respondWithJSON } from "./json";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig } from "../config";
import type { BunRequest } from "bun";
import { BadRequestError, NotFoundError, UserForbiddenError } from "./errors";
import { getDataURL } from "./assets";

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
    const imageBufferString = Buffer.from(imageData).toString("base64");
    const dataURL = getDataURL(mediaType, imageBufferString);

    const video = getVideo(cfg.db, videoId);
    if (!video) {
        throw new NotFoundError("Unable to get video");
    }

    if (video.userID != userID) {
        throw new UserForbiddenError("Unauthorized");
    }

    video.thumbnailURL = dataURL;
    updateVideo(cfg.db, video);

    return respondWithJSON(200, video);
}
