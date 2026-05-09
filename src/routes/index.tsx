import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, ShieldCheck, Zap } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

interface ServiceCard {
  id: string;
  title: string;
  category: string;
  price: number;
  image_url: string | null;
  provider_id: string;
}

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [services, setServices] = useState<ServiceCard[]>([]);

  useEffect(() => {
    supabase
      .from("services")
      .select("id,title,category,price,image_url,provider_id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setServices((data as ServiceCard[]) ?? []));
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/services", search: { q } as never });
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-primary text-sm font-medium mb-5">
              <Zap className="h-4 w-4" /> 10,000+ trusted providers
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Find the right <span className="text-primary">service</span>, right now.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              From cleaning to repairs to tutoring — book vetted local pros in minutes and pay securely in one place.
            </p>
            <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Try ‘deep cleaning’ or ‘math tutor’"
                  className="h-13 pl-12 text-base bg-card border-border h-14 rounded-xl"
                />
              </div>
              <Button type="submit" size="lg" className="bg-primary hover:bg-primary-hover h-14 px-8 text-base rounded-xl">
                Search
              </Button>
            </form>
            <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Verified pros</div>
              <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-warning fill-warning" /> 4.9 average rating</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent rounded-[2rem] blur-2xl" aria-hidden />
            <img
              src={heroImg}
              alt="Trusted service professional ready to help at home"
              width={1280}
              height={960}
              className="relative rounded-3xl shadow-card-hover w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Popular categories</h2>
            <p className="text-muted-foreground mt-2">Tap a category to browse providers near you.</p>
          </div>
          <Link to="/services" className="text-primary font-medium hover:underline hidden sm:inline">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/services"
              search={{ category: c.slug } as never}
              className={`group bg-gradient-to-br ${c.color} dark:from-card dark:to-card rounded-2xl p-6 hover:shadow-card-hover transition-all border border-border/50`}
            >
              <div className="text-4xl mb-3">{c.emoji}</div>
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="container mx-auto px-4 py-16 border-t border-border">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">Latest on Service Hub</h2>
          <Link to="/services" className="text-primary font-medium hover:underline">Browse all</Link>
        </div>
        {services.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <p className="text-muted-foreground mb-4">No services listed yet. Be the first!</p>
            <Button asChild className="bg-primary hover:bg-primary-hover">
              <Link to="/become-provider">Become a provider</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s) => (
              <Link
                key={s.id}
                to="/services/$id"
                params={{ id: s.id }}
                className="group bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.title} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">{CATEGORIES.find((c) => c.slug === s.category)?.emoji ?? "✨"}</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{s.category}</div>
                  <div className="font-semibold mt-1 line-clamp-2 group-hover:text-primary transition-colors">{s.title}</div>
                  <div className="mt-3 font-bold text-lg">PKR {Number(s.price).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-primary to-primary-hover rounded-3xl p-10 md:p-16 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to earn doing what you love?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            List your services for free. Keep 85% of every booking.
          </p>
          <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base">
            <Link to="/signup">Become a provider</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
