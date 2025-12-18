import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle, Users, Bell, Shield, BarChart3, MessageSquare, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "@/contexts/LanguageContext";

const landingTranslations = {
  en: {
    tagline: "Elevating Property Management in Bangladesh",
    nav: {
      features: "Features",
      pricing: "Pricing",
      forWhom: "For Whom",
      bookDemo: "Book Demo",
      getStarted: "Get Started",
    },
    hero: {
      badge: "Building Management System • Bangladesh",
      title: "A smarter, more transparent way to manage your residential buildings.",
      description: "NASH‑MS is a modern, web‑based Building Management System that replaces notebooks, Excel sheets, and scattered WhatsApp groups with one centralized, transparent platform for flat owners, tenants, and management committees.",
      scheduleDemo: "Schedule Free Demo",
      exploreFeatures: "Explore Features →",
      visibility: "Complete visibility",
      visibilityDesc: "Track flats, payments, expenses, staff, and service requests in one system.",
      designed: "Designed for Bangladesh",
      designedDesc: "Supports local building structures, contact formats, and workflows.",
      automated: "Automated communication",
      automatedDesc: "Send payment reminders and updates via email and WhatsApp.",
    },
    heroCard: {
      liveOverview: "Live building overview",
      digital: "100% Digital",
      flats: "Flats",
      occupancy: "Occupancy",
      dueAmount: "Due amount",
      todaySummary: "Today's summary",
      invoicesPaid: "18 invoices paid",
      serviceRequests: "4 new service requests logged",
      maintenanceTasks: "2 maintenance tasks in progress",
      aiAssistant: "AI assistant",
      aiMessage: "\"Total maintenance collection last month was ৳ 3,27,000, with 7 flats still overdue.\"",
    },
    features: {
      title: "Centralized control at your fingertips.",
      description: "NASH‑MS brings every core building operation into one dashboard—so management can focus on decisions instead of manual chasing.",
      dashboard: "Dashboard",
      dashboardDesc: "Get a real‑time overview of building status, payments, and open service requests.",
      flatsResidents: "Flats & Residents",
      flatsResidentsDesc: "Maintain a complete directory of flats, owners, and tenants with occupancy tracking.",
      invoicesExpenses: "Invoices & Expenses",
      invoicesExpensesDesc: "Generate bills, track payments, and record every expense for full financial transparency.",
      serviceRequests: "Service Requests",
      serviceRequestsDesc: "Residents log complaints; you track status and updates without messy WhatsApp threads.",
      employeesCameras: "Employees & Cameras",
      employeesCamerasDesc: "Store staff records and manage CCTV information in a single secure system.",
      aiNotifications: "AI & Notifications",
      aiNotificationsDesc: "Use the AI assistant for quick answers, summaries, and automated WhatsApp/email reminders.",
    },
    forWhom: {
      title: "Built for every building stakeholder.",
      description: "NASH‑MS keeps everyone on the same page—owners, tenants, committees, managers, and on‑site staff.",
      flatOwners: "Flat owners",
      flatOwner1: "Clear visibility of maintenance spending.",
      flatOwner2: "Access to notices and full payment history.",
      flatOwner3: "Reduced conflict through transparent records.",
      tenants: "Tenants",
      tenant1: "Simple bill reception and online payment links.",
      tenant2: "Easy complaint and service request submission.",
      tenant3: "Faster, traceable responses from management.",
      committees: "Committees & managers",
      committee1: "Centralized control of all building data.",
      committee2: "Automated reminders via WhatsApp & email.",
      committee3: "Effortless reports for AGMs and audits.",
    },
    pricing: {
      title: "Flexible pricing for every building size.",
      description: "Simple per‑flat pricing that scales with your building, with optional onboarding and annual discounts.",
      starter: "Starter",
      starterSubtitle: "For small buildings",
      standard: "Standard",
      standardSubtitle: "For medium buildings",
      enterprise: "Enterprise",
      enterpriseSubtitle: "For large communities",
      mostPopular: "Most Popular",
      custom: "Custom",
      perFlat: "per flat / month",
      talkToSales: "Talk to sales",
      starterFeatures: ["Up to 20 flats", "Dashboard & resident directory", "Invoice generation", "Email notifications"],
      standardFeatures: ["21–60 flats", "All Starter features", "Service request tracking", "WhatsApp notifications", "Expense management"],
      enterpriseFeatures: ["60+ flats", "All Standard features", "AI assistant", "Camera integration", "Dedicated support", "Custom reports"],
      annualNote: "Annual billing discounts and one‑time onboarding / implementation fees are available.",
    },
    demo: {
      title: "Ready to transform your building management?",
      description: "Share a few details about your building, and the NASH‑MS team will arrange a personalized walkthrough and proposal.",
      fullName: "Full name",
      fullNamePlaceholder: "Your name",
      phone: "Phone number (WhatsApp)",
      phonePlaceholder: "+880 1XXX-XXX-XXX",
      email: "Email",
      emailPlaceholder: "you@example.com",
      buildingName: "Building name & location",
      buildingPlaceholder: "e.g., Samad Garden, Elephant Road",
      numberOfFlats: "Number of flats",
      flatsPlaceholder: "e.g., 24",
      currentMethod: "Current management method",
      selectPlaceholder: "Select...",
      notebook: "Notebook / paper",
      excel: "Excel / Google Sheets",
      whatsapp: "WhatsApp only",
      other: "Other software",
      challenges: "What are your biggest challenges?",
      challengesPlaceholder: "e.g., tracking payments, communication with residents...",
      submit: "Request Demo",
      consent: "By submitting, you agree to be contacted via phone, email, or WhatsApp about NASH‑MS.",
      success: "Demo request submitted! We'll contact you soon.",
    },
    qr: {
      title: "Share NASH-MS",
      description: "Scan this QR code to visit our landing page",
      share: "Share with building managers and committees",
    },
    footer: {
      rights: "All rights reserved.",
    },
  },
  bn: {
    tagline: "বাংলাদেশে সম্পত্তি ব্যবস্থাপনার উন্নতি",
    nav: {
      features: "বৈশিষ্ট্য",
      pricing: "মূল্য",
      forWhom: "কাদের জন্য",
      bookDemo: "ডেমো বুক করুন",
      getStarted: "শুরু করুন",
    },
    hero: {
      badge: "বিল্ডিং ম্যানেজমেন্ট সিস্টেম • বাংলাদেশ",
      title: "আপনার আবাসিক ভবন পরিচালনার জন্য একটি স্মার্ট ও স্বচ্ছ পদ্ধতি।",
      description: "NASH‑MS একটি আধুনিক, ওয়েব-ভিত্তিক বিল্ডিং ম্যানেজমেন্ট সিস্টেম যা নোটবুক, এক্সেল শীট এবং বিক্ষিপ্ত হোয়াটসঅ্যাপ গ্রুপগুলোকে ফ্ল্যাট মালিক, ভাড়াটে এবং ম্যানেজমেন্ট কমিটির জন্য একটি কেন্দ্রীভূত, স্বচ্ছ প্ল্যাটফর্মে রূপান্তরিত করে।",
      scheduleDemo: "ফ্রি ডেমো নিন",
      exploreFeatures: "বৈশিষ্ট্য দেখুন →",
      visibility: "সম্পূর্ণ দৃশ্যমানতা",
      visibilityDesc: "ফ্ল্যাট, পেমেন্ট, খরচ, কর্মী এবং সার্ভিস রিকোয়েস্ট এক সিস্টেমে ট্র্যাক করুন।",
      designed: "বাংলাদেশের জন্য ডিজাইন",
      designedDesc: "স্থানীয় বিল্ডিং কাঠামো, যোগাযোগ ফরম্যাট এবং কর্মপ্রবাহ সমর্থন করে।",
      automated: "স্বয়ংক্রিয় যোগাযোগ",
      automatedDesc: "ইমেইল এবং হোয়াটসঅ্যাপের মাধ্যমে পেমেন্ট রিমাইন্ডার পাঠান।",
    },
    heroCard: {
      liveOverview: "লাইভ বিল্ডিং ওভারভিউ",
      digital: "১০০% ডিজিটাল",
      flats: "ফ্ল্যাট",
      occupancy: "দখল",
      dueAmount: "বকেয়া",
      todaySummary: "আজকের সারসংক্ষেপ",
      invoicesPaid: "১৮টি ইনভয়েস পরিশোধিত",
      serviceRequests: "৪টি নতুন সার্ভিস রিকোয়েস্ট",
      maintenanceTasks: "২টি রক্ষণাবেক্ষণ কাজ চলমান",
      aiAssistant: "AI সহকারী",
      aiMessage: "\"গত মাসে মোট রক্ষণাবেক্ষণ সংগ্রহ ছিল ৳ ৩,২৭,০০০, ৭টি ফ্ল্যাট এখনও বকেয়া।\"",
    },
    features: {
      title: "আপনার হাতের মুঠোয় কেন্দ্রীভূত নিয়ন্ত্রণ।",
      description: "NASH‑MS প্রতিটি মূল বিল্ডিং অপারেশনকে একটি ড্যাশবোর্ডে নিয়ে আসে—যাতে ম্যানেজমেন্ট ম্যানুয়াল তাড়া করার পরিবর্তে সিদ্ধান্তে মনোযোগ দিতে পারে।",
      dashboard: "ড্যাশবোর্ড",
      dashboardDesc: "বিল্ডিং স্ট্যাটাস, পেমেন্ট এবং ওপেন সার্ভিস রিকোয়েস্টের রিয়েল-টাইম ওভারভিউ পান।",
      flatsResidents: "ফ্ল্যাট ও বাসিন্দা",
      flatsResidentsDesc: "দখল ট্র্যাকিং সহ ফ্ল্যাট, মালিক এবং ভাড়াটেদের সম্পূর্ণ ডিরেক্টরি রাখুন।",
      invoicesExpenses: "ইনভয়েস ও খরচ",
      invoicesExpensesDesc: "বিল তৈরি করুন, পেমেন্ট ট্র্যাক করুন এবং সম্পূর্ণ আর্থিক স্বচ্ছতার জন্য প্রতিটি খরচ রেকর্ড করুন।",
      serviceRequests: "সার্ভিস রিকোয়েস্ট",
      serviceRequestsDesc: "বাসিন্দারা অভিযোগ লগ করেন; আপনি অগোছালো হোয়াটসঅ্যাপ থ্রেড ছাড়াই স্ট্যাটাস ট্র্যাক করুন।",
      employeesCameras: "কর্মী ও ক্যামেরা",
      employeesCamerasDesc: "স্টাফ রেকর্ড সংরক্ষণ করুন এবং একটি নিরাপদ সিস্টেমে CCTV তথ্য পরিচালনা করুন।",
      aiNotifications: "AI ও বিজ্ঞপ্তি",
      aiNotificationsDesc: "দ্রুত উত্তর, সারসংক্ষেপ এবং স্বয়ংক্রিয় হোয়াটসঅ্যাপ/ইমেইল রিমাইন্ডারের জন্য AI সহকারী ব্যবহার করুন।",
    },
    forWhom: {
      title: "প্রতিটি বিল্ডিং স্টেকহোল্ডারের জন্য তৈরি।",
      description: "NASH‑MS সবাইকে একই পেজে রাখে—মালিক, ভাড়াটে, কমিটি, ম্যানেজার এবং অন-সাইট স্টাফ।",
      flatOwners: "ফ্ল্যাট মালিক",
      flatOwner1: "রক্ষণাবেক্ষণ খরচের স্পষ্ট দৃশ্যমানতা।",
      flatOwner2: "নোটিশ এবং সম্পূর্ণ পেমেন্ট ইতিহাসে অ্যাক্সেস।",
      flatOwner3: "স্বচ্ছ রেকর্ডের মাধ্যমে দ্বন্দ্ব হ্রাস।",
      tenants: "ভাড়াটে",
      tenant1: "সহজ বিল গ্রহণ এবং অনলাইন পেমেন্ট লিঙ্ক।",
      tenant2: "সহজ অভিযোগ এবং সার্ভিস রিকোয়েস্ট জমা।",
      tenant3: "ম্যানেজমেন্ট থেকে দ্রুত, ট্রেসযোগ্য প্রতিক্রিয়া।",
      committees: "কমিটি ও ম্যানেজার",
      committee1: "সমস্ত বিল্ডিং ডেটার কেন্দ্রীভূত নিয়ন্ত্রণ।",
      committee2: "হোয়াটসঅ্যাপ ও ইমেইলের মাধ্যমে স্বয়ংক্রিয় রিমাইন্ডার।",
      committee3: "AGM এবং অডিটের জন্য সহজ রিপোর্ট।",
    },
    pricing: {
      title: "প্রতিটি বিল্ডিং সাইজের জন্য নমনীয় মূল্য।",
      description: "আপনার বিল্ডিংয়ের সাথে স্কেল করে সহজ প্রতি-ফ্ল্যাট মূল্য, ঐচ্ছিক অনবোর্ডিং এবং বার্ষিক ছাড় সহ।",
      starter: "স্টার্টার",
      starterSubtitle: "ছোট বিল্ডিংয়ের জন্য",
      standard: "স্ট্যান্ডার্ড",
      standardSubtitle: "মাঝারি বিল্ডিংয়ের জন্য",
      enterprise: "এন্টারপ্রাইজ",
      enterpriseSubtitle: "বড় কমিউনিটির জন্য",
      mostPopular: "সবচেয়ে জনপ্রিয়",
      custom: "কাস্টম",
      perFlat: "প্রতি ফ্ল্যাট / মাস",
      talkToSales: "সেলসের সাথে কথা বলুন",
      starterFeatures: ["২০টি ফ্ল্যাট পর্যন্ত", "ড্যাশবোর্ড ও বাসিন্দা ডিরেক্টরি", "ইনভয়েস জেনারেশন", "ইমেইল নোটিফিকেশন"],
      standardFeatures: ["২১-৬০ ফ্ল্যাট", "সমস্ত স্টার্টার বৈশিষ্ট্য", "সার্ভিস রিকোয়েস্ট ট্র্যাকিং", "হোয়াটসঅ্যাপ নোটিফিকেশন", "খরচ ব্যবস্থাপনা"],
      enterpriseFeatures: ["৬০+ ফ্ল্যাট", "সমস্ত স্ট্যান্ডার্ড বৈশিষ্ট্য", "AI সহকারী", "ক্যামেরা ইন্টিগ্রেশন", "ডেডিকেটেড সাপোর্ট", "কাস্টম রিপোর্ট"],
      annualNote: "বার্ষিক বিলিং ছাড় এবং এককালীন অনবোর্ডিং / বাস্তবায়ন ফি উপলব্ধ।",
    },
    demo: {
      title: "আপনার বিল্ডিং ব্যবস্থাপনা রূপান্তর করতে প্রস্তুত?",
      description: "আপনার বিল্ডিং সম্পর্কে কিছু বিবরণ শেয়ার করুন, এবং NASH‑MS টিম একটি ব্যক্তিগতকৃত ওয়াকথ্রু এবং প্রস্তাব সাজাবে।",
      fullName: "পুরো নাম",
      fullNamePlaceholder: "আপনার নাম",
      phone: "ফোন নম্বর (হোয়াটসঅ্যাপ)",
      phonePlaceholder: "+৮৮০ ১XXX-XXX-XXX",
      email: "ইমেইল",
      emailPlaceholder: "you@example.com",
      buildingName: "বিল্ডিং নাম ও অবস্থান",
      buildingPlaceholder: "যেমন, সামাদ গার্ডেন, এলিফ্যান্ট রোড",
      numberOfFlats: "ফ্ল্যাটের সংখ্যা",
      flatsPlaceholder: "যেমন, ২৪",
      currentMethod: "বর্তমান ব্যবস্থাপনা পদ্ধতি",
      selectPlaceholder: "নির্বাচন করুন...",
      notebook: "নোটবুক / কাগজ",
      excel: "এক্সেল / গুগল শীটস",
      whatsapp: "শুধু হোয়াটসঅ্যাপ",
      other: "অন্যান্য সফটওয়্যার",
      challenges: "আপনার সবচেয়ে বড় চ্যালেঞ্জ কি?",
      challengesPlaceholder: "যেমন, পেমেন্ট ট্র্যাকিং, বাসিন্দাদের সাথে যোগাযোগ...",
      submit: "ডেমো রিকোয়েস্ট করুন",
      consent: "জমা দিয়ে, আপনি NASH‑MS সম্পর্কে ফোন, ইমেইল বা হোয়াটসঅ্যাপের মাধ্যমে যোগাযোগ করতে সম্মত হচ্ছেন।",
      success: "ডেমো রিকোয়েস্ট জমা হয়েছে! শীঘ্রই যোগাযোগ করা হবে।",
    },
    qr: {
      title: "NASH-MS শেয়ার করুন",
      description: "আমাদের ল্যান্ডিং পেজ দেখতে এই QR কোড স্ক্যান করুন",
      share: "বিল্ডিং ম্যানেজার এবং কমিটিদের সাথে শেয়ার করুন",
    },
    footer: {
      rights: "সর্বস্বত্ব সংরক্ষিত।",
    },
  },
};

const LandingPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const t = landingTranslations[language];
  
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
    toast.success(t.demo.success);
  };

  const features = [
    { icon: BarChart3, title: t.features.dashboard, body: t.features.dashboardDesc },
    { icon: Building2, title: t.features.flatsResidents, body: t.features.flatsResidentsDesc },
    { icon: Shield, title: t.features.invoicesExpenses, body: t.features.invoicesExpensesDesc },
    { icon: MessageSquare, title: t.features.serviceRequests, body: t.features.serviceRequestsDesc },
    { icon: Users, title: t.features.employeesCameras, body: t.features.employeesCamerasDesc },
    { icon: Bell, title: t.features.aiNotifications, body: t.features.aiNotificationsDesc },
  ];

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
                {t.tagline}
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-xs font-medium text-slate-300 md:flex">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              {t.nav.features}
            </a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">
              {t.nav.pricing}
            </a>
            <a href="#for-whom" className="hover:text-emerald-400 transition-colors">
              {t.nav.forWhom}
            </a>
            <a href="#demo" className="hover:text-emerald-400 transition-colors">
              {t.nav.bookDemo}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              {language === 'en' ? 'বাংলা' : 'English'}
            </button>
            <Link to="/auth">
              <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs px-4 py-2">
                {t.nav.getStarted}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div className="space-y-6">
                <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
                  {t.hero.badge}
                </span>
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-50 md:text-4xl lg:text-5xl">
                  {t.hero.title}
                </h1>
                <p className="text-sm leading-relaxed text-slate-300 md:text-base">
                  {t.hero.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="#demo">
                    <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                      {t.hero.scheduleDemo}
                    </Button>
                  </a>
                  <a href="#features">
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                      {t.hero.exploreFeatures}
                    </Button>
                  </a>
                </div>
                <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-50">{t.hero.visibility}</span>
                      <p className="text-[10px] text-slate-400">{t.hero.visibilityDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-50">{t.hero.designed}</span>
                      <p className="text-[10px] text-slate-400">{t.hero.designedDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-50">{t.hero.automated}</span>
                      <p className="text-[10px] text-slate-400">{t.hero.automatedDesc}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Card */}
              <div className="relative">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl backdrop-blur">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="block text-xs font-semibold text-slate-50">{t.heroCard.liveOverview}</span>
                      <span className="text-[10px] text-slate-400">Samad Garden, Elephant Road</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      {t.heroCard.digital}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-800 py-4">
                    <div>
                      <span className="block text-[10px] text-slate-400">{t.heroCard.flats}</span>
                      <p className="text-lg font-semibold text-slate-50">64</p>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">{t.heroCard.occupancy}</span>
                      <span className="text-lg font-semibold text-emerald-400">94%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">{t.heroCard.dueAmount}</span>
                      <span className="text-lg font-semibold text-amber-400">৳ 72,500</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400">{t.heroCard.todaySummary}</span>
                      <div className="mt-1 space-y-1 text-xs text-slate-300">
                        <p>• {t.heroCard.invoicesPaid}</p>
                        <p>• {t.heroCard.serviceRequests}</p>
                        <p>• {t.heroCard.maintenanceTasks}</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-3">
                      <span className="text-[10px] font-medium text-emerald-400">{t.heroCard.aiAssistant}</span>
                      <p className="mt-1 text-xs text-slate-300">
                        {t.heroCard.aiMessage}
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
                {t.features.title}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                {t.features.description}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
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
              {t.forWhom.title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-300">
              {t.forWhom.description}
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-semibold text-emerald-400">{t.forWhom.flatOwners}</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  <li>• {t.forWhom.flatOwner1}</li>
                  <li>• {t.forWhom.flatOwner2}</li>
                  <li>• {t.forWhom.flatOwner3}</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-semibold text-emerald-400">{t.forWhom.tenants}</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  <li>• {t.forWhom.tenant1}</li>
                  <li>• {t.forWhom.tenant2}</li>
                  <li>• {t.forWhom.tenant3}</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-semibold text-emerald-400">{t.forWhom.committees}</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  <li>• {t.forWhom.committee1}</li>
                  <li>• {t.forWhom.committee2}</li>
                  <li>• {t.forWhom.committee3}</li>
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
                {t.pricing.title}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                {t.pricing.description}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <PricingCard
                name={t.pricing.starter}
                subtitle={t.pricing.starterSubtitle}
                price="৳ 50"
                perFlat={t.pricing.perFlat}
                talkToSales={t.pricing.talkToSales}
                highlights={t.pricing.starterFeatures}
              />
              <PricingCard
                name={t.pricing.standard}
                subtitle={t.pricing.standardSubtitle}
                price="৳ 40"
                badge={t.pricing.mostPopular}
                perFlat={t.pricing.perFlat}
                talkToSales={t.pricing.talkToSales}
                highlights={t.pricing.standardFeatures}
              />
              <PricingCard
                name={t.pricing.enterprise}
                subtitle={t.pricing.enterpriseSubtitle}
                price={t.pricing.custom}
                perFlat={t.pricing.perFlat}
                talkToSales={t.pricing.talkToSales}
                highlights={t.pricing.enterpriseFeatures}
              />
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              {t.pricing.annualNote}
            </p>
          </div>
        </section>

        {/* Demo form */}
        <section id="demo" className="bg-slate-950 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-50 md:text-3xl">
                  {t.demo.title}
                </h2>
                <p className="mt-3 text-sm text-slate-300">
                  {t.demo.description}
                </p>
                <div className="mt-6 space-y-2 text-sm text-slate-400">
                  <p>📍 NASH Samad Garden, 409/Ga/1, SP Road, Kallyanpur</p>
                  <p>📞 +880 1898‑934‑855</p>
                  <p>🌐 nash.eduintbd.ai</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">{t.demo.fullName}</label>
                  <Input
                    className="bg-slate-900 border-slate-700 text-slate-100"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={t.demo.fullNamePlaceholder}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">{t.demo.phone}</label>
                    <Input
                      className="bg-slate-900 border-slate-700 text-slate-100"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t.demo.phonePlaceholder}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">{t.demo.email}</label>
                    <Input
                      type="email"
                      className="bg-slate-900 border-slate-700 text-slate-100"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t.demo.emailPlaceholder}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">{t.demo.buildingName}</label>
                  <Input
                    className="bg-slate-900 border-slate-700 text-slate-100"
                    value={formData.buildingName}
                    onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                    placeholder={t.demo.buildingPlaceholder}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">{t.demo.numberOfFlats}</label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-700 text-slate-100"
                      value={formData.numberOfFlats}
                      onChange={(e) => setFormData({ ...formData, numberOfFlats: e.target.value })}
                      placeholder={t.demo.flatsPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">{t.demo.currentMethod}</label>
                    <Select
                      value={formData.currentMethod}
                      onValueChange={(value) => setFormData({ ...formData, currentMethod: value })}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                        <SelectValue placeholder={t.demo.selectPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notebook">{t.demo.notebook}</SelectItem>
                        <SelectItem value="excel">{t.demo.excel}</SelectItem>
                        <SelectItem value="whatsapp">{t.demo.whatsapp}</SelectItem>
                        <SelectItem value="other">{t.demo.other}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">{t.demo.challenges}</label>
                  <Textarea
                    className="bg-slate-900 border-slate-700 text-slate-100"
                    rows={3}
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    placeholder={t.demo.challengesPlaceholder}
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  {t.demo.submit}
                </Button>
                <p className="text-[10px] text-slate-500">
                  {t.demo.consent}
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* QR Code Section */}
      <section className="bg-slate-900 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-8">
            <h3 className="text-lg font-semibold text-slate-50">{t.qr.title}</h3>
            <p className="text-sm text-slate-400 text-center">{t.qr.description}</p>
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG 
                value={typeof window !== 'undefined' ? window.location.origin : 'https://nash-ms.lovable.app'}
                size={150}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-slate-500">{t.qr.share}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} NASH‑MS. {t.footer.rights}</p>
          <p>{t.tagline}</p>
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
  perFlat: string;
  talkToSales: string;
  highlights: string[];
};

const PricingCard: React.FC<PricingCardProps> = ({
  name,
  subtitle,
  price,
  badge,
  perFlat,
  talkToSales,
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
        {price !== "Custom" && price !== "কাস্টম" && <span className="ml-1 text-xs text-slate-400">{perFlat}</span>}
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
          {talkToSales}
        </Button>
      </a>
    </div>
  );
};

export default LandingPage;
