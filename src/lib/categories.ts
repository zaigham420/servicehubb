export const CATEGORIES = [
  { slug: "cleaning", name: "Home Cleaning", emoji: "🧹", color: "from-blue-100 to-blue-50" },
  { slug: "repairs", name: "Repairs & Handyman", emoji: "🔧", color: "from-orange-100 to-orange-50" },
  { slug: "beauty", name: "Beauty & Wellness", emoji: "💆", color: "from-pink-100 to-pink-50" },
  { slug: "tutoring", name: "Tutoring", emoji: "📚", color: "from-purple-100 to-purple-50" },
  { slug: "tech", name: "Tech Support", emoji: "💻", color: "from-cyan-100 to-cyan-50" },
  { slug: "fitness", name: "Fitness & Coaching", emoji: "💪", color: "from-red-100 to-red-50" },
  { slug: "moving", name: "Moving & Delivery", emoji: "📦", color: "from-yellow-100 to-yellow-50" },
  { slug: "events", name: "Events & Catering", emoji: "🎉", color: "from-green-100 to-green-50" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);
