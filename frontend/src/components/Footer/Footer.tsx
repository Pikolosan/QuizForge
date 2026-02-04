import { Github, Mail, Linkedin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-border/60 bg-card/60 backdrop-blur-md supports-[backdrop-filter]:bg-card/40">
      {/* Gradient accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-500" />

      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-7 flex flex-col md:flex-row items-center md:items-center justify-center gap-4 sm:gap-6">
        {/* Created by */}
        {/* <div className="text-center md:text-left">
          <p className="text-xs sm:text-sm text-muted-foreground">Created by </p>
          <p className="flex items-center justify-center md:justify-start gap-1 sm:gap-2 font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 animate-pulse drop-shadow-[0_0_12px_rgba(168,85,247,0.35)] text-xl sm:text-2xl md:text-3xl">
            Parth Chaudhary
            <span className="inline-flex items-center justify-center">
              
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)] animate-ping" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l1.9 5.6L20 9.5l-5.1 1.9L12 17l-2.9-5.6L4 9.5l6.1-1.9L12 2z"/>
              </svg>
            </span>
          </p>
        </div> */}

        {/* Links */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full justify-center">
          <a
            href="https://github.com/Pikolosan/"
            className="ai-rounded-lg px-3 sm:px-4 py-2 border border-border/70 bg-background/50 hover:bg-primary/10 transition-colors inline-flex items-center gap-2 ai-glass ai-card-glow w-full sm:w-auto justify-center"
            target="_blank" rel="noreferrer"
          >
            <Github className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm">github: @Pikolosan</span>
          </a>
          <a
            href="https://www.linkedin.com/in/parth-chaudhary-aa82ab262/"
            className="ai-rounded-lg px-3 sm:px-4 py-2 border border-border/70 bg-background/50 hover:bg-primary/10 transition-colors inline-flex items-center gap-2 ai-glass ai-card-glow w-full sm:w-auto justify-center"
            target="_blank" rel="noreferrer"
          >
            <Linkedin className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm">linkedin: @parth-chaudhary</span>
          </a>
        </div>
      </div>
    </footer>
  );
};


