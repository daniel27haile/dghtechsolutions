import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteContentService } from '../../../core/services/site-content.service';
import { SiteContentSection } from '../../../core/models';
import { CtaSectionComponent } from '../../../shared/components/cta-section/cta-section.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, CtaSectionComponent],
  template: `
    <!-- Hero -->
    <section class="page-hero">
      <div class="orb orb-a"></div>
      <div class="orb orb-b"></div>
      <div class="inner">
        <p class="eyebrow">Who We Are</p>
        <h1>{{ content()?.title || 'About DGH Tech Solutions' }}</h1>
        <p>{{ content()?.subtitle || 'We build reliable, scalable, and modern digital products for businesses that need technology to support real growth.' }}</p>
      </div>
    </section>

    <!-- Company Overview -->
    <section class="section overview-section">
      <div class="container">
        <div class="overview-grid">

          <!-- Mission Card -->
          <div class="mission-card">
            <div class="mission-icon" aria-hidden="true">🚀</div>
            <h3>Our Mission</h3>
            <p class="mission-text">To deliver practical, scalable, and reliable technology solutions that help businesses operate better, reach more customers, and grow with confidence.</p>
            <div class="service-tags" aria-label="Service areas">
              @for (s of services; track s) {
                <span class="service-tag">{{ s }}</span>
              }
            </div>
          </div>

          <!-- Company Text -->
          <div class="overview-text">
            <p class="eyebrow-colored">About the Company</p>
            <h2>Technology Built for Business Growth</h2>
            <div class="body-text">
              <p>{{ content()?.body || 'DGH Tech Solutions is a technology company focused on designing and developing high-quality web applications, mobile apps, cloud-based platforms, and AI-ready digital solutions.' }}</p>
              <p class="body-extra">Our work is centered on clean architecture, strong user experience, performance, security, and long-term maintainability. From business websites and admin dashboards to custom platforms and API integrations, we help clients turn ideas into production-ready software.</p>
            </div>
            <div class="highlights-list" role="list" aria-label="Company commitments">
              @for (v of values; track v.title) {
                <div class="hl-item" role="listitem">
                  <span class="hl-icon" aria-hidden="true">&#10003;</span>
                  <span>{{ v.title }}</span>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="section section--gray">
      <div class="container">
        <div class="section-header">
          <p class="eyebrow-colored">Core Principles</p>
          <h2>How We Work</h2>
          <p class="section-sub">The standards that guide every project we take on.</p>
        </div>
        <div class="values-grid">
          @for (v of values; track v.title) {
            <div class="value-card">
              <div class="v-icon" aria-hidden="true">{{ v.icon }}</div>
              <h3>{{ v.title }}</h3>
              <p>{{ v.body }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Tech Stack -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <p class="eyebrow-colored">Technology Stack</p>
          <h2>Tools We Work With</h2>
          <p class="section-sub">Full-stack expertise across the modern web and cloud ecosystem.</p>
        </div>
        <div class="stack-groups">
          @for (g of techGroups; track g.label) {
            <div class="stack-group">
              <h4>{{ g.label }}</h4>
              <div class="stack-tags">
                @for (t of g.items; track t) {
                  <span class="stack-tag">{{ t }}</span>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Trust Indicators -->
    <section class="section section--dark trust-section">
      <div class="container">
        <div class="trust-grid">
          @for (t of trustItems; track t.number) {
            <div class="trust-item">
              <div class="t-number">{{ t.number }}</div>
              <div class="t-label">{{ t.label }}</div>
              <div class="t-sub">{{ t.sub }}</div>
            </div>
          }
        </div>
      </div>
    </section>

    <app-cta-section
      heading="Let's Build Something Together"
      sub="Have a project in mind? Tell us about it and we'll get back to you."
      primaryLabel="Start a Conversation"
      primaryLink="/contact"
      secondaryLabel="View Our Services"
      secondaryLink="/services"
    />
  `,
  styles: [`
    /* ── Hero ────────────────────────────────────────────────────────────────── */
    .page-hero {
      position: relative; overflow: hidden;
      background: var(--bg-section, #f3f4f6);
      color: var(--text-main, #111827);
      padding: 9rem 1.5rem 5rem; text-align: center;
      border-bottom: 1px solid var(--bg-section-alt, #e5e7eb);
    }
    .orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; animation: float 10s ease-in-out infinite; }
    .orb-a { width: 480px; height: 480px; background: rgba(37,99,235,.07); top: -140px; right: -80px; }
    .orb-b { width: 280px; height: 280px; background: rgba(96,165,250,.05); bottom: -40px; left: 5%; animation-delay: -4s; }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
    .inner { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; }
    .eyebrow {
      font-size: .8rem; font-weight: 700; letter-spacing: .12em;
      text-transform: uppercase; color: var(--primary, #2563eb);
      margin-bottom: .75rem; display: block;
    }
    h1 { font-size: clamp(2.5rem,4vw,3.5rem); font-weight: 700; letter-spacing: -.025em; color: var(--text-main, #111827); margin: .5rem 0 1rem; line-height: 1.1; }
    .page-hero p { font-size: 1.1rem; color: var(--text-body, #374151); margin: 0; max-width: 56ch; margin-inline: auto; }

    /* ── Layout ──────────────────────────────────────────────────────────────── */
    .section { padding: 5rem 1.5rem; }
    .section--gray { background: #f9fafb; }
    .container { max-width: 1200px; margin: 0 auto; }

    /* ── Section header ──────────────────────────────────────────────────────── */
    .section-header { text-align: center; margin-bottom: 3rem; }
    .section-header h2 { font-size: clamp(1.8rem,3vw,2.4rem); font-weight: 700; color: var(--text-main, #111827); margin: .4rem 0 .75rem; }
    .section-sub { color: var(--text-muted, #6b7280); max-width: 48ch; margin: 0 auto; font-size: .95rem; }
    .eyebrow-colored {
      font-size: .8rem; font-weight: 700; letter-spacing: .12em;
      text-transform: uppercase; color: var(--primary, #2563eb);
      display: block; margin-bottom: .3rem;
    }

    /* ── Overview grid ───────────────────────────────────────────────────────── */
    .overview-grid { display: grid; grid-template-columns: 340px 1fr; gap: 4rem; align-items: start; }
    @media (max-width: 960px) { .overview-grid { grid-template-columns: 1fr; gap: 2.5rem; } }

    /* Mission card */
    .mission-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 2.25rem 2rem;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
      position: sticky; top: 96px;
    }
    @media (max-width: 960px) { .mission-card { position: static; } }
    .mission-icon { font-size: 2.75rem; display: block; margin-bottom: 1rem; }
    .mission-card h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-main, #111827); margin: 0 0 .75rem; }
    .mission-text { font-size: .9rem; color: var(--text-body, #374151); line-height: 1.75; margin: 0 0 1.5rem; }

    .service-tags { display: flex; flex-wrap: wrap; gap: .4rem; justify-content: center; }
    .service-tag {
      font-size: .72rem; font-weight: 600;
      padding: .25rem .7rem; border-radius: 4px;
      background: rgba(37,99,235,.08);
      color: var(--primary, #2563eb);
      border: 1px solid rgba(37,99,235,.15);
    }

    /* Overview text */
    .overview-text { display: flex; flex-direction: column; gap: 1.5rem; }
    .overview-text h2 { font-size: clamp(1.8rem,3vw,2.4rem); font-weight: 700; color: var(--text-main, #111827); margin: 0; }
    .body-text p { color: var(--text-body, #374151); line-height: 1.8; font-size: 1rem; margin: 0 0 1rem; }
    .body-extra { font-size: .95rem !important; color: var(--text-muted, #6b7280) !important; }

    .highlights-list { display: flex; flex-direction: column; gap: .6rem; }
    .hl-item { display: flex; align-items: center; gap: .75rem; color: var(--text-body, #374151); font-size: .95rem; font-weight: 500; }
    .hl-icon {
      width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
      background: rgba(37,99,235,.1); color: var(--primary, #2563eb);
      display: flex; align-items: center; justify-content: center;
      font-size: .75rem;
    }

    /* ── Values grid ─────────────────────────────────────────────────────────── */
    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 1.5rem;
    }

    .value-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 1.75rem 1.5rem;
      transition: box-shadow .25s, transform .25s;
    }
    .value-card:hover { box-shadow: 0 8px 28px rgba(37,99,235,.1); transform: translateY(-4px); }
    .v-icon { font-size: 2rem; margin-bottom: .75rem; }
    .value-card h3 { font-size: 1rem; font-weight: 700; color: var(--text-main, #111827); margin: 0 0 .5rem; }
    .value-card p { font-size: .875rem; color: var(--text-body, #374151); line-height: 1.65; margin: 0; }

    /* ── Tech stack ──────────────────────────────────────────────────────────── */
    .stack-groups { display: grid; grid-template-columns: repeat(4,1fr); gap: 2rem; }
    @media (max-width: 900px) { .stack-groups { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 480px) { .stack-groups { grid-template-columns: 1fr; } }

    .stack-group h4 {
      font-size: .78rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .08em;
      color: var(--text-muted, #6b7280); margin: 0 0 .75rem;
    }
    .stack-tags { display: flex; flex-wrap: wrap; gap: .4rem; }
    .stack-tag {
      font-size: .8rem; font-weight: 500;
      padding: .25rem .65rem; border-radius: 6px;
      background: #f3f4f6; border: 1px solid #e5e7eb;
      color: var(--text-body, #374151);
    }

    /* ── Trust indicators ────────────────────────────────────────────────────── */
    .section--dark { background: #e5e7eb; }
    .trust-section { padding: 4rem 1.5rem; }
    .trust-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 2rem; text-align: center; }
    @media (max-width: 768px) { .trust-grid { grid-template-columns: repeat(2,1fr); } }
    .t-number { font-size: 2.6rem; font-weight: 800; color: var(--primary, #2563eb); line-height: 1; }
    .t-label  { font-size: 1rem; font-weight: 600; color: var(--text-main, #111827); margin: .4rem 0 .2rem; }
    .t-sub    { font-size: .82rem; color: var(--text-muted, #6b7280); }
  `],
})
export class AboutComponent implements OnInit {
  content = signal<SiteContentSection | null>(null);

  values = [
    {
      icon: '⚡',
      title: 'Quality Engineering',
      body: 'We write clean, well-structured code that is built to scale and easy to maintain over time.',
    },
    {
      icon: '💬',
      title: 'Clear Communication',
      body: 'We keep clients informed at every stage — no surprises, no jargon, just honest timelines and clear updates.',
    },
    {
      icon: '✅',
      title: 'Reliable Delivery',
      body: 'We set realistic timelines and meet them. Commitments matter on every project, regardless of size.',
    },
    {
      icon: '🏗️',
      title: 'Scalable Architecture',
      body: 'Every system we build is designed to grow — from early-stage startup to enterprise scale without a full rebuild.',
    },
    {
      icon: '🤝',
      title: 'Long-Term Support',
      body: 'We stay engaged after launch — offering maintenance, updates, and ongoing technical guidance.',
    },
  ];

  techGroups = [
    { label: 'Frontend',       items: ['Angular', 'React', 'Next.js', 'TypeScript', 'SCSS', 'Responsive UI'] },
    { label: 'Backend',        items: ['Node.js', 'Express', 'NestJS', 'REST APIs', 'GraphQL', 'Spring Boot'] },
    { label: 'Database',       items: ['MongoDB', 'PostgreSQL', 'Redis', 'Firebase', 'TypeORM'] },
    { label: 'Cloud & DevOps', items: ['AWS', 'Docker', 'CI/CD', 'GitHub Actions', 'Nginx', 'PM2'] },
  ];

  trustItems = [
    { number: '50+', label: 'Projects Delivered', sub: 'across diverse industries' },
    { number: '30+', label: 'Happy Clients',       sub: 'long-term partnerships'   },
    { number: '5+',  label: 'Years Experience',    sub: 'building scalable software' },
    { number: '99%', label: 'Client Satisfaction', sub: 'measured across all projects' },
  ];

  services = [
    'Web Applications',
    'Mobile Apps',
    'Cloud Platforms',
    'AI Integration',
    'API Development',
    'Admin Dashboards',
  ];

  constructor(private contentSvc: SiteContentService) {}

  ngOnInit(): void {
    this.contentSvc.getByKey('about.main').subscribe({
      next: (r) => this.content.set(r.data),
      error: () => {},
    });
  }
}
