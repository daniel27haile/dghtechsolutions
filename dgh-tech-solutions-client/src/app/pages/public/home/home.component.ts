import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ServiceService } from '../../../core/services/service.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { Service, SiteContentSection } from '../../../core/models';
import { ProjectCarouselComponent } from '../../../shared/components/project-carousel/project-carousel.component';
import { ServiceCardComponent } from '../../../shared/components/service-card/service-card.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { CtaSectionComponent } from '../../../shared/components/cta-section/cta-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    ProjectCarouselComponent,
    ServiceCardComponent,
    SectionTitleComponent,
    CtaSectionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  services        = signal<Service[]>([]);
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

  highlights = computed<string[]>(() => {
    const m = this.about()?.metadata as { highlights?: string[] } | undefined;
    return m?.highlights ?? [
      'Clean, scalable architecture on every project',
      'Agile process with consistent client updates',
      'Transparent timelines and honest communication',
      'On-time, on-budget delivery',
      'Post-launch support and long-term maintenance',
    ];
  });

  values = [
    { icon: '⚡', title: 'Performance First',  body: 'We build applications that load fast and hold up under real-world traffic — optimized from day one.' },
    { icon: '🔒', title: 'Security by Design', body: 'Security is built into every layer of our architecture, not added as an afterthought.' },
    { icon: '🎯', title: 'Results Driven',      body: 'Every feature we build is tied to a clear business objective. We ship what matters.' },
    { icon: '🤝', title: 'Transparent Partner', body: 'Clear timelines, regular updates, and full visibility at every stage of your project.' },
  ];

  readonly techGroups = [
    {
      label: 'Frontend',
      items: ['Angular 18', 'React', 'TypeScript', 'JavaScript', 'HTML5', 'SCSS / Tailwind'],
    },
    {
      label: 'Backend',
      items: ['Node.js', 'Express.js', 'REST APIs', 'MongoDB', 'JWT Auth', 'API Integration'],
    },
    {
      label: 'Cloud & DevOps',
      items: ['AWS', 'DigitalOcean', 'GitHub Actions', 'Nginx', 'PM2', 'CI/CD'],
    },
    {
      label: 'AI & Automation',
      items: ['OpenAI API', 'Gemini AI', 'AI Integration', 'Automation', 'Workflow Tools'],
    },
  ];

  constructor(
    private serviceSvc: ServiceService,
    private contentSvc: SiteContentService,
  ) {}

  ngOnInit(): void {
    // Services load independently (different API)
    this.serviceSvc.getActive().subscribe({
      next: (r) => this.services.set((r.data ?? []).slice(0, 6)),
      error: () => {},
    });

    // All content blocks fetched in parallel — one round-trip per key (cached)
    forkJoin({
      hero:     this.contentSvc.getByKey('home.hero'),
      about:    this.contentSvc.getByKey('home.aboutPreview'),
      cta:      this.contentSvc.getByKey('home.contactCta'),
      services: this.contentSvc.getByKey('home.servicesPreview'),
      projects: this.contentSvc.getByKey('home.projectsPreview'),
    }).subscribe({
      next: (r) => {
        this.hero.set(r.hero.data);
        this.about.set(r.about.data);
        this.cta.set(r.cta.data);
        this.servicesPreview.set(r.services.data);
        this.projectsPreview.set(r.projects.data);
      },
      error: () => {},
    });
  }
}
