import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const Contact = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you within 24 hours.");
    e.target.reset();
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-50" />

      <div className="container relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="text-sm font-bold uppercase tracking-widest text-accent mb-4">Contact Us</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Got questions? <span className="text-gradient">Let's talk.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're a student, staff member or considering Smart Campus for your university, we'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 max-w-6xl mx-auto">
          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: Mail, label: "Email us", value: "hello@smartcampus.lk", color: "primary" },
              { icon: Phone, label: "Call us", value: "+94 11 754 4801", color: "accent" },
              { icon: MapPin, label: "Visit us", value: "SLIIT Malabe Campus, New Kandy Rd", color: "info" },
            ].map((c) => (
              <div
                key={c.label}
                className="flex gap-4 p-6 rounded-2xl bg-card border border-border shadow-elegant hover:shadow-glow transition-smooth"
              >
                <div
                  className="h-12 w-12 shrink-0 rounded-xl grid place-items-center"
                  style={{
                    background: `hsl(var(--${c.color}) / 0.15)`,
                    color: `hsl(var(--${c.color}))`,
                  }}
                >
                  <c.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    {c.label}
                  </div>
                  <div className="font-display font-semibold text-foreground">{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-3 p-8 md:p-10 rounded-3xl bg-card border border-border shadow-elegant space-y-5"
          >
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                  Your name
                </label>
                <Input id="name" required placeholder="Jane Doe" className="h-12 bg-background border-border" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email address
                </label>
                <Input id="email" type="email" required placeholder="jane@example.com" className="h-12 bg-background border-border" />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold mb-2">
                Subject
              </label>
              <Input id="subject" required placeholder="How can we help?" className="h-12 bg-background border-border" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-semibold mb-2">
                Message
              </label>
              <Textarea
                id="message"
                required
                placeholder="Tell us a bit about what you need..."
                rows={5}
                className="bg-background border-border resize-none"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02] transition-smooth h-12 text-base"
            >
              Send message
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
