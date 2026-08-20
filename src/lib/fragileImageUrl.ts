/** Social CDNs expire or block hotlinking — photos vanish after a while. */
const FRAGILE_HOST =
  /(^|\.)(fbcdn\.net|facebook\.com|cdninstagram\.com|instagram\.com|telegram\.org|t\.me|whatsapp\.net)$/i;

export const isFragileImageUrl = (url: string): boolean => {
  try {
    return FRAGILE_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

export const isHostedCarImageUrl = (url: string): boolean =>
  url.includes("/storage/v1/object/public/car-images/");
