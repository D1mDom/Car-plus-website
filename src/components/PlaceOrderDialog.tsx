import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlaceOrder } from "@/hooks/usePlaceOrder";
import { useProfile } from "@/hooks/useProfile";
import type { Car } from "@/hooks/useCars";

interface PlaceOrderDialogProps {
  car: Car | null;
  onOpenChange: (open: boolean) => void;
}

// Asks for a phone number before placing an order, so admins have a way to
// reach the customer about the car.
const PlaceOrderDialog = ({ car, onOpenChange }: PlaceOrderDialogProps) => {
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const placeOrder = usePlaceOrder();
  const { data: profile } = useProfile();

  // Pre-fill from the saved profile each time the dialog opens, so repeat
  // customers don't retype their number — they can still edit it here.
  useEffect(() => {
    if (car) setPhone(profile?.phone ?? "");
  }, [car, profile?.phone]);

  const cleanPhone = (v: string) => v.replace(/[^0-9+\-\s()]/g, "");
  const isValid = phone.trim().replace(/[^0-9]/g, "").length >= 8;

  const close = () => { onOpenChange(false); setPhone(""); setTouched(false); };

  const submit = () => {
    setTouched(true);
    if (!car || !isValid) return;
    placeOrder.mutate({ car, phone: phone.trim() }, { onSuccess: close });
  };

  return (
    <Dialog open={!!car} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>បញ្ជាទិញ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {car && (
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">{car.name}</p>
              <p className="text-primary font-semibold">${car.price.toLocaleString()}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="order-phone">លេខទូរស័ព្ទ (ដើម្បីឲ្យយើងទាក់ទងអ្នក)</Label>
            <Input
              id="order-phone"
              value={phone}
              onChange={(e) => setPhone(cleanPhone(e.target.value))}
              placeholder="0xx xxx xxx"
              autoFocus
            />
            {touched && !isValid && (
              <p className="text-xs text-destructive">សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={close}>បោះបង់</Button>
            <Button onClick={submit} disabled={placeOrder.isPending}>
              {placeOrder.isPending ? "កំពុងបញ្ជូន..." : "បញ្ជាទិញ"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceOrderDialog;
