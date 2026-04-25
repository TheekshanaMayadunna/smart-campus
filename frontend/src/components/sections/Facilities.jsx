import lectureImg from "@/Assests/facility-lecture.jpg";
import labImg from "@/Assests/facility-lab.jpg";
import meetingImg from "@/Assests/facility-meeting.jpg";
import equipmentImg from "@/Assests/facility-equipment.jpg";

const FACILITIES = [
  {
    title: "Lecture Halls",
    desc: "Auditorium-style halls with capacities from 50 to 500 — book by the hour with instant conflict checking.",
    img: lectureImg,
    tag: "Capacity 50–500",
  },
  {
    title: "Computer Labs",
    desc: "Fully-equipped labs with the latest software stacks, perfect for practicals, hackathons and group work.",
    img: labImg,
    tag: "30+ workstations",
  },
  {
    title: "Meeting Rooms",
    desc: "Quiet, modern meeting rooms with displays and video-conferencing — ideal for project teams and committees.",
    img: meetingImg,
    tag: "4–20 people",
  },
  {
    title: "AV Equipment",
    desc: "Projectors, professional cameras, microphones and tripods. Reserve, collect and return — all tracked.",
    img: equipmentImg,
    tag: "120+ assets",
  },
];

const Facilities = () => {
  return (
    <section id="facilities" className="py-24 md:py-32 bg-secondary/30 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-radial-glow opacity-40 -z-0" />

      <div className="container relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="text-sm font-bold uppercase tracking-widest text-accent mb-4">Facilities & Assets</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Everything on campus, <span className="text-gradient">at your fingertips.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From lecture halls to a single tripod — every bookable resource lives in one searchable catalogue with real-time availability.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FACILITIES.map((f, i) => (
            <article
              key={f.title}
              className="group relative rounded-2xl overflow-hidden bg-card border border-border shadow-elegant hover:shadow-glow transition-smooth hover:-translate-y-2"
              style={{ animation: `fade-up 0.6s ${i * 0.1}s both` }}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={f.img}
                  alt={f.title}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-700"
                />
              </div>
              <div className="absolute top-4 left-4">
                <span className="inline-block bg-background/90 backdrop-blur text-foreground text-xs font-bold px-3 py-1 rounded-full border border-border">
                  {f.tag}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-smooth">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Facilities;
