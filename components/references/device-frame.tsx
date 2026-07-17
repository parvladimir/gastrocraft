import Image from "next/image";
import type { ReactNode } from "react";

type DeviceFrameProps = {
  accentClassName: string;
  alt: string;
  desktopImage: string;
  hasMobileImage: boolean;
  mobileImage: string;
};

export function DeviceFrame({
  accentClassName,
  alt,
  desktopImage,
  hasMobileImage,
  mobileImage
}: DeviceFrameProps) {
  return (
    <div className="relative mx-auto max-w-xl overflow-visible pb-12 sm:pb-16">
      <BrowserFrame accentClassName={accentClassName}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-b bg-midnight">
          <Image
            src={desktopImage}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 48vw, (min-width: 640px) 82vw, 100vw"
            className="object-cover object-top"
          />
        </div>
      </BrowserFrame>

      {hasMobileImage ? (
        <div className="absolute bottom-0 right-3 w-[32%] min-w-20 max-w-32 rounded-[1.25rem] border border-white/14 bg-midnight p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.35)] sm:w-[25%] sm:min-w-24 lg:right-4">
          <div className="relative aspect-[43/90] overflow-hidden rounded-[1rem] bg-midnight">
            <Image
              src={mobileImage}
              alt=""
              fill
              sizes="150px"
              className="object-cover object-top"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BrowserFrame({
  accentClassName,
  children
}: {
  accentClassName: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/12 bg-[#111c31] p-3 shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-3">
        <span className={`h-2.5 w-2.5 rounded-full ${accentClassName}`} />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-gray" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
        <span className="ml-3 h-6 flex-1 rounded border border-white/10 bg-black/10" />
      </div>
      {children}
    </div>
  );
}
