import { NextResponse } from "next/server";
import { InputError, errorResponse } from "@/lib/context";
import { hasVisionKey, solveDoubtImage } from "@/lib/vision";
import { isLanguage } from "@/lib/types";

export const maxDuration = 60;

/** ~4.5 MB of binary once base64-decoded; the client downscales well below this. */
const MAX_BASE64_CHARS = 6_000_000;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export async function POST(request: Request) {
  try {
    if (!hasVisionKey()) {
      return NextResponse.json(
        {
          error:
            "Camera solving isn't configured yet. Add GEMINI_API_KEY to the server environment and restart.",
          code: "NO_VISION_KEY",
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);

    const rawImage = String(body?.image ?? "");
    if (!rawImage) throw new InputError("Add a photo of the question first.");

    // Accept either a data URL or bare base64.
    const base64 = rawImage.includes(",")
      ? rawImage.slice(rawImage.indexOf(",") + 1)
      : rawImage;

    if (base64.length < 100) {
      throw new InputError("That image looks empty. Try another photo.");
    }
    if (base64.length > MAX_BASE64_CHARS) {
      throw new InputError(
        "That image is too large. Take the photo again, a little further from the page."
      );
    }

    const declared = String(body?.mimeType ?? "").toLowerCase();
    const mimeType = ALLOWED_TYPES.includes(declared)
      ? declared
      : "image/jpeg";

    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (note.length > 400) {
      throw new InputError("Keep your note under 400 characters.");
    }

    const language = isLanguage(body?.language) ? body.language : "English";
    const standard =
      typeof body?.standard === "string" ? body.standard.trim() : undefined;
    const subject =
      typeof body?.subject === "string" ? body.subject.trim() : undefined;

    const solution = await solveDoubtImage({
      imageBase64: base64,
      mimeType,
      note,
      standard,
      subject,
      language,
    });

    return NextResponse.json({ solution });
  } catch (err) {
    console.error("[api/doubt]", err);
    const { message, status } = errorResponse(
      err,
      "Could not read that photo. Try better light, hold steady, and capture just the question."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
