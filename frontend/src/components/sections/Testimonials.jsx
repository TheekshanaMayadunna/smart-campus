import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "Booking a lab used to take days of emails. Now it's three clicks and I get an instant confirmation. Game changer.",
    name: "Nimal Perera",
    role: "Final Year Student, Computing",
  },
  {
    quote: "As an admin I can see every booking and every open ticket in one dashboard. The conflict checker alone saved us hours every week.",
    name: "Dr. Anushka Silva",
    role: "Faculty Operations Manager",
  },
  {
    quote: "The QR check-in for room bookings is brilliant. No more lost paper slips, no more arguments at the door.",
    name: "Kavindu Fernando",
    role: "Maintenance Technician",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="text-sm font-bold uppercase tracking-widest text-accent mb-4">Loved on campus</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            What our community <span className="text-gradient">is saying.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className="relative p-8 rounded-2xl bg-gradient-card border border-border shadow-elegant hover:shadow-glow transition-smooth hover:-translate-y-1"
              style={{ animation: `fade-up 0.5s ${i * 0.1}s both` }}
            >
              <Quote className="h-10 w-10 text-primary/30 mb-4" />
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <blockquote className="text-foreground/90 leading-relaxed mb-6">
                "{t.quote}"
              </blockquote>
              <figcaption>
                <div className="font-display font-bold">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
