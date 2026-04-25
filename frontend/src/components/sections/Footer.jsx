import { GraduationCap, Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background relative">
      <div className="container py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">
                Smart<span className="text-primary">Campus</span>
              </span>
            </div>
            <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
              Smart Campus Operations Hub modernizes day-to-day university operations — bookings, assets, and incident handling — in a single, beautiful platform.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="social link"
                  className="h-10 w-10 rounded-full grid place-items-center bg-secondary hover:bg-primary hover:text-primary-foreground transition-smooth border border-border"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#facilities" className="hover:text-foreground transition-smooth">Facilities</a></li>
              <li><a href="#how" className="hover:text-foreground transition-smooth">How it works</a></li>
              <li><a href="#stats" className="hover:text-foreground transition-smooth">Statistics</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#about" className="hover:text-foreground transition-smooth">About Us</a></li>
              <li><a href="#contact" className="hover:text-foreground transition-smooth">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Smart Campus Operations Hub. Built for IT3030 — SLIIT.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with care for modern campuses.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
