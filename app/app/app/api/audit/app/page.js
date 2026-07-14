'use client';
import { useState } from 'react';

export default function Home() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAudit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Komunikační rozhraní se serverem selhalo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-100 font-mono p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Terminálová hlavička */}
        <div className="border border-blue-500/20 rounded-lg p-6 bg-zinc-900 shadow-[0_0_20px_rgba(59,130,246,0.08)]">
          <div className="flex items-center space-x-3">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-pulse"></span>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-blue-400">
              Aegis Security Auditor v2.0
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            [STAV: READY] Profesionální pasivní průzkumná (recon) a auditní stanice. Analyzuje bezpečnostní hlavičky, DNS zranitelnosti a detekuje vektory potenciálních útoků bez generování přímých nelegálních aktivit.
          </p>
        </div>

        {/* Vyhledávání / Ovládací panel */}
        <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/40">
          <form onSubmit={handleAudit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-slate-400 mb-2 font-bold tracking-wider">
                Cíl bezpečnostního auditu (Doména / IP):
              </label>
              <input
                type="text"
                placeholder="např. github.com, google.com nebo IP adresa"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded p-3 text-slate-200 focus:outline-none focus:border-blue-500 text-sm placeholder-zinc-600 transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded transition duration-150 text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? '⚡ SPOUŠTÍM BEZPEČNOSTNÍ AUDIT...' : 'SPUSTIT PASIVNÍ ANALÝZU'}
            </button>
          </form>
        </div>

        {/* Blok s výsledky auditu */}
        {result && (
          <div className="space-y-6">
            
            {result.error ? (
              <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                [!] CHYBA AUDITU: {result.error}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Levý sloupec: Skóre a Doporučení */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Score Card */}
                  <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/50 flex flex-col items-center justify-center text-center">
                    <h3 className="text-xs uppercase text-slate-400 mb-3 font-bold tracking-widest">Bezpečnostní skóre</h3>
                    <div className={`text-6xl font-extrabold mb-2 ${
                      typeof result.securityScore === 'number' && result.securityScore >= 80 
                        ? 'text-green-400' 
                        : typeof result.securityScore === 'number' && result.securityScore >= 50 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                    }`}>
                      {result.securityScore}{typeof result.securityScore === 'number' ? '%' : ''}
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Hodnocení konfigurace
                    </span>
                  </div>

                  {/* Remediation Plan (Akční kroky) */}
                  <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/50">
                    <h3 className="text-xs uppercase text-slate-400 mb-4 font-bold tracking-widest border-b border-zinc-800 pb-2">
                      Doporučení k opravě
                    </h3>
                    {result.recommendations?.length > 0 ? (
                      <ul className="space-y-3.5 text-xs leading-relaxed">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start space-x-2 text-yellow-300">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-green-400 font-bold">
                        ✅ Nebyla detekována žádná závažná rizika. Konfigurace splňuje standardy!
                      </p>
                    )}
                  </div>
                </div>

                {/* Pravý sloupec: Technické analýzy */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Sekce DNS a pošta */}
                  <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/50 space-y-4">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-zinc-800/60 pb-2">
                      SÍŤ & ELEKTRONICKÁ POŠTA (DNS)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block uppercase tracking-wider">Cílová IP adresa:</span>
                        <span className="text-white font-bold">{result.ip}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase tracking-wider">Status SSL/TLS:</span>
                        <span className="text-white font-bold">{result.sslStatus}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-500 block uppercase tracking-wider mb-1">E-mailové servery (MX):</span>
                        <span className="text-slate-300 block bg-black/40 p-2 rounded border border-zinc-900 font-sans break-all">
                          {result.dnsRecords?.mx}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-500 block uppercase tracking-wider mb-1">SPF Záznam:</span>
                        <code className="text-emerald-400 block bg-black/60 p-2.5 rounded border border-zinc-900 overflow-x-auto">
                          {result.dnsRecords?.spf}
                        </code>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-500 block uppercase tracking-wider mb-1">DMARC Záznam:</span>
                        <code className="text-emerald-400 block bg-black/60 p-2.5 rounded border border-zinc-900 overflow-x-auto">
                          {result.dnsRecords?.dmarc}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Sekce HTTP hlaviček */}
                  <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/50 space-y-4">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-zinc-800/60 pb-2">
                      BEZPEČNOSTNÍ HLAVIČKY (OWASP AUDIT)
                    </h3>
                    <div className="space-y-4 text-xs">
                      {result.securityHeaders && !result.securityHeaders.error ? (
                        Object.entries(result.securityHeaders).map(([name, data]) => (
                          <div key={name} className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800/20 pb-3 last:border-0 last:pb-0">
                            <span className="text-slate-300 font-bold">{name}:</span>
                            <div className="flex items-center space-x-2 mt-1 md:mt-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                                data.status.includes('ZABEZPEČENO') 
                                  ? 'bg-green-950 text-green-400 border border-green-500/30' 
                                  : 'bg-red-950 text-red-400 border border-red-500/30'
                              }`}>
                                {data.status}
                              </span>
                              {data.value !== 'Nenastaveno' && (
                                <code className="bg-black/60 text-slate-400 px-2 py-1 rounded max-w-xs md:max-w-md overflow-x-auto block whitespace-nowrap">
                                  {data.value}
                                </code>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-red-400 font-bold">
                          {result.securityHeaders?.error || 'Žádné hlavičky nebyly analyzovány.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Integrace třetí strany - Shodan */}
                  <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Pasivní Sken Portů přes Shodan</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Zjisti, jaké služby a otevřené porty na dané IP adrese vidí globální vyhledávací roboti Shodan.
                      </p>
                    </div>
                    <a 
                      href={result.shodanLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full md:w-auto text-center bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/30 px-5 py-3 rounded text-xs font-bold transition flex items-center justify-center space-x-2"
                    >
                      <span>ANALYZA PORTŮ</span>
                      <span>↗</span>
                    </a>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
