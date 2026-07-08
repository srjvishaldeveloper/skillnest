function buildYouTubeEmbed(videoId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: videoId,
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
    playsinline: "1",
    controls: "1",
    fs: "1",
    color: "white",
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function getEmbedUrl(url?: string) {
  if (!url) return null;

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  if (youtubeMatch) return buildYouTubeEmbed(youtubeMatch[1]);

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const params = new URLSearchParams({
      autoplay: "1",
      muted: "1",
      loop: "1",
      background: "1",
      playsinline: "1",
      title: "0",
      byline: "0",
      portrait: "0",
    });
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?${params.toString()}`;
  }

  return null;
}

export function isDirectVideo(url?: string) {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

/**
 * Return the URL only if it is a safe http(s) link, else undefined.
 * Blocks javascript:/data:/vbscript: schemes that would be a stored-XSS
 * sink when placed in an href/src. Defense-in-depth alongside input validation.
 */
export function safeHref(url?: string | null): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url.trim()) ? url : undefined;
}

export function getVideoSource(url: string): { type: "iframe" | "video"; src: string } {
  const embedUrl = getEmbedUrl(url);
  if (embedUrl) {
    return { type: "iframe", src: embedUrl };
  }

  return { type: "video", src: url };
}
