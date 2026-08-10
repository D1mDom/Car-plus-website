import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useContact } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";

const Footer = () => {
  const { data: contact } = useContact();
  const { t } = useLanguage();
  const telegramHandle = (contact?.telegram || "@Carplus777").replace(/^@/, "");

  return (
    <footer className="border-t border-border bg-[hsl(216_45%_12%)] text-white">
      <div className="container mx-auto px-[10px] py-10 sm:py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src={logo} alt="Car Plus" className="h-11 w-auto rounded-lg" />
              <span className="font-heading text-xl font-bold tracking-tight">
                Car <span className="text-[hsl(199_100%_62%)]">Plus</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/55">
              {t("footer.blurb")}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{t("footer.links")}</h3>
            <ul className="space-y-2.5">
              {[
                ["/", t("nav.home")],
                ["/cars", t("nav.inventory")],
                ["/about", t("nav.about")],
                ["/contact", t("nav.contact")],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/65 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{t("footer.categories")}</h3>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li>{t("category.ready")}</li>
              <li>{t("category.onroad")}</li>
              <li>{t("category.luxury")}</li>
              <li>{t("category.plate")}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{t("footer.contact")}</h3>
            <ul className="space-y-3 text-sm text-white/65">
              <li>{contact?.phone || "+855 12 345 678"}</li>
              <li>
                <a href={`https://t.me/${telegramHandle}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  {contact?.telegram || "@Carplus777"}
                </a>
              </li>
              <li>
                <a href={contact?.facebook || "https://facebook.com/CarPlus"} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  Facebook
                </a>
              </li>
              {contact?.address && <li className="leading-relaxed">{contact.address}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/40 sm:text-sm">
            © {new Date().getFullYear()} Car Plus. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
