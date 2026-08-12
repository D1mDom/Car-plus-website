import { useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import AdminStatCards from "@/components/admin/AdminStatCards";
import AdminCarList from "@/components/admin/AdminCarList";

const Admin = () => {
  const { t } = useLanguage();
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const handleBackup = async () => {
    try {
      const [carsRes, teamRes, bannersRes, contactRes] = await Promise.all([
        supabase.from("cars").select("*"),
        db.from("team_members").select("*"),
        db.from("banners").select("*"),
        db.from("contact_info").select("*").eq("id", 1).maybeSingle(),
      ]);
      const backup = {
        exported_at: new Date().toISOString(),
        version: 1,
        cars: carsRes.data ?? [],
        team_members: teamRes.data ?? [],
        banners: bannersRes.data ?? [],
        contact_info: contactRes.data ?? null,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carplus-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (err) {
      toast.error("Backup failed: " + (err instanceof Error ? err.message : "error"));
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const backup = JSON.parse(await file.text());
      const fail = (e: unknown) => {
        if (e) throw e;
      };

      if (Array.isArray(backup.cars) && backup.cars.length) {
        fail((await supabase.from("cars").upsert(backup.cars, { onConflict: "id" })).error);
      }
      if (Array.isArray(backup.team_members) && backup.team_members.length) {
        fail((await db.from("team_members").upsert(backup.team_members, { onConflict: "id" })).error);
      }
      if (Array.isArray(backup.banners) && backup.banners.length) {
        fail((await db.from("banners").upsert(backup.banners, { onConflict: "id" })).error);
      }
      if (backup.contact_info) {
        const { id: _id, ...contact } = backup.contact_info;
        fail((await db.from("contact_info").update(contact).eq("id", 1)).error);
      }

      queryClient.invalidateQueries();
      toast.success("Data imported successfully");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Invalid backup file";
      toast.error("Import failed: " + msg);
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" className="transition-transform active:scale-95" onClick={handleBackup}>
          <Download className="mr-2 h-4 w-4" />
          {t("admin.cars.backup")}
        </Button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleImport(e.target.files[0]);
          }}
        />
        <Button
          variant="outline"
          className="transition-transform active:scale-95"
          onClick={() => importInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {t("admin.cars.import")}
        </Button>
      </div>

      <AdminStatCards />

      <AdminCarList previewLimit={8} />
    </div>
  );
};

export default Admin;
