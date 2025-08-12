import { existsSync, mkdirSync } from "fs";

import type { ApiConfig } from "../config";
import path from "path";

export function ensureAssetsDir(cfg: ApiConfig) {
    if (!existsSync(cfg.assetsRoot)) {
        mkdirSync(cfg.assetsRoot, { recursive: true });
    }
}

/*
First implementation for storing thumbnails, storing thumbnail URL in the 
database and using a GET endpoint to pull it out.

export function getThumbnailURL(cfg: ApiConfig, videoId: string) {
    return `http://localhost:${cfg.port}/api/thumbnails/${videoId}`;
}
*/

/*
Second implementation for storing thumbnails, storing thumbnail image in the
database as a base64 encoded string in the thumbnail URL field. 

export function getDataURL(mediaType: string, data: string) {
    return `data:${mediaType};base64,${data}`;
}
*/

export function getAssetDiskPath(cfg: ApiConfig, assetPath: string) {
    return path.join(cfg.assetsRoot, assetPath);
}

export function getThumbnailURL(cfg: ApiConfig, assetPath: string) {
    return `http://localhost:${cfg.port}/assets/${assetPath}`;
}

export function getExtFromMediaType(mediaType: string) {
    return `.${mediaType.substring(mediaType.indexOf("/") + 1)}`;
}
