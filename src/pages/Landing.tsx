import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle, Users, Bell, Shield, BarChart3, MessageSquare, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    buildingName: "",
    numberOfFlats: "",
    currentMethod: "",
    challenges: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Demo request submitted! We'll contact you soon.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-xl font-bold text-slate-950">
              N
            </div>
            <div>
              <span className="block text-sm font-semibold tracking-tight text-slate-50">
                NASH‑MS
              </span>
              <span className="block text-[10px] text-slate-400">
                Elevating Property Management in Bangladesh
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-xs font-medium text-slate-300 md:flex">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">
              Pricing
            </a>
            <a href="#for-whom" className="hover:text-emerald-400 transition-colors">
              For Whom
            </a>
            <a href="#demo" className="hover:text-emerald-400 transition-colors">
              Book Demo
            </a>
          </div>
          <Link to="/auth">
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs px-4 py-2">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div className="space-y-6">
                <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
                  Building Management System • Bangladesh
                </span>
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-50 md:text-4xl lg:text-5xl">
                  A smarter, more transparent way to manage your residential buildings.
                </h1>
                <p className="text-sm leading-relaxed text-slate-300 md:text-base">
                  NASH‑MS is a modern, web‑based Building Management System that replaces notebooks, Excel sheets, and scattered WhatsApp groups with one centralized, transparent platform for flat owners, tenants, and management committees.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="#demo">
                    <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                      Schedule Free Demo
                    </Button>
                  </a>
                  <a href="#features">
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                      Explore Features →
                    </Button>
                  </a>
                </div>
                <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-50">Complete visibility</span>
                      <p className="text-[10px] text-slate-400">Track flats, payments, expenses, staff, and service requests in one system.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-50">Designed for Bangladesh</span>
                      <p className="text-[10px] text-slate-400">Supports local building structures, contact formats, and workflows.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-50">Automated communication</span>
                      <p className="text-[10px] text-slate-400">Send payment reminders and updates via email and WhatsApp.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Card */}
              <div className="relative">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl backdrop-blur">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="block text-xs font-semibold text-slate-50">Live building overview</span>
                      <span className="text-[10px] text-slate-400">Samad Garden, Elephant Road</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      100% Digital
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-800 py-4">
                    <div>
                      <span className="block text-[10px] text-slate-400">Flats</span>
                      <p className="text-lg font-semibold text-slate-50">64</p>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Occupancy</span>
                      <span className="text-lg font-semibold text-emerald-400">94%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Due amount</span>
                      <span className="text-lg font-semibold text-amber-400">৳ 72,500</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400">Today's summary</span>
                      <div className="mt-1 space-y-1 text-xs text-slate-300">
                        <p>• 18 invoices paid</p>
                        <p>• 4 new service requests logged</p>
                        <p>• 2 maintenance tasks in progress</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-3">
                      <span className="text-[10px] font-medium text-emerald-400">AI assistant</span>
                      <p className="mt-1 text-xs text-slate-300">
                        "Total maintenance collection last month was ৳ 3,27,000, with 7 flats still overdue."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-slate-900 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-slate-50 md:text-3xl">
                Centralized control at your fingertips.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                NASH‑MS brings every core building operation into one dashboard—so management can focus on decisions instead of manual chasing.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: BarChart3,
                  title: "Dashboard",
                  body: "Get a real‑time overview of building status, payments, and open service requests.",
                },
                {
                  icon: Building2,
                  title: "Flats & Residents",
                  body: "Maintain a complete directory of flats, owners, and tenants with occupancy tracking.",
                },
                {
                  icon: Shield,
                  title: "Invoices & Expenses",
                  body: "Generate bills, track payments, and record every expense for full financial transparency.",
                },
                {
                  icon: MessageSquare,
                  title: "Service Requests",
                  body: "Residents log complaints; you track status and updates without messy WhatsApp threads.",
                },
                {
                  icon: Users,
                  title: "Employees & Cameras",
                  body: "Store staff records and manage CCTV information in a single secure system.",
                },
                {
                  icon: Bell,
                  title: "AI & Notifications",
                  body: "Use the AI assistant for quick answers, summaries, and automated WhatsApp/email reminders.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 transition-all hover:border-emerald-500/30 hover:bg-slate-900"
                >
                  <f.icon className="h-8 w-8 text-emerald-400 mb-3" />
                  <h3 className="text-sm font-semibold text-slate-50">{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section id="for-whom" className="bg-slate-950 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-bold text-slate-50 md:text-3xl">
              Built for every building stakeholder.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-300">
              NASH‑MS keeps everyone on the same page—owners, tenants, committees, managers, and on‑site staff.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-semibold text-emerald-400">Flat owners</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  <li>• Clear visibility of maintenance spending.</li>
                  <li>• Access to notices and full payment history.</li>
                  <li>• Reduced conflict through transparent records.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-semibold text-emerald-400">Tenants</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  <li>• Simple bill reception and online payment links.</li>
                  <li>• Easy complaint and service request submission.</li>
                  <li>• Faster, traceable responses from management.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-semibold text-emerald-400">Committees & managers</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  <li>• Centralized control of all building data.</li>
                  <li>• Automated reminders via WhatsApp & email.</li>
                  <li>• Effortless reports for AGMs and audits.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-slate-900 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-slate-50 md:text-3xl">
                Flexible pricing for every building size.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                Simple per‑flat pricing that scales with your building, with optional onboarding and annual discounts.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <PricingCard
                name="Starter"
                subtitle="For small buildings"
                price="৳ 50"
                highlights={[
                  "Up to 20 flats",
                  "Dashboard & resident directory",
                  "Invoice generation",
                  "Email notifications",
                ]}
              />
              <PricingCard
                name="Standard"
                subtitle="For medium buildings"
                price="৳ 40"
                badge="Most Popular"
                highlights={[
                  "21–60 flats",
                  "All Starter features",
                  "Service request tracking",
                  "WhatsApp notifications",
                  "Expense management",
                ]}
              />
              <PricingCard
                name="Enterprise"
                subtitle="For large communities"
                price="Custom"
                highlights={[
                  "60+ flats",
                  "All Standard features",
                  "AI assistant",
                  "Camera integration",
                  "Dedicated support",
                  "Custom reports",
                ]}
              />
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              Annual billing discounts and one‑time onboarding / implementation fees are available.
            </p>
          </div>
        </section>

        {/* Demo form */}
        <section id="demo" className="bg-slate-950 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-50 md:text-3xl">
                  Ready to transform your building management?
                </h2>
                <p className="mt-3 text-sm text-slate-300">
                  Share a few details about your building, and the NASH‑MS team will arrange a personalized walkthrough and proposal.
                </p>
                <div className="mt-6 space-y-2 text-sm text-slate-400">
                  <p>📍 264 Elephant Road, Dhaka</p>
                  <p>📞 +880 1898‑934‑855</p>
                  <p>🌐 nash.eduintbd.ai</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Full name</label>
                  <Input
                    className="bg-slate-900 border-slate-700 text-slate-100"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">Phone number (WhatsApp)</label>
                    <Input
                      className="bg-slate-900 border-slate-700 text-slate-100"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+880 1XXX-XXX-XXX"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">Email</label>
                    <Input
                      type="email"
                      className="bg-slate-900 border-slate-700 text-slate-100"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Building name & location</label>
                  <Input
                    className="bg-slate-900 border-slate-700 text-slate-100"
                    value={formData.buildingName}
                    onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                    placeholder="e.g., Samad Garden, Elephant Road"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">Number of flats</label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-700 text-slate-100"
                      value={formData.numberOfFlats}
                      onChange={(e) => setFormData({ ...formData, numberOfFlats: e.target.value })}
                      placeholder="e.g., 24"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">Current management method</label>
                    <Select
                      value={formData.currentMethod}
                      onValueChange={(value) => setFormData({ ...formData, currentMethod: value })}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notebook">Notebook / paper</SelectItem>
                        <SelectItem value="excel">Excel / Google Sheets</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp only</SelectItem>
                        <SelectItem value="other">Other software</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">What are your biggest challenges?</label>
                  <Textarea
                    className="bg-slate-900 border-slate-700 text-slate-100"
                    rows={3}
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    placeholder="e.g., tracking payments, communication with residents..."
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  Request Demo
                </Button>
                <p className="text-[10px] text-slate-500">
                  By submitting, you agree to be contacted via phone, email, or WhatsApp about NASH‑MS.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} NASH‑MS. All rights reserved.</p>
          <p>Elevating Property Management in Bangladesh.</p>
        </div>
      </footer>
    </div>
  );
};

type PricingCardProps = {
  name: string;
  subtitle: string;
  price: string;
  badge?: string;
  highlights: string[];
};

const PricingCard: React.FC<PricingCardProps> = ({
  name,
  subtitle,
  price,
  badge,
  highlights,
}) => {
  return (
    <div className="relative flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
          {badge}
        </span>
      )}
      <h3 className="text-sm font-semibold text-slate-50">{name}</h3>
      <p className="mt-1 text-xs text-slate-300">{subtitle}</p>
      <p className="mt-4 text-lg font-semibold text-emerald-400">
        {price}
        {price !== "Custom" && <span className="ml-1 text-xs text-slate-400">per flat / month</span>}
      </p>
      <ul className="mt-4 flex-1 space-y-1 text-xs text-slate-300">
        {highlights.map((h) => (
          <li key={h}>• {h}</li>
        ))}
      </ul>
      <a href="#demo">
        <Button
          variant="outline"
          className="mt-4 w-full border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
        >
          Talk to sales
        </Button>
      </a>
    </div>
  );
};

export default LandingPage;
