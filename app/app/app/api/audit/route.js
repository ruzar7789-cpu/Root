import { NextResponse } from 'next/server';
import dns from 'dns/promises';

export async function POST(request) {
  try {
    const { target } = await request.json();
    if (!target) {
      return NextResponse.json({ error: 'Zadejte platný cíl (doménu nebo IP)' }, { status: 400 });
    }

    // Vyčištění domény od protokolů (http://, https://, www. atd.)
    const cleanDomain = target
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      .trim();
    
    let ip = 'Neznámá';
    let dnsRecords = { mx: 'Nenalezeno', spf: 'Nenalezeno', dmarc: 'Nenalezeno' };
    let securityHeaders = {};
    let sslStatus = 'Neznámé';
    let securityScore = 100;
    let recommendations = [];

    // 1. DNS Lookup (Zjištění IPv4 adresy)
    try {
      const ips = await dns.resolve4(cleanDomain);
      ip = ips[0] || 'Neznámá';
    } catch (e) {
      ip = 'Chyba při překladu DNS (A záznam)';
      securityScore -= 20;
      recommendations.push('Chybí nebo je poškozený DNS A záznam. Prověřte směrování domény.');
    }

    // 2. Analýza DNS Mail Security (MX, SPF, DMARC)
    try {
      const mx = await dns.resolveMx(cleanDomain);
      dnsRecords.mx = mx.map(m => `${m.exchange} (priorita: ${m.priority})`).join(', ');
    } catch (e) {
      dnsRecords.mx = '⚠️ Nenalezeny žádné MX záznamy (Doména nemůže přijímat e-maily).';
    }

    try {
      const txt = await dns.resolveTxt(cleanDomain);
      
      // Hledání SPF
      const spf = txt.flat().find(record => record.startsWith('v=spf1'));
      if (spf) {
        dnsRecords.spf = spf;
      } else {
        dnsRecords.spf = '❌ SPF záznam nebyl v DNS zóně nalezen!';
        securityScore -= 15;
        recommendations.push('Implementujte SPF (Sender Policy Framework) záznam. Bez něj mohou útočníci snadno podvrhnout vaše e-mailové adresy.');
      }

      // Hledání DMARC (DMARC se často nachází na subdoméně _dmarc.domena.cz)
      let dmarcRecords = [];
      try {
        dmarcRecords = await dns.resolveTxt(`_dmarc.${cleanDomain}`);
      } catch (_) {
        // Zkusit v hlavním TXT, pokud subdoména selže
        dmarcRecords = txt;
      }
      
      const dmarc = dmarcRecords.flat().find(record => record.startsWith('v=DMARC1'));
      if (dmarc) {
        dnsRecords.dmarc = dmarc;
      } else {
        dnsRecords.dmarc = '❌ DMARC záznam nebyl nalezen!';
        securityScore -= 15;
        recommendations.push('Nakonfigurujte DMARC záznam v DNS. DMARC určuje, jak mají servery nakládat s e-maily, které neprojdou SPF/DKIM kontrolou.');
      }
    } catch (e) {
      dnsRecords.spf = '⚠️ Nelze vyhodnotit (Chyba TXT dotazu)';
      dnsRecords.dmarc = '⚠️ Nelze vyhodnotit (Chyba TXT dotazu)';
    }

    // 3. Analýza HTTP / HTTPS a OWASP Bezpečnostních hlaviček
    try {
      const url = target.startsWith('http') ? target : `https://${cleanDomain}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout pro pomalejší weby

      const response = await fetch(url, { 
        method: 'GET', 
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'AegisSecurityAuditor/2.0 (Vercel Serverless Agent)'
        }
      });
      
      clearTimeout(timeoutId);
      const headers = response.headers;

      // Seznam OWASP hlaviček k analýze
      const expectedHeaders = {
        'content-security-policy': {
          desc: 'Content Security Policy (CSP)',
          penalty: 20,
          rec: 'Není definována politika CSP. Hrozí riziko injekce škodlivých skriptů (XSS) a clickjacking.'
        },
        'strict-transport-security': {
          desc: 'HTTP Strict Transport Security (HSTS)',
          penalty: 15,
          rec: 'HSTS hlavička chybí. Útočníci mohou donutit prohlížeč komunikovat přes nešifrovaný HTTP protokol (MITM útoky).'
        },
        'x-frame-options': {
          desc: 'X-Frame-Options (Ochrana proti Clickjackingu)',
          penalty: 10,
          rec: 'Chybí ochrana X-Frame-Options. Web může být zneužit a vložen do skrytého iframe na cizím útočném webu.'
        },
        'x-content-type-options': {
          desc: 'X-Content-Type-Options',
          penalty: 5,
          rec: 'Chybí hlavička X-Content-Type-Options: nosniff. Prohlížeče se mohou pokusit odhadnout MIME typ souborů, což usnadňuje spuštění malware.'
        },
        'referrer-policy': {
          desc: 'Referrer-Policy',
          penalty: 5,
          rec: 'Referrer-Policy není explicitně nastavena. Při přechodu na cizí weby se mohou přenášet citlivé parametry z URL adresy.'
        }
      };

      // Vyhodnocení hlaviček
      Object.entries(expectedHeaders).forEach(([headerName, info]) => {
        const value = headers.get(headerName);
        if (value) {
          securityHeaders[info.desc] = { status: '✅ ZABEZPEČENO', value };
        } else {
          securityHeaders[info.desc] = { status: '❌ CHYBÍ', value: 'Nenastaveno' };
          securityScore -= info.penalty;
          recommendations.push(info.rec);
        }
      });

      sslStatus = url.startsWith('https') ? '🔒 Aktivní (HTTPS)' : '⚠️ Neaktivní (HTTP)';
      if (!url.startsWith('https')) {
        securityScore -= 30;
        recommendations.push('Kritické: Web neběží na HTTPS. Veškerá komunikace a hesla jsou přenášeny v čistém textu a lze je odposlechnout.');
      }

    } catch (e) {
      securityHeaders = { error: 'Nepodařilo se navázat HTTP/HTTPS spojení pro analýzu hlaviček. Hostitel může blokovat automatizované dotazy.' };
      securityScore = 'Nedostupné';
    }

    // Udržení skóre v rozmezí 0 až 100
    if (typeof securityScore === 'number') {
      securityScore = Math.max(0, securityScore);
    }

    // Generování linku na Shodan pro pasivní analýzu portů
    const shodanLink = `https://www.shodan.io/host/${ip}`;

    return NextResponse.json({
      domain: cleanDomain,
      ip,
      sslStatus,
      dnsRecords,
      securityHeaders,
      securityScore,
      recommendations,
      shodanLink
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
