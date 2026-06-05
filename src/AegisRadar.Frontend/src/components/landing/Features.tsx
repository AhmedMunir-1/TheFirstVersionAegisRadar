import { Shield, Zap, Bell, BarChart3, Lock, Globe } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

const features = [
  {
    icon: Zap,
    title: "Real-time Detection",
    description: "Monitor transactions as they happen with our high-speed API that processes requests in under 50ms.",
  },
  {
    icon: Shield,
    title: "AI Risk Scoring",
    description: "Advanced machine learning models trained on Egyptian market data for accurate fraud risk assessment.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Automated email notifications with tiered security guidance based on threat severity levels.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Comprehensive reporting and analysis tools to understand patterns and optimize your fraud prevention.",
  },
  {
    icon: Lock,
    title: "Secure API",
    description: "Enterprise-grade security with encrypted data transmission and SOC 2 compliant infrastructure.",
  },
  {
    icon: Globe,
    title: "Egypt-Focused",
    description: "Tailored for Egyptian payment methods, regulations, and local fraud patterns unique to the region.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-aegis-surface/30 to-background" />
      
      <div className="container relative z-10 px-6">
        {/* Section Header */}
        <ScrollReveal variant="fadeUp" className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to
            <span className="text-gradient"> Stop Fraud</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A complete fraud detection platform built specifically for Egyptian E-commerce businesses.
          </p>
        </ScrollReveal>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <ScrollReveal
              key={feature.title}
              variant="fadeUp"
              delay={index * 0.1}
            >
              <div className="group relative p-6 rounded-xl bg-card-gradient border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card h-full">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
