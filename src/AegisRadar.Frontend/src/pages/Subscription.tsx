import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const getPlans = (isEG: boolean) => [
  {
    id: "starter",
    name: "Starter",
    price: isEG ? 1500 : 29,
    currency: isEG ? "EG" : "$",
    isSuffix: isEG,
    period: "month",
    description: "Perfect for small businesses getting started with fraud protection.",
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/40",
    glowColor: "shadow-blue-500/20",
    badgeColor: "bg-blue-500/20 text-blue-300",
    features: [
      "Up to 1,000 transactions/month",
      "Real-time fraud detection",
      "Basic alerts & notifications",
      "Email support",
      "Dashboard analytics",
      "API access",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: isEG ? 4500 : 99,
    currency: isEG ? "EG" : "$",
    isSuffix: isEG,
    period: "month",
    description: "For growing businesses that need advanced fraud intelligence.",
    color: "from-violet-500 to-purple-600",
    borderColor: "border-violet-500/40",
    glowColor: "shadow-violet-500/20",
    badgeColor: "bg-violet-500/20 text-violet-300",
    popular: true,
    features: [
      "Up to 10,000 transactions/month",
      "Advanced AI fraud detection",
      "Priority alerts & notifications",
      "Priority email & chat support",
      "Advanced analytics & reports",
      "Team collaboration (5 members)",
      "Custom risk thresholds",
      "Webhook integrations",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    currency: isEG ? "EG" : "$",
    isSuffix: isEG,
    customPrice: true,
    period: "month",
    description: "For large enterprises requiring full-scale fraud prevention.",
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/40",
    glowColor: "shadow-amber-500/20",
    badgeColor: "bg-amber-500/20 text-amber-300",
    features: [
      "Unlimited transactions",
      "Custom AI model tuning",
      "24/7 dedicated support",
      "SLA guarantee (99.99% uptime)",
      "Custom analytics & BI integration",
      "Unlimited team members",
      "Advanced posture reports",
      "Dedicated account manager",
      "On-premise deployment option",
    ],
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const isEG = user?.country?.toLowerCase() === "egypt" || user?.country?.toLowerCase() === "eg";
  const plans = getPlans(isEG);

  const handleContinue = () => {
    if (!selected) return;
    if (selected === "enterprise") {
      window.location.href = "mailto:sales@aegisradar.com?subject=Enterprise%20Plan%20Inquiry";
      return;
    }
    const plan = plans.find((p) => p.id === selected)!;
    const price = plan.customPrice
      ? 0
      : billingCycle === "annual"
      ? Math.round(plan.price * 0.8)
      : plan.price;
    navigate("/dashboard/payment", {
      state: {
        planId: plan.id,
        planName: plan.name,
        price,
        billingCycle,
        currency: plan.currency,
        isSuffix: plan.isSuffix,
      },
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            AegisRadar Subscription Plans
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Protection Plan
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Your 14-day free trial has ended. Select a monthly subscription to continue protecting your transactions.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 mt-6 p-1 bg-slate-800/80 border border-slate-700 rounded-xl">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-slate-700 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-slate-700 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Annual
              <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full font-semibold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => {
            const displayPrice =
              billingCycle === "annual"
                ? Math.round(plan.price * 0.8)
                : plan.price;
            const isSelected = selected === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`relative cursor-pointer rounded-2xl border p-6 transition-all duration-300 group ${
                  plan.popular ? "md:-translate-y-2" : ""
                } ${
                  isSelected
                    ? `${plan.borderColor} shadow-xl ${plan.glowColor} bg-slate-800/80`
                    : "border-slate-700/60 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg">
                      ✦ Most Popular
                    </span>
                  </div>
                )}

                {/* Selected ring */}
                {isSelected && (
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${plan.color} opacity-5`} />
                )}

                <div className="relative z-10">
                  {/* Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-400 mt-1 leading-snug">{plan.description}</p>
                    </div>
                    {/* Selection indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                        isSelected
                          ? `border-transparent bg-gradient-to-br ${plan.color}`
                          : "border-slate-600"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.customPrice ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-2xl font-extrabold text-white">Customize Price</span>
                        <a href="mailto:sales@aegisradar.com?subject=Enterprise%20Plan%20Inquiry" className="text-sm text-violet-400 hover:text-violet-300 underline mt-1 transition-colors">
                          Contact Us
                        </a>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-white">
                            {plan.isSuffix ? `${displayPrice} ${plan.currency}` : `${plan.currency}${displayPrice}`}
                          </span>
                          <span className="text-gray-400 text-sm">/month</span>
                        </div>
                        {billingCycle === "annual" && (
                          <div className="text-xs text-green-400 mt-0.5">
                            Billed annually · Save {plan.isSuffix ? `${(plan.price - displayPrice) * 12} ${plan.currency}` : `${plan.currency}${(plan.price - displayPrice) * 12}`}/yr
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-700/60 mb-5" />

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            isSelected ? "text-green-400" : "text-slate-500"
                          }`}
                        />
                        <span className={isSelected ? "text-gray-200" : "text-gray-400"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
              selected
                ? "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:scale-105"
                : "bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            {selected === "enterprise" ? (
              <>
                Contact Sales
                <ArrowRight className="w-5 h-5" />
              </>
            ) : selected ? (
              <>
                Continue to Payment
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              "Select a plan to continue"
            )}
          </button>
          <p className="text-xs text-gray-500">
            Secured payments · Cancel anytime · No hidden fees
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
