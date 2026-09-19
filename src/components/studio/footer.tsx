import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.08] bg-[#05070C]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">

          {/* Left: Coordinate stamps & status */}
          <div className="lg:col-span-5">
            <div className="flex flex-col gap-4">
              {/* Coordinate system */}
              <div className="flex items-center gap-6 font-mono text-xs text-white/40">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
                  <span>37.7749°N</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>122.4194°W</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>UTC−8</span>
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className="relative h-2 w-2">
                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <div className="relative h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-emerald-400">Systems Operational</span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <span className="text-white/40">
                  Accepting Projects
                </span>
              </div>
            </div>
          </div>

          {/* Center: Studio info */}
          <div className="lg:col-span-4 lg:text-center">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-white/90">
                  HVNF Studios
                </h3>
                <p className="text-xs text-white/50">
                  High-Performance Web Development
                </p>
              </div>

              {/* Direct contact */}
              <a
                href="mailto:studio@hvnf.dev"
                className="font-mono text-xs text-white/60 transition-colors hover:text-white/90"
              >
                studio@hvnf.dev
              </a>
            </div>
          </div>

          {/* Right: Copyright & build info */}
          <div className="lg:col-span-3 lg:text-right">
            <div className="flex flex-col gap-3 text-xs">
              <div className="font-mono text-white/40">
                <div>Build {currentYear}.{String(new Date().getMonth() + 1).padStart(2, '0')}</div>
                <div className="mt-1 text-[10px] text-white/30">
                  Edge Runtime
                </div>
              </div>

              <div className="text-white/50">
                © {currentYear} HVNF Studios
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar - minimal legal */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-6 text-[10px] font-mono text-white/30 sm:flex-row">
          <div className="flex gap-6">
            <a href="/terms" className="transition-colors hover:text-white/60">
              Terms
            </a>
            <a href="/privacy" className="transition-colors hover:text-white/60">
              Privacy
            </a>
          </div>

          <div>
            All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
