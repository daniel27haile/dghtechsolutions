import { Component, OnInit, signal } from '@angular/core';
import { ServiceService } from '../../../core/services/service.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { Service, SiteContentSection } from '../../../core/models';
import { ServiceCardComponent } from '../../../shared/components/service-card/service-card.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { CtaSectionComponent } from '../../../shared/components/cta-section/cta-section.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [ServiceCardComponent, SectionTitleComponent, CtaSectionComponent, LoadingSpinnerComponent],
  template: `
    <!-- Hero -->
    <section class="page-hero">
      <div class="orb orb-a"></div>
      <div class="orb orb-b"></div>
      <div class="inner">
        <p class="eyebrow">{{ content()?.subtitle || 'What We Build' }}</p>
        <h1>{{ content()?.title || 'Our Services' }}</h1>
        <p>{{ content()?.body || 'End-to-end digital solutions — from initial architecture to production deployment and long-term support.' }}</p>
      </div>
    </section>

    <!-- Core service cards — always shown -->
    <section class="section" aria-labelledby="services-heading">
      <div class="container">
        <app-section-title
          subtitle="Full-Stack Capabilities"
          title="What We Deliver"
          description="From custom web applications to cloud infrastructure — we cover the full product lifecycle."
          [center]="true"
          headingId="services-heading"
        />
        <div class="services-grid">
          @for (svc of staticServices; track svc.title) {
            <article class="svc-card">
              <div class="svc-icon" aria-hidden="true">{{ svc.icon }}</div>
              <h3>{{ svc.title }}</h3>
              <p>{{ svc.description }}</p>
              <div class="svc-tags" [attr.aria-label]="svc.title + ' technologies'">
                @for (tag of svc.tags; track tag) {
                  <span class="svc-tag">{{ tag }}</span>
                }
              </div>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- CMS-managed service packages (shown only when published) -->
    @if (loading()) {
      <div class="loading-row" aria-label="Loading services"><app-loading-spinner /></div>
    } @else if (services().length > 0) {
      <section class="section section--gray" aria-label="Service packages">
        <div class="container">
          <app-section-title
            subtitle="Service Packages"
            title="Current Offerings"
            description="Active packages and solutions available for immediate engagement."
            [center]="true"
          />
          <div class="services-grid">
            @for (svc of services(); track svc._id) {
              <app-service-card [service]="svc" />
            }
          </div>
        </div>
      </section>
    }

    <app-cta-section
      heading="Ready to Start a Project?"
      sub="Tell us what you're building and our team will put together a clear plan of action."
      primaryLabel="Contact Our Team"
      primaryLink="/contact"
      secondaryLabel="Learn About Us"
      secondaryLink="/about"
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
    .orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
    .orb-a { width: 500px; height: 500px; background: rgba(37,99,235,.07); top: -150px; right: -100px; }
    .orb-b { width: 300px; height: 300px; background: rgba(96,165,250,.05); bottom: -50px; left: 5%; }
    .inner { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; }
    .eyebrow {
      font-size: .8rem; font-weight: 700; letter-spacing: .12em;
      text-transform: uppercase; color: var(--primary, #2563eb);
      margin-bottom: .75rem; display: block;
    }
    h1 { font-size: clamp(2.5rem,4vw,3.5rem); font-weight: 700; letter-spacing: -.025em; color: var(--text-main, #111827); margin: .5rem 0 1rem; line-height: 1.1; }
    .inner p { font-size: 1.1rem; color: var(--text-body, #374151); margin: 0; max-width: 56ch; margin-inline: auto; }

    /* ── Layout ──────────────────────────────────────────────────────────────── */
    .container { max-width: 1200px; margin: 0 auto; }
    .section { padding: 5rem 1.5rem; }
    .section--gray { background: #f9fafb; }

    /* ── Service cards grid ──────────────────────────────────────────────────── */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-top: 3rem;
    }
    @media (max-width: 1024px) { .services-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px)  { .services-grid { grid-template-columns: 1fr; } }

    /* Static service card */
    .svc-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 2rem 1.75rem;
      display: flex; flex-direction: column; gap: .9rem;
      transition: box-shadow .22s, transform .22s;
    }
    .svc-card:hover { box-shadow: 0 8px 28px rgba(37,99,235,.1); transform: translateY(-4px); }

    .svc-icon { font-size: 2.25rem; line-height: 1; }
    .svc-card h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-main, #111827); margin: 0; }
    .svc-card p  { font-size: .9rem; color: var(--text-body, #374151); line-height: 1.7; margin: 0; flex: 1; }

    .svc-tags { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .25rem; }
    .svc-tag {
      font-size: .72rem; font-weight: 600;
      padding: .2rem .6rem; border-radius: 4px;
      background: rgba(37,99,235,.07);
      color: var(--primary, #2563eb);
      border: 1px solid rgba(37,99,235,.12);
    }

    .loading-row { display: flex; justify-content: center; padding: 3rem 0; }
  `],
})
export class ServicesComponent implements OnInit {
  services = signal<Service[]>([]);
  content  = signal<SiteContentSection | null>(null);
  loading  = signal(true);

  staticServices = [
    {
      icon: '🌐',
      title: 'Web Application Development',
      description: 'Custom web applications built for performance, security, and scale. From internal tools to full SaaS platforms, we deliver software that handles real business workloads.',
      tags: ['Angular', 'React', 'Next.js', 'Node.js'],
    },
    {
      icon: '📱',
      title: 'Mobile App Development',
      description: 'Cross-platform mobile applications that work consistently across iOS and Android. Built with modern frameworks and ready for app store deployment.',
      tags: ['React Native', 'Ionic', 'TypeScript', 'Mobile UI'],
    },
    {
      icon: '☁️',
      title: 'Cloud Solutions',
      description: 'Cloud infrastructure setup, migration, and management. Scalable and cost-efficient architecture on AWS and other major cloud platforms — built to grow with your business.',
      tags: ['AWS', 'Docker', 'CI/CD', 'Nginx', 'GitHub Actions'],
    },
    {
      icon: '🔗',
      title: 'API & Backend Development',
      description: 'Reliable backend systems and third-party integrations. We build clean, documented, and secure APIs that connect your services and power your data layer.',
      tags: ['Node.js', 'Express', 'NestJS', 'MongoDB', 'PostgreSQL'],
    },
    {
      icon: '📊',
      title: 'Admin Dashboards',
      description: 'Internal tools and management dashboards designed around your team\'s workflows. Real-time data, role-based access controls, and clean UI for operational efficiency.',
      tags: ['Angular', 'Charts', 'Role Management', 'Real-Time Data'],
    },
    {
      icon: '🤖',
      title: 'AI-Ready Digital Products',
      description: 'Applications built with AI integration — from OpenAI and Gemini API connections to intelligent automation that reduces manual work and surfaces actionable insights.',
      tags: ['OpenAI', 'Gemini API', 'LangChain', 'AI Automation'],
    },
  ];

  constructor(private svc: ServiceService, private contentSvc: SiteContentService) {}

  ngOnInit(): void {
    this.svc.getActive().subscribe({
      next: (r) => { this.services.set(r.data ?? []); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
    this.contentSvc.getByKey('services.main').subscribe({
      next: (r) => this.content.set(r.data),
      error: () => {},
    });
  }
}
