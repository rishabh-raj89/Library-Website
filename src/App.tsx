/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  Wind, 
  Battery, 
  ShieldCheck, 
  Droplets, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Zap, 
  Lightbulb, 
  BookOpen,
  Menu,
  X,
  Users,
  Star,
  FileText,
  Trophy,
  Moon,
  Sun,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  MessageCircle,
  Send,
  LogIn,
  LogOut,
  User as UserIcon,
  CreditCard,
  Armchair,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  Settings,
  History,
  Trash2
} from 'lucide-react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const AMENITIES = [
  { icon: Wind, title: "Full Air-Conditioned", desc: "A cool and comfortable environment in every season." },
  { icon: Wifi, title: "High-Speed WiFi", desc: "Seamless access for online classes and research." },
  { icon: Droplets, title: "Pure RO Water", desc: "Fresh and chilled drinking water available 24/7." },
  { icon: Clock, title: "Flexible Long Hours", desc: "Dedicated spaces catering to serious aspirants." },
  { icon: ShieldCheck, title: "CCTV Security", desc: "Safe and secure environment for all students." },
  { icon: Battery, title: "Charging Points", desc: "Individual points at every seat for your devices." },
  { icon: Lightbulb, title: "Proper Lighting", desc: "Optimized lighting to reduce eye strain during long sessions." },
  { icon: Zap, title: "24/7 Power Backup", desc: "Uninterrupted study even during power outages." },
];

const PRICING_PLANS = [
  {
    name: "Daily Pass",
    price: "₹30",
    period: "per day",
    desc: "Perfect for students who need a quiet space for occasional intensive sessions.",
    features: ["Standard Seating", "High-Speed WiFi", "All Amenities Included", "24/7 Access"]
  },
  {
    name: "Weekly Plan",
    price: "₹150",
    period: "per week",
    desc: "Designed for short-term projects or exam-week preparation cycles.",
    features: ["Standard Seating", "High-Speed WiFi", "All Amenities Included", "Basic Study Materials", "24/7 Access"]
  },
  {
    name: "Monthly",
    price: "₹500",
    period: "per month",
    desc: "Our most popular plan for dedicated students striving for long-term consistency.",
    features: ["Standard Seating", "Premium Study Materials", "Exclusive Workshops", "Locker (Optional)", "24/7 Access"],
    popular: true
  },
  {
    name: "Reserved Desk",
    price: "₹600",
    period: "per month",
    desc: "A dedicated personal workspace reserved exclusively for you throughout the month.",
    features: ["Fixed Personal Desk", "Mentor Sessions", "Exclusive Workshops", "Locker Included", "24/7 Access"]
  }
];

const PERKS = [
  {
    icon: FileText,
    title: "Premium Materials",
    desc: "Gain access to a curated library of mock tests, previous year papers, and specialized notes for major exams."
  },
  {
    icon: Users,
    title: "Mentor Sessions",
    desc: "Monthly 1-on-1 sessions with subject matter experts to discuss strategy, doubts, and career pathing."
  },
  {
    icon: Star,
    title: "Exclusive Workshops",
    desc: "Weekly seminars on productivity, time management, and specific exam strategies led by toppers."
  },
  {
    icon: Trophy,
    title: "Success Track",
    desc: "Personalized progress tracking and periodic performance reviews to help you stay on target."
  }
];

const EXAMS = [
  "JEE", "NEET", "SSC", "Banking", "UPSC", "CUET", "Railway", "Defence", "PCS", "Boards"
];

const TESTIMONIALS = [
  {
    name: "Rahul Singh",
    exam: "UPSC Aspirant",
    text: "The silence here is unmatched. I was able to complete my syllabus 2 months earlier than planned thanks to the distraction-free environment.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
  },
  {
    name: "Priya Sharma",
    exam: "NEET Qualified",
    text: "AC and comfortable seating made long 12-hour study sessions possible even in peak summer. The high-speed WiFi was a lifesaver for online lectures.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
  },
  {
    name: "Amit Verma",
    exam: "SSC CGL Topper",
    text: "The mentor sessions really helped me refine my strategy. It's not just a library, it's a success center.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
  }
];

function Navbar({ isDark, toggleDark, user, isAdmin, showAdmin, setShowAdmin }: { 
  isDark: boolean; 
  toggleDark: () => void; 
  user: User | null;
  isAdmin: boolean;
  showAdmin: boolean;
  setShowAdmin: (v: boolean) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed w-full z-50 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center py-6 md:py-8">
          <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => setShowAdmin(false)}>
            <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  <path
                    id="circlePath"
                    d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                    fill="none"
                  />
                  <text className="text-[8px] uppercase tracking-[0.16em] fill-brand-accent font-black" style={{ fontSize: '8px' }}>
                    <textPath xlinkHref="#circlePath">
                      Anjana Library • Self Study Point • 
                    </textPath>
                  </text>
                </svg>
              </motion.div>
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-brand-primary flex items-center justify-center text-white text-[9px] md:text-[10px] font-bold serif z-10 shadow-lg border border-brand-border/10 ring-4 ring-brand-bg">
                AL
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-light tracking-tight serif uppercase leading-none text-brand-text-dark" style={{ fontFamily: 'Georgia, serif' }}>
                Anjana
              </h1>
              <p className="text-[8px] md:text-[9px] tracking-[0.3em] uppercase text-brand-text-muted font-bold mt-1">
                Library
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-10 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">
            {showAdmin ? (
              <>
                <button onClick={() => setShowAdmin(true)} className="text-brand-accent transition-colors">Dashboard</button>
                <button onClick={() => setShowAdmin(false)} className="hover:text-brand-accent transition-colors">Main Site</button>
              </>
            ) : (
              <>
                <a href="#home" className="hover:text-brand-accent transition-colors">Home</a>
                <a href="#mission" className="hover:text-brand-accent transition-colors">Mission</a>
                <a href="#amenities" className="hover:text-brand-accent transition-colors">Facilities</a>
                <a href="#pricing" className="hover:text-brand-accent transition-colors">Pricing</a>
                <a href="#booking" className="hover:text-brand-accent transition-colors">Book Seat</a>
                {isAdmin && (
                  <button onClick={() => setShowAdmin(true)} className="text-brand-accent flex items-center gap-2">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Admin
                  </button>
                )}
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-8 text-right">
            <button 
              onClick={toggleDark}
              className="p-2 rounded-full hover:bg-brand-muted transition-colors text-brand-text-dark"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-6 border-l border-brand-border pl-8">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest text-[#A19E95] font-bold">{user.displayName}</p>
                    <button onClick={() => signOut(auth)} className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-accent transition-colors text-brand-text-dark">Sign Out</button>
                  </div>
                  <img src={user.photoURL || ""} alt="" className="w-8 h-8 rounded-full border border-brand-border" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <button 
                  onClick={signInWithGoogle}
                  className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest hover:text-brand-accent transition-colors text-brand-text-dark"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <button 
              onClick={toggleDark}
              className="p-2 rounded-full hover:bg-brand-muted transition-colors text-brand-text-dark"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5 text-brand-text-dark" /> : <Menu className="w-5 h-5 text-brand-text-dark" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-brand-bg border-b border-brand-border overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6 flex flex-col items-center text-center">
              <a href="#home" onClick={() => setIsOpen(false)} className="text-xs font-bold uppercase tracking-widest text-brand-text-dark">Home</a>
              <a href="#mission" onClick={() => setIsOpen(false)} className="text-xs font-bold uppercase tracking-widest text-brand-text-dark">Mission</a>
              <a href="#amenities" onClick={() => setIsOpen(false)} className="text-xs font-bold uppercase tracking-widest text-brand-text-dark">Facilities</a>
              <a href="#pricing" onClick={() => setIsOpen(false)} className="text-xs font-bold uppercase tracking-widest text-brand-text-dark">Pricing</a>
              <a href="#testimonials" onClick={() => setIsOpen(false)} className="text-xs font-bold uppercase tracking-widest text-brand-text-dark">Success</a>
              <a href="#contact" onClick={() => setIsOpen(false)} className="text-xs font-bold uppercase tracking-widest text-brand-text-dark">Inquiry</a>
              <a href="#location" onClick={() => setIsOpen(false)} className="text-xs font-bold uppercase tracking-widest text-brand-text-dark">Location</a>
              <a href="https://chat.whatsapp.com/IFGwA4cflVD22Azz5wrw7a" target="_blank" rel="noopener noreferrer" className="w-full py-4 border border-brand-accent text-brand-accent text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Group</span>
              </a>
              <a href="tel:+918953490609" className="w-full py-4 bg-brand-primary text-brand-bg text-xs font-bold uppercase tracking-widest">Call Us</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Hero() {
  return (
    <section id="home" className="pt-48 pb-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:w-1/2 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-5xl md:text-6xl font-light leading-[1.1] text-brand-text-dark mb-10" style={{ fontFamily: 'Georgia, serif' }}>
              Focus on your dreams in a <br />
              <span className="italic text-brand-accent">peaceful</span> and premium environment.
            </h2>
            <p className="max-w-md text-base text-brand-text-muted leading-relaxed mb-12">
              Our library is a dedicated sanctuary for serious aspirants. We provide the silence, comfort, and infrastructure required to transform your academic and career goals into reality.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <button className="w-full sm:w-auto px-12 py-5 bg-brand-primary text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
              Join Our Center
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-[#A19E95] font-bold">Limited Seats</span>
              <span className="text-xs font-medium">Reserve your spot today</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="lg:w-1/2"
        >
          <div className="relative aspect-[4/3] border-[1px] border-brand-border p-4 bg-brand-bg">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
              alt="Modern Study Space" 
              className="w-full h-full object-cover grayscale-[0.4]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-10 -left-10 bg-brand-muted p-10 hidden xl:block border border-brand-border">
              <h4 className="text-[11px] uppercase tracking-widest font-bold mb-4 text-brand-accent">Target Exams</h4>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted w-48">
                <span>• UPSC / PCS</span>
                <span>• JEE / NEET</span>
                <span>• SSC / Banking</span>
                <span>• Boards / CUET</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MissionVision() {
  return (
    <section id="mission" className="py-32 px-6 lg:px-12 bg-brand-bg">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-32 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="border-[1px] border-brand-border p-4 bg-brand-bg"
          >
            <img 
              src="https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=1200" 
              alt="Mission and Vision" 
              className="w-full aspect-square object-cover grayscale-[0.3]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-brand-accent mb-4">Our Purpose</p>
              <h2 className="text-4xl font-light text-brand-text-dark mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>The Mission</h2>
              <p className="text-sm text-brand-text-muted leading-relaxed uppercase tracking-widest">
                To provide a serene, high-performance study sanctuary that empowers students to reach their full academic potential by eliminating every obstacle to deep focus.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="border-t border-brand-border pt-12"
            >
              <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-brand-accent mb-4">The Future</p>
              <h2 className="text-4xl font-light text-brand-text-dark mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>The Vision</h2>
              <p className="text-sm text-brand-text-muted leading-relaxed uppercase tracking-widest">
                To become the premier destination for serious aspirants, recognized for our commitment to excellence in infrastructure, mentorship, and consistent student success outcomes.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Amenities() {
  return (
    <section id="amenities" className="py-32 px-6 lg:px-12 border-t border-brand-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#A19E95] mb-4">The Experience</p>
          <h2 className="text-4xl font-light text-brand-text-dark leading-none" style={{ fontFamily: 'Georgia, serif' }}>Premium Amenities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-brand-border">
          {AMENITIES.map((item, index) => (
            <motion.div
              key={index}
              className="p-10 border-r border-b border-brand-border hover:bg-brand-muted transition-colors group"
            >
              <div className="w-10 h-[1px] bg-brand-accent mb-8 group-hover:w-16 transition-all duration-500"></div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-text-dark mb-4">{item.title}</h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed uppercase tracking-wider">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-32 px-6 lg:px-12 bg-brand-bg border-y border-brand-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#A19E95] mb-4">Membership Plans</p>
          <h2 className="text-4xl md:text-5xl font-light text-brand-text-dark mb-4" style={{ fontFamily: 'Georgia, serif' }}>Choose Your Growth Path</h2>
          <div className="w-20 h-[1px] bg-brand-accent mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative p-10 border border-brand-border flex flex-col h-full bg-brand-bg ${plan.popular ? 'shadow-2xl dark:shadow-none shadow-gray-100 scale-105 z-10' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-10 -translate-y-1/2 bg-brand-accent text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Best Value
                </div>
              )}
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-text-dark mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-light text-brand-text-dark">{plan.price}</span>
                <span className="text-[10px] uppercase tracking-widest text-brand-text-muted font-bold">{plan.period}</span>
              </div>
              <p className="text-[11px] text-brand-text-muted leading-relaxed uppercase tracking-wider mb-8 flex-grow">
                {plan.desc}
              </p>
              <div className="space-y-4 mb-10">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                    <span className="text-[10px] uppercase tracking-widest font-medium text-brand-text-muted">{feature}</span>
                  </div>
                ))}
              </div>
              <button className={`w-full py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${plan.popular ? 'bg-brand-primary text-white hover:bg-brand-accent hover:text-white' : 'border border-brand-border hover:bg-brand-muted'}`}>
                Select Plan
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Perks() {
  return (
    <section className="py-32 px-6 lg:px-12 bg-brand-bg">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#A19E95] mb-4">Elite Benefits</p>
            <h2 className="text-4xl font-light text-brand-text-dark mb-12 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Beyond Just a Desk: <br />
              Grow with Our Resources.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-16">
              {PERKS.map((perk, index) => (
                <div key={index} className="flex flex-col">
                  <perk.icon className="w-6 h-6 text-brand-accent mb-6" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-brand-text-dark mb-3">{perk.title}</h4>
                  <p className="text-[11px] text-brand-text-muted leading-relaxed uppercase tracking-wider">
                    {perk.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 border-[1px] border-brand-border p-4 bg-brand-bg relative">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200" 
              alt="Collaboration and Mentorship" 
              className="w-full aspect-[4/5] object-cover grayscale-[0.2]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-1/2 left-0 -translate-x-10 -translate-y-1/2 bg-brand-accent text-white p-10 hidden xl:block border border-brand-border">
              <p className="text-2xl font-serif italic mb-2">"Environment is 50% <br />of the struggle."</p>
              <p className="text-[10px] uppercase tracking-widest font-bold">A. Library Team</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const confirmBooking = async (
  user: User, 
  selectedSeat: string, 
  selectedPlan: any, 
  paymentId: string
) => {
  try {
    // Record Booking in Firestore
    const bookingId = Math.random().toString(36).substring(7);
    const bookingRef = doc(db, 'bookings', bookingId);
    await setDoc(bookingRef, {
      userId: user.uid,
      seatId: selectedSeat,
      planName: selectedPlan.name,
      amount: parseInt(selectedPlan.price.replace('₹', '').replace(',', '')),
      status: 'confirmed',
      startTime: serverTimestamp(),
      endTime: serverTimestamp(), 
      paymentId: paymentId,
      createdAt: serverTimestamp()
    });

    // Update Seat Status
    const seatRef = doc(db, 'seats', selectedSeat);
    await updateDoc(seatRef, {
      isOccupied: true,
      currentUserId: user.uid
    });
  } catch (err) {
    console.error("Error confirming booking:", err);
    throw err;
  }
};

function SimulatedCheckoutForm({ 
  clientSecret, 
  user, 
  selectedSeat, 
  selectedPlan,
  onSuccess 
}: { 
  clientSecret: string; 
  user: User; 
  selectedSeat: string; 
  selectedPlan: any;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await confirmBooking(user, selectedSeat, selectedPlan, clientSecret);
      onSuccess();
    } catch (err) {
      setMessage("Booking failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-brand-bg p-6 border border-brand-border">
      <div className="flex items-center gap-3 text-brand-accent mb-4">
        <CreditCard className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Simulated Payment Mode</span>
      </div>
      <p className="text-[10px] text-brand-text-muted leading-relaxed italic">
        Stripe API keys are not detected in the environment. Using simulation mode for demonstration.
      </p>
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-all disabled:opacity-50"
      >
        {isLoading ? "Processing..." : "Confirm Test Payment"}
      </button>
      {message && <p className="text-[10px] text-red-500 font-bold text-center mt-2">{message}</p>}
    </div>
  );
}

function CheckoutForm({ 
  clientSecret, 
  user, 
  selectedSeat, 
  selectedPlan,
  onSuccess 
}: { 
  clientSecret: string; 
  user: User; 
  selectedSeat: string; 
  selectedPlan: any;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        await confirmBooking(user, selectedSeat, selectedPlan, paymentIntent.id);
        onSuccess();
      } catch (err) {
        setMessage("Payment succeeded but booking failed. Please contact support.");
      }
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-8">
      <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
      
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
      >
        <span id="button-text">
          {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : "Complete Payment"}
        </span>
      </button>

      {message && (
        <div id="payment-message" className="text-[10px] uppercase tracking-widest text-[#B44C4C] font-bold flex items-center gap-2 mt-4">
          <AlertCircle className="w-4 h-4" />
          {message}
        </div>
      )}
    </form>
  );
}

function BookingSection({ user }: { user: User | null }) {
  const [selectedSeat, setSelectedSeat] = React.useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = React.useState<typeof PRICING_PLANS[0] | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = React.useState(false);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [seats, setSeats] = React.useState<{id: string, number: string, isOccupied: boolean}[]>([]);

  React.useEffect(() => {
    if (!user) {
      setSeats([]);
      return;
    }
    // Generate initial seats if they don't exist, or listen to them
    const seatsRef = collection(db, 'seats');
    const unsubscribe = onSnapshot(seatsRef, (snapshot) => {
      const seatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      if (seatData.length === 0) {
        // Initialize 40 seats if collection is empty
        Array.from({ length: 40 }).forEach(async (_, i) => {
          const id = `seat-${i + 1}`;
          await setDoc(doc(db, 'seats', id), {
            id,
            number: `${i + 1}`,
            isOccupied: false,
            type: i > 25 ? 'reserved' : 'standard'
          });
        });
      } else {
        setSeats(seatData.sort((a, b) => parseInt(a.number) - parseInt(b.number)));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'seats'));

    return () => unsubscribe();
  }, [user]);

  const handleStartBooking = async () => {
    if (!user || !selectedSeat || !selectedPlan) return;
    setIsInitializingPayment(true);
    setClientSecret(null);

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseInt(selectedPlan.price.replace('₹', '').replace(',', '')),
          planName: selectedPlan.name 
        }),
      });
      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error(data.error || "Failed to initialize payment");
      }
    } catch (error) {
      alert("Failed to initialize payment. Please try again.");
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handleSuccess = () => {
    setSuccess(true);
    setClientSecret(null);
    setSelectedSeat(null);
    setSelectedPlan(null);
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <section id="booking" className="py-32 px-6 lg:px-12 bg-white border-y border-brand-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#A19E95] mb-4">Seat Reservation</p>
          <h2 className="text-4xl font-light text-brand-text-dark mb-4" style={{ fontFamily: 'Georgia, serif' }}>Choose Your Sanctuary</h2>
          <div className="w-20 h-[1px] bg-brand-accent mx-auto"></div>
        </div>

        {!user ? (
          <div className="text-center py-20 border border-dashed border-brand-border bg-brand-bg">
            <UserIcon className="w-12 h-12 text-[#A19E95] mx-auto mb-6" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-text-dark mb-4">Login Required</h3>
            <p className="text-xs text-brand-text-muted mb-8 uppercase tracking-widest">Please sign in to view available seats and book your spot.</p>
            <button 
              onClick={signInWithGoogle}
              className="px-12 py-4 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors"
            >
              Sign In with Google
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Seat Map */}
            <div className="space-y-10">
              <div className="flex justify-between items-center bg-brand-bg p-6 border border-brand-border">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-border"></div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-brand-text-muted">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-accent/20 border border-brand-accent"></div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-brand-text-muted">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-text-dark/10"></div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-brand-text-muted">Occupied</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 md:grid-cols-8 gap-4">
                {seats.map((seat) => (
                  <button
                    key={seat.id}
                    disabled={seat.isOccupied}
                    onClick={() => setSelectedSeat(seat.id)}
                    className={`aspect-square border flex flex-col items-center justify-center transition-all duration-300 ${
                      seat.isOccupied 
                        ? 'bg-brand-text-dark/5 border-brand-border cursor-not-allowed opacity-50' 
                        : selectedSeat === seat.id
                          ? 'bg-brand-accent/10 border-brand-accent'
                          : 'border-brand-border hover:border-brand-accent bg-brand-bg'
                    }`}
                  >
                    <Armchair className={`w-5 h-5 mb-1 ${selectedSeat === seat.id ? 'text-brand-accent' : 'text-brand-text-muted'}`} />
                    <span className="text-[9px] font-bold">{seat.number}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Details */}
            <div className="border border-brand-border p-10 bg-brand-bg">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-text-dark mb-10 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-brand-accent" />
                Booking Summary
              </h3>
              
              <div className="space-y-12">
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#A19E95]">1. Selected Seat</p>
                  <p className="text-2xl font-light serif text-brand-text-dark">
                    {selectedSeat ? `Seat No. ${seats.find(s => s.id === selectedSeat)?.number}` : "Choose a seat from the map"}
                  </p>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#A19E95]">2. Membership Plan</p>
                  <div className="grid grid-cols-1 gap-3">
                    {PRICING_PLANS.map((plan) => (
                      <button
                        key={plan.name}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 border text-left flex justify-between items-center transition-all ${
                          selectedPlan?.name === plan.name 
                            ? 'border-brand-accent bg-brand-accent/5' 
                            : 'border-brand-border hover:border-brand-accent'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest block">{plan.name}</span>
                          <span className="text-xs serif italic text-brand-text-muted">{plan.period}</span>
                        </div>
                        <span className="text-sm font-medium">{plan.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-brand-border">
                  <div className="flex justify-between items-end mb-10">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#A19E95] mb-2">Total Due</p>
                      <p className="text-3xl font-light serif text-brand-accent">{selectedPlan?.price || "₹0"}</p>
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text-muted mb-2">Incl. all taxes</p>
                  </div>

                  {!clientSecret ? (
                    <button
                      disabled={!selectedSeat || !selectedPlan || isInitializingPayment}
                      onClick={handleStartBooking}
                      className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      <span className={isInitializingPayment ? "opacity-0" : "opacity-100"}>Secure Reservation</span>
                      {isInitializingPayment && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-6">
                      {clientSecret.startsWith('simulated_') ? (
                        <SimulatedCheckoutForm 
                          clientSecret={clientSecret}
                          user={user}
                          selectedSeat={selectedSeat!}
                          selectedPlan={selectedPlan}
                          onSuccess={handleSuccess}
                        />
                      ) : (
                        <Elements 
                          stripe={stripePromise} 
                          options={{ 
                            clientSecret,
                            appearance: {
                              theme: 'stripe',
                              variables: {
                                colorPrimary: '#D4AF37',
                                colorBackground: '#F4F1EA',
                                colorText: '#1C1C1C',
                                fontFamily: 'Inter, system-ui, sans-serif',
                              },
                            }
                          }}
                        >
                          <CheckoutForm 
                            clientSecret={clientSecret} 
                            user={user} 
                            selectedSeat={selectedSeat!} 
                            selectedPlan={selectedPlan}
                            onSuccess={handleSuccess}
                          />
                        </Elements>
                      )}
                      <button 
                        onClick={() => setClientSecret(null)}
                        className="w-full text-[9px] uppercase tracking-widest font-bold text-brand-text-muted hover:text-brand-accent transition-colors"
                      >
                        Cancel & Change Details
                      </button>
                    </div>
                  )}
                  
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-brand-accent/10 border border-brand-accent text-center"
                    >
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-accent flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Success! Your seat is reserved.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
function Testimonials() {
  return (
    <section id="testimonials" className="py-32 px-6 lg:px-12 bg-white border-y border-brand-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#A19E95] mb-4">Student Stories</p>
          <h2 className="text-4xl md:text-5xl font-light text-brand-text-dark mb-4" style={{ fontFamily: 'Georgia, serif' }}>Voices of Success</h2>
          <div className="w-20 h-[1px] bg-brand-accent mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {TESTIMONIALS.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-10 border border-brand-border bg-brand-bg flex flex-col"
            >
              <div className="flex items-center gap-4 mb-8">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full grayscale" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-brand-text-dark">{t.name}</h4>
                  <p className="text-[10px] text-brand-accent font-bold uppercase tracking-wider">{t.exam}</p>
                </div>
              </div>
              <p className="text-[11px] text-brand-text-muted leading-relaxed uppercase tracking-wider italic">
                "{t.text}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [formState, setFormState] = React.useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section id="contact" className="py-32 px-6 lg:px-12 bg-brand-bg">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#A19E95] mb-4">Inquiry Form</p>
          <h2 className="text-4xl font-light text-brand-text-dark leading-none" style={{ fontFamily: 'Georgia, serif' }}>Begin Your Journey</h2>
          <div className="w-20 h-[1px] bg-brand-accent mx-auto mt-10"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-brand-text-muted">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-transparent border border-brand-border p-4 text-xs font-medium focus:border-brand-accent outline-none transition-colors text-brand-text-dark"
                placeholder="ENTER YOUR NAME"
                value={formState.name}
                onChange={(e) => setFormState({...formState, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-brand-text-muted">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full bg-transparent border border-brand-border p-4 text-xs font-medium focus:border-brand-accent outline-none transition-colors text-brand-text-dark"
                placeholder="YOUR EMAIL"
                value={formState.email}
                onChange={(e) => setFormState({...formState, email: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-text-muted">Your Inquiry</label>
            <textarea 
              required
              rows={5}
              className="w-full bg-transparent border border-brand-border p-4 text-xs font-medium focus:border-brand-accent outline-none transition-colors text-brand-text-dark resize-none"
              placeholder="HOW CAN WE HELP YOU ACHIEVE YOUR GOALS?"
              value={formState.message}
              onChange={(e) => setFormState({...formState, message: e.target.value})}
            ></textarea>
          </div>
          <div className="flex flex-col items-center">
            <button 
              type="submit"
              className="px-16 py-5 bg-brand-primary text-brand-bg text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-all w-full md:w-auto"
            >
              Examine Membership
            </button>
            {submitted && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-xs font-bold text-brand-accent uppercase tracking-widest"
              >
                Inquiry sent successfully. We will reach out shortly.
              </motion.p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function ExamsSection() {
  return (
    <section id="exams" className="py-32 bg-brand-muted px-6 lg:px-12 border-y border-brand-border">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-light text-brand-text-dark mb-10" style={{ fontFamily: 'Georgia, serif' }}>A Sanctuary for High Achievers</h2>
        <div className="w-20 h-[1px] bg-brand-accent mx-auto mb-12"></div>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
          {EXAMS.map((exam, index) => (
            <span 
              key={index}
              className="text-xs font-bold uppercase tracking-[0.3em] text-brand-text-muted"
            >
              • {exam}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Location() {
  return (
    <section id="location" className="py-32 px-6 lg:px-12 bg-brand-bg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-24 items-start">
          <div className="lg:w-1/3">
            <h2 className="text-4xl font-light text-brand-text-dark mb-12 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Located in the <br /> Heart of Learning.
            </h2>
            
            <div className="space-y-12">
              <div className="flex flex-col space-y-4">
                <span className="text-[10px] uppercase tracking-widest text-brand-accent font-bold">Primary Location</span>
                <p className="text-sm font-medium uppercase tracking-wider leading-relaxed">
                  Pakki Mahatauli Chauraha Overbridge,<br />
                  Near the Medical Store.
                </p>
              </div>

              <div className="flex flex-col space-y-4">
                <span className="text-[10px] uppercase tracking-widest text-brand-accent font-bold">Study Concierge</span>
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium uppercase tracking-wider">+91 89534 90609</p>
                  <p className="text-sm font-medium uppercase tracking-wider">+91 70788 91877</p>
                  <p className="text-sm font-medium uppercase tracking-wider">+91 95698 52712</p>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 border border-brand-accent flex items-center justify-center">
                    <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-text-muted">Always Accessible</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-2/3 w-full border border-brand-border p-4 bg-brand-bg">
            <div className="aspect-video relative grayscale hover:grayscale-0 transition-all duration-700">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14234.39487739543!2d79.5663468!3d26.4140944!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDI0JzUwLjciTiA3OcKwMzMnNTguOSJF!5e0!3m2!1sen!2sin!4v1715555555555!5m2!1sen!2sin" 
                className="w-full h-full border-none"
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-20 border-t border-brand-border bg-brand-bg px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex flex-col items-center md:items-start">
          <h1 className="text-2xl font-light tracking-tight serif uppercase leading-none text-brand-text-dark" style={{ fontFamily: 'Georgia, serif' }}>
            Anjana Library
          </h1>
          <p className="text-[9px] tracking-[0.2em] uppercase mt-1 text-brand-accent font-bold">
            & Self Study Point
          </p>
        </div>
        
        <div className="text-center md:text-right">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#A19E95] font-bold mb-2">Copyright &copy; {new Date().getFullYear()}</p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-brand-text-muted">
            Your Success Begins With the Right Environment
          </p>
        </div>

        <div className="flex gap-10 text-[10px] font-bold uppercase tracking-widest text-[#A19E95]">
          <a href="#" className="hover:text-brand-accent transition-colors">Privacy</a>
          <a href="#" className="hover:text-brand-accent transition-colors">Terms</a>
        </div>

        <div className="flex gap-6 items-center border-l border-brand-border pl-10 h-10 hidden lg:flex">
          <a href="#" className="text-brand-text-muted hover:text-brand-accent transition-colors">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="https://www.instagram.com/anjana_library/" target="_blank" rel="noopener noreferrer" className="text-brand-text-muted hover:text-brand-accent transition-colors">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="#" className="text-brand-text-muted hover:text-brand-accent transition-colors">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href="https://chat.whatsapp.com/IFGwA4cflVD22Azz5wrw7a" target="_blank" rel="noopener noreferrer" className="text-brand-text-muted hover:text-brand-accent transition-colors">
            <MessageCircle className="w-4 h-4" />
          </a>
          <a href="#" className="text-brand-text-muted hover:text-brand-accent transition-colors">
            <Youtube className="w-4 h-4" />
          </a>
        </div>

        <div className="flex lg:hidden gap-8 text-brand-text-muted">
          <a href="#" className="hover:text-brand-accent transition-colors"><Facebook className="w-5 h-5" /></a>
          <a href="https://www.instagram.com/anjana_library/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors"><Instagram className="w-5 h-5" /></a>
          <a href="https://chat.whatsapp.com/IFGwA4cflVD22Azz5wrw7a" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors"><MessageCircle className="w-5 h-5" /></a>
          <a href="#" className="hover:text-brand-accent transition-colors"><Youtube className="w-5 h-5" /></a>
        </div>
      </div>
    </footer>
  );
}

function AdminDashboard() {
  const [seats, setSeats] = React.useState<any[]>([]);
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [view, setView] = React.useState<'seats' | 'bookings'>('seats');

  React.useEffect(() => {
    const unsubSeats = onSnapshot(collection(db, 'seats'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      setSeats(data.sort((a, b) => parseInt(a.number || '0') - parseInt(b.number || '0')));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'seats'));

    const unsubBookings = onSnapshot(query(collection(db, 'bookings'), where('status', '==', 'confirmed')), (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'bookings'));

    return () => { unsubSeats(); unsubBookings(); };
  }, []);

  const toggleSeat = async (seat: any) => {
    await updateDoc(doc(db, 'seats', seat.id), {
      isOccupied: !seat.isOccupied,
      currentUserId: !seat.isOccupied ? 'ADMIN_MANUAL' : null
    });
  };

  return (
    <div className="pt-40 pb-20 px-6 lg:px-12 min-h-screen bg-brand-bg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h2 className="text-4xl font-light serif text-brand-text-dark mb-4">Administration</h2>
            <div className="flex gap-8">
              <button 
                onClick={() => setView('seats')}
                className={`text-[10px] font-bold uppercase tracking-[0.2em] pb-2 border-b-2 transition-all ${view === 'seats' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-brand-text-muted hover:text-brand-text-dark'}`}
              >
                Seat Management
              </button>
              <button 
                onClick={() => setView('bookings')}
                className={`text-[10px] font-bold uppercase tracking-[0.2em] pb-2 border-b-2 transition-all ${view === 'bookings' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-brand-text-muted hover:text-brand-text-dark'}`}
              >
                Booking Ledger
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 border-l border-brand-border pl-10">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#A19E95] font-bold mb-1">Occupancy</p>
              <p className="text-2xl font-light serif">{seats.filter(s => s.isOccupied).length} / {seats.length}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#A19E95] font-bold mb-1">Total Revenue</p>
              <p className="text-2xl font-light serif text-brand-accent">₹{bookings.reduce((acc, b) => acc + (b.amount || 0), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {view === 'seats' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {seats.map((seat) => (
              <div 
                key={seat.id}
                className={`p-6 border flex flex-col items-center justify-center space-y-4 transition-all ${seat.isOccupied ? 'bg-brand-text-dark/5 border-brand-border' : 'bg-white border-brand-accent/20 shadow-sm'}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Seat {seat.number}</span>
                <Armchair className={`w-8 h-8 ${seat.isOccupied ? 'text-brand-text-muted' : 'text-brand-accent'}`} />
                <button 
                  onClick={() => toggleSeat(seat)}
                  className={`px-4 py-2 text-[8px] font-bold uppercase tracking-widest border transition-all ${seat.isOccupied ? 'border-brand-border text-brand-text-muted hover:bg-brand-accent hover:text-white hover:border-brand-accent' : 'border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white'}`}
                >
                  {seat.isOccupied ? 'Release' : 'Mark Occupied'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-brand-border overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-bg text-[10px] uppercase tracking-widest font-bold text-brand-text-muted border-b border-brand-border">
                  <th className="p-6">Date</th>
                  <th className="p-6">User / Booking ID</th>
                  <th className="p-6">Plan</th>
                  <th className="p-6">Seat</th>
                  <th className="p-6">Amount</th>
                  <th className="p-6">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-brand-border hover:bg-brand-bg transition-colors">
                    <td className="p-6 text-brand-text-muted">
                      {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleDateString() : 'Pending'}
                    </td>
                    <td className="p-6">
                      <p className="font-bold uppercase tracking-tight text-brand-text-dark">{booking.userId}</p>
                      <p className="text-[9px] text-brand-text-muted">{booking.id}</p>
                    </td>
                    <td className="p-6 uppercase tracking-wider font-medium">{booking.planName}</td>
                    <td className="p-6 font-bold text-brand-accent">#{booking.seatId?.split('-')[1]}</td>
                    <td className="p-6 font-medium">₹{booking.amount}</td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-[8px] font-bold uppercase tracking-[0.2em] rounded-full">Confirmed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminAuth({ onVerify, user }: { onVerify: () => void; user: User | null }) {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(false);
  const [showForgot, setShowForgot] = React.useState(false);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [requestSent, setRequestSent] = React.useState(false);
  const [adminData, setAdminData] = React.useState<any>(null);

  React.useEffect(() => {
    if (user) {
      return onSnapshot(doc(db, 'admins', user.uid), (snap) => {
        setAdminData(snap.data());
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = adminData?.secondaryPassword || 'admin123';
    if (password === correctPassword) {
      onVerify();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleForgot = async () => {
    if (!user?.email) return;
    setIsRequesting(true);
    try {
      const resp = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      if (resp.ok) setRequestSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-12 bg-white border border-brand-border text-center relative overflow-hidden"
      >
        <ShieldCheck className="w-12 h-12 text-brand-accent mx-auto mb-8" />
        <h2 className="text-2xl font-light serif text-brand-text-dark mb-4">Security Challenge</h2>
        <p className="text-[10px] uppercase tracking-widest text-brand-text-muted font-bold mb-10">Administrative entry requires verification.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[9px] uppercase tracking-widest font-bold text-brand-text-muted">Master Password</label>
            <input 
              type="password" 
              autoFocus
              className={`w-full bg-brand-bg border ${error ? 'border-red-500' : 'border-brand-border'} p-4 text-xs font-medium focus:border-brand-accent outline-none transition-all text-brand-text-dark text-center tracking-[0.5em]`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-all"
          >
            Unlock Dashboard
          </button>
          
          <div className="pt-4">
            <button 
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-text-muted hover:text-brand-accent transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {error && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest animate-pulse mt-4">Incorrect credentials</p>}
        </form>

        <AnimatePresence>
          {showForgot && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 bg-white p-12 flex flex-col items-center justify-center text-center z-10"
            >
              {!requestSent ? (
                <>
                  <AlertCircle className="w-10 h-10 text-brand-accent mb-6" />
                  <h3 className="text-lg serif text-brand-text-dark mb-4">Access Recovery</h3>
                  <p className="text-[10px] text-brand-text-muted leading-relaxed uppercase tracking-widest mb-8">
                    We will send a secure reset link to your registered email:<br/>
                    <span className="text-brand-text-dark font-bold">{user?.email}</span>
                  </p>
                  <button 
                    onClick={handleForgot}
                    disabled={isRequesting}
                    className="w-full py-4 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest mb-6"
                  >
                    {isRequesting ? "Sending..." : "Send Reset Link"}
                  </button>
                  <button 
                    onClick={() => setShowForgot(false)}
                    className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent border-b border-brand-accent pb-1"
                  >
                    Back to Login
                  </button>
                </>
              ) : (
                <>
                  <CheckCircle className="w-10 h-10 text-brand-accent mb-6" />
                  <h3 className="text-lg serif text-brand-text-dark mb-4">Email Sent</h3>
                  <p className="text-[10px] text-brand-text-muted leading-relaxed uppercase tracking-widest mb-8">
                    A secure reset link has been dispatched. Please check your inbox (and spam folder) to complete the clearance reset.
                  </p>
                  <button 
                    onClick={() => setShowForgot(false)}
                    className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent border-b border-brand-accent pb-1"
                  >
                    Back to Login
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ResetPasswordView({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/admin/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      if (resp.ok) setStatus('success');
      else setStatus('error');
    } catch (err) {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6">
        <div className="max-w-md w-full p-12 bg-white border border-brand-border text-center">
          <CheckCircle className="w-12 h-12 text-brand-accent mx-auto mb-8" />
          <h2 className="text-2xl font-light serif text-brand-text-dark mb-4">Password Updated</h2>
          <p className="text-[10px] uppercase tracking-widest text-brand-text-muted font-bold mb-10">Secondary clearance has been reset successfully.</p>
          <button 
            onClick={onComplete}
            className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-12 bg-white border border-brand-border text-center"
      >
        <ShieldCheck className="w-12 h-12 text-brand-accent mx-auto mb-8" />
        <h2 className="text-2xl font-light serif text-brand-text-dark mb-4">Reset Master Password</h2>
        <p className="text-[10px] uppercase tracking-widest text-brand-text-muted font-bold mb-10">Set your new secondary administrative clearance code.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 text-left">
            <div>
              <label className="text-[9px] uppercase tracking-widest font-bold text-brand-text-muted">New Password</label>
              <input 
                type="password" 
                className="w-full bg-brand-bg border border-brand-border p-4 text-xs font-medium focus:border-brand-accent outline-none text-center tracking-[0.5em]"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest font-bold text-brand-text-muted">Confirm New Password</label>
              <input 
                type="password" 
                className="w-full bg-brand-bg border border-brand-border p-4 text-xs font-medium focus:border-brand-accent outline-none text-center tracking-[0.5em]"
                value={confirm}
                required
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Clearance"}
          </button>
          {status === 'error' && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest animate-pulse mt-4">Invalid or expired clearance token</p>}
        </form>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [isDark, setIsDark] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [showAdmin, setShowAdmin] = React.useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = React.useState(false);
  const [resetToken, setResetToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setResetToken(token);
    }
  }, []);

  React.useEffect(() => {
    if (!showAdmin) {
      setIsAdminAuthenticated(false);
    }
  }, [showAdmin]);

  React.useEffect(() => {
    let unsubAdmin: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (unsubAdmin) {
        unsubAdmin();
        unsubAdmin = null;
      }

      if (u) {
        // Create/Update user doc
        setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${u.uid}`));

        // Admin Bootstrap (for development/demo purposes)
        if (u.email === 'royalrishabhrajput8953@gmail.com') {
          setDoc(doc(db, 'admins', u.uid), {
            uid: u.uid,
            email: u.email,
            boostrapped: true,
            secondaryPassword: 'admin123' // Initial default
          }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `admins/${u.uid}`));
        }

        // Check if admin
        unsubAdmin = onSnapshot(doc(db, 'admins', u.uid), (snap) => {
          setIsAdmin(snap.exists());
        }, (err) => handleFirestoreError(err, OperationType.GET, `admins/${u.uid}`));
      } else {
        setIsAdmin(false);
        setShowAdmin(false);
        setIsAdminAuthenticated(false);
      }
    });
    return () => {
      unsubscribe();
      if (unsubAdmin) unsubAdmin();
    };
  }, []);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(!isDark);

  return (
    <div className="min-h-screen bg-brand-bg">
      <Navbar 
        isDark={isDark} 
        toggleDark={toggleDark} 
        user={user} 
        isAdmin={isAdmin} 
        showAdmin={showAdmin} 
        setShowAdmin={setShowAdmin} 
      />
      <main>
        {resetToken ? (
          <ResetPasswordView 
            token={resetToken} 
            onComplete={() => {
              setResetToken(null);
              window.history.replaceState({}, document.title, "/");
              setShowAdmin(true);
            }} 
          />
        ) : showAdmin && isAdmin ? (
          isAdminAuthenticated ? (
            <AdminDashboard />
          ) : (
            <AdminAuth 
              user={user}
              onVerify={() => setIsAdminAuthenticated(true)} 
            />
          )
        ) : (
          <>
            <Hero />
            <MissionVision />
            <Amenities />
            <Pricing />
            <BookingSection user={user} />
            <Perks />
            <Testimonials />
            <ContactForm />
            <ExamsSection />
            <Location />
          </>
        )}
      </main>
      <Footer />
      
      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://chat.whatsapp.com/IFGwA4cflVD22Azz5wrw7a"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center group"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 text-[10px] uppercase font-bold tracking-widest">
          Join WhatsApp Group
        </span>
      </motion.a>
    </div>
  );
}
