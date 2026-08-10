import { Facebook, MessageCircle } from "lucide-react";
import { useContact } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const SocialLinks = () => {
  const { data: contact } = useContact();
  const { t } = useLanguage();
  const telegramHandle = (contact?.telegram || "@Carplus777").replace(/^@/, "");

  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: contact?.facebook || "https://facebook.com/CarPlus",
      className: "hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
    },
    {
      name: "Telegram",
      icon: MessageCircle,
      url: `https://t.me/${telegramHandle}`,
      className: "hover:border-[#0088cc]/40 hover:bg-[#0088cc]/10 hover:text-[#0088cc]",
    },
    {
      name: "TikTok",
      icon: TikTokIcon,
      url: contact?.tiktok || "https://tiktok.com/@carplus",
      className: "hover:border-foreground/30 hover:bg-foreground hover:text-background",
    },
  ];

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{t("contact.follow")}</h3>
      <div className="flex flex-wrap gap-2.5">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors",
              social.className
            )}
          >
            <social.icon className="h-4 w-4" />
            {social.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialLinks;
