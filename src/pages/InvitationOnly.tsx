import { Zap } from 'lucide-react';

export default function InvitationOnly() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark text-white px-6 select-none font-sans relative overflow-hidden">
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 text-center space-y-8 max-w-lg">
        {/* Logo / Brand */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-brand-gold border-[3px] border-white/20 mx-auto">
            <Zap className="h-8 w-8 text-brand-dark" />
          </div>
          <h1 className="display-heading text-4xl md:text-6xl text-white">
            OPTIMUS RUFUS
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-white/40">
            AI-NATIVE AMAZON LISTING OPTIMIZATION
          </p>
        </div>

        {/* Message */}
        <div className="border-[3px] border-white/10 bg-white/5 p-6 md:p-8 space-y-3 backdrop-blur-sm">
          <p className="text-lg font-bold text-white/90 leading-relaxed">
            We work by invitation only.
          </p>
          <p className="text-sm text-white/50 font-medium leading-relaxed">
            If you've received a personalized diagnostic link, please use that URL to access your listing report.
            Otherwise, reach out to us directly to get started.
          </p>
        </div>

        {/* Contact */}
        <p className="font-mono text-xs text-white/30 uppercase tracking-widest">
          Questions? Contact us at hello@optimusrufus.com
        </p>
      </div>
    </div>
  );
}
