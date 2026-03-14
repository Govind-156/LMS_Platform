"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import { usePaymentStore } from "@/store/paymentStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";

export function PaymentModal({ onSuccess }: { onSuccess?: () => void }) {
  const { isOpen, course, status, error, closeModal, setStatus, setError } = usePaymentStore();

  const handlePay = useCallback(async () => {
    if (!course) return;
    setStatus("processing");
    setError(null);
    try {
      const createRes = await api.post<{ payment_id: string }>("/payments/create", {
        subject_id: course.subjectId,
      });
      const paymentId = createRes.data.payment_id;
      await api.post("/payments/confirm", { payment_id: paymentId });
      setStatus("success");
      setTimeout(() => {
        closeModal();
        onSuccess?.();
      }, 1500);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Payment failed"
          : "Payment failed";
      setError(message);
      setStatus("error");
    }
  }, [course, closeModal, onSuccess, setStatus, setError]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && status !== "processing") closeModal();
    },
    [status, closeModal]
  );

  const priceDisplay =
    course && course.price === 0
      ? "Free"
      : course
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(course.price)
        : "";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showClose={status !== "processing"}>
        <DialogHeader className="space-y-1">
          <DialogTitle>Complete enrollment</DialogTitle>
          {course && (
            <div className="mt-2">
              <p className="body">{course.title}</p>
              <p className="text-lg font-semibold text-primary mt-2">{priceDisplay}</p>
            </div>
          )}
        </DialogHeader>

        {status === "idle" && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePay}>Pay Now</Button>
          </DialogFooter>
        )}

        {status === "processing" && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="body-muted">Processing payment…</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-14 w-14 text-emerald-500 mb-4" />
            <p className="font-semibold text-slate-900 dark:text-slate-100">Payment successful</p>
            <p className="body-muted mt-1">You’re enrolled.</p>
          </div>
        )}

        {status === "error" && error && (
          <>
            <p className="body text-destructive">{error}</p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handlePay}>Retry</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
