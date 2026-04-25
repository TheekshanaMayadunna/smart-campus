import { GraduationCap } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";

const NAV = [
  { label: "About", href: "#about" },
  { label: "Facilities", href: "#facilities" },
  { label: "How it works", href: "#how" },
  { label: "Stats", href: "#stats" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 glass">
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow group-hover:scale-110 transition-smooth">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Smart<span className="text-primary">Campus</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 after:bg-gradient-primary after:transition-all hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
