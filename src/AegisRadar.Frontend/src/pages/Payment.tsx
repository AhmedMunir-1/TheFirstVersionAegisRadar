import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  CreditCard,
  Lock,
  CheckCircle2,
  ChevronLeft,
  Shield,
  Loader2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface LocationState {
  planId: string;
  planName: string;
  price: number;
  billingCycle: "monthly" | "annual";
  currency: string;
  isSuffix: boolean;
}

const formatCardNumber = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const formatExpiry = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
};

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as LocationState | null;

  const planName = state?.planName ?? "Business";
  const price = state?.price ?? 99;
  const billingCycle = state?.billingCycle ?? "monthly";
  const currency = state?.currency ?? "$";
  const isSuffix = state?.isSuffix ?? false;

  const displayPrice = isSuffix ? `${price} ${currency}` : `${currency}${price}`;

  const [step, setStep] = useState<"form" | "success">("form");
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim() || !email.includes("@")) newErrors.email = "Valid email is required";
    if (cardNumber.replace(/\s/g, "").length < 16) newErrors.cardNumber = "Enter a valid 16-digit card number";
    if (!cardName.trim()) newErrors.cardName = "Cardholder name is required";
    if (expiry.length < 5) newErrors.expiry = "Enter a valid expiry (MM/YY)";
    if (cvv.length < 3) newErrors.cvv = "Enter a valid CVV";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Key copied to clipboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2200));
    setIsProcessing(false);
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Animated success icon */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-gray-400 mb-1">
            You're now subscribed to the{" "}
            <span className="text-violet-400 font-semibold">{planName} Plan</span>.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            A confirmation receipt has been sent to{" "}
            <span className="text-gray-300">{email}</span>.
          </p>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 mb-8 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Plan</span>
              <span className="text-white font-medium">{planName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Billing</span>
              <span className="text-white font-medium capitalize">{billingCycle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount charged</span>
              <span className="text-white font-medium">{displayPrice}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Next billing date</span>
              <span className="text-white font-medium">
                {new Date(
                  new Date().setMonth(new Date().getMonth() + 1)
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {user && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5 mb-8 text-left space-y-3">
              <h3 className="text-sm font-semibold text-violet-400">Your API Key is Ready</h3>
              <p className="text-xs text-gray-400">Use this key to authenticate your backend requests to AegisRadar.</p>
              <div className="flex gap-2 items-center">
                <input
                  type="password"
                  value={user.apiKey}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(user.apiKey)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-gray-300 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/dashboard/profile")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold transition-all hover:scale-105"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/dashboard/subscription")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Plans
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Payment Form — 3 cols */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-violet-500/15 border border-violet-500/20">
                  <CreditCard className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Payment Details</h2>
                  <p className="text-xs text-gray-500">All fields are required</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                      errors.email ? "border-red-500/60" : "border-slate-700 focus:border-violet-500/60"
                    }`}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className={`w-full pl-4 pr-12 py-2.5 rounded-lg bg-slate-800/80 border text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                        errors.cardNumber ? "border-red-500/60" : "border-slate-700 focus:border-violet-500/60"
                      }`}
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                  {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Smith"
                    className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                      errors.cardName ? "border-red-500/60" : "border-slate-700 focus:border-violet-500/60"
                    }`}
                  />
                  {errors.cardName && <p className="text-red-400 text-xs mt-1">{errors.cardName}</p>}
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                        errors.expiry ? "border-red-500/60" : "border-slate-700 focus:border-violet-500/60"
                      }`}
                    />
                    {errors.expiry && <p className="text-red-400 text-xs mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      maxLength={4}
                      className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                        errors.cvv ? "border-red-500/60" : "border-slate-700 focus:border-violet-500/60"
                      }`}
                    />
                    {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                  </div>
                </div>

                {/* Secure note */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <Lock className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-xs text-gray-400">
                    Your payment info is encrypted with 256-bit SSL. We never store your full card number.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay {displayPrice}/month
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Card brand logos */}
            <div className="flex items-center justify-center gap-3 mt-4">
              {["VISA", "MC", "AMEX", "DISC"].map((brand) => (
                <div key={brand} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs font-bold text-gray-400">
                  {brand}
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white font-semibold">{planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Billing</span>
                  <span className="text-white capitalize">{billingCycle}</span>
                </div>
                {billingCycle === "annual" && (
                  <div className="flex justify-between text-green-400 text-xs">
                    <span>Annual discount (20%)</span>
                    <span>Applied ✓</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-3 flex justify-between font-bold">
                  <span className="text-white">Total Today</span>
                  <span className="text-violet-400 text-lg">{displayPrice}</span>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                What's included
              </h3>
              {[
                { icon: "🔄", text: "Cancel anytime, no questions asked" },
                { icon: "🔒", text: "256-bit SSL encrypted payment" },
                { icon: "📧", text: "Instant email receipt" },
                { icon: "⚡", text: "Access activates immediately" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 text-xs text-gray-400">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <Shield className="w-3.5 h-3.5" />
              Powered by AegisRadar Secure Payments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
