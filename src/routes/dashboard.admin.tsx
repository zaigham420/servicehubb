import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Receipt, ShoppingBag, Percent } from "lucide-react";

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  created_at: string;
  roles?: string[];
}
interface BookingRow {
  id: string;
  service_name: string;
  price: number;
  commission_amount: number;
  status: string;
  created_at: string;
  customer_id: string;
  provider_id: string;
}
interface TxRow {
  id: string;
  total_amount: number;
  commission_cut: number;
  provider_amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  created_at: string;
}

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin panel — Service Hub" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [commission, setCommission] = useState("15");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!roles.includes("admin")) {
      // Don't redirect if roles still loading; check after a tick
      setTimeout(() => {
        if (!roles.includes("admin")) {
          toast.error("Admin access required");
          navigate({ to: "/" });
        }
      }, 500);
    }
  }, [user, roles, loading, navigate]);

  const refresh = async () => {
    const [{ data: ps }, { data: pr }, { data: rls }, { data: bk }, { data: tx }] = await Promise.all([
      supabase.from("platform_settings").select("commission_percent").eq("id", 1).maybeSingle(),
      supabase.from("profiles").select("id,full_name,email,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
    ]);
    if (ps) setCommission(String(ps.commission_percent));
    const rolesByUser: Record<string, string[]> = {};
    (rls ?? []).forEach((r: { user_id: string; role: string }) => {
      rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] ?? []), r.role];
    });
    setUsers(((pr as UserRow[]) ?? []).map((u) => ({ ...u, roles: rolesByUser[u.id] ?? [] })));
    setBookings((bk as BookingRow[]) ?? []);
    setTxs((tx as TxRow[]) ?? []);
  };

  useEffect(() => {
    if (roles.includes("admin")) refresh();
  }, [roles]);

  const saveCommission = async () => {
    const pct = parseFloat(commission);
    if (isNaN(pct) || pct < 0 || pct > 100) return toast.error("Enter a valid %");
    const { error } = await supabase.from("platform_settings").update({ commission_percent: pct }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Commission updated");
  };

  if (!user || !roles.includes("admin")) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  const totalRevenue = txs.filter((t) => t.payment_status === "success").reduce((s, t) => s + Number(t.commission_cut), 0);
  const totalGmv = txs.filter((t) => t.payment_status === "success").reduce((s, t) => s + Number(t.total_amount), 0);

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2">Admin panel</h1>
      <p className="text-muted-foreground mb-8">Manage Service Hub.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={Users} label="Users" value={String(users.length)} />
        <Stat icon={ShoppingBag} label="Bookings" value={String(bookings.length)} />
        <Stat icon={Receipt} label="GMV" value={`PKR ${totalGmv.toLocaleString()}`} />
        <Stat icon={Percent} label="Platform revenue" value={`PKR ${totalRevenue.toLocaleString()}`} />
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          <Table head={["Service", "Price", "Commission", "Status", "Date"]}>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-border">
                <td className="py-3 px-4">{b.service_name}</td>
                <td className="py-3 px-4">PKR {Number(b.price).toLocaleString()}</td>
                <td className="py-3 px-4 text-success">PKR {Number(b.commission_amount).toLocaleString()}</td>
                <td className="py-3 px-4"><span className="text-xs font-semibold px-2 py-1 rounded-full bg-secondary uppercase">{b.status}</span></td>
                <td className="py-3 px-4 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </Table>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Table head={["Transaction", "Method", "Amount", "Commission", "Provider gets", "Status"]}>
            {txs.map((t) => (
              <tr key={t.id} className="border-b border-border">
                <td className="py-3 px-4 font-mono text-xs">{t.transaction_id}</td>
                <td className="py-3 px-4 capitalize">{t.payment_method}</td>
                <td className="py-3 px-4">PKR {Number(t.total_amount).toLocaleString()}</td>
                <td className="py-3 px-4 text-success">PKR {Number(t.commission_cut).toLocaleString()}</td>
                <td className="py-3 px-4">PKR {Number(t.provider_amount).toLocaleString()}</td>
                <td className="py-3 px-4"><span className="text-xs font-semibold px-2 py-1 rounded-full bg-success/15 text-success uppercase">{t.payment_status}</span></td>
              </tr>
            ))}
          </Table>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Table head={["Name", "Email", "Roles", "Joined"]}>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border">
                <td className="py-3 px-4">{u.full_name || "—"}</td>
                <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                <td className="py-3 px-4">
                  {u.roles?.map((r) => (
                    <span key={r} className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-primary mr-1 capitalize">{r}</span>
                  ))}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </Table>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md shadow-card">
            <h3 className="font-bold text-lg mb-1">Platform commission</h3>
            <p className="text-sm text-muted-foreground mb-4">Percentage charged on every successful booking.</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Commission %</Label>
                <Input type="number" min={0} max={100} step={0.1} value={commission} onChange={(e) => setCommission(e.target.value)} />
              </div>
            </div>
            <Button onClick={saveCommission} className="mt-4 bg-primary hover:bg-primary-hover">Save</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{head.map((h) => <th key={h} className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase text-xs tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
