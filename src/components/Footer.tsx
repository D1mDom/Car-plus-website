import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer id="contact" className="border-t-2 border-border bg-card">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Car Plus ឡូហ្គោ" className="h-10 w-auto rounded-lg border-2 border-primary/30" />
              <span className="text-xl font-bold text-foreground text-bordered">
                Car <span className="text-gradient-ocean">Plus</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ប្រភពដែលអ្នកទុកចិត្តសម្រាប់រថយន្តគុណភាពនៅភ្នំពេញ។ រថយន្តគុណភាពខ្ពស់ជាមួយប្រវត្តិថ្លាភ្លឺ និងសេវាកម្មល្អឥតខ្ចោះ។
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b-2 border-primary pb-2 inline-block">តំណភ្ជាប់រហ័ស</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  ទំព័រដើម
                </Link>
              </li>
              <li>
                <Link to="/#inventory" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  មើលឡាន
                </Link>
              </li>
              <li>
                <Link to="/#about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  អំពីយើង
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b-2 border-primary pb-2 inline-block">ប្រភេទ</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">ឡានរួចរាល់</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">ឡានលើផ្លូវ</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">ឡានប្រណីត</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">ឡានមានស្លាកលេខ</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b-2 border-primary pb-2 inline-block">ទំនាក់ទំនង</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-primary/30 bg-surface">
                  <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground">+855 12 345 678</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-primary/30 bg-surface">
                  <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                  </svg>
                </div>
                <a
                  href="https://t.me/Carplus777"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  @Carplus777
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-primary/30 bg-surface">
                  <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <a
                  href="https://facebook.com/CarPlus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Car Plus។ រក្សាសិទ្ធិគ្រប់យ៉ាង។ ទីតាំងនៅភ្នំពេញ កម្ពុជា។
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
