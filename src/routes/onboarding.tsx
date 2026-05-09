import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingBag, Briefcase, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Choose your role — Service Hub" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, roles, loading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [picking, setPicking] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (roles.length > 0) {
      // already onboarded
      if (roles.includes("provider")) navigate({ to: "/dashboard/provider" });
      else navigate({ to: "/dashboard/customer" });
    }
  }, [user, roles, loading, navigate]);

  const pick = async (role: "customer" | "provider") => {
    if (!user) return;
    setPicking(role);
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
    if (error) {
      toast.error(error.message);
      setPicking(null);
      return;
    }
    if (role === "provider") {
      // Also seed provider profile shell
      await supabase.from("provider_profiles").insert({ user_id: user.id }).select().maybeSingle();
    }
    await refreshRoles();
    toast.success(`Welcome aboard as a ${role}!`);
    navigate({ to: role === "provider" ? "/dashboard/provider" : "/dashboard/customer" });
  };

  if (loading || !user) return null;

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">How will you use Service Hub?</h1>
        <p className="text-muted-foreground text-lg">Pick a role to get started. You can add the other one later.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => pick("customer")}
          disabled={!!picking}
          className="group text-left bg-card border-2 border-border rounded-2xl p-8 hover:border-primary hover:shadow-card-hover transition-all disabled:opacity-50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-primary mb-5">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold mb-2">I need services</h2>
          <p className="text-muted-foreground mb-4">Browse providers, book in seconds, pay securely.</p>
          <ul className="space-y-2 text-sm">
            {["Search hundreds of services", "Transparent pricing", "Track every booking"].map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
            ))}
          </ul>
        </button>
        <button
          onClick={() => pick("provider")}
          disabled={!!picking}
          className="group text-left bg-card border-2 border-border rounded-2xl p-8 hover:border-primary hover:shadow-card-hover transition-all disabled:opacity-50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-primary mb-5">
            <Briefcase className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold mb-2">I offer services</h2>
          <p className="text-muted-foreground mb-4">List your skills, get bookings, earn money.</p>
          <ul className="space-y-2 text-sm">
            {["Reach paying customers", "Manage bookings in one place", "Get paid after every job"].map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
            ))}
          </ul>
        </button>
      </div>
      <div className="text-center mt-8">
        <Button variant="ghost" onClick={() => navigate({ to: "/" })}>Skip for now</Button>
      </div>
    </div>
  );
}
