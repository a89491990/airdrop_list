import { Languages } from "lucide-react";
import TranslatorCard from "@/components/TranslatorCard";

const Index = () => {
  return (
    <div className="min-h-screen gradient-surface">
      {/* Header */}
      <header className="pt-10 pb-8 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl gradient-primary shadow-card animate-pulse-glow">
            <Languages className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground tracking-tight">
            Translator
          </h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
          AI-powered Bangla ↔ English translator with natural, context-aware results
        </p>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-16">
        <TranslatorCard />
      </main>

      {/* Footer */}
      <footer className="text-center pb-6 text-xs text-muted-foreground">
        Powered by AI · Built with ❤️
      </footer>
    </div>
  );
};

export default Index;
