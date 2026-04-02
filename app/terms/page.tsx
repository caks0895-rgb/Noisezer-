export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-zinc-400 p-12 font-mono text-sm max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
      <div className="space-y-6">
        <p>Last updated: March 30, 2026</p>
        <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
        <p>By accessing or using the Noisezer platform, you agree to be bound by these Terms of Service.</p>
        <h2 className="text-xl font-bold text-white">2. No Financial Advice</h2>
        <p>Noisezer provides market data and anomaly detection for informational purposes only. We do not provide investment advice, buy/sell recommendations, or price predictions.</p>
        <h2 className="text-xl font-bold text-white">3. Limitation of Liability</h2>
        <p>Noisezer is not liable for any financial losses or damages resulting from the use of our data or services.</p>
        <h2 className="text-xl font-bold text-white">4. Autonomous Agent Usage</h2>
        <p>Users are responsible for the actions of their autonomous agents utilizing the Noisezer API.</p>
      </div>
    </main>
  );
}
