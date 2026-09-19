"use client";

import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);

  return (
    <>
      <motion.nav
        className="sticky top-0 z-50 backdrop-blur-xl bg-carbon-500/80 border-b border-border-hairline"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Monomark */}
            <motion.a
              href="/"
              className="flex items-center gap-3 group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="font-mono text-sm tracking-tight">
                <span className="text-white font-semibold">HVNF STUDIOS</span>
                <span className="text-white/40 ml-2">//</span>
                <span className="text-white/60 ml-2 text-xs">[SYS.VER_2.4]</span>
              </div>
            </motion.a>

            {/* Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
              <motion.div
                className="w-2 h-2 rounded-full bg-signal-green shadow-[0_0_8px_rgba(0,255,136,0.6)]"
                animate={{
                  opacity: [1, 0.5, 1],
                  scale: [1, 0.95, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <span className="text-xs font-mono text-signal-green/90 tracking-tight">
                SYSTEMS OPERATIONAL
              </span>
              <span className="text-white/30 mx-1">/</span>
              <span className="text-xs font-mono text-white/60 tracking-tight">
                ACCEPTING Q4 ENGAGEMENTS
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <NavLink href="#work">Work / Flagships</NavLink>
              <NavLink href="#capabilities">Capabilities</NavLink>
              <NavLink href="#architecture">Architecture</NavLink>
              <motion.button
                onClick={() => setIntakeOpen(true)}
                className="ml-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-mono tracking-tight transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Initiate Project
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="lg:hidden border-t border-border-hairline bg-carbon-400"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                <motion.div
                  className="w-2 h-2 rounded-full bg-signal-green"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs font-mono text-signal-green/90">
                  SYSTEMS OPERATIONAL
                </span>
              </div>
              <MobileNavLink href="#work">Work / Flagships</MobileNavLink>
              <MobileNavLink href="#capabilities">Capabilities</MobileNavLink>
              <MobileNavLink href="#architecture">Architecture</MobileNavLink>
              <button
                onClick={() => {
                  setIntakeOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-mono text-left transition-colors"
              >
                Initiate Project
              </button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Intake Drawer Overlay */}
      {intakeOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIntakeOpen(false)}
        >
          <motion.div
            className="absolute right-0 top-0 h-full w-full max-w-lg bg-carbon-400 border-l border-border-hairline shadow-2xl overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-mono text-white">Initiate Project</h2>
                <button
                  onClick={() => setIntakeOpen(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Intake form content goes here
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.a
      href={href}
      className="px-3 py-2 text-sm font-mono text-white/70 hover:text-white transition-colors relative group"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {children}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-white/20"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.a>
  );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block px-4 py-3 text-sm font-mono text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
    >
      {children}
    </a>
  );
}
