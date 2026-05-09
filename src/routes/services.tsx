import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

interface ServiceRow {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
}

export const Route = createFileRoute("/services")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Browse services — Service Hub" },
      { name: "description", content: "Discover trusted providers across cleaning, repairs, tutoring, beauty and more." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { q: initialQ, category: initialCat } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [category, setCategory] = useState(initialCat ?? "");
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    let query = supabase
      .from("services")
      .select("id,title,description,category,price,image_url")
      .eq("is_active", true);
    if (category) query = query.eq("category", category);
    if (q) query = query.ilike("title", `%${q}%`);
    query.order("created_at", { ascending: false }).then(({ data }) => {
      if (!active) return;
      setServices((data as ServiceRow[]) ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [q, category]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">Browse services</h1>
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search services..."
            className="pl-12 h-12 rounded-xl"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-4 px-4">
        <button
          onClick={() => setCategory("")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
            !category ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug === category ? "" : c.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              category === c.slug ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-1/3 bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No services match your search.</p>
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
    </div>
  );
}
