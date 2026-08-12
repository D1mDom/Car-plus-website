import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Trash2,
  Plus,
  Users,
  Loader2,
  Phone,
  Send,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Search,
  UserCheck,
  Database,
} from "lucide-react";
import {
  useTeam,
  useDeleteTeamMember,
  useUpdateTeamOrder,
  isRealTeamMember,
  stripContactFromImage,
  type TeamMember,
} from "@/hooks/useTeam";
import { useLanguage } from "@/hooks/useLanguage";
import TeamFormDialog from "@/components/admin/TeamFormDialog";
import { onImgError } from "@/lib/imageFallback";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type MemberFilter = "all" | "saved" | "demo";

function TeamMemberFace({ member }: { member: TeamMember }) {
  const image = stripContactFromImage(member.image);

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60">
        {image ? (
          <img
            src={image}
            alt={member.name}
            onError={onImgError}
            className="aspect-[4/5] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
            {member.name.charAt(0)}
          </div>
        )}
      </div>
      <h4 className="font-heading text-base font-semibold text-foreground">{member.name}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
    </div>
  );
}

const AdminTeam = () => {
  const { t } = useLanguage();
  const { data: teamMembers = [], isLoading } = useTeam();
  const deleteMember = useDeleteTeamMember();
  const reorder = useUpdateTeamOrder();

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("all");

  const realMembers = useMemo(
    () => teamMembers.filter((m) => isRealTeamMember(m.id)),
    [teamMembers],
  );
  const demoMembers = useMemo(
    () => teamMembers.filter((m) => !isRealTeamMember(m.id)),
    [teamMembers],
  );

  const nextSortOrder = teamMembers.reduce((max, m) => Math.max(max, m.sort_order), 0) + 1;

  const stats = useMemo(
    () => ({
      total: teamMembers.length,
      phone: teamMembers.filter((m) => m.phone?.trim()).length,
      telegram: teamMembers.filter((m) => m.telegram?.trim()).length,
      saved: realMembers.length,
    }),
    [teamMembers, realMembers.length],
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teamMembers.filter((member) => {
      if (memberFilter === "saved" && !isRealTeamMember(member.id)) return false;
      if (memberFilter === "demo" && isRealTeamMember(member.id)) return false;
      if (q) {
        const hay = `${member.name} ${member.role} ${member.phone ?? ""} ${member.telegram ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [teamMembers, search, memberFilter]);

  const handleAdd = () => {
    setEditingMember(null);
    setFormOpen(true);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setFormOpen(false);
      setEditingMember(null);
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMember.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const move = (memberId: string, dir: -1 | 1) => {
    const sorted = [...realMembers].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((m) => m.id === memberId);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    reorder.mutate([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
  };

  const filterCounts = {
    all: teamMembers.length,
    saved: realMembers.length,
    demo: demoMembers.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#174080]/10 text-[#174080]">
            <Users className="h-5 w-5" />
          </span>
          <p className="max-w-xl text-sm text-muted-foreground">{t("admin.team.pageHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="gap-1.5">
            <a href="/about" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t("admin.team.viewSite")}
            </a>
          </Button>
          <Button onClick={handleAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("team.add")}
          </Button>
        </div>
      </div>

      <div className="admin-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("admin.team.statTotal"), value: stats.total, icon: Users, tone: "bg-[#174080]/10 text-[#174080]" },
          { label: t("admin.team.statPhone"), value: stats.phone, icon: Phone, tone: "bg-emerald-500/10 text-emerald-600" },
          { label: t("admin.team.statTelegram"), value: stats.telegram, icon: Send, tone: "bg-sky-500/10 text-sky-600" },
          { label: t("admin.team.statSaved"), value: stats.saved, icon: Database, tone: "bg-violet-500/10 text-violet-600" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="admin-card-hover border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {label}
                <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", tone)}>
                  <Icon className="h-5 w-5" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.cars.search")}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "saved", "demo"] as const).map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={memberFilter === key ? "default" : "outline"}
              onClick={() => setMemberFilter(key)}
              className="gap-1.5 rounded-full"
            >
              {t(
                key === "all"
                  ? "admin.team.filterAll"
                  : key === "saved"
                    ? "admin.team.filterSaved"
                    : "admin.team.filterDemo",
              )}
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 justify-center px-1.5 text-[10px]">
                {filterCounts[key]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5 text-[#174080]" />
            {t("team.all")}
          </CardTitle>
          <CardDescription>{t("admin.team.listHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p>{t("team.none")}</p>
              <p className="mt-1 text-sm">{t("admin.team.emptyHint")}</p>
              <Button className="mt-4 gap-1.5" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                {t("team.addFirst")}
              </Button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>{t("admin.team.noFilterResults")}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMembers.map((member, i) => {
                const isReal = isRealTeamMember(member.id);
                const realSorted = [...realMembers].sort((a, b) => a.sort_order - b.sort_order);
                const realIndex = realSorted.findIndex((m) => m.id === member.id);

                return (
                  <div
                    key={member.id}
                    className="admin-card-hover flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
                    style={{
                      animation: "adminRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
                      animationDelay: `${Math.min(i, 12) * 0.03 + 0.05}s`,
                    }}
                  >
                    <div className="relative p-4 pb-3">
                      <Badge
                        variant={isReal ? "default" : "secondary"}
                        className="absolute left-4 top-4 z-10 text-[10px]"
                      >
                        {isReal ? t("admin.team.savedBadge") : t("admin.team.demoBadge")}
                      </Badge>
                      <TeamMemberFace member={member} />

                      {(member.phone?.trim() || member.telegram?.trim()) && (
                        <div className="mt-3 space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-2.5">
                          {member.phone?.trim() ? (
                            <a
                              href={`tel:${member.phone.replace(/\s+/g, "")}`}
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              {member.phone}
                            </a>
                          ) : null}
                          {member.telegram?.trim() ? (
                            <a
                              href={`https://t.me/${member.telegram.replace(/^@/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-[#229ED9] hover:underline"
                            >
                              <Send className="h-3.5 w-3.5 shrink-0" />
                              {member.telegram.startsWith("@") ? member.telegram : `@${member.telegram}`}
                            </a>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto space-y-2 border-t border-border/60 bg-muted/15 p-3">
                      <p className="text-center text-xs text-muted-foreground">
                        {t("team.form.order")}: {member.sort_order}
                      </p>
                      {isReal ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            disabled={realIndex <= 0 || reorder.isPending}
                            onClick={() => move(member.id, -1)}
                            aria-label={t("admin.banners.moveUp")}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            disabled={realIndex >= realSorted.length - 1 || reorder.isPending}
                            onClick={() => move(member.id, 1)}
                            aria-label={t("admin.banners.moveDown")}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => handleEdit(member)}
                            aria-label={t("team.form.edit")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => setDeleteId(member.id)}
                            aria-label={t("common.delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <Button size="sm" className="gap-1.5" onClick={handleAdd}>
                            <Plus className="h-3.5 w-3.5" />
                            {t("team.add")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TeamFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        member={editingMember}
        nextSortOrder={nextSortOrder}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("team.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("team.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("form.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTeam;
