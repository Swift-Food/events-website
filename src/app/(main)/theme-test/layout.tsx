export default function ThemeTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the main navbar and footer on this page */}
      <style>{`
        body > div > header,
        body > div > footer {
          display: none !important;
        }
        body > div > main {
          flex: unset;
        }
      `}</style>
      {children}
    </>
  );
}
