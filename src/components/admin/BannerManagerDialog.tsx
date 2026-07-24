import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import {
  useBanners,
  useCreateBanner,
  useDeleteBanner,
  useUpdateBannerOrder,
  type Banner,
} from "@/hooks/useBanners";
import { uploadImage, MAX_UPLOAD_BYTES } from "@/lib/imageUpload";

interface BannerManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BannerManagerDialog = ({ open, onOpenChange }: BannerManagerDialogProps) => {
  const { data: banners = [] } = useBanners();
  const createBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();
  const reorder = useUpdateBannerOrder();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextSortOrder = banners.reduce((max, b) => Math.max(max, b.sort_order), 0) + 1;

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    setIsUploading(true);
    try {
      let order = nextSortOrder;
      for (const file of arr) {
        if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); continue; }
        if (file.size > MAX_UPLOAD_BYTES) { toast.error("Image must be less than 50MB"); continue; }
        const url = await uploadImage(file);
        await createBanner.mutateAsync({ image: url, sort_order: order++ });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload banner");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Swap a banner's position with its neighbour by swapping sort_order values.
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= banners.length) return;
    const a = banners[index];
    const b = banners[target];
    reorder.mutate([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>គ្រប់គ្រងបដា</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 py-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">បញ្ចូលរូបបដា (អាចដាក់ច្រើន)</p>
              </>
            )}
          </div>

          {banners.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              មិនទាន់មានបដាទេ។ បើទទេ គេហទំព័របង្ហាញបដាដើមរបស់ប្រព័ន្ធ។
            </p>
          ) : (
            <div className="space-y-3">
              {banners.map((banner: Banner, i) => (
                <div key={banner.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                  <img src={banner.image} alt="" className="h-14 w-24 shrink-0 rounded object-cover" />
                  <span className="text-sm text-muted-foreground">#{i + 1}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="ឡើងលើ">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" disabled={i === banners.length - 1} onClick={() => move(i, 1)} aria-label="ចុះក្រោម">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteBanner.mutate(banner.id)} aria-label="លុប">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={() => onOpenChange(false)}>រួចរាល់</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BannerManagerDialog;
