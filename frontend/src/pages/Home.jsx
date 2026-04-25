import Navbar from "@/components/Navbar.jsx";
import Hero from "@/components/sections/Hero.jsx";
import About from "@/components/sections/About.jsx";
import Facilities from "@/components/sections/Facilities.jsx";
import Features from "@/components/sections/Features.jsx";
import HowItWorks from "@/components/sections/HowItWorks.jsx";
import Stats from "@/components/sections/Stats.jsx";
import Testimonials from "@/components/sections/Testimonials.jsx";
import Contact from "@/components/sections/Contact.jsx";
import Footer from "@/components/sections/Footer.jsx";

const Home = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <About />
      <Facilities />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
};

export default Home;
