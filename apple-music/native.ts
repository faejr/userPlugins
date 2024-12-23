import { IpcMainInvokeEvent } from "electron";

let cachedRemoteData: { spotifyUrl: string, data: any; } | { spotifyUrl: string, failures: number; } | null = null;

export interface TrackData {
    appleMusicLink: string;
    songLink: string;
}

export async function fetchRemoteData(_: IpcMainInvokeEvent, spotifyUrl: string): Promise<TrackData | null> {
    if (spotifyUrl === cachedRemoteData?.spotifyUrl) {
        if ("data" in cachedRemoteData) return cachedRemoteData.data;
        if ("failures" in cachedRemoteData && cachedRemoteData.failures >= 5) return null;
    }

    const dataUrl = `https://api.song.link/v1-alpha.1/links?url=${spotifyUrl}`;

    try {
        const songData = await fetch(dataUrl)
            .then(r => r.json())
            .then(data => data);

        cachedRemoteData = {
            spotifyUrl,
            data: {
                appleMusicLink: songData.linksByPlatform.appleMusic.url,
                songLink: songData.pageUrl,
            }
        };

        return cachedRemoteData.data;
    } catch (e) {
        console.error("[SpotifyToAppleMusic] Failed to fetch remote data:", e);
        cachedRemoteData = {
            spotifyUrl,
            failures: (spotifyUrl === cachedRemoteData?.spotifyUrl && "failures" in cachedRemoteData ? cachedRemoteData.failures : 0) + 1
        };
        return null;
    }
}
