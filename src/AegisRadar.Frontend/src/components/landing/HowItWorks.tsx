import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

const steps = [
  {
    number: "01",
    title: "Integrate Our API",
    description: "Add our simple REST API to your checkout flow. We provide SDKs for all major platforms and detailed documentation.",
    highlight: "5-minute setup",
  },
  {
    number: "02",
    title: "Analyze Transactions",
    description: "Every transaction is scored in real-time using our AI model trained on millions of Egyptian payment patterns.",
    highlight: "< 50ms latency",
  },
  {
    number: "03",
    title: "Get Instant Alerts",
    description: "Receive automated email alerts with actionable guidance when suspicious activity is detected.",
    highlight: "Tiered alerts",
  },
  {
    number: "04",
    title: "Review & Report",
    description: "Use our comprehensive dashboard to analyze trends, generate reports, and optimize your fraud rules.",
    highlight: "Full analytics",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-glow opacity-50" />
      
      <div className="container relative z-10 px-6">
        {/* Section Header */}
        <ScrollReveal variant="fadeUp" className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How <span className="text-gradient">AegisRadar</span> Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Get protected in minutes with our streamlined integration process.
          </p>
        </ScrollReveal>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <ScrollReveal
              key={step.number}
              variant="fadeLeft"
              delay={index * 0.15}
            >
              <div className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-20 bottom-0 w-px bg-gradient-to-b from-primary/50 to-border hidden md:block" />
                )}

                <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-12 group">
                  {/* Number */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-secondary border-2 border-primary/30 flex items-center justify-center group-hover:border-primary transition-colors">
                      <span className="text-xl font-bold text-gradient">{step.number}</span>
                    </div>
                    <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {step.highlight}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow (mobile hidden) */}
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden lg:block w-5 h-5 text-muted-foreground self-center rotate-90 md:rotate-0" />
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
