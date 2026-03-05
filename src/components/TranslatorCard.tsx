import { useState, useCallback } from "react";
import { ArrowRightLeft, Copy, Check, Volume2, Loader2, Eraser, Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Lang = "Bangla" | "English" | "Auto";

const TranslatorCard = () => {
  const [sourceLang, setSourceLang] = useState<Lang>("Auto");
  const [targetLang, setTargetLang] = useState<Lang>("English");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedLang, setDetectedLang] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const swapLanguages = useCallback(() => {
    if (sourceLang === "Auto") {
      // If auto, swap detected lang with target
      const newSource = targetLang;
      const newTarget = detectedLang === "Bangla" ? "Bangla" : "English";
      setSourceLang(newSource);
      setTargetLang(newTarget as Lang);
    } else {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
    }
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    setDetectedLang("");
  }, [sourceLang, targetLang, sourceText, translatedText, detectedLang]);

  const translate = useCallback(async () => {
    if (!sourceText.trim()) {
      toast.error("Please enter text to translate");
      return;
    }
    setIsLoading(true);
    setDetectedLang("");
    try {
      const { data, error } = await supabase.functions.invoke("translate", {
        body: { text: sourceText, sourceLang, targetLang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTranslatedText(data.translatedText || "");
      if (data.detectedLanguage) {
        setDetectedLang(data.detectedLanguage);
      }
    } catch (err: any) {
      toast.error(err.message || "Translation failed");
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, sourceLang, targetLang]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [translatedText]);

  const speak = useCallback((text: string, lang: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "Bangla" ? "bn-BD" : "en-US";
    speechSynthesis.speak(utterance);
  }, []);

  const clearAll = useCallback(() => {
    setSourceText("");
    setTranslatedText("");
    setDetectedLang("");
  }, []);

  const charCount = sourceText.length;
  const displaySourceLang = sourceLang === "Auto" ? (detectedLang || "Auto Detect") : sourceLang;
  const displaySourceLabel = displaySourceLang === "Bangla" ? "বাংলা" : displaySourceLang === "English" ? "English" : "Auto Detect";

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Language Selector Bar */}
      <div className="flex items-center justify-center gap-3 md:gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          {(["Auto", "Bangla", "English"] as Lang[]).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setSourceLang(lang);
                setDetectedLang("");
                if (lang === "Bangla") setTargetLang("English");
                else if (lang === "English") setTargetLang("Bangla");
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold font-heading tracking-wide transition-all duration-300 ${
                sourceLang === lang
                  ? "gradient-primary text-primary-foreground shadow-card"
                  : "bg-card text-muted-foreground border border-border hover:bg-muted"
              }`}
            >
              {lang === "Auto" && <Sparkles className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
              {lang === "Bangla" ? "বাংলা" : lang === "Auto" ? "Auto" : "English"}
            </button>
          ))}
        </div>

        <button
          onClick={swapLanguages}
          className="group relative p-3 rounded-full bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Swap languages"
        >
          <ArrowRightLeft className="w-5 h-5 text-primary transition-transform duration-300 group-hover:rotate-180" />
        </button>

        <button
          className="px-5 py-2 rounded-full font-heading text-sm font-semibold tracking-wide gradient-primary text-primary-foreground shadow-card"
          disabled
        >
          {targetLang === "Bangla" ? "বাংলা" : "English"}
        </button>
      </div>

      {/* Main Translation Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-card rounded-2xl shadow-elevated overflow-hidden border border-border">
        {/* Source Panel */}
        <div className="relative p-5 md:border-r border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {displaySourceLabel}
              </span>
              {sourceLang === "Auto" && detectedLang && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Detected
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => speak(sourceText, displaySourceLang)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Listen"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder={sourceLang === "Bangla" ? "এখানে বাংলা লিখুন..." : sourceLang === "English" ? "Type English here..." : "যেকোনো ভাষায় লিখুন / Type in any language..."}
            className="w-full h-48 bg-transparent resize-none outline-none text-foreground text-lg leading-relaxed placeholder:text-muted-foreground/50 font-body"
            maxLength={5000}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{charCount}/5000</span>
          </div>
        </div>

        {/* Target Panel */}
        <div className="relative p-5 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {targetLang === "Bangla" ? "বাংলা" : "English"}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => speak(translatedText, targetLang)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Listen"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={copyToClipboard}
                disabled={!translatedText}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Copy"
              >
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="w-full h-48 text-lg leading-relaxed text-foreground overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Translating...</span>
              </div>
            ) : (
              translatedText || (
                <span className="text-muted-foreground/50">
                  {targetLang === "Bangla" ? "অনুবাদ এখানে দেখাবে..." : "Translation will appear here..."}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Translate Button */}
      <div className="flex justify-center mt-6">
        <Button
          onClick={translate}
          disabled={isLoading || !sourceText.trim()}
          variant="translate"
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Languages className="w-5 h-5" />
          )}
          {isLoading ? "Translating..." : "Translate"}
        </Button>
      </div>
    </div>
  );
};

export default TranslatorCard;
