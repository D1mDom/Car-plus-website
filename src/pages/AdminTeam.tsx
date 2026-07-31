import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Users, Loader2 } from "lucide-react";
import { useTeam, useDeleteTeamMember, isRealTeamMember, type TeamMember } from "@/hooks/useTeam";
import { useLanguage } from "@/hooks/useLanguage";
import TeamFormDialog from "@/components/admin/TeamFormDialog";
import { onImgError } from "@/lib/imageFallback";
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

const AdminTeam = () => {
  const { t } = useLanguage();
  const { data: teamMembers = [], isLoading } = useTeam();
  const deleteMember = useDeleteTeamMember();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const nextSortOrder = teamMembers.reduce((max, m) => Math.max(max, m.sort_order), 0) + 1;

  const handleAdd = () => { setEditingMember(null); setFormOpen(true); };
  const handleEdit = (member: TeamMember) => { setEditingMember(member); setFormOpen(true); };
  const confirmDelete = () => {
    if (deleteId) { deleteMember.mutate(deleteId); setDeleteId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.team.title")}</h1>
          <p className="text-muted-foreground">{t("admin.team.subtitle")}</p>
        </div>
        <Button onClick={handleAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          បន្ថែមសមាជិក
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            សមាជិកទាំងអស់
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p>មិនទាន់មានសមាជិកទេ</p>
              <Button className="mt-4" onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                បន្ថែមសមាជិកដំបូង
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="relative rounded-xl border border-border bg-background p-4">
                  {isRealTeamMember(member.id) && (
                    <div className="absolute right-3 top-3 flex gap-1">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(member)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteId(member.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {member.image ? (
                    <img src={member.image} alt={member.name} onError={onImgError} className="mb-3 h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <h4 className="font-semibold text-foreground">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TeamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editingMember}
        nextSortOrder={nextSortOrder}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>លុបសមាជិកក្រុម</AlertDialogTitle>
            <AlertDialogDescription>
              តើអ្នកប្រាកដទេថាចង់លុបសមាជិកនេះ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>បោះបង់</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>លុប</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTeam;
