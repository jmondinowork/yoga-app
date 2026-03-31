import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getPresignedUrl, uploadToR2 } from "@/lib/r2";

/**
 * Extract the first frame from a video stored on R2 and upload it as a JPEG thumbnail.
 * Returns the R2 key of the generated thumbnail, or null if extraction failed.
 */
export async function generateThumbnailFromVideo(
  videoKey: string,
  thumbnailKey: string
): Promise<string | null> {
  const tmp = path.join(os.tmpdir(), `thumb_${Date.now()}.jpg`);
  try {
    const videoUrl = await getPresignedUrl(videoKey, 3600);

    const res = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-nostdin",
        "-hide_banner",
        "-loglevel", "error",
        "-reconnect", "1",
        "-reconnect_at_eof", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-i", videoUrl,
        "-frames:v", "1",
        "-q:v", "2",
        tmp,
      ],
      { timeout: 60_000 }
    );

    if (res.status !== 0 || !fs.existsSync(tmp)) {
      console.error("[THUMBNAIL_GEN] ffmpeg failed:", res.stderr?.toString());
      return null;
    }

    const buf = fs.readFileSync(tmp);
    await uploadToR2(thumbnailKey, buf, "image/jpeg");
    return thumbnailKey;
  } catch (err) {
    console.error("[THUMBNAIL_GEN] Error:", err);
    return null;
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}
