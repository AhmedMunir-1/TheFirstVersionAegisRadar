import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-aegis-blue/10 to-aegis-purple/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-glow opacity-50" />

      <div className="container relative z-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <ScrollReveal variant="scaleUp">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-8"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Shield className="w-8 h-8 text-primary" />
            </motion.div>
          </ScrollReveal>

          {/* Headline */}
          <ScrollReveal variant="fadeUp" delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Ready to Protect Your
              <span className="text-gradient"> Business?</span>
            </h2>
          </ScrollReveal>

          {/* Subheadline */}
          <ScrollReveal variant="fadeUp" delay={0.2}>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join 500+ Egyptian E-businesses already using AegisRadar to stop fraud before it happens. Start your free trial today.
            </p>
          </ScrollReveal>

          {/* CTA Buttons */}
          <ScrollReveal variant="fadeUp" delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  Start Free 14-Day Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="heroOutline"
                size="lg"
                onClick={() => {
                  toast.success("Demo Scheduled!", {
                    description: "We have sent a Google Meet invite to demo@aegisradar.io to schedule your interactive tour.",
                    duration: 5000,
                  });
                }}
              >
                Schedule a Demo
              </Button>
            </div>
          </ScrollReveal>

          {/* Trust Note */}
          <ScrollReveal variant="fadeIn" delay={0.4}>
            <p className="text-sm text-muted-foreground mt-8">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CTA;
