import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SiteContentService } from '../../../core/services/site-content.service';
import { SiteContentSection } from '../../../core/models';
import { CtaSectionComponent } from '../../../shared/components/cta-section/cta-section.component';

// ─── Feather-style SVG path data ──────────────────────────────────────────────
const P: Record<string, string> = {
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  box:      '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  cloud:    '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  target:   '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  eye:      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  award:    '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>',
  code:     '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  layers:   '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  lock:     '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  zap:      '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  user:     '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  tool:     '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  monitor:  '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  phone:    '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  link:     '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  cpu:      '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  grid:     '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
};

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, CtaSectionComponent],
  template: `

    <!-- ═══ 1. HERO ════════════════════════════════════════════════════════════ -->
    <section class="about-hero">
      <div class="ah-orb ah-orb--a"></div>
      <div class="ah-orb ah-orb--b"></div>
      <div class="container ah-inner">

        <!-- Left: headline + CTA -->
        <div class="ah-text">
          <p class="eyebrow">Who We Are</p>
          <h1 class="ah-h1">{{ content()?.title || 'Building Software That&nbsp;Works' }}</h1>
          <p class="ah-lead">{{ content()?.subtitle || 'DGH Tech Solutions designs and develops reliable, scalable digital products — from web applications and mobile apps to cloud platforms and AI-ready solutions.' }}</p>
          <div class="ah-actions">
            <a routerLink="/contact" class="btn btn--primary">Get Started</a>
            <a routerLink="/services" class="btn btn--outline">Explore Services</a>
          </div>
        </div>

        <!-- Right: visual dashboard card or CMS hero image -->
        <div class="ah-visual" [attr.aria-hidden]="!content()?.imageUrl ? 'true' : null">
          @if (content()?.imageUrl) {
            <img class="ah-hero-img" [src]="content()!.imageUrl!" [alt]="content()?.title || 'About DGH Tech Solutions'" />
          } @else {
          <div class="hv-card">
            <div class="hv-titlebar">
              <span class="hv-dot hv-dot--r"></span>
              <span class="hv-dot hv-dot--y"></span>
              <span class="hv-dot hv-dot--g"></span>
              <span class="hv-file">deployment.log</span>
            </div>
            <div class="hv-metrics">
              <div class="hv-metric">
                <span class="hv-m-lbl">API response</span>
                <div class="hv-m-bar"><div class="hv-m-fill hv-m-fill--b" style="width:82%"></div></div>
                <span class="hv-m-val">82ms</span>
              </div>
              <div class="hv-metric">
                <span class="hv-m-lbl">Build success</span>
                <div class="hv-m-bar"><div class="hv-m-fill hv-m-fill--g" style="width:100%"></div></div>
                <span class="hv-m-val">100%</span>
              </div>
              <div class="hv-metric">
                <span class="hv-m-lbl">Test coverage</span>
                <div class="hv-m-bar"><div class="hv-m-fill hv-m-fill--p" style="width:91%"></div></div>
                <span class="hv-m-val">91%</span>
              </div>
              <div class="hv-metric">
                <span class="hv-m-lbl">Uptime</span>
                <div class="hv-m-bar"><div class="hv-m-fill hv-m-fill--g" style="width:99.9%"></div></div>
                <span class="hv-m-val">99.9%</span>
              </div>
            </div>
            <div class="hv-footer">
              <span class="hv-pulse"></span>
              All systems operational &mdash; v2.4.1 deployed
            </div>
          </div>
          <div class="hv-badge hv-badge--tl">
            <strong>50+</strong><span>Projects Delivered</span>
          </div>
          <div class="hv-badge hv-badge--br">
            <strong>8yr+</strong><span>Experience</span>
          </div>
          }
        </div>

      </div>
    </section>

    <!-- ═══ 2. STATS ROW ════════════════════════════════════════════════════════ -->
    <section class="stats-band">
      <div class="container stats-grid">
        @for (s of stats; track s.label) {
          <div class="stat-card">
            <div class="stat-icon" [innerHTML]="icon(s.icon)"></div>
            <div class="stat-val">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-sub">{{ s.sub }}</div>
          </div>
        }
      </div>
    </section>

    <!-- ═══ 3. MISSION / VISION / VALUES ════════════════════════════════════════ -->
    <section class="section section--gray">
      <div class="container">
        <div class="section-header">
          <p class="eyebrow-col">What We Stand For</p>
          <h2>Mission, Vision &amp; Values</h2>
          <p class="section-sub">The principles behind every decision, every project, and every line of code we write.</p>
        </div>
        <div class="mvv-grid">
          @for (m of mvv; track m.heading) {
            <div class="mvv-card">
              <div class="mvv-icon" [innerHTML]="icon(m.icon)"></div>
              <h3>{{ m.heading }}</h3>
              <p>{{ m.body }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ═══ 4. TECHNOLOGY BUILT FOR BUSINESS GROWTH ═══════════════════════════ -->
    <section class="section">
      <div class="container services-inner">
        <div class="services-text">
          <p class="eyebrow-col">What We Build</p>
          <h2>Technology Built for Business Growth</h2>
          <p>{{ content()?.body || 'DGH Tech Solutions designs and develops high-quality digital products centered on clean architecture, strong user experience, performance, and long-term maintainability.' }}</p>
          <p class="text-muted">From business websites and admin dashboards to custom platforms and API integrations, we help clients turn ideas into production-ready software.</p>
        </div>
        <div class="services-grid">
          @for (s of serviceItems; track s.label) {
            <div class="service-item">
              <div class="si-icon" [innerHTML]="icon(s.icon)"></div>
              <span class="si-label">{{ s.label }}</span>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ═══ 5. WHY CHOOSE DGH ════════════════════════════════════════════════════ -->
    <section class="section section--gray">
      <div class="container">
        <div class="section-header">
          <p class="eyebrow-col">Why DGH</p>
          <h2>Why Choose DGH Tech Solutions</h2>
          <p class="section-sub">We combine engineering discipline with product thinking to deliver software that stands the test of time.</p>
        </div>
        <div class="why-grid">
          @for (w of whyCards; track w.title) {
            <div class="why-card">
              <div class="why-icon" [innerHTML]="icon(w.icon)"></div>
              <h4>{{ w.title }}</h4>
              <p>{{ w.body }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ═══ 6. OUR PROCESS ════════════════════════════════════════════════════════ -->
    <section class="section process-section">
      <div class="container">
        <div class="section-header">
          <p class="eyebrow-col">How We Work</p>
          <h2>Our Process</h2>
          <p class="section-sub">A structured, transparent approach that keeps projects on track from first conversation to long-term support.</p>
        </div>
        <div class="process-steps">
          @for (step of process; track step.num) {
            <div class="process-step">
              <div class="ps-num">{{ step.num }}</div>
              <h4 class="ps-label">{{ step.label }}</h4>
              <p class="ps-desc">{{ step.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ═══ 7. TECHNOLOGIES ════════════════════════════════════════════════════ -->
    <section class="section section--gray">
      <div class="container">
        <div class="section-header">
          <p class="eyebrow-col">Our Stack</p>
          <h2>Technologies We Work With</h2>
          <p class="section-sub">Full-stack expertise across the modern web, cloud, and data ecosystem.</p>
        </div>
        <div class="tech-pills">
          @for (t of techs; track t) {
            <span class="tech-pill">{{ t }}</span>
          }
        </div>
      </div>
    </section>

    <!-- ═══ 8. FINAL CTA ══════════════════════════════════════════════════════ -->
    <app-cta-section
      heading="Ready to build your next digital product?"
      sub="Let's turn your idea into reliable, scalable, production-ready software."
      primaryLabel="Get Started"
      primaryLink="/contact"
      secondaryLabel="Contact Us"
      secondaryLink="/contact"
    />
  `,
  styles: [`

    /* ── Shared layout helpers ─────────────────────────────────────────────── */
    .eyebrow {
      display: block;
      font-size: .75rem; font-weight: 700;
      letter-spacing: .12em; text-transform: uppercase;
      color: var(--clr-primary); margin-bottom: .75rem;
    }
    .eyebrow-col {
      display: block;
      font-size: .75rem; font-weight: 700;
      letter-spacing: .12em; text-transform: uppercase;
      color: var(--clr-primary); margin-bottom: .4rem;
    }
    .section-header {
      text-align: center; margin-bottom: 3rem;
      h2 { margin: .35rem 0 .65rem; }
    }
    .section-sub {
      color: var(--clr-text-muted); max-width: 52ch;
      margin: 0 auto; font-size: .95rem; line-height: 1.7;
    }
    .text-muted { color: var(--clr-text-muted) !important; font-size: .95rem !important; }

    /* ══════════════════════════════════════════════════════════════════════════
       1. HERO
    ══════════════════════════════════════════════════════════════════════════ */
    .about-hero {
      position: relative; overflow: hidden;
      background: #f3f4f6;
      border-bottom: 1px solid #e5e7eb;
      padding: 5.5rem 0 4rem;
    }

    .ah-orb {
      position: absolute; border-radius: 50%;
      filter: blur(80px); pointer-events: none;
    }
    .ah-orb--a {
      width: 500px; height: 500px;
      background: rgba(37,99,235,.07);
      top: -160px; right: -100px;
    }
    .ah-orb--b {
      width: 300px; height: 300px;
      background: rgba(96,165,250,.05);
      bottom: -60px; left: 3%;
    }

    .ah-inner {
      position: relative; z-index: 1;
      display: grid;
      grid-template-columns: 1fr 480px;
      gap: 4rem;
      align-items: center;
    }

    /* Left text column */
    .ah-h1 {
      font-size: clamp(2.2rem, 4vw, 3.2rem);
      font-weight: 800; letter-spacing: -.03em;
      color: #111827; line-height: 1.1;
      margin: .5rem 0 1.1rem;
    }
    .ah-lead {
      font-size: 1.05rem; color: #374151;
      line-height: 1.75; margin: 0 0 2rem;
      max-width: 52ch;
    }
    .ah-actions {
      display: flex; gap: .85rem; flex-wrap: wrap;
    }

    /* Right visual card */
    .ah-visual {
      position: relative;
    }
    .ah-hero-img {
      width: 100%;
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(0,0,0,.15);
      object-fit: cover;
      display: block;
    }

    .hv-card {
      background: #1e293b;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,.22), 0 4px 16px rgba(0,0,0,.14);
    }

    .hv-titlebar {
      display: flex; align-items: center; gap: .45rem;
      padding: .75rem 1rem;
      background: #0f172a;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .hv-dot {
      width: 11px; height: 11px; border-radius: 50%;
    }
    .hv-dot--r { background: #ef4444; }
    .hv-dot--y { background: #f59e0b; }
    .hv-dot--g { background: #22c55e; }
    .hv-file {
      font-size: .72rem; color: #94a3b8;
      margin-left: .5rem; font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .hv-metrics {
      padding: 1.25rem 1.25rem 1rem;
      display: flex; flex-direction: column; gap: .9rem;
    }
    .hv-metric {
      display: grid; grid-template-columns: 110px 1fr 44px; align-items: center; gap: .65rem;
    }
    .hv-m-lbl { font-size: .73rem; color: #94a3b8; white-space: nowrap; }
    .hv-m-bar {
      height: 5px; border-radius: 3px; background: rgba(255,255,255,.08); overflow: hidden;
    }
    .hv-m-fill {
      height: 100%; border-radius: 3px;
      background: #3b82f6;
      transition: width .4s ease;
    }
    .hv-m-fill--g  { background: #22c55e; }
    .hv-m-fill--p  { background: #a855f7; }
    .hv-m-fill--b  { background: #3b82f6; }
    .hv-m-val { font-size: .73rem; color: #e2e8f0; text-align: right; font-family: 'SF Mono', 'Fira Code', monospace; }

    .hv-footer {
      display: flex; align-items: center; gap: .5rem;
      padding: .6rem 1.25rem;
      background: #0f172a;
      border-top: 1px solid rgba(255,255,255,.06);
      font-size: .72rem; color: #64748b;
    }
    .hv-pulse {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
      background: #22c55e;
      box-shadow: 0 0 0 0 rgba(34,197,94,.4);
      animation: pulse 2s ease-out infinite;
    }
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 rgba(34,197,94,.4); }
      70%  { box-shadow: 0 0 0 7px rgba(34,197,94,0); }
      100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }

    /* Floating metric badges */
    .hv-badge {
      position: absolute;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: .55rem .85rem;
      display: flex; flex-direction: column;
      box-shadow: 0 6px 20px rgba(0,0,0,.10);
      min-width: 90px;
      strong { font-size: 1.15rem; font-weight: 800; color: #111827; line-height: 1; }
      span   { font-size: .7rem; color: #6b7280; margin-top: .15rem; }
    }
    .hv-badge--tl { top: -14px; left: -14px; }
    .hv-badge--br { bottom: -14px; right: -14px; }

    /* Hero responsive */
    @media (max-width: 1024px) {
      .ah-inner { grid-template-columns: 1fr 400px; gap: 2.5rem; }
    }
    @media (max-width: 860px) {
      .ah-inner { grid-template-columns: 1fr; }
      .ah-visual { display: none; }
      .about-hero { padding: 4rem 0 3rem; text-align: center; }
      .ah-actions { justify-content: center; }
      .ah-lead { margin-inline: auto; }
    }

    /* ══════════════════════════════════════════════════════════════════════════
       2. STATS ROW
    ══════════════════════════════════════════════════════════════════════════ */
    .stats-band {
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      padding: 2.75rem 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
    .stat-card {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 1.5rem 1rem;
      border: 1px solid #f3f4f6; border-radius: 14px;
      background: #f9fafb;
      transition: box-shadow .2s, transform .2s;
      &:hover { box-shadow: 0 6px 24px rgba(37,99,235,.09); transform: translateY(-3px); }
    }
    .stat-icon {
      color: #2563eb; margin-bottom: .7rem;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-val  { font-size: 1.85rem; font-weight: 800; color: #111827; line-height: 1; }
    .stat-label{ font-size: .875rem; font-weight: 700; color: #111827; margin: .35rem 0 .2rem; }
    .stat-sub  { font-size: .78rem; color: #6b7280; }

    @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 400px) { .stats-grid { grid-template-columns: 1fr; } }

    /* ══════════════════════════════════════════════════════════════════════════
       3. MISSION / VISION / VALUES
    ══════════════════════════════════════════════════════════════════════════ */
    .mvv-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .mvv-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 2rem 1.75rem;
      display: flex; flex-direction: column;
      transition: box-shadow .25s, transform .25s;
      &:hover { box-shadow: 0 8px 30px rgba(37,99,235,.1); transform: translateY(-4px); }
      h3 { font-size: 1rem; font-weight: 700; color: #111827; margin: .75rem 0 .6rem; }
      p  { font-size: .9rem; color: #374151; line-height: 1.75; margin: 0; flex: 1; }
    }
    .mvv-icon {
      width: 44px; height: 44px; border-radius: 10px;
      background: rgba(37,99,235,.08);
      color: #2563eb;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    @media (max-width: 768px) { .mvv-grid { grid-template-columns: 1fr; } }

    /* ══════════════════════════════════════════════════════════════════════════
       4. SERVICES (Technology Built for Business Growth)
    ══════════════════════════════════════════════════════════════════════════ */
    .services-inner {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5rem;
      align-items: center;
    }
    .services-text {
      display: flex; flex-direction: column; gap: 1rem;
      h2 { margin: .35rem 0 0; }
      p  { font-size: .97rem; color: #374151; line-height: 1.8; margin: 0; }
    }
    .services-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
    }
    .service-item {
      display: flex; align-items: center; gap: .75rem;
      background: #f9fafb; border: 1px solid #e5e7eb;
      border-radius: 10px; padding: .9rem 1rem;
      transition: background .2s, border-color .2s;
      &:hover { background: #eff6ff; border-color: rgba(37,99,235,.2); }
    }
    .si-icon { color: #2563eb; flex-shrink: 0; display: flex; }
    .si-label { font-size: .875rem; font-weight: 600; color: #111827; }

    @media (max-width: 900px) { .services-inner { grid-template-columns: 1fr; gap: 2.5rem; } }
    @media (max-width: 480px) { .services-grid { grid-template-columns: 1fr; } }

    /* ══════════════════════════════════════════════════════════════════════════
       5. WHY CHOOSE DGH
    ══════════════════════════════════════════════════════════════════════════ */
    .why-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    .why-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1.5rem 1.4rem;
      transition: box-shadow .2s, transform .2s;
      &:hover { box-shadow: 0 6px 24px rgba(37,99,235,.09); transform: translateY(-3px); }
      h4 { font-size: .95rem; font-weight: 700; color: #111827; margin: .65rem 0 .4rem; }
      p  { font-size: .85rem; color: #374151; line-height: 1.7; margin: 0; }
    }
    .why-icon {
      width: 40px; height: 40px; border-radius: 9px;
      background: rgba(37,99,235,.08); color: #2563eb;
      display: flex; align-items: center; justify-content: center;
    }

    @media (max-width: 900px) { .why-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 520px) { .why-grid { grid-template-columns: 1fr; } }

    /* ══════════════════════════════════════════════════════════════════════════
       6. PROCESS
    ══════════════════════════════════════════════════════════════════════════ */
    .process-section { background: #fff; }

    .process-steps {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1.5rem;
      position: relative;
      /* Connecting line behind numbered circles */
      &::before {
        content: '';
        position: absolute;
        top: 22px; /* center of .ps-num circle (44px / 2 = 22px) */
        left: calc(10% + 0px);
        right: calc(10% + 0px);
        height: 1px;
        background: linear-gradient(to right, transparent, #d1d5db 15%, #d1d5db 85%, transparent);
        z-index: 0;
      }
    }

    .process-step {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; position: relative; z-index: 1;
    }
    .ps-num {
      width: 44px; height: 44px; border-radius: 50%;
      background: #fff; border: 2px solid #2563eb;
      color: #2563eb; font-size: .8rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1rem; letter-spacing: .03em;
      box-shadow: 0 0 0 4px rgba(37,99,235,.08);
      flex-shrink: 0;
    }
    .ps-label {
      font-size: .9rem; font-weight: 700; color: #111827;
      margin: 0 0 .4rem;
    }
    .ps-desc {
      font-size: .8rem; color: #6b7280; line-height: 1.6; margin: 0;
    }

    @media (max-width: 900px) {
      .process-steps {
        grid-template-columns: repeat(3, 1fr);
        &::before { display: none; }
      }
    }
    @media (max-width: 600px) {
      .process-steps {
        grid-template-columns: 1fr;
      }
      .process-step { align-items: flex-start; text-align: left; flex-direction: row; gap: 1rem; }
      .ps-num { margin-bottom: 0; flex-shrink: 0; }
    }

    /* ══════════════════════════════════════════════════════════════════════════
       7. TECHNOLOGIES
    ══════════════════════════════════════════════════════════════════════════ */
    .tech-pills {
      display: flex; flex-wrap: wrap; gap: .65rem; justify-content: center;
    }
    .tech-pill {
      display: inline-block;
      padding: .45rem 1rem;
      border-radius: 999px;
      background: #fff;
      border: 1px solid #d1d5db;
      font-size: .875rem; font-weight: 500; color: #374151;
      transition: background .18s, border-color .18s, color .18s;
      &:hover {
        background: #eff6ff; border-color: rgba(37,99,235,.3); color: #2563eb;
      }
    }
  `],
})
export class AboutComponent implements OnInit {
  content = signal<SiteContentSection | null>(null);

  private san = inject(DomSanitizer);
  private contentSvc = inject(SiteContentService);

  // Produce a sized, scoped SVG from the shared path table
  icon(name: string): SafeHtml {
    return this.san.bypassSecurityTrustHtml(
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
      `stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
      `${P[name] ?? ''}</svg>`,
    );
  }

  // ─── Page data ──────────────────────────────────────────────────────────────

  readonly stats = [
    { icon: 'calendar', value: '8+',     label: 'Years Experience',   sub: 'Building production software'     },
    { icon: 'box',      value: '50+',    label: 'Projects Delivered', sub: 'Across diverse industries'        },
    { icon: 'cloud',    value: '100%',   label: 'Cloud Ready',        sub: 'Modern infrastructure from day 1' },
    { icon: 'shield',   value: 'Secure', label: 'Secure & Scalable',  sub: 'Enterprise-grade standards'       },
  ];

  readonly mvv = [
    {
      icon: 'target', heading: 'Mission',
      body: 'To deliver practical, scalable, and reliable technology solutions that help businesses operate better, reach more customers, and grow with confidence.',
    },
    {
      icon: 'eye', heading: 'Vision',
      body: 'To be the technology partner growing businesses trust when they need software that works — reliable, modern, and built to last.',
    },
    {
      icon: 'award', heading: 'Values',
      body: 'Quality, clarity, and ownership. We write clean code, communicate honestly, and take full responsibility for every system we build.',
    },
  ];

  readonly serviceItems = [
    { icon: 'monitor', label: 'Web Applications'   },
    { icon: 'phone',   label: 'Mobile Apps'        },
    { icon: 'cloud',   label: 'Cloud Platforms'    },
    { icon: 'link',    label: 'API Integrations'   },
    { icon: 'cpu',     label: 'AI-Ready Solutions' },
    { icon: 'grid',    label: 'Admin Dashboards'   },
  ];

  readonly whyCards = [
    { icon: 'code',   title: 'Clean Architecture',   body: 'Structured, maintainable codebases that scale without technical debt piling up.'      },
    { icon: 'layers', title: 'Scalable Systems',     body: 'Built to grow from MVP to enterprise without requiring a full rewrite.'                },
    { icon: 'lock',   title: 'Secure Development',   body: 'Security best practices baked into every layer — not bolted on at the end.'           },
    { icon: 'zap',    title: 'Performance Focused',  body: 'Fast load times, optimized queries, and responsive UIs that feel instant.'             },
    { icon: 'user',   title: 'User-Centered Design', body: 'Interfaces real users understand and enjoy — no UX shortcuts taken.'                  },
    { icon: 'tool',   title: 'Long-Term Support',    body: 'We stay engaged after launch: maintenance, updates, and ongoing technical guidance.'   },
  ];

  readonly process = [
    { num: '01', label: 'Discover', desc: 'We learn your business goals, map requirements, and define a clear scope of work.'                 },
    { num: '02', label: 'Design',   desc: 'Architecture planning, UI wireframes, and a technical blueprint before a line of code is written.' },
    { num: '03', label: 'Build',    desc: 'Agile development in short cycles with regular check-ins and live demos throughout.'               },
    { num: '04', label: 'Deploy',   desc: 'Production-ready deployment on your infrastructure with full testing and documentation.'           },
    { num: '05', label: 'Support',  desc: 'Post-launch monitoring, maintenance, and ongoing development as your product scales and evolves.'  },
  ];

  readonly techs = [
    'React', 'Angular', 'Node.js', 'TypeScript', 'AWS', 'Docker',
    'MongoDB', 'PostgreSQL', 'Python', 'AI / ML', 'CI/CD', 'GraphQL',
  ];

  ngOnInit(): void {
    this.contentSvc.getByKey('about.main').subscribe({
      next:  (r) => this.content.set(r.data ?? null),
      error: () => {},
    });
  }
}
