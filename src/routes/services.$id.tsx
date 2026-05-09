import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Star, Briefcase, CheckCircle2, CreditCard, Smartphone } from "lucide-react";

interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  provider_id: string;
}

interface ProviderInfo {
  full_name: string;
  rating: number;
  completed_jobs: number;
  bio: string;
}

export const Route = createFileRoute("/services/$id")({
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { id } = Route.useParams();
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "easypaisa" | "jazzcash">("stripe");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: svc } = await supabase
        .from("services")
        .select("id,title,description,category,price,image_url,provider_id")
        .eq("id", id)
        .maybeSingle();
      if (!svc) {
        setLoading(false);
        return;
      }
      setService(svc as ServiceDetail);
      const [{ data: prof }, { data: pp }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", svc.provider_id).maybeSingle(),
        supabase
          .from("provider_profiles")
          .select("rating,completed_jobs,bio")
          .eq("user_id", svc.provider_id)
          .maybeSingle(),
      ]);
      setProvider({
        full_name: prof?.full_name ?? "Provider",
        rating: pp?.rating ?? 0,
        completed_jobs: pp?.completed_jobs ?? 0,
        bio: pp?.bio ?? "",
      });
      setLoading(false);
    })();
  }, [id]);

  const handleBook = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!service) return;
    if (!roles.includes("customer")) {
      toast.error("Only customers can book services. Switch role from your dashboard.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. fetch commission %
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("commission_percent")
        .eq("id", 1)
        .single();
      const commissionPct = Number(settings?.commission_percent ?? 15);
      const price = Number(service.price);
      const commission = +(price * (commissionPct / 100)).toFixed(2);
      const earning = +(price - commission).toFixed(2);

      // 2. create booking (status: pending)
      const { data: booking, error: bErr } = await supabase
        .from("bookings")
        .insert({
          customer_id: user.id,
          provider_id: service.provider_id,
          service_id: service.id,
          service_name: service.title,
          price,
          commission_amount: commission,
          provider_earning: earning,
          scheduled_date: date || null,
          notes: notes || null,
          status: "pending",
        })
        .select()
        .single();
      if (bErr || !booking) throw bErr ?? new Error("Booking failed");

      // 3. simulate payment processing
      await new Promise((r) => setTimeout(r, 900));
      const txId = `${paymentMethod.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      // 4. record transaction
      const { error: tErr } = await supabase.from("transactions").insert({
        booking_id: booking.id,
        total_amount: price,
        commission_cut: commission,
        provider_amount: earning,
        payment_method: paymentMethod,
        payment_status: "success",
        transaction_id: txId,
      });
      if (tErr) throw tErr;

      // 5. update booking status to paid
      await supabase.from("bookings").update({ status: "paid" }).eq("id", booking.id);

      toast.success("Payment successful! Your booking is confirmed.");
      setBookingOpen(false);
      navigate({ to: "/dashboard/customer" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 w-1/2 bg-muted rounded mb-6" />
        <div className="aspect-[16/9] max-w-3xl bg-muted rounded-2xl" />
      </div>
    );
  }
  if (!service) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Service not found</h1>
        <Button asChild className="mt-4 bg-primary hover:bg-primary-hover">
          <Link to="/services">Back to services</Link>
        </Button>
      </div>
    );
  }

  const cat = CATEGORIES.find((c) => c.slug === service.category);

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="text-sm text-muted-foreground mb-4">
        <Link to="/services" className="hover:text-primary">Services</Link> / {cat?.name ?? service.category}
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="aspect-[16/9] bg-gradient-to-br from-accent to-secondary rounded-2xl overflow-hidden flex items-center justify-center mb-6">
            {service.image_url ? (
              <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl">{cat?.emoji ?? "✨"}</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{cat?.name ?? service.category}</div>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{service.title}</h1>
          <p className="text-foreground/80 text-lg leading-relaxed whitespace-pre-line">{service.description || "No description provided."}</p>

          {provider && (
            <div className="mt-8 bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {provider.full_name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-lg">{provider.full_name}</div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-4 w-4 text-warning fill-warning" /> {provider.rating || "New"}</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {provider.completed_jobs} jobs</span>
                  </div>
                </div>
              </div>
              {provider.bio && <p className="mt-4 text-foreground/80">{provider.bio}</p>}
            </div>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card sticky top-20">
            <div className="text-sm text-muted-foreground">Price</div>
            <div className="text-4xl font-bold mb-1">PKR {Number(service.price).toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mb-6">All-inclusive · paid securely</div>
            <Button onClick={() => setBookingOpen(true)} className="w-full bg-primary hover:bg-primary-hover h-12 text-base">
              Book now
            </Button>
            <ul className="mt-6 space-y-3 text-sm">
              {["Verified provider", "Secure payment", "Cancel anytime before start"].map((b) => (
                <li key={b} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{b}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm & pay</DialogTitle>
            <DialogDescription>{service.title} · PKR {Number(service.price).toLocaleString()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Preferred date & time</Label>
              <Input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="notes">Notes for provider (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Address details, requests..." />
            </div>
            <div>
              <Label className="mb-2 block">Payment method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)} className="space-y-2">
                {[
                  { v: "stripe", label: "Card (Stripe)", icon: CreditCard },
                  { v: "easypaisa", label: "EasyPaisa", icon: Smartphone },
                  { v: "jazzcash", label: "JazzCash", icon: Smartphone },
                ].map(({ v, label, icon: Icon }) => (
                  <label key={v} htmlFor={`pm-${v}`} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/30 transition has-[:checked]:border-primary has-[:checked]:bg-accent/40">
                    <RadioGroupItem id={`pm-${v}`} value={v} />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              💡 Demo payments — no real money is charged. Production integration ready.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBookingOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleBook} disabled={submitting} className="bg-primary hover:bg-primary-hover">
              {submitting ? "Processing..." : `Pay PKR ${Number(service.price).toLocaleString()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
