import { Building2, CalendarCheck, Wrench, Users } from "lucide-react";

const STATS = [
  { icon: Building2, value: "120+", label: "Bookable Resources", color: "primary" },
  { icon: CalendarCheck, value: "5,400", label: "Bookings Processed", color: "accent" },
  { icon: Wrench, value: "1,200", label: "Tickets Resolved", color: "success" },
  { icon: Users, value: "8,500", label: "Active Users", color: "info" },
];

const Stats = () => {
  return (
    <section id="stats" className="py-20 relative">
      <div className="container">
        <div className="rounded-3xl bg-gradient-hero p-1 shadow-glow">
          <div className="rounded-[calc(1.5rem-4px)] bg-card p-10 md:p-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className="text-center group"
                  style={{ animation: `fade-up 0.5s ${i * 0.1}s both` }}
                >
                  <div
                    className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4 group-hover:scale-110 transition-smooth"
                    style={{
                      background: `hsl(var(--${s.color}) / 0.15)`,
                      color: `hsl(var(--${s.color}))`,
                    }}
                  >
                    <s.icon className="h-8 w-8" />
                  </div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-gradient mb-2">
                    {s.value}
                  </div>
                  <div className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
