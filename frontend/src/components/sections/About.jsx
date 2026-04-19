import aboutImg from "@/Assests/about-students.jpg";
import { CheckCircle2 } from "lucide-react";

const POINTS = [
  "Built specifically for modern university campuses and faculties.",
  "Role-based access for Students, Staff, Technicians and Admins.",
  "Real-time notifications keep everyone in the loop.",
  "Secure OAuth 2.0 sign-in — no password headaches.",
];

const About = () => {
  return (
    <section id="about" className="py-24 md:py-32 relative">
      <div className="container grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -inset-4 bg-gradient-accent opacity-20 blur-3xl rounded-3xl" />
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-elegant">
            <img
              src={aboutImg}
              alt="Students collaborating on the Smart Campus platform"
              loading="lazy"
              width={1280}
              height={896}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-card border border-border rounded-2xl p-5 shadow-elegant max-w-[220px]">
            <div className="text-3xl font-display font-bold text-primary">98%</div>
            <div className="text-sm text-muted-foreground mt-1">User satisfaction across all faculties</div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="text-sm font-bold uppercase tracking-widest text-accent mb-4">About Us</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
            We modernize how universities <span className="text-gradient">run every day.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            The Smart Campus Operations Hub was born from a simple question: why do students still queue for room bookings, and why does a broken projector take days to fix? We replace messy spreadsheets, scattered emails and manual approvals with a single, transparent platform built around the people who use the campus every day.
          </p>

          <ul className="space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground/90">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default About;
