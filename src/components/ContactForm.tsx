import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "ត្រូវការឈ្មោះ").max(100, "ឈ្មោះវែងពេក"),
  email: z.string().trim().email("អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវ").max(255, "អ៊ីមែលវែងពេក"),
  phone: z.string().trim().max(20, "លេខទូរស័ព្ទវែងពេក").optional(),
  message: z.string().trim().min(1, "ត្រូវការសារ").max(1000, "សារវែងពេក"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("សារបានផ្ញើដោយជោគជ័យ! យើងនឹងឆ្លើយតបឆាប់ៗ។");
    setFormData({ name: "", email: "", phone: "", message: "" });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">ឈ្មោះ *</Label>
          <Input id="name" placeholder="ឈ្មោះរបស់អ្នក" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">អ៊ីមែល *</Label>
          <Input id="email" type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">ទូរស័ព្ទ (ជាជម្រើស)</Label>
        <Input id="phone" placeholder="+855 12 345 678" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">សារ *</Label>
        <Textarea id="message" placeholder="ប្រាប់យើងអំពីឡានដែលអ្នកកំពុងស្វែងរក..." rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className={errors.message ? "border-destructive" : ""} />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
        ផ្ញើសារ
      </Button>
    </form>
  );
};

export default ContactForm;
