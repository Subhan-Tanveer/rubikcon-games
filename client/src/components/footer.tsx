import { Button } from "@/components/ui/button";
import { Facebook, X, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border/50 mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Social Links */}
        <div className="flex justify-center space-x-4 mb-8">
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 shadow-[0_2px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-transform hover:scale-105"
          >
            <Facebook className="h-5 w-5 text-[#4267B2]" />
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 shadow-[0_2px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-transform hover:scale-105"
          >
            <X className="h-5 w-5 text-white" />
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 shadow-[0_2px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-5 w-5 text-[#7289DA]" viewBox="0 0 16 16">
              <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
            </svg>
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 shadow-[0_2px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-transform hover:scale-105"
          >
            <Send className="h-5 w-5 text-[#0088CC]" />
          </a>
        </div>

        {/* Company Description */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground max-w-4xl mx-auto">
            Rubikcon Games is a subsidiary of Rubikcon Nexus, a company dedicated to
            empowering businesses with innovative Web3 solutions for global impact. We
            provide end to end services from ideation and strategy to development and
            education driven by our core values of transparency, agility, continuous
            learning and proactiveness.
          </p>
        </div>

        {/* Company Branding */}
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
          <div className="flex items-center space-x-2">
            <div className="flex h-24 w-24 items-center justify-center rounded">
              <img src="/images/logo.png" alt="Rubikcon Logo" className="h-full w-full object-contain" />
            </div>
           
          </div>
          <Button variant="default">
            Visit our Website
          </Button>
        </div>

        {/* Copyright */}
        <div className="text-center text-muted-foreground text-sm">
          ©Copyright 2025 Rubikcon Games. All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
