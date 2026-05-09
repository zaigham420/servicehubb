import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Calendar, Package, Shield } from "lucide-react";
import { toast } from "sonner";

interface BookingRow {
  id: string;
  service_name: string;
  price: number;
  status: string;
  scheduled_date: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  paid: "bg-primary/15 text-primary",
  accepted: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

export const Route = createFileRoute("/dashboard/customer")({
  head: () => ({ meta: [{ title: "My bookings — Service Hub" }] }),
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { user, loading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const claimAdmin = async () => {
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error) return toast.error(error.message);
    if (data) {
      toast.success("You are now an admin!");
      await refreshRoles();
      navigate({ to: "/dashboard/admin" });
    } else {
      toast.error("An admin already exists.");
    }
  };

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("id,service_name,price,status,scheduled_date,created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setBookings((data as BookingRow[]) ?? []));
  }, [user]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My bookings</h1>
          <p className="text-muted-foreground mt-1">Track your service bookings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={claimAdmin}><Shield className="h-4 w-4 mr-1.5" />Claim admin</Button>
          <Button asChild className="bg-primary hover:bg-primary-hover">
            <Link to="/services">Browse services</Link>
          </Button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No bookings yet.</p>
          <Button asChild className="bg-primary hover:bg-primary-hover">
            <Link to="/services">Find a service</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
              <div className="flex-1">
                <div className="font-semibold">{b.service_name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                  {b.scheduled_date && (
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(b.scheduled_date).toLocaleString()}</span>
                  )}
                  <span>Booked {new Date(b.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${STATUS_STYLES[b.status] ?? "bg-muted"}`}>
                  {b.status}
                </span>
                <div className="font-bold">PKR {Number(b.price).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
