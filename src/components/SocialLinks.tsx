import { Facebook, Instagram, MessageCircle, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

const socialLinks = [
  { name: "Facebook", icon: Facebook, url: "https://facebook.com/CarPlus", color: "hover:bg-[#1877F2] hover:text-white" },
  { name: "Instagram", icon: Instagram, url: "https://instagram.com/carplus_cambodia", color: "hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:text-white" },
  { name: "Telegram", icon: MessageCircle, url: "https://t.me/Carplus777", color: "hover:bg-[#0088cc] hover:text-white" },
  { name: "YouTube", icon: Youtube, url: "https://youtube.com/@carplus", color: "hover:bg-[#FF0000] hover:text-white" },
];

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const SocialLinks = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">តាមដានយើង</h3>
      <div className="flex flex-wrap gap-3">
        {socialLinks.map((social) => (
          <Button key={social.name} variant="outline" size="lg" className={`gap-2 ${social.color} transition-all duration-300`} asChild>
            <a href={social.url} target="_blank" rel="noopener noreferrer">
              <social.icon className="h-5 w-5" />
              {social.name}
            </a>
          </Button>
        ))}
        <Button variant="outline" size="lg" className="gap-2 hover:bg-black hover:text-white transition-all duration-300" asChild>
          <a href="https://tiktok.com/@carplus" target="_blank" rel="noopener noreferrer">
            <TikTokIcon className="h-5 w-5" />
            TikTok
          </a>
        </Button>
      </div>
    </div>
  );
};

export default SocialLinks;
