/* Animated visuals for the learning pages.
   A page opts in with <div class="vz" data-vz="name"></div>; the builder named in B fills it. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ── tiny markup helpers ── */
  const node = (em, label, cls = '') => `<div class="node ${cls}"><span class="em">${em}</span>${label}</div>`;
  const lane = (t, dir = 'r', cls = '') => `<div class="lane">${t ? `<span class="pkt ${dir} ${cls}">${t}</span>` : ''}</div>`;
  const flow = (...p) => `<div class="flow">${p.join('')}</div>`;
  const mem = t => `<div class="mem-box"><span class="mem-tag">🧠 MEMORY TRICK</span>${t}</div>`;
  const wrap = (el, head, inner) => { el.innerHTML = `<div class="vz-head">${head}</div>${inner}`; };

  /* ── generic step-by-step player ── */
  function stepper(host, title, frames, opts = {}) {
    host.innerHTML = `<div class="stepper">${title ? `<div class="demo-title">${title}</div>` : ''}
      <div class="stage">${frames.map(f => `<div class="frame">${f.html}</div>`).join('')}</div>
      <div class="step-cap"></div>
      <div class="step-ctl"><button class="btn-sm" data-a="prev">◀</button><button class="btn-sm" data-a="play">▶ Play</button><button class="btn-sm" data-a="next">▶|</button><span class="dots"></span></div></div>`;
    const fr = $$('.frame', host), cap = $('.step-cap', host), dots = $('.dots', host), play = $('[data-a=play]', host);
    let i = 0, timer = null;
    fr.forEach(() => dots.appendChild(document.createElement('i')));
    const show = n => {
      i = (n + fr.length) % fr.length;
      fr.forEach((f, k) => f.classList.toggle('show', k === i));
      $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i));
      cap.textContent = frames[i].cap;
    };
    const stop = () => { clearInterval(timer); timer = null; play.textContent = '▶ Play'; };
    $('[data-a=prev]', host).onclick = () => { stop(); show(i - 1); };
    $('[data-a=next]', host).onclick = () => { stop(); show(i + 1); };
    play.onclick = () => { if (timer) return stop(); play.textContent = '⏸ Pause'; timer = setInterval(() => show(i + 1), opts.ms || 2800); };
    show(0);
  }

  const B = {};

  /* ═══════════ NETWORKING ═══════════ */

  /* packet journey */
  B['net-journey'] = el => {
    const hop = (hl, cap) => {
      const names = [['💻', 'Your PC'], ['🔀', 'Switch'], ['📡', 'Router'], ['🌐', 'Internet'], ['🖥️', 'Server']];
      return {
        cap, html: `<div class="path">${names.map((n, k) => (k ? '<span class="arr">▶▶</span>' : '') + node(n[0], n[1], k === hl ? 'hl' : (k < hl ? 'hl-c' : ''))).join('')}</div>
        <div class="pchips"><span class="pchip">P1</span><span class="pchip">P2</span><span class="pchip">P3</span><span class="pchip">P4</span></div>`
      };
    };
    stepper(el, 'Animation · the journey of data', [
      { cap: 'A file/message is broken into small packets.', html: `<div class="pchips"><span class="pchip dim">Your data: photo.jpg</span></div><div class="pchips"><span class="pchip">P1</span><span class="pchip">P2</span><span class="pchip">P3</span><span class="pchip">P4</span></div>` },
      { cap: 'Each packet carries a Source address (your IP) and a Destination address (server IP).', html: `<div class="pchips"><span class="pchip">[ SRC 192.168.1.10 | DST 93.184.216.34 | data P1 ]</span></div><div class="pchips"><span class="pchip dim">same header on every packet</span></div>` },
      hop(0, 'Packets leave your device…'),
      hop(1, '…the Switch passes them along inside your local network…'),
      hop(2, '…the Router forwards them toward the Internet…'),
      hop(3, '…they cross many networks on the Internet (they may even take different routes)…'),
      hop(4, '…and reach the server.'),
      { cap: 'The server reassembles P1–P4 in order into the original data.', html: `<div class="flow">${node('🖥️', 'Server', 'ok')}${lane('P1 P2 P3 P4 ✔', 'both', 'ok')}${node('📄', 'photo.jpg', 'ok')}</div>` },
    ]);
  };

  /* OSI encapsulation */
  B['osi'] = el => {
    const L = [
      null,
      { n: 'Physical', pdu: 'Bits', hdr: '' },
      { n: 'Data Link', pdu: 'Frames', hdr: 'MAC' },
      { n: 'Network', pdu: 'Packets', hdr: 'IP' },
      { n: 'Transport', pdu: 'Segments', hdr: 'TCP/UDP' },
      { n: 'Session', pdu: 'Data', hdr: 'Session' },
      { n: 'Presentation', pdu: 'Data', hdr: 'TLS' },
      { n: 'Application', pdu: 'Data', hdr: '' },
    ];
    const REQ = {
      web: { label: '🌐 Open a website', data: 'GET /index.html', proto: 'HTTP/HTTPS', tp: 'TCP :443', pres: 'TLS encrypts the data (+ formats / compresses)', port: 'src port 51512 → dst port 443 (TCP)' },
      mail: { label: '✉️ Send an email', data: 'MAIL FROM: asha@…', proto: 'SMTP', tp: 'TCP :587', pres: 'TLS encrypts the message; text encoded', port: 'src port 49822 → dst port 587 (TCP)' },
      dns: { label: '🔎 DNS lookup', data: 'Who is example.com?', proto: 'DNS', tp: 'UDP :53', pres: 'Data formatted into DNS message', port: 'src port 53211 → dst port 53 (UDP)' },
    };
    let key = 'web', s = 0, timer = null;
    el.innerHTML = `<div class="vz-head">Animation · follow one request down 7 layers, across the wire and back up 7 layers</div>
      <div class="demo">
        <div class="tabs">${Object.entries(REQ).map(([k, r]) => `<button class="btn-sm ${k === key ? 'on' : ''}" data-k="${k}">${r.label}</button>`).join('')}</div>
        <div class="osi">
          <div><div class="stack-t">💻 SENDER (you)</div>${[7, 6, 5, 4, 3, 2, 1].map(n => `<div class="ly" data-s="${n}"><b>${n}</b>${L[n].n}<small>${L[n].pdu}</small></div>`).join('')}</div>
          <div class="wire"><span>⬇ encapsulate</span><div class="tube"></div><span>⬆ de-encapsulate</span></div>
          <div><div class="stack-t">🖥️ RECEIVER (server)</div>${[7, 6, 5, 4, 3, 2, 1].map(n => `<div class="ly" data-r="${n}"><b>${n}</b>${L[n].n}<small>${L[n].pdu}</small></div>`).join('')}</div>
        </div>
        <div class="pk"><div class="pk-t" id="osiPT"></div><div id="osiPK"></div></div>
        <div class="step-cap" id="osiCap"></div>
        <div class="step-ctl"><button class="btn-sm" data-a="prev">◀</button><button class="btn-sm" data-a="play">▶ Play</button><button class="btn-sm" data-a="next">▶|</button><button class="btn-sm" data-a="reset">↺ Restart</button><span class="dots" id="osiDots"></span></div>
      </div>
      ${mem('<strong>Top → bottom (sending):</strong> <em>All People Seem To Need Data Processing</em> = Application, Presentation, Session, Transport, Network, Data-link, Physical.<br><strong>Bottom → top:</strong> <em>Please Do Not Throw Sausage Pizza Away</em> = Physical, Data-link, Network, Transport, Session, Presentation, Application.<br>Data names on the way down: <strong>Data → Segment → Packet → Frame → Bits</strong>.')}`;
    const dots = $('#osiDots', el);
    for (let i = 0; i < 15; i++) dots.appendChild(document.createElement('i'));
    const nest = (n, r) => {
      if (n === 1) return `<div class="w w1">${'01101001 01010011 …'}</div>`;
      let h = `<div class="w w7"><b>L7</b><span class="core">${esc(r.data)}</span></div>`;
      for (let k = 6; k >= n; k--) {
        const lab = { 6: 'L6 TLS', 5: 'L5 Session', 4: 'L4 ' + r.tp, 3: 'L3 IP', 2: 'L2 MAC' }[k];
        const extra = k === 2 ? '<i>trailer</i>' : '';
        h = `<div class="w w${k}"><b>${lab}</b>${h}${extra}</div>`;
      }
      return h;
    };
    const info = (n, r, up) => ({
      7: up ? 'Application receives the HTTP/SMTP/DNS data and shows it to the program.' : `The app creates the request: ${r.proto} → “${r.data}”.`,
      6: up ? 'Presentation decrypts / decompresses the data back to readable form.' : r.pres + '.',
      5: up ? 'Session layer matches the data to the open conversation.' : 'Session layer opens / tracks the conversation between the two apps.',
      4: up ? 'Transport removes the header and puts segments back in order.' : `Transport adds a header with ports: ${r.port}. The data becomes a segment.`,
      3: up ? 'Network checks the destination IP is me, removes the IP header.' : 'Network adds the IP header: source IP (192.168.1.10) → destination IP (93.184.216.34). The data becomes a packet.',
      2: up ? 'Data Link checks the MAC address and removes the frame header and trailer.' : 'Data Link adds the MAC addresses (next hop on the local network) plus an error-check trailer. It is now a frame.',
      1: up ? 'Physical receives the electrical / light / radio signals and turns them into bits.' : 'Physical turns the frame into bits (0s and 1s) and sends them over cable or Wi-Fi.',
    })[n];
    const render = () => {
      const r = REQ[key];
      $$('.ly[data-s]', el).forEach(d => { const n = +d.dataset.s; const active = s <= 6 && n === 7 - s; const done = s > 6 || n > 7 - s; d.className = 'ly' + (active ? ' on' : done ? ' done' : ''); });
      $$('.ly[data-r]', el).forEach(d => { const n = +d.dataset.r; const active = s >= 8 && n === s - 7; const done = s >= 8 && n < s - 7; d.className = 'ly' + (active ? ' on' : done ? ' done' : ''); });
      $('.wire', el).classList.toggle('live', s === 7);
      $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === s));
      let n, up, cap;
      if (s <= 6) { n = 7 - s; up = false; cap = `SENDER · Layer ${n} (${L[n].n}): ` + info(n, r, false); }
      else if (s === 7) { n = 1; up = false; cap = '📡 ON THE WIRE: the bits travel across cables / Wi-Fi / the Internet to the server.'; }
      else { n = s - 7; up = true; cap = `RECEIVER · Layer ${n} (${L[n].n}): ` + info(n, r, true); }
      $('#osiCap', el).textContent = cap;
      $('#osiPT', el).textContent = s === 7 ? 'Data on the wire: bits' : `What the data looks like right now (${up ? 'being unwrapped' : 'being wrapped'}) · unit: ${L[n].pdu}`;
      $('#osiPK', el).innerHTML = nest(n, r);
    };
    const stop = () => { clearInterval(timer); timer = null; $('[data-a=play]', el).textContent = '▶ Play'; };
    $('[data-a=prev]', el).onclick = () => { stop(); s = Math.max(0, s - 1); render(); };
    $('[data-a=next]', el).onclick = () => { stop(); s = Math.min(14, s + 1); render(); };
    $('[data-a=reset]', el).onclick = () => { stop(); s = 0; render(); };
    $('[data-a=play]', el).onclick = () => {
      if (timer) return stop();
      if (s >= 14) s = 0;
      $('[data-a=play]', el).textContent = '⏸ Pause';
      timer = setInterval(() => { if (s >= 14) return stop(); s++; render(); }, 2600);
      render();
    };
    $$('[data-k]', el).forEach(b => b.onclick = () => { key = b.dataset.k; $$('[data-k]', el).forEach(x => x.classList.toggle('on', x === b)); render(); });
    render();
  };

  /* TCP vs UDP */
  B['tcp-udp'] = el => {
    el.innerHTML = `<div class="vz-head">Animation · TCP (reliable) vs UDP (fast)</div><div id="tcpS"></div><div id="udpS"></div>`;
    const C = node('💻', 'Client'), S = node('🖥️', 'Server');
    stepper($('#tcpS', el), 'TCP · reliable, ordered, error-checked', [
      { cap: '1. Client says “Can we talk?” (SYN).', html: flow(C, lane('SYN', 'r'), S) },
      { cap: '2. Server answers “Yes, ready” (SYN-ACK).', html: flow(C, lane('SYN-ACK', 'l'), S) },
      { cap: '3. Client confirms (ACK). Three-way handshake done: connection established.', html: flow(C, lane('ACK', 'r', 'ok'), S) },
      { cap: '4. Data is sent in numbered segments.', html: flow(C, lane('Seg 1 · 2 · 3', 'r'), S) },
      { cap: '5. Segment 2 gets lost on the way. The server never ACKs it…', html: flow(C, lane('ACK 1, ACK 3 (no ACK 2)', 'l', 'red'), S) },
      { cap: '6. …so the client re-sends Segment 2. Nothing is missing at the end. Reliable, but with extra steps.', html: flow(C, lane('Re-send Seg 2', 'r', 'ok'), S) },
    ]);
    stepper($('#udpS', el), 'UDP · fast, connectionless, no guarantee', [
      { cap: '1. No handshake. The client just sends datagram 1.', html: flow(C, lane('Datagram 1', 'r'), S) },
      { cap: '2. Datagram 2 is lost on the way.', html: flow(C, lane('Datagram 2 ✖ lost', 'r', 'red'), S) },
      { cap: '3. Nobody checks and nobody re-sends. That is faster, but not guaranteed (fine for video calls, DNS, gaming).', html: flow(C, lane('Datagram 3', 'r'), S) },
    ]);
    el.insertAdjacentHTML('beforeend', mem('<strong>TCP = phone call</strong> (connect, confirm, resend if you missed a word). <strong>UDP = shouting a message across the street</strong> (fast, no confirmation).'));
  };

  /* VPN */
  B['vpn'] = el => {
    let on = false;
    const draw = () => {
      const spy = on ? '🔒 x9#Kq2…8fA9 (encrypted — unreadable)' : 'username=vishu&password=Vishu@123';
      const ip = on ? '198.51.100.9 (the VPN server)' : '203.0.113.25 (YOUR real IP)';
      $('#vpnBody', el).innerHTML =
        flow(node('💻', 'You'), lane(on ? '🔒 encrypted tunnel' : 'password=Vishu@123', 'r', on ? 'enc' : ''), node('☕', 'Public Wi-Fi<br>/ ISP', on ? '' : 'bad'),
          on ? lane('🔒 tunnel', 'r', 'enc') + node('🛡️', 'VPN server', 'ok') + lane('request', 'r') : lane('request', 'r'), node('🌐', 'Website')) +
        `<div class="spy">🕵️ Someone on the Wi-Fi sees:<div class="out ${on ? 'good' : 'bad'}">${esc(spy)}</div></div>
         <div class="spy" style="border-color:var(--border);background:rgba(196,255,0,.05)">🌐 The website sees your IP as:<div class="out ${on ? 'good' : ''}">${ip}</div></div>`;
      $$('[data-v]', el).forEach(b => b.classList.toggle('on', (b.dataset.v === 'on') === on));
    };
    wrap(el, 'Animation · what a VPN changes', `<div class="demo"><button class="btn-sm on" data-v="off">VPN OFF</button><button class="btn-sm" data-v="on">VPN ON</button><div id="vpnBody" style="margin-top:10px"></div></div>
      ${mem('<strong>VPN = a private tunnel through a public road.</strong> People outside can see a tunnel exists, but not what is inside, and the website only sees the tunnel’s exit (VPN server).')}`);
    $$('[data-v]', el).forEach(b => b.onclick = () => { on = b.dataset.v === 'on'; draw(); });
    draw();
  };

  /* Firewall */
  B['firewall'] = el => {
    const pk = [
      { src: '192.168.1.20', port: 443, t: 'HTTPS from inside' },
      { src: '203.0.113.50', port: 443, t: 'HTTPS from a known bad IP' },
      { src: '198.51.100.4', port: 23, t: 'Telnet from outside' },
      { src: '192.168.1.20', port: 80, t: 'HTTP from inside' },
      { src: '198.51.100.4', port: 22, t: 'SSH from outside' },
    ];
    const rules = [
      { id: 'r1', on: true, txt: 'Block IP 203.0.113.50', test: p => p.src === '203.0.113.50', act: 'Block' },
      { id: 'r2', on: true, txt: 'Allow port 443 (HTTPS)', test: p => p.port === 443, act: 'Allow' },
      { id: 'r3', on: true, txt: 'Allow port 80 (HTTP)', test: p => p.port === 80, act: 'Allow' },
      { id: 'r4', on: true, txt: 'Allow port 22 only from 192.168.1.x', test: p => p.port === 22 && p.src.startsWith('192.168.1.'), act: 'Allow' },
    ];
    const decide = p => { for (const r of rules) if (r.on && r.test(p)) return { ok: r.act === 'Allow', why: r.txt }; return { ok: false, why: 'default deny' }; };
    wrap(el, 'Interactive · Traffic → Firewall Rules → Allow / Block', `<div class="demo">
      <div class="rules">${rules.map(r => `<label><input type="checkbox" data-r="${r.id}" checked> Rule: ${r.txt}</label>`).join('')}<label style="color:var(--muted)">✔ Last rule (always on): deny everything else</label></div>
      <div id="fwRows" style="margin-top:10px">${pk.map((p, i) => `<div class="fwrow" data-i="${i}"><span>${p.src} → :${p.port}<br><small style="color:var(--muted)">${p.t}</small></span><div class="fwl"><i></i></div><span class="verdict">—</span></div>`).join('')}</div>
      <button class="btn-sm" id="fwGo">▶ Send traffic</button><div class="out" id="fwNote" style="margin-top:8px">Tick / untick rules, then send the traffic again and watch what changes.</div></div>`);
    $$('[data-r]', el).forEach(c => c.onchange = () => { rules.find(r => r.id === c.dataset.r).on = c.checked; });
    $('#fwGo', el).onclick = async () => {
      const rows = $$('.fwrow', el);
      rows.forEach(r => { $('i', r).style.transition = 'none'; $('i', r).style.left = '2px'; $('i', r).style.background = ''; $('.verdict', r).textContent = '…'; });
      await sleep(60);
      for (let k = 0; k < pk.length; k++) {
        const r = rows[k], dot = $('i', r), d = decide(pk[k]);
        dot.style.transition = 'left .8s ease, background .3s';
        dot.style.left = 'calc(50% - 6px)'; await sleep(850);
        if (d.ok) { dot.style.background = '#22c55e'; dot.style.left = 'calc(100% - 12px)'; $('.verdict', r).innerHTML = '<span style="color:#22c55e">✅ Allow</span>'; }
        else { dot.style.background = '#ff4d4d'; dot.style.left = 'calc(50% - 22px)'; $('.verdict', r).innerHTML = '<span style="color:#ff4d4d">⛔ Block</span>'; }
        $('#fwNote', el).textContent = `${pk[k].t}: ${d.ok ? 'allowed' : 'blocked'} by → ${d.why}`;
        await sleep(350);
      }
    };
  };

  /* IDS vs IPS */
  B['ids-ips'] = el => {
    let mode = 'ids', tries = 0, blocked = false, busy = false;
    wrap(el, 'Interactive · IDS = Detects & Reports, IPS = Detects & Blocks', `<div class="demo">
      <button class="btn-sm on" data-m="ids">📹 IDS (security camera)</button><button class="btn-sm" data-m="ips">💂 IPS (security guard)</button>
      <div class="flow" style="margin-top:12px">${node('🥷', 'Attacker')}<div class="lane"><span class="pkt r" id="idsPkt" style="animation:none;opacity:0">wrong password</span></div>${node('📹', '<span id="idsName">IDS</span>', 'hl-c')}${lane('', 'r')}${node('🔐', 'Login server')}</div>
      <button class="btn-sm red" id="idsOne">Wrong login attempt</button><button class="btn-sm red" id="idsAuto">⚡ Brute-force ×6</button><button class="btn-sm" id="idsReset">↺ Reset</button>
      <div class="out logbox" id="idsLog" style="margin-top:10px">Waiting… the rule: 3 wrong logins = suspicious.</div></div>`);
    const log = (t, c) => { const l = $('#idsLog', el); if (tries === 1 && !l.dataset.s) { l.dataset.s = 1; l.innerHTML = ''; } l.innerHTML += `<div style="color:${c || 'inherit'}">${t}</div>`; l.scrollTop = 1e6; };
    const attempt = async () => {
      tries++;
      const p = $('#idsPkt', el); p.style.animation = 'none'; void p.offsetWidth; p.style.opacity = ''; p.style.animation = 'goRight 1s ease-in-out';
      if (blocked) { log(`#${tries} 🛑 dropped by IPS, never reached the server`, '#ff4d4d'); return; }
      log(`#${tries} wrong password reached the server`);
      if (tries === 3) {
        if (mode === 'ids') log('🚨 IDS ALERT sent to admin: multiple wrong logins. (IDS only reports; attacker is not stopped)', '#f59e0b');
        else { blocked = true; log('🛑 IPS blocked the attacker’s IP automatically', '#22c55e'); }
      }
    };
    const reset = () => { tries = 0; blocked = false; const l = $('#idsLog', el); delete l.dataset.s; l.textContent = 'Waiting… the rule: 3 wrong logins = suspicious.'; };
    $$('[data-m]', el).forEach(b => b.onclick = () => { mode = b.dataset.m; $$('[data-m]', el).forEach(x => x.classList.toggle('on', x === b)); $('#idsName', el).textContent = mode.toUpperCase(); reset(); });
    $('#idsOne', el).onclick = attempt;
    $('#idsReset', el).onclick = reset;
    $('#idsAuto', el).onclick = async () => { if (busy) return; busy = true; for (let i = 0; i < 6; i++) { await attempt(); await sleep(700); } busy = false; };
  };

  /* Subnetting */
  B['subnet'] = el => {
    wrap(el, 'Interactive · slide the CIDR prefix and watch network bits vs host bits', `<div class="demo">
      <label class="lb">IP address</label><input type="text" id="snIp" value="192.168.1.10" style="width:200px">
      <label class="lb">CIDR prefix: <strong id="snP" style="color:var(--accent)">/24</strong></label><input type="range" id="snR" min="8" max="30" value="24">
      <div class="bits" id="snBits"></div>
      <div style="font-size:.72rem;color:var(--muted)"><span style="color:var(--cyan)">■ network bits</span> &nbsp; <span style="color:var(--accent)">■ host bits</span></div>
      <div class="kv" id="snKv"></div></div>`);
    const toInt = s => { const p = s.trim().split('.').map(Number); return p.length === 4 && p.every(n => Number.isInteger(n) && n >= 0 && n <= 255) ? ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0 : null; };
    const toIp = n => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
    const run = () => {
      const p = +$('#snR', el).value, ip = toInt($('#snIp', el).value);
      $('#snP', el).textContent = '/' + p;
      const bin = ip === null ? '0'.repeat(32) : ip.toString(2).padStart(32, '0');
      $('#snBits', el).innerHTML = [0, 1, 2, 3].map(o => `<div class="oct">${[...bin.slice(o * 8, o * 8 + 8)].map((b, k) => `<span class="${o * 8 + k < p ? '' : 'h'}">${b}</span>`).join('')}</div>`).join('');
      if (ip === null) { $('#snKv', el).innerHTML = '<span>Status</span><span style="color:var(--danger)">Enter a valid IPv4 address</span>'; return; }
      const mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0, net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0, hosts = Math.pow(2, 32 - p) - 2;
      $('#snKv', el).innerHTML = [['Subnet mask', toIp(mask)], ['Network address', toIp(net) + '/' + p], ['Broadcast', toIp(bc)], ['Usable hosts', `${toIp(net + 1)} – ${toIp(bc - 1)}`], ['How many hosts', hosts.toLocaleString()]].map(a => `<span>${a[0]}</span><span>${a[1]}</span>`).join('');
    };
    $('#snR', el).oninput = $('#snIp', el).oninput = run; run();
  };

  /* MITM (shared by networking + cybersecurity-101) */
  B['mitm'] = el => {
    let https = false;
    const draw = () => {
      const U = node('👩', 'You'), A = node('🥷', 'Attacker', 'bad'), S = node('🏦', 'Bank');
      const read = https ? '🔒 8fA9x#Kq2… (encrypted: cannot read or change it)' : 'username=vishu  password=Vishu@123  → stolen / modified';
      const frames = [
        { cap: 'Normal communication: you talk to the bank.', html: flow(U, lane('login data', 'r'), S) },
        { cap: 'An attacker secretly stands between you and the bank (e.g. on public Wi-Fi). You think you talk to the bank; the bank thinks it talks to you.', html: flow(U, lane('login data', 'r'), A, lane('', 'r'), S) },
        { cap: 'Your data is intercepted mid-transmission.', html: flow(U, lane('login data', 'r', 'red'), A, lane('', 'r'), S) },
        { cap: https ? 'The attacker captures the traffic but it is encrypted, so there is nothing to read.' : 'The attacker can read, modify or steal the data.', html: `${flow(U, lane('', 'r'), A, lane('', 'r'), S)}<div class="out ${https ? 'good' : 'bad'}">${esc(read)}</div>` },
        { cap: https ? 'The attacker cannot present a valid certificate for the bank, so your browser warns you and the attack is exposed.' : 'The attacker forwards the data to the bank. Neither the user nor the server realizes the breach.', html: https ? flow(U, lane('⚠ certificate error', 'l', 'ok'), A, lane('✖', 'r', 'red'), S) : flow(U, lane('', 'r'), A, lane('forwarded', 'r'), S) },
      ];
      stepper($('#mitmS', el), 'Animation · Man-in-the-Middle', frames);
      $$('[data-h]', el).forEach(b => b.classList.toggle('on', (b.dataset.h === 'https') === https));
    };
    wrap(el, 'Animation · see the attack, then see HTTPS stop it', `<div><button class="btn-sm on" data-h="http">HTTP (no encryption)</button><button class="btn-sm" data-h="https">HTTPS / TLS</button></div><div id="mitmS"></div>`);
    $$('[data-h]', el).forEach(b => b.onclick = () => { https = b.dataset.h === 'https'; draw(); });
    draw();
  };

  /* DoS / DDoS */
  B['ddos'] = el => {
    let mode = 'none', prot = false;
    wrap(el, 'Interactive · DoS vs DDoS (illustrative numbers)', `<div class="demo">
      <button class="btn-sm" data-d="dos">🥷 DoS: one attacker</button><button class="btn-sm" data-d="ddos">🤖 DDoS: botnet</button><button class="btn-sm" data-d="none">Stop attack</button>
      <label style="display:inline-flex;gap:6px;align-items:center;margin-left:10px;color:var(--text);font-size:.8rem"><input type="checkbox" id="ddProt"> Protection (rate limiting / CDN / load balancer / traffic filtering)</label>
      <div class="bots" id="ddBots"></div>
      <div class="flow">${node('👥', 'Real users', 'ok')}${lane('normal requests', 'r', 'ok')}${node('🖥️', '<span id="ddSrv">Server</span>')}</div>
      <div>Server load: <strong id="ddPct">5%</strong></div><div class="gauge"><i id="ddG"></i></div>
      <div class="out" id="ddMsg"></div></div>`);
    const draw = () => {
      const bots = mode === 'ddos' ? 12 : mode === 'dos' ? 1 : 0;
      $('#ddBots', el).innerHTML = Array.from({ length: bots }, () => '<span>' + (mode === 'dos' ? '🥷' : '🤖') + '</span>').join('');
      let load = 5; if (mode === 'dos') load = prot ? 15 : 85; if (mode === 'ddos') load = prot ? 45 : 100;
      const g = $('#ddG', el); g.style.width = load + '%'; g.style.background = load >= 100 ? '#ff4d4d' : load > 70 ? '#f59e0b' : '#22c55e';
      $('#ddPct', el).textContent = load + '%';
      const down = load >= 100;
      $('#ddSrv', el).textContent = down ? '💥 DOWN' : 'Server';
      $('#ddMsg', el).className = 'out ' + (down ? 'bad' : mode === 'none' ? '' : 'good');
      $('#ddMsg', el).textContent = mode === 'none' ? 'All quiet. Pick an attack.'
        : down ? '❌ DDoS: massive traffic from many infected machines. The server crashes. Real users are locked out.'
        : mode === 'dos' && !prot ? '⚠ DoS: one system floods the server. It is struggling, but it is easy to stop (block that one source).'
        : mode === 'dos' ? '✅ Protection blocks the single attacker quickly.'
        : '✅ Traffic filtering / CDN / load balancing absorbs most of the flood. DDoS is hard to stop, but defences help.';
      $$('[data-d]', el).forEach(b => b.classList.toggle('on', b.dataset.d === mode));
    };
    $$('[data-d]', el).forEach(b => b.onclick = () => { mode = b.dataset.d; draw(); });
    $('#ddProt', el).onchange = e => { prot = e.target.checked; draw(); };
    draw();
  };

  /* Port scan */
  B['portscan'] = el => {
    const P = [[21, 'FTP'], [22, 'SSH'], [23, 'Telnet'], [25, 'SMTP'], [53, 'DNS'], [80, 'HTTP'], [110, 'POP3'], [443, 'HTTPS'], [3306, 'MySQL'], [3389, 'RDP']];
    let hard = false, busy = false;
    const openSet = () => hard ? [80, 443] : [21, 22, 23, 80, 443, 3306];
    wrap(el, 'Animation · what an Nmap-style port scan finds', `<div class="demo">
      <button class="btn-sm red" id="psGo">🔍 Scan the server</button>
      <label style="display:inline-flex;gap:6px;align-items:center;margin-left:10px;color:var(--text);font-size:.8rem"><input type="checkbox" id="psHard"> Prevention: close unused ports / firewall</label>
      <div class="ports">${P.map(p => `<div class="port" data-p="${p[0]}">${p[0]}<small>${p[1]}</small></div>`).join('')}</div>
      <div class="out logbox" id="psOut">Press “Scan the server”. Every service runs on a port; the attacker looks for open ones.</div></div>`);
    $('#psHard', el).onchange = e => { hard = e.target.checked; $$('.port', el).forEach(p => p.className = 'port'); $('#psOut', el).textContent = 'Settings changed. Scan again.'; };
    $('#psGo', el).onclick = async () => {
      if (busy) return; busy = true;
      const out = $('#psOut', el); out.innerHTML = ''; $$('.port', el).forEach(p => p.className = 'port');
      for (const [n, name] of P) {
        const t = $(`.port[data-p="${n}"]`, el); t.classList.add('scan'); await sleep(420);
        const o = openSet().includes(n); t.className = 'port ' + (o ? 'open' : 'closed');
        out.innerHTML += `${n}/tcp ${o ? '<span style="color:#22c55e">open</span> ' + name.toLowerCase() : '<span style="color:#8a5555">closed/filtered</span>'}<br>`;
      }
      out.innerHTML += `<br>${openSet().length} open port(s) found. ${hard ? 'Only what is really needed is exposed.' : 'Each open service is a possible way in (e.g. Telnet is unencrypted).'}`;
      busy = false;
    };
  };

  /* ═══════════ CYBERSECURITY 101 ═══════════ */

  /* CIA triad scenarios */
  B['cia'] = el => {
    let tab = 'c', prot = false;
    const scenes = {
      c: p => ({
        t: 'Confidentiality · only authorized people can see data',
        html: flow(node('📋', 'Patient<br>records'), lane(p ? '🔒 encrypted + MFA' : 'Name, diagnosis…', 'r', p ? 'enc' : 'red'), node('🥷', 'Attacker', p ? 'ok' : 'bad')),
        out: p ? '✅ Encryption + MFA + access control: attacker gets unreadable 🔒 data or is stopped at login.' : '❌ Data leak: the attacker reads private information → identity theft / fraud.', good: p
      }),
      i: p => ({
        t: 'Integrity · data stays accurate and unaltered',
        html: flow(node('🎓', 'Exam mark<br><strong>85</strong>'), lane(p ? '85 → 35 ✖ hash mismatch' : '85 → 35', 'r', p ? 'ok' : 'red'), node(p ? '🛡️' : '📋', p ? 'Mark stays<br>85 (restored)' : 'Mark now<br>35', p ? 'ok' : 'bad')),
        out: p ? '✅ Hashes / checksums / digital signatures detect the change, so the original value is restored.' : '❌ Someone silently altered the data and nobody noticed.', good: p
      }),
      a: p => ({
        t: 'Availability · systems are there when needed',
        html: flow(node('👥', 'Users'), lane(p ? 'served by backup ✔' : '✖ blocked', 'r', p ? 'ok' : 'red'), node(p ? '🖥️🖥️' : '💥', p ? 'Load balancer<br>+ failover' : 'Server<br>overloaded', p ? 'ok' : 'bad')),
        out: p ? '✅ Backups, load balancing, redundancy and failover keep the service running.' : '❌ A DDoS flood knocks the website down. Hospitals / banks / sites become unreachable.', good: p
      }),
    };
    const draw = () => {
      const sc = scenes[tab](prot);
      $('#ciaBody', el).innerHTML = `<div class="demo-title">${sc.t}</div>${sc.html}<div class="out ${sc.good ? 'good' : 'bad'}">${sc.out}</div>`;
      $$('[data-t]', el).forEach(b => b.classList.toggle('on', b.dataset.t === tab));
      $$('[data-p]', el).forEach(b => b.classList.toggle('on', (b.dataset.p === '1') === prot));
    };
    wrap(el, 'Interactive · attack each pillar, then switch protection on', `<div class="demo">
      <div class="tabs"><button class="btn-sm on" data-t="c">🔒 Confidentiality</button><button class="btn-sm" data-t="i">✓ Integrity</button><button class="btn-sm" data-t="a">⚡ Availability</button></div>
      <div class="tabs"><button class="btn-sm on" data-p="0">No protection</button><button class="btn-sm" data-p="1">With protection</button></div>
      <div id="ciaBody"></div></div>
      ${mem('<strong>C-I-A = Can’t read · Intact · Always on.</strong> Lose C → data leaks. Lose I → data is secretly changed. Lose A → service goes down.')}`);
    $$('[data-t]', el).forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    $$('[data-p]', el).forEach(b => b.onclick = () => { prot = b.dataset.p === '1'; draw(); });
    draw();
  };

  /* Threat / vulnerability / risk story */
  B['tvr'] = el => {
    stepper(el, 'Animation · how Vulnerability + Threat create Risk', [
      { cap: 'A VULNERABILITY is a weakness: an unlocked window in a house, or an unpatched server.', html: flow(node('🏠', 'House<br>unlocked window', 'hl'), lane('weakness', 'both'), node('🖥️', 'Server<br>missing patch', 'hl')) },
      { cap: 'A THREAT is something that could exploit it: a burglar, or a hacker / malware.', html: flow(node('🥷', 'Threat<br>burglar / hacker', 'bad'), lane('looking…', 'r', 'red'), node('🏠', 'Weak point')) },
      { cap: 'When a threat meets a vulnerability it can be exploited…', html: flow(node('🥷', 'Threat', 'bad'), lane('💥 exploit', 'r', 'red'), node('🖥️', 'Vulnerability', 'bad')) },
      { cap: 'RISK = the chance this happens × how much damage it would cause (impact).', html: `<div class="flow">${node('🥷', 'Threat', 'bad')}${lane('×', 'both')}${node('🕳️', 'Vulnerability', 'bad')}${lane('×', 'both')}${node('💸', 'Impact', 'bad')}</div>` },
      { cap: 'Fix the vulnerability (lock the window / apply the patch) and the risk drops, even though the threat is still out there.', html: flow(node('🥷', 'Threat', ''), lane('✖ blocked', 'r', 'ok'), node('🔒', 'Patched', 'ok')) },
    ]);
    el.insertAdjacentHTML('beforeend', mem('<strong>Threat = the burglar · Vulnerability = the open window · Risk = the chance he gets in, times what he could steal.</strong>'));
  };

  /* IAAA */
  B['iaaa'] = el => {
    el.innerHTML = '<div class="vz-head">Animation · IAAA in one login</div><div id="iaaaS"></div><div class="demo"><div class="demo-title">Try Authorization · pick a role</div><div class="tabs"><button class="btn-sm on" data-ro="s">🎓 Student</button><button class="btn-sm" data-ro="t">👩‍🏫 Teacher</button><button class="btn-sm" data-ro="a">🛠 Admin</button></div><div class="chips" id="roChips"></div><div class="out" id="roOut" style="margin-top:10px"></div></div>';
    const A = node('🙋', 'User'), S = node('🏫', 'System');
    stepper($('#iaaaS', el), '', [
      { cap: '1 · IDENTIFICATION. “Who are you?” The user claims an identity (username / email / employee ID). Nothing is verified yet.', html: flow(A, lane('I am vishu@example.com', 'r'), S) },
      { cap: '2 · AUTHENTICATION. “Prove it!” Password, OTP, fingerprint, Face ID, or MFA (several together).', html: flow(A, lane('🔑 password + OTP', 'r', 'enc'), node('🏫', 'System<br>checks ✔', 'hl')) },
      { cap: '3 · AUTHORIZATION. “What can you do?” Permissions depend on the role (Student → View marks, Teacher → Edit marks, Admin → Full access).', html: flow(node('🙋', 'Student', 'hl'), lane('Edit marks?', 'r', 'red'), node('🏫', 'System<br>⛔ not allowed')) },
      { cap: '4 · ACCOUNTING (auditing). Everything is logged: login time and location, files accessed, changes made.', html: `${flow(A, lane('', 'r'), S)}<div class="out">10:42  login ok  (office network)\n10:43  opened marks.xlsx\n10:51  changed 1 record</div>` },
    ]);
    const roles = { s: ['Student', ['view']], t: ['Teacher', ['view', 'edit']], a: ['Admin', ['view', 'edit', 'manage']] };
    const chips = { view: 'View marks', edit: 'Edit marks', manage: 'Full access (manage users & settings)' };
    const draw = k => {
      $('#roChips', el).innerHTML = Object.keys(chips).map(c => `<span class="chip ${roles[k][1].includes(c) ? 'yes' : 'no'}">${chips[c]}</span>`).join('');
      $('#roOut', el).textContent = `${roles[k][0]} → ` + { s: 'View marks', t: 'Edit marks (viewing is implied)', a: 'Full access' }[k];
      $$('[data-ro]', el).forEach(b => b.classList.toggle('on', b.dataset.ro === k));
    };
    $$('[data-ro]', el).forEach(b => b.onclick = () => draw(b.dataset.ro)); draw('s');
    el.insertAdjacentHTML('beforeend', mem('<strong>I-A-A-A:</strong> <em>Who are you? → Prove it → What can you do? → What did you do?</em>'));
  };

  /* Access control models */
  B['access'] = el => {
    let m = 'mac';
    const sel = (id, opts, v) => `<select id="${id}">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    const views = {
      mac: () => `<label class="lb">File label (set by the system)</label>${sel('acF', ['Public', 'Confidential', 'Secret'], 'Secret')}<label class="lb">Asha’s clearance</label>${sel('acU', ['Public', 'Confidential', 'Secret'], 'Confidential')}`,
      dac: () => `<label class="lb">Ravi is the OWNER of Salary.xlsx. Does he share it with Asha?</label>${sel('acS', ['No', 'Yes'], 'No')}`,
      rbac: () => `<label class="lb">Asha’s role (Salary.xlsx is allowed for HR)</label>${sel('acR', ['Intern', 'Developer', 'HR'], 'Intern')}`,
      abac: () => `<label class="lb">Location</label>${sel('acL', ['Office', 'Home'], 'Home')}<label class="lb">Time</label>${sel('acT', ['Office hours', '11 PM'], '11 PM')}<label class="lb">Device</label>${sel('acD', ['Company laptop', 'Personal phone'], 'Personal phone')}`,
    };
    const lev = { Public: 0, Confidential: 1, Secret: 2 };
    const decide = () => {
      const v = id => $('#' + id, el).value;
      if (m === 'mac') { const ok = lev[v('acU')] >= lev[v('acF')]; return [ok, `System compares labels: clearance “${v('acU')}” vs file “${v('acF')}” → ${ok ? 'clearance is high enough' : 'clearance too low'}. Users cannot change this.`]; }
      if (m === 'dac') { const ok = v('acS') === 'Yes'; return [ok, `The owner decides. Ravi ${ok ? 'shared' : 'did not share'} the file with Asha.`]; }
      if (m === 'rbac') { const ok = v('acR') === 'HR'; return [ok, `Access follows the role. “${v('acR')}” ${ok ? 'is' : 'is not'} in the allowed roles.`]; }
      const c = [v('acL') === 'Office', v('acT') === 'Office hours', v('acD') === 'Company laptop'];
      const ok = c.every(Boolean);
      return [ok, `Policy: location = Office AND time = office hours AND device = company laptop.\n${c[0] ? '✔' : '✘'} location  ${c[1] ? '✔' : '✘'} time  ${c[2] ? '✔' : '✘'} device → ${ok ? 'all attributes match' : 'an attribute fails'}.`];
    };
    const draw = () => {
      $('#acForm', el).innerHTML = views[m]();
      $$('#acForm select', el).forEach(s => s.onchange = upd);
      $$('[data-m]', el).forEach(b => b.classList.toggle('on', b.dataset.m === m));
      upd();
    };
    const upd = () => {
      const [ok, why] = decide();
      const o = $('#acOut', el); o.className = 'out ' + (ok ? 'good' : 'bad'); o.textContent = (ok ? '✅ ACCESS GRANTED\n' : '⛔ ACCESS DENIED\n') + why;
    };
    wrap(el, 'Interactive · can Asha open Salary.xlsx?', `<div class="demo">
      <div class="tabs"><button class="btn-sm on" data-m="mac">MAC</button><button class="btn-sm" data-m="dac">DAC</button><button class="btn-sm" data-m="rbac">RBAC</button><button class="btn-sm" data-m="abac">ABAC</button></div>
      <div class="flow">${node('👩', 'Asha')}${lane('open Salary.xlsx', 'r')}${node('📁', 'Salary.xlsx')}</div>
      <div id="acForm"></div><div class="out" id="acOut" style="margin-top:10px"></div></div>
      ${mem('<strong>MAC = Military (system decides, labels).</strong> <strong>DAC = Dad/owner decides.</strong> <strong>RBAC = Role = job title.</strong> <strong>ABAC = Attributes (where, when, what device) decide on the fly.</strong>')}`);
    $$('[data-m]', el).forEach(b => b.onclick = () => { m = b.dataset.m; draw(); });
    draw();
  };

  /* Risk formula */
  B['risk'] = el => {
    wrap(el, 'Interactive · Risk = Threat × Vulnerability × Impact', `<div class="demo">
      <label class="lb">Threat level: <strong id="rkTv">3</strong></label><input type="range" id="rkT" min="1" max="5" value="3">
      <label class="lb">Vulnerability level: <strong id="rkVv">4</strong></label><input type="range" id="rkV" min="1" max="5" value="4">
      <label class="lb">Impact if it happens: <strong id="rkIv">4</strong></label><input type="range" id="rkI" min="1" max="5" value="4">
      <div class="big" id="rkScore" style="margin-top:12px"></div><div class="gauge"><i id="rkG"></i></div><div class="out" id="rkMsg"></div>
      <button class="btn-sm" id="rkFix">🛠 Apply a control: reduce the vulnerability to 1</button></div>`);
    const run = () => {
      const t = +$('#rkT', el).value, v = +$('#rkV', el).value, i = +$('#rkI', el).value, r = t * v * i;
      $('#rkTv', el).textContent = t; $('#rkVv', el).textContent = v; $('#rkIv', el).textContent = i;
      $('#rkScore', el).textContent = `${t} × ${v} × ${i} = ${r}`;
      const g = $('#rkG', el); g.style.width = r / 125 * 100 + '%'; g.style.background = r > 60 ? '#ff4d4d' : r > 20 ? '#f59e0b' : '#22c55e';
      const lvl = r > 60 ? 'HIGH' : r > 20 ? 'MEDIUM' : 'LOW';
      $('#rkMsg', el).className = 'out ' + (r > 60 ? 'bad' : r > 20 ? '' : 'good');
      $('#rkMsg', el).textContent = `Risk level: ${lvl} (out of 125). Apply controls: mitigate, transfer, accept or avoid.`;
    };
    $$('input[type=range]', el).forEach(x => x.oninput = run);
    $('#rkFix', el).onclick = () => { $('#rkV', el).value = 1; run(); };
    run();
  };

  /* Zero-day timeline */
  B['zeroday'] = el => {
    const tl = (n) => `<div class="path">${['Flaw exists', 'Attacker finds it', 'Day 0 attack', 'Vendor patch', 'Users patched'].map((t, k) => (k ? '<span class="arr">▶▶</span>' : '') + node(['🕳️', '🥷', '💥', '🧑‍🔧', '✅'][k], t, k === n ? (k === 2 ? 'bad' : 'hl') : k < n ? 'hl-c' : '')).join('')}</div>`;
    stepper(el, 'Animation · life of a zero-day', [
      { cap: 'A flaw exists in software, but nobody (including the vendor) knows about it yet.', html: tl(0) },
      { cap: 'An attacker discovers it first and builds an exploit.', html: tl(1) },
      { cap: 'Day 0: the attack happens. The vendor has had zero days to prepare a fix, which is why it is called a zero-day.', html: tl(2) },
      { cap: 'The vendor learns about it and builds a patch.', html: tl(3) },
      { cap: 'Users install the update and are protected. Until then, defences like monitoring, least privilege and segmentation limit the damage.', html: tl(4) },
    ]);
  };

  /* ── boot ── */
  function boot() { $$('.vz[data-vz]').forEach(el => { const f = B[el.dataset.vz]; if (f) { try { f(el); } catch (e) { console.error('vz', el.dataset.vz, e); } } }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
