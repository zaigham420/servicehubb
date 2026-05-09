import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Briefcase, TrendingUp, ShieldCheck, Wallet } from "lucide-react";

export const Route = createFileRoute("/become-provider")({
  head: () => ({
    meta: [
      { title: "Become a provider — Service Hub" },
      { name: "description", content: "Earn money offering your services on Service Hub. List your skills and start receiving bookings today." },
    ],
  }),
  component: BecomeProviderPage,
});

function BecomeProviderPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-accent/40 to-background py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Briefcase className="h-4 w-4" /> Earn on your terms
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Turn your skills into <span className="text-primary">income</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of providers earning steady income through Service Hub. Set your own prices, choose your hours.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary-hover h-12 px-8 text-base">
            <Link to="/signup">Start earning today</Link>
          </Button>
        </div>
      </section>
      <section className="py-20 container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { icon: TrendingUp, title: "Grow your business", desc: "Reach thousands of customers actively looking for what you offer." },
            { icon: Wallet, title: "Keep 85%", desc: "Transparent 15% platform fee. The rest is yours, every booking." },
            { icon: ShieldCheck, title: "Secure payments", desc: "We handle the money. You focus on doing great work." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary mb-4">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
