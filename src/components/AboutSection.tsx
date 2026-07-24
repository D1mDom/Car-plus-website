import { useState } from "react";
import { Shield, Award, Wrench, CreditCard, Pencil, Trash2, Plus } from "lucide-react";
import ContactForm from "./ContactForm";
import BusinessHours from "./BusinessHours";
import SocialLinks from "./SocialLinks";
import { useAdmin } from "@/hooks/useAdmin";
import { useTeam, useDeleteTeamMember, isRealTeamMember, type TeamMember } from "@/hooks/useTeam";
import TeamFormDialog from "./admin/TeamFormDialog";
import { Button } from "@/components/ui/button";
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

const features = [
  {
    icon: Shield,
    title: "មានធានា",
    description: "ធានា ៦ ខែលើម៉ាស៊ីន និងប្រអប់លេខជាមួយរាល់ការទិញ។",
  },
  {
    icon: Award,
    title: "គុណភាពធានា",
    description: "រថយន្តទាំងអស់ត្រូវបានត្រួតពិនិត្យ និងបញ្ជាក់មុនលក់។",
  },
  {
    icon: Wrench,
    title: "ប្រវត្តិសេវាកម្មពេញលេញ",
    description: "ឯកសារគ្រប់គ្រាន់ និងប្រវត្តិរថយន្តថ្លាភ្លឺ។",
  },
  {
    icon: CreditCard,
    title: "ហិរញ្ញវត្ថុបត់បែន",
    description: "ជម្រើសបង់រំលស់ងាយស្រួលជាមួយហិរញ្ញវត្ថុសម្រាប់អតិថិជនទាំងអស់។",
  },
];

const AboutSection = () => {
  const { isAdmin } = useAdmin();
  const { data: teamMembers = [] } = useTeam();
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
    <>
      <section id="about" className="py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              អំពី <span className="text-primary">Car Plus</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              បង្កើតឡើងក្នុងឆ្នាំ ២០១៤ Car Plus បានរីកចម្រើនពីអាជីវកម្មគ្រួសារតូចមួយ ទៅជាឈ្មួញលក់រថយន្តដែលទុកចិត្តបំផុតមួយនៅភ្នំពេញ។ បេសកកម្មរបស់យើងគឺផ្តល់រថយន្តគុណភាពខ្ពស់ជាមួយប្រវត្តិថ្លាភ្លឺ ធានា និងសេវាកម្មអតិថិជនល្អឥតខ្ចោះ។
            </p>
          </div>

          {/* Features - left-aligned cards */}
          <div className="mb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Team - sleek left-aligned cards */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-center gap-3">
              <h3 className="text-center text-2xl font-bold text-foreground">
                ស្គាល់ <span className="text-primary">ក្រុមការងារ</span>យើង
              </h3>
              {isAdmin && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  បន្ថែម
                </Button>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="group relative rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
                  {isAdmin && isRealTeamMember(member.id) && (
                    <div className="absolute right-3 top-3 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(member)}
                        aria-label="កែសម្រួល"
                        className="rounded-full bg-background p-2 text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(member.id)}
                        aria-label="លុប"
                        className="rounded-full bg-background p-2 text-destructive shadow-sm ring-1 ring-border transition-colors hover:bg-accent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="mb-4 h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <h4 className="font-semibold text-foreground">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section id="contact" className="border-t border-border bg-card py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              ទំនាក់ <span className="text-primary">ទំនង</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              មានសំណួរអំពីឡាន ឬចង់ណាត់ជួបសាកឡាន? ទាក់ទងមកយើង ហើយក្រុមការងារយើងនឹងឆ្លើយតបជូនឆាប់រហ័ស។
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
              <h3 className="mb-6 text-xl font-bold text-foreground">ផ្ញើសារមកយើង</h3>
              <ContactForm />
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-background p-6">
                <BusinessHours />
              </div>

              <div className="rounded-2xl border border-border bg-background p-6">
                <SocialLinks />
              </div>
            </div>
          </div>
        </div>
      </section>

      {isAdmin && (
        <>
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
        </>
      )}
    </>
  );
};

export default AboutSection;
