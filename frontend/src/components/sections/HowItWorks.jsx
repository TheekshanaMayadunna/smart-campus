import dashboardImg from "@/Assests/dashboard-preview.jpg";
import maintenanceImg from "@/Assests/maintenance.jpg";

const STEPS = [
  {
    n: "01",
    title: "Sign in with your campus account",
    desc: "Use Google OAuth — no extra passwords. We pick up your role automatically.",
  },
  {
    n: "02",
    title: "Browse the resource catalogue",
    desc: "Filter by type, location and capacity. See live availability windows for every room and asset.",
  },
  {
    n: "03",
    title: "Request a booking or report an issue",
    desc: "Submit a booking with date, time and purpose. Or open an incident ticket with up to 3 photos.",
  },
  {
    n: "04",
    title: "Get notified the moment it's actioned",
    desc: "Approvals, rejections and status changes hit your notifications panel in real time.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how" className="py-24 md:py-32 bg-secondary/30 relative">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="text-sm font-bold uppercase tracking-widest text-accent mb-4">How it works</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            From request to resolution in <span className="text-gradient">four simple steps.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="flex gap-6 group"
                style={{ animation: `fade-up 0.5s ${i * 0.1}s both` }}
              >
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-primary text-primary-foreground font-display font-bold text-xl grid place-items-center shadow-glow group-hover:scale-110 transition-smooth">
                    {s.n}
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="font-display text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl overflow-hidden border border-border shadow-elegant relative group">
              <img
                src={dashboardImg}
                alt="Booking dashboard preview"
                loading="lazy"
                width={1280}
                height={896}
                className="w-full object-cover group-hover:scale-105 transition-smooth duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
            <div className="rounded-3xl overflow-hidden border border-border shadow-elegant relative group">
              <img
                src={maintenanceImg}
                alt="Technician resolving a maintenance ticket"
                loading="lazy"
                width={1280}
                height={896}
                className="w-full object-cover group-hover:scale-105 transition-smooth duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-sm font-bold uppercase tracking-wider text-accent mb-1">Live ticket</div>
                <div className="text-foreground font-display text-xl font-bold">Average resolution: 4.2 hrs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
