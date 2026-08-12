import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateTeamMember,
  useUpdateTeamMember,
  type TeamMember,
} from "@/hooks/useTeam";
import { uploadImage, MAX_UPLOAD_BYTES } from "@/lib/imageUpload";
import { useLanguage } from "@/hooks/useLanguage";
import { stripContactFromImage } from "@/hooks/useTeam";
import { onImgError } from "@/lib/imageFallback";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().default(""),
  telegram: z.string().default(""),
  image: z.string(),
  sort_order: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  nextSortOrder: number;
}

const TeamFormDialog = ({ open, onOpenChange, member, nextSortOrder }: TeamFormDialogProps) => {
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const [isUploading, setIsUploading] = useState(false);
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", role: "", phone: "", telegram: "", image: "", sort_order: nextSortOrder },
  });

  const image = form.watch("image");
  const previewName = form.watch("name");
  const previewRole = form.watch("role");
  const previewPhone = form.watch("phone");
  const previewTelegram = form.watch("telegram");
  const displayImage = stripContactFromImage(image);

  useEffect(() => {
    if (!open) return;
    if (member) {
      form.reset({
        name: member.name,
        role: member.role,
        phone: member.phone ?? "",
        telegram: member.telegram ?? "",
        image: member.image,
        sort_order: member.sort_order,
      });
    } else {
      form.reset({
        name: "",
        role: "",
        phone: "",
        telegram: "",
        image: "",
        sort_order: nextSortOrder,
      });
    }
  }, [member?.id, nextSortOrder, open]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image must be less than 50MB");
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      form.setValue("image", url, { shouldValidate: true });
      toast.success("Photo uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      role: values.role,
      phone: values.phone.trim(),
      telegram: values.telegram.trim(),
      image: values.image,
      sort_order: values.sort_order,
    };
    if (member) {
      updateMember.mutate(
        { id: member.id, ...payload },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMember.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isLoading = createMember.isPending || updateMember.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? t("team.form.edit") : t("team.form.add")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">{t("admin.team.previewDesc")}</p>
              <div className="mx-auto max-w-[160px] text-center">
                <div className="mx-auto mb-2 overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt=""
                      onError={onImgError}
                      className="aspect-[4/5] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                      {(previewName || "?").charAt(0)}
                    </div>
                  )}
                </div>
                <p className="font-heading text-sm font-semibold text-foreground">
                  {previewName || t("team.form.namePlaceholder")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {previewRole || t("team.form.rolePlaceholder")}
                </p>
                {(previewPhone?.trim() || previewTelegram?.trim()) && (
                  <div className="mt-2 space-y-1 text-left text-xs">
                    {previewPhone?.trim() ? (
                      <p className="flex items-center gap-1 text-primary">
                        <Phone className="h-3 w-3" />
                        {previewPhone}
                      </p>
                    ) : null}
                    {previewTelegram?.trim() ? (
                      <p className="flex items-center gap-1 text-[#229ED9]">
                        <Send className="h-3 w-3" />
                        {previewTelegram.startsWith("@") ? previewTelegram : `@${previewTelegram}`}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>{t("team.form.photo")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFile(e.target.files[0]);
                        }}
                      />
                      {image ? (
                        <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-border">
                          <img src={image} alt={t("team.form.photo")} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => form.setValue("image", "", { shouldValidate: true })}
                            aria-label={t("team.form.removePhoto")}
                            className="absolute right-0 top-0 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50 hover:bg-muted/50"
                        >
                          {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {image ? t("team.form.changePhoto") : t("team.form.addPhoto")}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("team.form.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("team.form.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("team.form.role")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("team.form.rolePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("team.form.phone")}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder={t("team.form.phonePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t("team.form.phoneHint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("team.form.telegram")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("team.form.telegramPlaceholder")} {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t("team.form.telegramHint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("team.form.order")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? t("form.saving") : member ? t("form.save") : t("team.form.addBtn")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamFormDialog;
