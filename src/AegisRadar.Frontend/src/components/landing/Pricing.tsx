import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ScrollReveal from "@/components/ui/scroll-reveal";

const plans = [
  {
    name: "Starter",
    price: "1,500",
    currency: "EGP",
    period: "/month",
    description: "Perfect for small businesses just getting started.",
    features: [
      "Up to 5,000 transactions/month",
      "Real-time fraud detection",
      "Email alerts",
      "Basic dashboard",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Business",
    price: "4,500",
    currency: "EGP",
    period: "/month",
    description: "For growing businesses with higher volume needs.",
    features: [
      "Up to 25,000 transactions/month",
      "Advanced AI risk scoring",
      "Tiered security alerts",
      "Full analytics dashboard",
      "Priority support",
      "Custom rules engine",
      "API webhooks",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    currency: "",
    period: "",
    description: "For large businesses with custom requirements.",
    features: [
      "Unlimited transactions",
      "Dedicated AI model training",
      "24/7 phone support",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-aegis-surface/20 to-background" />

      <div className="container relative z-10 px-6">
        {/* Section Header */}
        <ScrollReveal variant="fadeUp" className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, Transparent
            <span className="text-gradient"> Pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose the plan that fits your business. All plans include a 14-day free trial.
          </p>
        </ScrollReveal>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <ScrollReveal
              key={plan.name}
              variant="scaleUp"
              delay={index * 0.1}
            >
              <div
                className={`relative rounded-2xl p-6 transition-all duration-300 h-full ${
                  plan.popular
                    ? "bg-card-gradient border-2 border-primary shadow-glow scale-105"
                    : "bg-card-gradient border border-border hover:border-primary/30"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Most Popular
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    {plan.currency && (
                      <span className="text-sm text-muted-foreground">{plan.currency}</span>
                    )}
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.cta === "Contact Sales" ? (
                  <Button
                    variant="heroOutline"
                    className="w-full"
                    onClick={() => {
                      toast.success("Request Received!", {
                        description: "Our enterprise sales team will reach out to you within 2 hours at demo@aegisradar.io.",
                        duration: 5000,
                      });
                    }}
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    variant={plan.popular ? "hero" : "heroOutline"}
                    className="w-full"
                    asChild
                  >
                    <Link to="/register">{plan.cta}</Link>
                  </Button>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
