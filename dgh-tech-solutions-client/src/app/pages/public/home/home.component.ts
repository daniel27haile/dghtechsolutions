import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SiteContentService } from '../../../core/services/site-content.service';
import { SiteContentSection } from '../../../core/models';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { CtaSectionComponent } from '../../../shared/components/cta-section/cta-section.component';

const ICONS: Record<string, string> = {
  globe:         '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  smartphone:    '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  cpu:           '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  layers:        '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  shield:        '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  trending:      '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  zap:           '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  users:         '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  tool:          '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  cloud:         '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  code:          '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  briefcase:     '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  heart:         '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  'book-open':   '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  truck:         '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  'shopping-bag':'<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  monitor:       '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, SectionTitleComponent, CtaSectionComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private san = inject(DomSanitizer);

  // ── Hero animated services ─────────────────────────────────────────────────
  readonly heroServices = [
    { verb: 'Build',    service: 'Web Development'        },
    { verb: 'Automate', service: 'AI Solutions'            },
    { verb: 'Scale',    service: 'Cloud Services'          },
    { verb: 'Launch',   service: 'Full-Stack Applications' },
    { verb: 'Grow',     service: 'Digital Solutions'       },
    { verb: 'Optimize', service: 'Admin Dashboards'        },
  ];

  activePhrase = signal(0);
  heroPaused   = signal(false);

  private _timer?: ReturnType<typeof setTimeout>;

  hero            = signal<SiteContentSection | null>(null);
  about           = signal<SiteContentSection | null>(null);
  cta             = signal<SiteContentSection | null>(null);
  servicesPreview = signal<SiteContentSection | null>(null);
  projectsPreview = signal<SiteContentSection | null>(null);

  stats = computed<{ label: string; value: string }[]>(() => {
    const m = this.hero()?.metadata as { stats?: { label: string; value: string }[] } | undefined;
    return m?.stats ?? [
      { label: 'Projects Delivered',  value: '50+' },
      { label: 'Happy Clients',       value: '30+' },
      { label: 'Years Experience',    value: '5+'  },
      { label: 'Client Satisfaction', value: '99%' },
    ];
  });

  // ── Hero trust row ─────────────────────────────────────────────────────────
  readonly trustItems = [
    { icon: 'code',    label: 'Custom Software'        },
    { icon: 'cpu',     label: 'AI-Ready Solutions'     },
    { icon: 'cloud',   label: 'Cloud Architecture'     },
    { icon: 'layers',  label: 'End-to-End Development' },
  ];

  // ── 3 featured service cards ───────────────────────────────────────────────
  readonly featuredServices = [
    {
      icon: 'globe',
      title: 'Web Development',
      description: 'Custom web applications built for performance, security, and scale — from internal tools to full SaaS platforms ready for real business workloads.',
      tags: ['Angular', 'React', 'Next.js', 'Node.js', 'TypeScript'],
    },
    {
      icon: 'smartphone',
      title: 'Mobile App Development',
      description: 'Cross-platform mobile apps that work consistently on iOS and Android — built with modern frameworks and ready for app store deployment.',
      tags: ['React Native', 'Ionic', 'TypeScript', 'Mobile UI'],
    },
    {
      icon: 'cpu',
      title: 'AI-Ready Solutions',
      description: 'Applications with intelligent automation — from OpenAI and Gemini integrations to AI-powered workflows that reduce manual work and surface insights.',
      tags: ['OpenAI', 'Gemini API', 'LangChain', 'Node.js'],
    },
  ];

  // ── Why Choose DGH (6 cards) ──────────────────────────────────────────────
  readonly whyCards = [
    { icon: 'layers',   title: 'Modern Architecture',  body: 'Well-established, maintainable patterns — not fragile shortcuts — so your software scales without rewrites.' },
    { icon: 'trending', title: 'Scalable Solutions',   body: 'Infrastructure and code designed to handle growth. From startup to enterprise, your system keeps up with demand.' },
    { icon: 'shield',   title: 'Secure Development',   body: 'Security built in from the start — authentication, authorization, input validation, and secure CI/CD pipelines.' },
    { icon: 'cloud',    title: 'Cloud Expertise',      body: 'Cloud-native architecture on AWS and major platforms. Scalable, cost-efficient, and production-ready from day one.' },
    { icon: 'cpu',      title: 'AI Integration',       body: 'Practical AI built into your products — not buzzwords. Real automation that reduces manual work and surfaces insights.' },
    { icon: 'tool',     title: 'Long-Term Support',    body: 'We support what we build — patches, upgrades, new features, and ongoing consultation after launch.' },
  ];

  // ── Development process (6 steps) ─────────────────────────────────────────
  readonly processSteps = [
    { num: '01', label: 'Discover', desc: 'Understand your goals, users, and constraints through structured discovery.' },
    { num: '02', label: 'Plan',     desc: 'Architecture, stack, timeline, and milestones documented and agreed upon.' },
    { num: '03', label: 'Design',   desc: 'UI wireframes and system design reviewed before any code is written.' },
    { num: '04', label: 'Develop',  desc: 'Iterative development with regular demos and check-ins at every milestone.' },
    { num: '05', label: 'Deploy',   desc: 'Production launch with CI/CD pipelines and thorough QA before go-live.' },
    { num: '06', label: 'Support',  desc: 'Ongoing maintenance, patches, and feature additions after launch.' },
  ];

  // ── Tech groups ────────────────────────────────────────────────────────────
  readonly techGroups = [
    {
      label: 'Frontend',
      desc:  'Modern UIs that are fast, accessible, and responsive.',
      items: ['Angular 18', 'React', 'TypeScript', 'JavaScript', 'HTML5', 'SCSS / Tailwind'],
    },
    {
      label: 'Backend',
      desc:  'Robust APIs and databases that power your products.',
      items: ['Node.js', 'Express.js', 'REST APIs', 'MongoDB', 'JWT Auth', 'API Integration'],
    },
    {
      label: 'Cloud & DevOps',
      desc:  'Scalable infrastructure with automated delivery pipelines.',
      items: ['AWS', 'DigitalOcean', 'GitHub Actions', 'Nginx', 'PM2', 'CI/CD'],
    },
    {
      label: 'AI & Automation',
      desc:  'Practical intelligence built directly into your products.',
      items: ['OpenAI API', 'Gemini AI', 'AI Integration', 'Automation', 'Workflow Tools'],
    },
  ];

  // ── Project examples (4 static cards) ────────────────────────────────────
  readonly projectExamples = [
    {
      title: 'Transportation Booking Platform',
      desc:  'Ride and charter booking system with real-time tracking, driver management, and integrated payment processing.',
      tags:  ['Web App', 'Node.js', 'React', 'Stripe'],
      link:  null as string | null,
    },
    {
      title: 'Photography Portfolio & Booking Site',
      desc:  'Portfolio and appointment booking platform for a photography business with client galleries and session scheduling.',
      tags:  ['Web App', 'Angular', 'MongoDB', 'Payment'],
      link:  null as string | null,
    },
    {
      title: 'Learning Resources Marketplace',
      desc:  'Structured learning hub with paid/free resources, MCQ practice, flashcards, and user progress tracking.',
      tags:  ['SaaS', 'Angular', 'Stripe', 'MongoDB'],
      link:  '/resources' as string | null,
    },
    {
      title: 'Business Admin Dashboard',
      desc:  'Multi-role internal management dashboard with real-time analytics, user management, and full CMS capabilities.',
      tags:  ['Admin Panel', 'Angular', 'Real-Time', 'Role-Based Access'],
      link:  null as string | null,
    },
  ];

  // ── Industries ─────────────────────────────────────────────────────────────
  readonly industries = [
    { icon: 'briefcase',    label: 'Small Businesses'    },
    { icon: 'zap',          label: 'Startups'            },
    { icon: 'truck',        label: 'Transportation'       },
    { icon: 'heart',        label: 'Healthcare'          },
    { icon: 'book-open',    label: 'Education'           },
    { icon: 'layers',       label: 'SaaS Platforms'      },
    { icon: 'users',        label: 'Prof. Services'      },
    { icon: 'shopping-bag', label: 'E-commerce'          },
  ];

  icon(name: string, size = 20): SafeHtml {
    const paths = ICONS[name] ?? '';
    return this.san.bypassSecurityTrustHtml(
      `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
    );
  }

  constructor(private contentSvc: SiteContentService) {}

  ngOnDestroy(): void { clearTimeout(this._timer); }

  pauseHero():  void { this.heroPaused.set(true);  clearTimeout(this._timer); }
  resumeHero(): void { this.heroPaused.set(false); this.schedule(); }

  private schedule(): void {
    this._timer = setTimeout(() => {
      this.activePhrase.update(i => (i + 1) % this.heroServices.length);
      this.schedule();
    }, 4000);
  }

  ngOnInit(): void {
    this.schedule();
    const fallback = of({ data: undefined } as { data: SiteContentSection | undefined });
    forkJoin({
      hero:     this.contentSvc.getByKey('home.hero').pipe(catchError(() => fallback)),
      about:    this.contentSvc.getByKey('home.aboutPreview').pipe(catchError(() => fallback)),
      cta:      this.contentSvc.getByKey('home.contactCta').pipe(catchError(() => fallback)),
      services: this.contentSvc.getByKey('home.servicesPreview').pipe(catchError(() => fallback)),
      projects: this.contentSvc.getByKey('home.projectsPreview').pipe(catchError(() => fallback)),
    }).subscribe({
      next: (r) => {
        this.hero.set(r.hero.data ?? null);
        this.about.set(r.about.data ?? null);
        this.cta.set(r.cta.data ?? null);
        this.servicesPreview.set(r.services.data ?? null);
        this.projectsPreview.set(r.projects.data ?? null);
      },
      error: () => {},
    });
  }
}
