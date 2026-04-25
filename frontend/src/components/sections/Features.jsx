import { Calendar, Wrench, Bell, Shield, BarChart3, QrCode } from "lucide-react";

const FEATURES = [
  {
    icon: Calendar,
    title: "Smart Booking Workflow",
    desc: "Request → Approve → Confirm. Conflict checking prevents double-bookings automatically.",
    color: "primary",
  },
  {
    icon: Wrench,
    title: "Incident Ticketing",
    desc: "Report a broken projector with photos. Track it from OPEN to RESOLVED with technician updates.",
    color: "accent",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    desc: "Stay informed about booking approvals, ticket updates and new comments — instantly.",
    color: "info",
  },
  {
    icon: Shield,
    title: "Secure OAuth Login",
    desc: "Sign in with Google in one click. Role-based access for Users, Admins and Technicians.",
    color: "success",
  },
  {
    icon: BarChart3,
    title: "Admin Analytics",
    desc: "Top resources, peak hours, ticket resolution times — make data-driven facility decisions.",
    color: "warning",
  },
  {
    icon: QrCode,
    title: "QR Code Check-in",
    desc: "Approved bookings get a unique QR code for fast, contactless verification at the door.",
    color: "primary",
  },
];

const Features = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="text-sm font-bold uppercase tracking-widest text-accent mb-4">Features</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Powerful tools, <span className="text-gradient">beautifully designed.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Every feature is crafted to remove friction from daily campus life.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group relative p-8 rounded-2xl bg-gradient-card border border-border hover:border-primary/50 shadow-elegant hover:shadow-glow transition-smooth hover:-translate-y-1"
              style={{ animation: `fade-up 0.5s ${i * 0.08}s both` }}
            >
              <div
                className="inline-flex h-14 w-14 items-center justify-center rounded-xl mb-5 transition-smooth group-hover:scale-110"
                style={{
                  background: `hsl(var(--${f.color}) / 0.15)`,
                  color: `hsl(var(--${f.color}))`,
                }}
              >
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
