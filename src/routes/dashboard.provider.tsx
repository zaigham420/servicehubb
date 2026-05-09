import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { toast } from "sonner";
import { Wallet, Briefcase, Star, Plus, Calendar } from "lucide-react";

interface BookingRow {
  id: string;
  service_name: string;
  price: number;
  provider_earning: number;
  status: string;
  scheduled_date: string | null;
  customer_id: string;
}

interface ServiceRow {
  id: string;
  title: string;
  category: string;
  price: number;
  is_active: boolean;
}

interface ProviderProfile {
  category: string;
  bio: string;
  hourly_rate: number;
  rating: number;
  total_earnings: number;
  completed_jobs: number;
  is_available: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  paid: "bg-primary/15 text-primary",
  accepted: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

export const Route = createFileRoute("/dashboard/provider")({
  head: () => ({ meta: [{ title: "Provider dashboard — Service Hub" }] }),
  component: ProviderDashboard,
});

function ProviderDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  // service form
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  // profile form
  const [bio, setBio] = useState("");
  const [hourly, setHourly] = useState("");
  const [profileCat, setProfileCat] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const refresh = async () => {
    if (!user) return;
    const [{ data: pp }, { data: sv }, { data: bk }] = await Promise.all([
      supabase.from("provider_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("services").select("id,title,category,price,is_active").eq("provider_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("id,service_name,price,provider_earning,status,scheduled_date,customer_id")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    if (pp) {
      setProfile(pp as ProviderProfile);
      setBio(pp.bio ?? "");
      setHourly(String(pp.hourly_rate ?? ""));
      setProfileCat(pp.category ?? "");
    }
    setServices((sv as ServiceRow[]) ?? []);
    setBookings((bk as BookingRow[]) ?? []);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createService = async () => {
    if (!user || !title || !category || !price) {
      toast.error("Fill all required fields");
      return;
    }
    const { error } = await supabase.from("services").insert({
      provider_id: user.id,
      title,
      description: desc,
      category,
      price: parseFloat(price),
    });
    if (error) return toast.error(error.message);
    toast.success("Service listed!");
    setOpen(false);
    setTitle("");
    setDesc("");
    setCategory("");
    setPrice("");
    refresh();
  };

  const updateProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("provider_profiles")
      .update({ bio, hourly_rate: parseFloat(hourly) || 0, category: profileCat })
      .eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refresh();
  };

  const updateBookingStatus = async (id: string, status: "accepted" | "completed" | "cancelled") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status}`);
    refresh();
  };

  const toggleService = async (svc: ServiceRow) => {
    await supabase.from("services").update({ is_active: !svc.is_active }).eq("id", svc.id);
    refresh();
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Provider dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage your listings, bookings, and earnings.</p>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Wallet} label="Total earnings" value={`PKR ${Number(profile?.total_earnings ?? 0).toLocaleString()}`} />
        <StatCard icon={Briefcase} label="Completed jobs" value={String(profile?.completed_jobs ?? 0)} />
        <StatCard icon={Star} label="Rating" value={profile?.rating ? profile.rating.toFixed(1) : "—"} />
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="services">My services</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          {bookings.length === 0 ? (
            <EmptyCard text="No bookings yet. Once customers book your services, they'll appear here." />
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="font-semibold">{b.service_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                        {b.scheduled_date && (
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(b.scheduled_date).toLocaleString()}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        You earn: <span className="font-semibold text-success">PKR {Number(b.provider_earning).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${STATUS_STYLES[b.status] ?? "bg-muted"}`}>{b.status}</span>
                      <div className="flex gap-2">
                        {b.status === "paid" && (
                          <Button size="sm" onClick={() => updateBookingStatus(b.id, "accepted")} className="bg-primary hover:bg-primary-hover">Accept</Button>
                        )}
                        {b.status === "accepted" && (
                          <Button size="sm" onClick={() => updateBookingStatus(b.id, "completed")} className="bg-success hover:bg-success/90 text-success-foreground">Mark complete</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover mb-4"><Plus className="h-4 w-4 mr-1.5" />New service</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>List a new service</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deep home cleaning" /></div>
                <div>
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.emoji} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Price (PKR) *</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createService} className="bg-primary hover:bg-primary-hover">Publish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {services.length === 0 ? (
            <EmptyCard text="No services listed yet." />
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-xl p-5 flex justify-between items-center shadow-card">
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-sm text-muted-foreground">{CATEGORIES.find((c) => c.slug === s.category)?.name ?? s.category} · PKR {Number(s.price).toLocaleString()}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleService(s)}>
                    {s.is_active ? "Pause" : "Activate"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl space-y-4 shadow-card">
            <div>
              <Label>Primary category</Label>
              <Select value={profileCat} onValueChange={setProfileCat}>
                <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.emoji} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Hourly rate (PKR)</Label><Input type="number" value={hourly} onChange={(e) => setHourly(e.target.value)} /></div>
            <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} placeholder="Tell customers about your experience..." /></div>
            <Button onClick={updateProfile} className="bg-primary hover:bg-primary-hover">Save profile</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">{text}</div>;
}
