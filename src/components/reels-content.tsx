const steps = [
  { icon: "🎬", title: "Find your Reel", text: "Open the public Reel you want to save on Facebook." },
  { icon: "🔗", title: "Copy its link", text: "Tap Share, then copy the Reel link." },
  { icon: "📋", title: "Paste it above", text: "Paste the link and press Download to find the available files." },
  { icon: "📥", title: "Save your file", text: "Choose video quality or convert the original sound to MP3." },
];

export function ReelsContent() {
  return <div className="mx-auto max-w-5xl py-12 sm:py-16">
    <h2 className="text-center text-2xl font-bold">Download Facebook Reels to your device</h2>
    <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-muted-foreground">Save public Facebook Reels without installing an app or signing in. Video quality depends on the original Reel; HD, SD and higher-resolution options appear when supported by the source.</p>
    <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{steps.map(step => <li key={step.title} className="rounded-lg border border-border bg-card p-5"><span aria-hidden="true" className="text-3xl">{step.icon}</span><h3 className="mt-4 text-base font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p></li>)}</ol>
    <section className="mx-auto mt-12 max-w-3xl">
      <div className="py-6"><h2 className="text-lg font-semibold">🎵 Can I save a Reel as MP3?</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">Yes. Choose Download MP3 after processing the link. The file keeps the original sound, including speech and music together. Conversion depends on CloudConvert availability and credits.</p></div>
      <div className="py-6"><h2 className="text-lg font-semibold">🔒 Why isn’t my Reel available?</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">The Reel must be public and still available on Facebook. Private, friends-only and login-restricted content is not supported. If a download expires, process the original Reel link again.</p></div>
      <div className="py-6"><h2 className="text-lg font-semibold">📱 Can I download on my phone?</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">Use your browser on Android, iPhone, tablet or computer. Files download directly to your device, subject to your browser’s download permissions.</p></div>
    </section>
    <p className="mt-8 text-center text-xs leading-6 text-muted-foreground">Only download Reels you own or have permission to save. Respect creators’ rights and Facebook’s terms.</p>
  </div>;
}