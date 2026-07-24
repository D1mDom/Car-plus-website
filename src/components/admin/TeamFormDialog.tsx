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
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateTeamMember,
  useUpdateTeamMember,
  type TeamMember,
} from "@/hooks/useTeam";
import { uploadImage, MAX_UPLOAD_BYTES } from "@/lib/imageUpload";

const formSchema = z.object({
  name: z.string().min(1, "សូមបញ្ចូលឈ្មោះ"),
  role: z.string().min(1, "សូមបញ្ចូលតួនាទី"),
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", role: "", image: "", sort_order: nextSortOrder },
  });

  const image = form.watch("image");

  useEffect(() => {
    if (member) {
      form.reset({ name: member.name, role: member.role, image: member.image, sort_order: member.sort_order });
    } else {
      form.reset({ name: "", role: "", image: "", sort_order: nextSortOrder });
    }
  }, [member, nextSortOrder, form]);

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
    if (member) {
      updateMember.mutate(
        { id: member.id, name: values.name, role: values.role, image: values.image, sort_order: values.sort_order },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMember.mutate(
        { name: values.name, role: values.role, image: values.image, sort_order: values.sort_order },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  const isLoading = createMember.isPending || updateMember.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "កែសម្រួលសមាជិកក្រុម" : "បន្ថែមសមាជិកក្រុម"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>រូបថត</FormLabel>
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
                          <img src={image} alt="រូបថត" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => form.setValue("image", "", { shouldValidate: true })}
                            aria-label="លុបរូបថត"
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
                        {image ? "ប្តូររូបថត" : "បញ្ចូលរូបថត"}
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
                  <FormLabel>ឈ្មោះ</FormLabel>
                  <FormControl>
                    <Input placeholder="សុវណ្ណ ចេន" {...field} />
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
                  <FormLabel>តួនាទី</FormLabel>
                  <FormControl>
                    <Input placeholder="អ្នកគ្រប់គ្រងផ្នែកលក់" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>លំដាប់បង្ហាញ</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                បោះបង់
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? "កំពុងរក្សាទុក..." : member ? "រក្សាទុក" : "បន្ថែម"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamFormDialog;
