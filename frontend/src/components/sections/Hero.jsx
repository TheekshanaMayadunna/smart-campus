import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/Assests/hero-campus.jpg";

const Hero = () => {
  return (
    <section id="top" className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Modern university campus at sunset"
          className="h-full w-full object-cover"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
        <div className="absolute inset-0 bg-radial-glow" />
      </div>

      <div className="container grid lg:grid-cols-2 gap-12 items-center py-20">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            Smart Campus Operations Hub
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
            One platform.
            <br />
            <span className="text-gradient">Every campus operation.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
            Book lecture halls, reserve labs, manage equipment and report incidents — all from a single, beautiful interface designed for students, staff and administrators.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-smooth h-12 px-8 text-base">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-2 hover:bg-accent hover:text-accent-foreground transition-smooth">
              Watch Demo
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-8 max-w-md">
            {[
              { v: "120+", l: "Resources" },
              { v: "5k+", l: "Bookings" },
              { v: "99.9%", l: "Uptime" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-3xl font-display font-bold text-gradient">{s.v}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block animate-float">
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-hero opacity-30 blur-3xl rounded-full" />
            <div className="relative rounded-3xl border border-border/50 glass p-2 shadow-glow">
              <div className="rounded-2xl bg-gradient-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <div className="h-3 w-3 rounded-full bg-success" />
                  </div>
                  <span className="text-xs text-muted-foreground">live preview</span>
                </div>
                {[
                  { name: "Lecture Hall A", status: "APPROVED", color: "success" },
                  { name: "Computer Lab 3", status: "PENDING", color: "warning" },
                  { name: "Projector #12", status: "MAINTENANCE", color: "info" },
                  { name: "Meeting Room B", status: "APPROVED", color: "success" },
                ].map((r, i) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3 border border-border/50"
                    style={{ animation: `fade-up 0.6s ${i * 0.1}s both` }}
                  >
                    <span className="font-medium">{r.name}</span>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: `hsl(var(--${r.color}) / 0.15)`,
                        color: `hsl(var(--${r.color}))`,
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
