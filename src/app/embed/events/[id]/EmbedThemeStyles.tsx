import type { ColorPalette } from "@/types/event/theme";

interface EmbedThemeStylesProps {
 palette: ColorPalette;
}

export default function EmbedThemeStyles({ palette }: EmbedThemeStylesProps) {
 return (
  <style>{`
   .themed-event h1,
   .themed-event h2,
   .themed-event h3 {
    color: ${palette.mainTextColor};
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
   }
   .themed-event h1 { font-size: 1.5rem; }
   .themed-event h2 { font-size: 1.25rem; }
   .themed-event h3 { font-size: 1.125rem; }
   .themed-event p,
   .themed-event li {
    color: ${palette.mainTextColor};
    opacity: 0.9;
    font-size: 0.875rem;
    line-height: 1.5rem;
    margin: 0.375rem 0;
   }
   .themed-event ul {
    list-style-type: disc;
    padding-left: 1.25rem;
    margin: 0.375rem 0;
   }
   .themed-event ol {
    list-style-type: decimal;
    padding-left: 1.25rem;
    margin: 0.375rem 0;
   }
   .themed-event blockquote {
    border-left: 4px solid ${palette.borderColor};
    padding-left: 0.875rem;
    margin: 0.75rem 0;
    font-style: italic;
    color: ${palette.subTextColor};
   }
   .themed-event hr {
    border: none;
    border-top: 2px solid ${palette.borderColor};
    margin: 1.25rem 0;
   }
   .themed-event a {
    color: ${palette.primaryColor};
    text-decoration: underline;
   }
   .themed-event code {
    background-color: ${palette.cardSecondaryBackground};
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.8125rem;
   }
   .themed-event strong {
    font-weight: 700;
    color: ${palette.mainTextColor};
   }
   .themed-event em {
    font-style: italic;
   }
  `}</style>
 );
}
