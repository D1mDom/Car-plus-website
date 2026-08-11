import { Link } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/i18n/translations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Car,
  Plus,
  Package,
  FileText,
  BarChart3,
  Image,
  Tag,
  Users,
  Phone,
  Languages,
  Moon,
  ExternalLink,
  LogOut,
  Settings,
  ArrowRight,
  CheckCircle2,
  Shield,
  UserRound,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import flagEn from "@/assets/flags/flag-en.png";
import flagKh from "@/assets/flags/flag-kh.png";

type GuideItem = {
  id: string;
  to?: string;
  icon: LucideIcon;
  image: string;
  /** photos crop; illustrations keep full art */
  imageFit?: "cover" | "contain";
  titleKey: TranslationKey;
  summaryKey: TranslationKey;
  purposeKey: TranslationKey;
  canDoKeys: TranslationKey[];
  tipsKey: TranslationKey;
};

function LanguageGuideImage({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-slate-900", className)}>
      <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-0.5">
        <div className="relative overflow-hidden rounded-l-md">
          <img src={flagKh} alt="Khmer" className="h-full w-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5 text-center text-[9px] font-semibold text-white sm:text-[10px]">
            ខ្មែរ
          </span>
        </div>
        <div className="relative overflow-hidden rounded-r-md">
          <img src={flagEn} alt="English" className="h-full w-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5 text-center text-[9px] font-semibold text-white sm:text-[10px]">
            EN
          </span>
        </div>
      </div>
      <span className="absolute left-1/2 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[hsl(350_70%_48%)] text-xs font-bold text-white shadow-md sm:h-8 sm:w-8">
        ⇄
      </span>
    </div>
  );
}

function GuideImage({
  item,
  alt,
  className,
}: {
  item: GuideItem;
  alt?: string;
  className?: string;
}) {
  if (item.id === "language") {
    return <LanguageGuideImage className={className} />;
  }

  const fit = item.imageFit ?? (item.image.endsWith(".svg") ? "contain" : "cover");

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden",
        fit === "contain" ? "bg-slate-800" : "bg-muted",
        className
      )}
    >
      <img
        src={item.image}
        alt={alt ?? ""}
        className={cn("h-full w-full", fit === "contain" ? "object-contain" : "object-cover")}
        loading="lazy"
      />
    </div>
  );
}

type GuideGroup = {
  id: string;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  items: GuideItem[];
};

const GROUPS: GuideGroup[] = [
  {
    id: "sales",
    labelKey: "admin.settings.group.sales",
    descKey: "admin.settings.group.salesDesc",
    items: [
      {
        id: "cars",
        to: "/admin",
        icon: Car,
        image: "/cars/bmw-blue.jpg",
        titleKey: "admin.nav.cars",
        summaryKey: "admin.settings.summary.cars",
        purposeKey: "admin.settings.purpose.cars",
        canDoKeys: [
          "admin.settings.can.cars1",
          "admin.settings.can.cars2",
          "admin.settings.can.cars3",
          "admin.settings.can.cars4",
        ],
        tipsKey: "admin.settings.tips.cars",
      },
      {
        id: "add-car",
        to: "/admin/add-car",
        icon: Plus,
        image: "/settings/add-car.svg",
        imageFit: "contain",
        titleKey: "admin.nav.addCar",
        summaryKey: "admin.settings.summary.addCar",
        purposeKey: "admin.settings.purpose.addCar",
        canDoKeys: [
          "admin.settings.can.addCar1",
          "admin.settings.can.addCar2",
          "admin.settings.can.addCar3",
          "admin.settings.can.addCar4",
        ],
        tipsKey: "admin.settings.tips.addCar",
      },
      {
        id: "orders",
        to: "/admin/orders",
        icon: Package,
        image: "/settings/orders.svg",
        imageFit: "contain",
        titleKey: "admin.nav.orders",
        summaryKey: "admin.settings.summary.orders",
        purposeKey: "admin.settings.purpose.orders",
        canDoKeys: [
          "admin.settings.can.orders1",
          "admin.settings.can.orders2",
          "admin.settings.can.orders3",
          "admin.settings.can.orders4",
        ],
        tipsKey: "admin.settings.tips.orders",
      },
      {
        id: "receipts",
        to: "/admin/receipts",
        icon: FileText,
        image: "/settings/receipts.svg",
        imageFit: "contain",
        titleKey: "admin.nav.receipts",
        summaryKey: "admin.settings.summary.receipts",
        purposeKey: "admin.settings.purpose.receipts",
        canDoKeys: [
          "admin.settings.can.receipts1",
          "admin.settings.can.receipts2",
          "admin.settings.can.receipts3",
          "admin.settings.can.receipts4",
        ],
        tipsKey: "admin.settings.tips.receipts",
      },
      {
        id: "reports",
        to: "/admin/reports",
        icon: BarChart3,
        image: "/settings/reports.svg",
        imageFit: "contain",
        titleKey: "admin.nav.reports",
        summaryKey: "admin.settings.summary.reports",
        purposeKey: "admin.settings.purpose.reports",
        canDoKeys: [
          "admin.settings.can.reports1",
          "admin.settings.can.reports2",
          "admin.settings.can.reports3",
        ],
        tipsKey: "admin.settings.tips.reports",
      },
    ],
  },
  {
    id: "website",
    labelKey: "admin.settings.group.website",
    descKey: "admin.settings.group.websiteDesc",
    items: [
      {
        id: "banners",
        to: "/admin/banners",
        icon: Image,
        image: "/slides/slide-3-showroom.jpg",
        titleKey: "admin.nav.banners",
        summaryKey: "admin.settings.summary.banners",
        purposeKey: "admin.settings.purpose.banners",
        canDoKeys: [
          "admin.settings.can.banners1",
          "admin.settings.can.banners2",
          "admin.settings.can.banners3",
        ],
        tipsKey: "admin.settings.tips.banners",
      },
      {
        id: "brands",
        to: "/admin/brands",
        icon: Tag,
        image: "/settings/brands.svg",
        imageFit: "contain",
        titleKey: "admin.nav.brands",
        summaryKey: "admin.settings.summary.brands",
        purposeKey: "admin.settings.purpose.brands",
        canDoKeys: [
          "admin.settings.can.brands1",
          "admin.settings.can.brands2",
          "admin.settings.can.brands3",
        ],
        tipsKey: "admin.settings.tips.brands",
      },
      {
        id: "team",
        to: "/admin/team",
        icon: Users,
        image: "/settings/team.svg",
        imageFit: "contain",
        titleKey: "admin.nav.team",
        summaryKey: "admin.settings.summary.team",
        purposeKey: "admin.settings.purpose.team",
        canDoKeys: [
          "admin.settings.can.team1",
          "admin.settings.can.team2",
          "admin.settings.can.team3",
        ],
        tipsKey: "admin.settings.tips.team",
      },
      {
        id: "contact",
        to: "/admin/contact",
        icon: Phone,
        image: "/settings/contact.svg",
        imageFit: "contain",
        titleKey: "admin.nav.contact",
        summaryKey: "admin.settings.summary.contact",
        purposeKey: "admin.settings.purpose.contact",
        canDoKeys: [
          "admin.settings.can.contact1",
          "admin.settings.can.contact2",
          "admin.settings.can.contact3",
        ],
        tipsKey: "admin.settings.tips.contact",
      },
    ],
  },
  {
    id: "tools",
    labelKey: "admin.settings.group.tools",
    descKey: "admin.settings.group.toolsDesc",
    items: [
      {
        id: "language",
        icon: Languages,
        image: "/flags/flag-kh.png",
        titleKey: "admin.settings.tool.language",
        summaryKey: "admin.settings.summary.language",
        purposeKey: "admin.settings.purpose.language",
        canDoKeys: ["admin.settings.can.language1", "admin.settings.can.language2"],
        tipsKey: "admin.settings.tips.language",
      },
      {
        id: "theme",
        icon: Moon,
        image: "/settings/theme.svg",
        imageFit: "contain",
        titleKey: "admin.settings.tool.theme",
        summaryKey: "admin.settings.summary.theme",
        purposeKey: "admin.settings.purpose.theme",
        canDoKeys: ["admin.settings.can.theme1", "admin.settings.can.theme2"],
        tipsKey: "admin.settings.tips.theme",
      },
      {
        id: "website",
        icon: ExternalLink,
        image: "/settings/website.svg",
        imageFit: "contain",
        titleKey: "admin.settings.tool.website",
        summaryKey: "admin.settings.summary.website",
        purposeKey: "admin.settings.purpose.website",
        canDoKeys: ["admin.settings.can.website1", "admin.settings.can.website2"],
        tipsKey: "admin.settings.tips.website",
      },
      {
        id: "logout",
        icon: LogOut,
        image: "/settings/logout.svg",
        imageFit: "contain",
        titleKey: "admin.settings.tool.logout",
        summaryKey: "admin.settings.summary.logout",
        purposeKey: "admin.settings.purpose.logout",
        canDoKeys: ["admin.settings.can.logout1", "admin.settings.can.logout2"],
        tipsKey: "admin.settings.tips.logout",
      },
    ],
  },
];

const AdminSettings = () => {
  const { t } = useLanguage();
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-2xl animate-admin-pop">
          <div className="bg-[hsl(350_70%_48%)] px-6 pb-5 pt-6 text-white">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 animate-admin-icon-swap">
              <ListChecks className="h-5 w-5" />
            </div>
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-xl text-white">{t("admin.settings.welcomeTitle")}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-white/85">
                {t("admin.settings.welcomeBody")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-3 px-6 py-5">
            <ul className="space-y-2.5 text-sm text-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{t("admin.settings.welcomePoint1")}</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{t("admin.settings.welcomePoint2")}</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{t("admin.settings.welcomePoint3")}</span>
              </li>
            </ul>
            <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
              {t("admin.settings.welcomeHint")}
            </p>
          </div>

          <DialogFooter className="border-t border-border/60 px-6 py-4">
            <Button className="w-full sm:w-auto" onClick={() => setWelcomeOpen(false)}>
              {t("admin.settings.welcomeGotIt")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60">
        <img
          src="/cars/mercedes-silver.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/35" />
        <div className="relative space-y-3 px-6 py-10 sm:px-8 sm:py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Settings className="h-3.5 w-3.5" />
            {t("admin.settings.badge")}
          </div>
          <h1 className="max-w-xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("admin.settings.title")}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            {t("admin.settings.subtitle")}
          </p>
        </div>
      </header>

      {/* Roles */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-[hsl(350_70%_48%)]" />
            {t("admin.settings.roleAdminTitle")}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("admin.settings.roleAdminBody")}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <UserRound className="h-4 w-4 text-sky-600" />
            {t("admin.settings.roleUserTitle")}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("admin.settings.roleUserBody")}</p>
        </div>
      </section>

      {/* Groups */}
      {GROUPS.map((group) => (
        <section key={group.id} className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{t(group.labelKey)}</h2>
            <p className="text-sm text-muted-foreground">{t(group.descKey)}</p>
          </div>

          <Accordion type="multiple" defaultValue={group.id === "sales" ? ["cars"] : []} className="space-y-3">
            {group.items.map((item, index) => {
              const Icon = item.icon;
              return (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-background px-0 shadow-none"
                >
                  <AccordionTrigger className="px-3 py-3 hover:no-underline sm:px-4 [&[data-state=open]]:bg-muted/20">
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-28">
                        <GuideImage item={item} className="absolute inset-0" />
                        <span
                          className={cn(
                            "absolute bottom-1 left-1 inline-flex h-6 w-6 items-center justify-center rounded-md",
                            "bg-black/55 text-white backdrop-blur-[2px]"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-semibold text-foreground">{t(item.titleKey)}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm font-normal text-muted-foreground">
                          {t(item.summaryKey)}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-border/50 px-3 pb-4 pt-3 sm:px-4">
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_1fr] sm:gap-5">
                      <div className="overflow-hidden rounded-xl border border-border/50">
                        <GuideImage
                          item={item}
                          alt={t(item.titleKey)}
                          className="aspect-[5/3] sm:aspect-[4/3]"
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {t("admin.settings.label.purpose")}
                          </p>
                          <p className="text-sm leading-relaxed text-foreground/90">{t(item.purposeKey)}</p>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {t("admin.settings.label.canDo")}
                          </p>
                          <ul className="space-y-2">
                            {item.canDoKeys.map((key) => (
                              <li key={key} className="flex gap-2 text-sm text-foreground/90">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                <span className="leading-relaxed">{t(key)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                          <p className="mb-0.5 text-xs font-semibold text-foreground">
                            {t("admin.settings.tipLabel")}
                          </p>
                          <p className="text-sm leading-relaxed text-muted-foreground">{t(item.tipsKey)}</p>
                        </div>

                        {item.to ? (
                          <Button size="sm" className="gap-1.5" asChild>
                            <Link to={item.to}>
                              {t("admin.settings.open")}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>
      ))}
    </div>
  );
};

export default AdminSettings;
