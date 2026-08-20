import type { ImgHTMLAttributes } from "react";
import { NO_PHOTO, onImgError } from "@/lib/imageFallback";

type SafeImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
};

/** Car photos: skip referrer so pasted Facebook/Telegram URLs still load. */
const SafeImg = ({ src, alt = "", onError, ...rest }: SafeImgProps) => (
  <img
    {...rest}
    src={src?.trim() || NO_PHOTO}
    alt={alt}
    referrerPolicy="no-referrer"
    onError={(e) => {
      onImgError(e);
      onError?.(e);
    }}
  />
);

export default SafeImg;
