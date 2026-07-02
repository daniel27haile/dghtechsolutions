import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ServiceService }     from '../../../core/services/service.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { Service, SiteContentSection } from '../../../core/models';
import { ServiceCardComponent }     from '../../../shared/components/service-card/service-card.component';
import { SectionTitleComponent }    from '../../../shared/components/section-title/section-title.component';
import { CtaSectionComponent }      from '../../../shared/components/cta-section/cta-section.component';
import { LoadingSpinnerComponent }  from '../../../shared/components/loading-spinner/loading-spinner.component';

// ─── Feather-style SVG path data ─────────────────────────────────────────────
const P: Record<string, string> = {
  globe:       '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  smartphone:  '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  cloud:       '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  link:        '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  monitor:     '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  cpu:         '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  layers:      '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  trending:    '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  shield:      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  zap:         '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  users:       '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  tool:        '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  briefcase:   '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  truck:       '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  heart:       '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  'shopping-bag': '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  calendar:    '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
};

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, ServiceCardComponent, SectionTitleComponent, CtaSectionComponent, LoadingSpinnerComponent],
  template: `
<!-- ═══ 1. HERO ══════════════════════════════════════════════════════════════ -->
<section class="sv-hero" aria-labelledby="sv-hero-h1">
  <div class="sv-orb sv-orb--a"></div>
  <div class="sv-orb sv-orb--b"></div>
  <div class="sv-hero-inner">
    <p class="sv-eyebrow">{{ content()?.subtitle || 'What We Build' }}</p>
    <h1 id="sv-hero-h1">{{ content()?.title || 'Helping Businesses Build&nbsp;Modern Software Solutions' }}</h1>
    <p class="sv-hero-sub">
      {{ content()?.body || 'End-to-end digital products — web apps, mobile apps, cloud platforms, APIs, AI-ready solutions, and enterprise dashboards. From first commit to production and beyond.' }}
    </p>
    <div class="sv-hero-ctas">
      <a routerLink="/contact" class="btn btn--primary">Start Your Project</a>
      <a routerLink="/contact" class="btn btn--outline">Contact Us</a>
    </div>

    <!-- Trust row -->
    <div class="sv-trust" aria-label="Key credentials">
      <div class="sv-tr-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>8+ Years Experience</span>
      </div>
      <span class="sv-tr-div" aria-hidden="true"></span>
      <div class="sv-tr-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
        <span>Cloud Ready</span>
      </div>
      <span class="sv-tr-div" aria-hidden="true"></span>
      <div class="sv-tr-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
        <span>AI-Ready Solutions</span>
      </div>
      <span class="sv-tr-div" aria-hidden="true"></span>
      <div class="sv-tr-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        <span>End-to-End Development</span>
      </div>
    </div>
  </div>
</section>

<!-- ═══ 2. FEATURED SERVICES ════════════════════════════════════════════════ -->
<section class="sv-section" aria-labelledby="sv-feat-heading">
  <div class="sv-container">
    <div class="sv-section-head">
      <p class="sv-eyebrow">Core Services</p>
      <h2 id="sv-feat-heading">What We Build</h2>
      <p>Our primary capabilities — end-to-end digital products designed to perform at scale from day one.</p>
    </div>
    <div class="sv-feat-grid">
      @for (svc of featuredServices; track svc.title) {
        <article class="sv-feat-card">
          <div class="sv-feat-icon" [innerHTML]="icon(svc.icon, 28)"></div>
          <h3>{{ svc.title }}</h3>
          <p>{{ svc.description }}</p>
          <div class="sv-tags" [attr.aria-label]="svc.title + ' technologies'">
            @for (tag of svc.tags; track tag) {
              <span class="sv-tag">{{ tag }}</span>
            }
          </div>
        </article>
      }
    </div>
  </div>
</section>

<!-- ═══ 3. SPECIALIZED SERVICES ════════════════════════════════════════════ -->
<section class="sv-section sv-section--gray" aria-labelledby="sv-spec-heading">
  <div class="sv-container">
    <div class="sv-section-head">
      <p class="sv-eyebrow">Specialized Work</p>
      <h2 id="sv-spec-heading">Specialized Capabilities</h2>
      <p>Targeted expertise for the details that make software products complete and production-ready.</p>
    </div>
    <div class="sv-spec-grid">
      @for (svc of specializedServices; track svc.title) {
        <article class="sv-spec-card">
          <div class="sv-spec-icon" [innerHTML]="icon(svc.icon, 22)"></div>
          <h3>{{ svc.title }}</h3>
          <p>{{ svc.description }}</p>
          <div class="sv-tags">
            @for (tag of svc.tags; track tag) {
              <span class="sv-tag">{{ tag }}</span>
            }
          </div>
          @if (svc.link) {
            <a [routerLink]="svc.link" class="sv-card-link">Browse {{ svc.title }} &rarr;</a>
          }
        </article>
      }
    </div>
  </div>
</section>

<!-- ═══ 4. CMS SERVICE PACKAGES (conditional) ══════════════════════════════ -->
@if (loading()) {
  <div class="sv-loading" aria-label="Loading service packages"><app-loading-spinner /></div>
} @else if (services().length > 0) {
  <section class="sv-section" aria-label="Service packages">
    <div class="sv-container">
      <app-section-title
        subtitle="Service Packages"
        title="Current Offerings"
        description="Active packages and solutions available for immediate engagement."
        [center]="true"
      />
      <div class="sv-cms-grid">
        @for (svc of services(); track svc._id) {
          <app-service-card [service]="svc" />
        }
      </div>
    </div>
  </section>
}

<!-- ═══ 5. WHY CHOOSE DGH ══════════════════════════════════════════════════ -->
<section class="sv-section sv-section--gray" aria-labelledby="sv-why-heading">
  <div class="sv-container">
    <div class="sv-section-head">
      <p class="sv-eyebrow">Why DGH</p>
      <h2 id="sv-why-heading">Why Businesses Choose DGH Tech Solutions</h2>
      <p>We combine technical depth with a clear focus on delivering software that actually works in production.</p>
    </div>
    <div class="sv-why-grid">
      @for (card of whyCards; track card.title) {
        <div class="sv-why-card">
          <div class="sv-why-icon" [innerHTML]="icon(card.icon, 22)"></div>
          <h3>{{ card.title }}</h3>
          <p>{{ card.body }}</p>
        </div>
      }
    </div>
  </div>
</section>

<!-- ═══ 6. DEVELOPMENT PROCESS ══════════════════════════════════════════════ -->
<section class="sv-section" aria-labelledby="sv-proc-heading">
  <div class="sv-container">
    <div class="sv-section-head">
      <p class="sv-eyebrow">How We Work</p>
      <h2 id="sv-proc-heading">Our Development Process</h2>
      <p>A structured, repeatable approach that keeps projects on track from discovery to deployment.</p>
    </div>
    <div class="sv-process" role="list">
      @for (step of processSteps; track step.num) {
        <div class="sv-step" role="listitem">
          <div class="sv-step-num" aria-hidden="true">{{ step.num }}</div>
          <div class="sv-step-label">{{ step.label }}</div>
          <p class="sv-step-desc">{{ step.desc }}</p>
        </div>
      }
    </div>
  </div>
</section>

<!-- ═══ 7. TECHNOLOGIES ══════════════════════════════════════════════════════ -->
<section class="sv-section sv-section--gray" aria-labelledby="sv-tech-heading">
  <div class="sv-container">
    <div class="sv-section-head">
      <p class="sv-eyebrow">Our Stack</p>
      <h2 id="sv-tech-heading">Technologies We Use</h2>
      <p>Modern, well-supported tools that ensure maintainable, scalable, and production-ready software.</p>
    </div>
    <div class="sv-tech-pills" aria-label="Technologies">
      @for (t of techs; track t) {
        <span class="sv-tech-pill">{{ t }}</span>
      }
    </div>
  </div>
</section>

<!-- ═══ 8. INDUSTRIES ════════════════════════════════════════════════════════ -->
<section class="sv-section" aria-labelledby="sv-ind-heading">
  <div class="sv-container">
    <div class="sv-section-head">
      <p class="sv-eyebrow">Who We Serve</p>
      <h2 id="sv-ind-heading">Industries We Serve</h2>
      <p>Experience across diverse sectors — we understand the specific challenges each industry faces.</p>
    </div>
    <div class="sv-ind-grid">
      @for (ind of industries; track ind.label) {
        <div class="sv-ind-card">
          <div class="sv-ind-icon" [innerHTML]="icon(ind.icon, 20)"></div>
          <span>{{ ind.label }}</span>
        </div>
      }
    </div>
  </div>
</section>

<!-- ═══ 9. PROJECT EXAMPLES ══════════════════════════════════════════════════ -->
<section class="sv-section sv-section--gray" aria-labelledby="sv-ex-heading">
  <div class="sv-container">
    <div class="sv-section-head">
      <p class="sv-eyebrow">Our Work</p>
      <h2 id="sv-ex-heading">Project Examples</h2>
      <p>A sample of the types of solutions we've built — each tailored to specific business needs.</p>
    </div>
    <div class="sv-ex-grid">
      @for (ex of projectExamples; track ex.title) {
        <div class="sv-ex-card">
          <h3>{{ ex.title }}</h3>
          <p>{{ ex.desc }}</p>
          <div class="sv-tags">
            @for (tag of ex.tags; track tag) {
              <span class="sv-tag">{{ tag }}</span>
            }
          </div>
        </div>
      }
    </div>
  </div>
</section>

<!-- ═══ 10. FINAL CTA ════════════════════════════════════════════════════════ -->
<app-cta-section
  heading="Ready to build your next project?"
  sub="Let's turn your idea into reliable, scalable, production-ready software."
  primaryLabel="Start Your Project"
  primaryLink="/contact"
  secondaryLabel="Book Consultation"
  secondaryLink="/contact"
/>
`,
  styles: [`
/* ─── Shared helpers ──────────────────────────────────────────────────────── */
.sv-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.sv-eyebrow {
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: #2563eb;
  margin-bottom: .5rem;
  display: block;
}

.sv-section {
  padding: 4.5rem 1.5rem;

  @media (max-width: 640px) { padding: 3rem 1.25rem; }
}

.sv-section--gray { background: #f8fafc; }

.sv-section-head {
  text-align: center;
  max-width: 620px;
  margin: 0 auto 2.75rem;

  h2 {
    font-size: clamp(1.55rem, 3vw, 2.1rem);
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -.025em;
    margin: .35rem 0 .65rem;
  }

  p {
    font-size: .93rem;
    color: #475569;
    line-height: 1.7;
    margin: 0;
  }

  @media (max-width: 640px) { margin-bottom: 2rem; }
}

/* ─── Shared tag pills ────────────────────────────────────────────────────── */
.sv-tags {
  display: flex;
  flex-wrap: wrap;
  gap: .35rem;
  margin-top: auto;
  padding-top: .5rem;
}

.sv-tag {
  font-size: .7rem;
  font-weight: 600;
  padding: .2rem .6rem;
  border-radius: 4px;
  background: rgba(37,99,235,.07);
  color: #1d4ed8;
  border: 1px solid rgba(37,99,235,.13);
  white-space: nowrap;
}

.sv-card-link {
  display: inline-block;
  margin-top: .85rem;
  font-size: .84rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  transition: color .15s;

  &:hover { color: #1d4ed8; text-decoration: underline; }
}

.sv-loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
.sv-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #eef4ff 0%, #f5f8ff 50%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 3rem 1.5rem 2.75rem;
  text-align: center;

  @media (max-width: 640px) { padding: 2.25rem 1.25rem 2rem; }
}

.sv-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}

.sv-orb--a {
  width: 480px;
  height: 480px;
  background: rgba(37,99,235,.07);
  top: -180px;
  right: -80px;
}

.sv-orb--b {
  width: 300px;
  height: 300px;
  background: rgba(96,165,250,.06);
  bottom: -60px;
  left: 4%;
}

.sv-hero-inner {
  position: relative;
  z-index: 1;
  max-width: 740px;
  margin: 0 auto;

  h1 {
    font-size: clamp(1.9rem, 4.5vw, 2.85rem);
    font-weight: 800;
    letter-spacing: -.025em;
    color: #0f172a;
    margin: .4rem 0 .85rem;
    line-height: 1.15;
  }
}

.sv-hero-sub {
  font-size: 1rem;
  color: #475569;
  max-width: 600px;
  margin: 0 auto 1.75rem;
  line-height: 1.7;
}

.sv-hero-ctas {
  display: flex;
  gap: .75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;

  @media (max-width: 380px) {
    flex-direction: column;
    align-items: center;
  }
}

/* ─── Hero trust row ──────────────────────────────────────────────────────── */
.sv-trust {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: .2rem .05rem;
}

.sv-tr-item {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  font-size: .78rem;
  font-weight: 600;
  color: #475569;
  padding: .25rem .6rem;

  svg { color: #2563eb; flex-shrink: 0; }
}

.sv-tr-div {
  width: 1px;
  height: 14px;
  background: #cbd5e1;
  flex-shrink: 0;
  margin: 0 .1rem;

  @media (max-width: 420px) { display: none; }
}

/* ─── Featured service cards (3 large) ───────────────────────────────────── */
.sv-feat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 960px) { grid-template-columns: 1fr; }
}

.sv-feat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 2.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: .85rem;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 36px rgba(37,99,235,.1);
    border-color: #bfdbfe;
  }

  h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  p {
    font-size: .91rem;
    color: #374151;
    line-height: 1.75;
    margin: 0;
    flex: 1;
  }
}

.sv-feat-icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  flex-shrink: 0;

  .sv-feat-card:hover & {
    background: #dbeafe;
  }
}

/* ─── Specialized service cards (4) ──────────────────────────────────────── */
.sv-spec-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;

  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 560px)  { grid-template-columns: 1fr; }
}

.sv-spec-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: .65rem;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(37,99,235,.09);
    border-color: #bfdbfe;
  }

  h3 {
    font-size: .97rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  p {
    font-size: .86rem;
    color: #374151;
    line-height: 1.7;
    margin: 0;
    flex: 1;
  }
}

.sv-spec-icon {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  flex-shrink: 0;

  .sv-spec-card:hover & { background: #dbeafe; }
}

/* ─── CMS grid ───────────────────────────────────────────────────────────── */
.sv-cms-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;

  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 640px)  { grid-template-columns: 1fr; gap: 1rem; }
}

/* ─── Why Choose DGH cards ───────────────────────────────────────────────── */
.sv-why-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 900px)  { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 540px)  { grid-template-columns: 1fr; }
}

.sv-why-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.75rem 1.5rem;
  transition: border-color .15s, box-shadow .15s;

  &:hover {
    border-color: #bfdbfe;
    box-shadow: 0 4px 16px rgba(37,99,235,.07);
  }

  h3 {
    font-size: .95rem;
    font-weight: 700;
    color: #0f172a;
    margin: .75rem 0 .45rem;
  }

  p {
    font-size: .86rem;
    color: #475569;
    line-height: 1.7;
    margin: 0;
  }
}

.sv-why-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
}

/* ─── Development process ────────────────────────────────────────────────── */
.sv-process {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 21px; /* center of 44px circle */
    left: calc(100% / 12);
    right: calc(100% / 12);
    height: 1px;
    background: linear-gradient(to right, #bfdbfe 0%, #93c5fd 50%, #bfdbfe 100%);
    pointer-events: none;
    z-index: 0;

    @media (max-width: 900px) { display: none; }
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }

  @media (max-width: 540px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

.sv-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: .55rem;
  position: relative;
  z-index: 1;
}

.sv-step-num {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: .78rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: .03em;
  box-shadow: 0 4px 12px rgba(37,99,235,.28);
}

.sv-step-label {
  font-size: .88rem;
  font-weight: 700;
  color: #0f172a;
}

.sv-step-desc {
  font-size: .78rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* ─── Technology pills ───────────────────────────────────────────────────── */
.sv-tech-pills {
  display: flex;
  flex-wrap: wrap;
  gap: .55rem;
  justify-content: center;
}

.sv-tech-pill {
  font-size: .82rem;
  font-weight: 600;
  padding: .45rem 1rem;
  border-radius: 20px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  color: #374151;
  white-space: nowrap;
  transition: border-color .15s, background .15s, color .15s;

  &:hover {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
  }
}

/* ─── Industry cards ─────────────────────────────────────────────────────── */
.sv-ind-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 640px)  { grid-template-columns: repeat(2, 1fr); }
}

.sv-ind-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .6rem;
  padding: 1.25rem 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
  font-size: .83rem;
  font-weight: 600;
  color: #374151;
  transition: border-color .15s, box-shadow .15s;

  &:hover {
    border-color: #bfdbfe;
    box-shadow: 0 2px 10px rgba(37,99,235,.07);
    color: #1d4ed8;
  }
}

.sv-ind-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  flex-shrink: 0;
}

/* ─── Project examples ───────────────────────────────────────────────────── */
.sv-ex-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 700px) { grid-template-columns: 1fr; gap: 1rem; }
}

.sv-ex-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: .65rem;
  transition: border-color .15s, box-shadow .15s;

  &:hover {
    border-color: #bfdbfe;
    box-shadow: 0 4px 18px rgba(37,99,235,.08);
  }

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  p {
    font-size: .87rem;
    color: #475569;
    line-height: 1.7;
    margin: 0;
    flex: 1;
  }
}
`],
})
export class ServicesComponent implements OnInit {
  private san = inject(DomSanitizer);

  services = signal<Service[]>([]);
  content  = signal<SiteContentSection | null>(null);
  loading  = signal(true);

  // ─── Featured services (3 large cards) ──────────────────────────────────────
  readonly featuredServices = [
    {
      icon: 'globe',
      title: 'Web Application Development',
      description: 'Custom web applications built for performance, security, and scale. From internal tools to full SaaS platforms, we deliver software that handles real business workloads.',
      tags: ['Angular', 'React', 'Next.js', 'Node.js', 'TypeScript'],
    },
    {
      icon: 'smartphone',
      title: 'Mobile App Development',
      description: 'Cross-platform mobile applications that work consistently across iOS and Android. Built with modern frameworks and ready for app store deployment.',
      tags: ['React Native', 'Ionic', 'TypeScript', 'Mobile UI'],
    },
    {
      icon: 'cloud',
      title: 'Cloud Solutions',
      description: 'Cloud infrastructure setup, migration, and management. Scalable and cost-efficient architecture on AWS and other major cloud platforms — built to grow with your business.',
      tags: ['AWS', 'Docker', 'CI/CD', 'GitHub Actions', 'Nginx'],
    },
  ];

  // ─── Specialized services (4 smaller cards) ──────────────────────────────────
  readonly specializedServices = [
    {
      icon: 'link',
      title: 'API & Backend Development',
      description: 'Reliable backend systems and third-party integrations. We build clean, documented, and secure APIs that connect your services and power your data layer.',
      tags: ['Node.js', 'Express', 'NestJS', 'MongoDB', 'PostgreSQL'],
      link: null as string | null,
    },
    {
      icon: 'monitor',
      title: 'Admin Dashboards',
      description: 'Internal tools and management dashboards designed around your team\'s workflows. Real-time data, role-based access controls, and clean UI for operational efficiency.',
      tags: ['Angular', 'Charts', 'Role Management', 'Real-Time Data'],
      link: null as string | null,
    },
    {
      icon: 'cpu',
      title: 'AI-Ready Digital Products',
      description: 'Applications built with AI integration — from OpenAI and Gemini API connections to intelligent automation that reduces manual work and surfaces actionable insights.',
      tags: ['OpenAI', 'Gemini API', 'LangChain', 'AI Automation'],
      link: null as string | null,
    },
    {
      icon: 'book-open',
      title: 'Resources & Study Materials',
      description: 'Developer guides, structured study materials, and reference resources covering cloud certifications, full-stack development, and software engineering topics.',
      tags: ['Study Guides', 'PDF Downloads', 'MCQ Practice', 'Flashcards'],
      link: '/resources' as string | null,
    },
  ];

  // ─── Why Choose DGH ──────────────────────────────────────────────────────────
  readonly whyCards = [
    { icon: 'layers',   title: 'Modern Architecture',   body: 'We build on well-established, maintainable patterns — not fragile shortcuts — so your software scales without rewrites.' },
    { icon: 'trending', title: 'Scalable Systems',       body: 'Infrastructure and code designed to handle growth. From startup to enterprise, your system keeps up with demand.' },
    { icon: 'shield',   title: 'Secure Development',     body: 'Security is built in from the start — authentication, authorization, input validation, and secure deployment pipelines.' },
    { icon: 'zap',      title: 'Performance Focused',    body: 'Fast load times, efficient queries, and optimized assets. Performance is treated as a feature, not an afterthought.' },
    { icon: 'users',    title: 'User-Centered Design',   body: 'Clean, intuitive interfaces that reduce friction for your users and align with your brand from day one.' },
    { icon: 'tool',     title: 'Long-Term Support',      body: 'We\'re not a one-time vendor. We support what we build — patches, upgrades, new features, and ongoing consultation.' },
  ];

  // ─── Development process ─────────────────────────────────────────────────────
  readonly processSteps = [
    { num: '01', label: 'Discover',        desc: 'We learn your goals, users, and constraints through structured discovery sessions.' },
    { num: '02', label: 'Plan',            desc: 'Architecture, stack, timeline, and milestones are documented and agreed upon.' },
    { num: '03', label: 'Design',          desc: 'UI wireframes and system design are reviewed before any code is written.' },
    { num: '04', label: 'Build',           desc: 'Iterative development with regular demos and check-ins to ensure alignment.' },
    { num: '05', label: 'Test',            desc: 'Rigorous QA, performance testing, and security checks before launch.' },
    { num: '06', label: 'Deploy & Support',desc: 'Production launch with CI/CD pipelines and ongoing maintenance support.' },
  ];

  // ─── Technologies ─────────────────────────────────────────────────────────────
  readonly techs = [
    'React', 'Angular', 'Next.js', 'Node.js', 'NestJS', 'Python',
    'TypeScript', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes',
    'GitHub Actions', 'OpenAI API', 'LangChain', 'Stripe', 'AI/ML',
  ];

  // ─── Industries ───────────────────────────────────────────────────────────────
  readonly industries = [
    { icon: 'briefcase',    label: 'Small Businesses' },
    { icon: 'zap',          label: 'Startups' },
    { icon: 'truck',        label: 'Transportation' },
    { icon: 'heart',        label: 'Healthcare' },
    { icon: 'book-open',    label: 'Education' },
    { icon: 'users',        label: 'Professional Services' },
    { icon: 'shopping-bag', label: 'E-commerce' },
    { icon: 'layers',       label: 'SaaS Platforms' },
  ];

  // ─── Project examples ─────────────────────────────────────────────────────────
  readonly projectExamples = [
    {
      title: 'Transportation Booking Platform',
      desc:  'A full-featured ride and charter booking system with real-time tracking, driver management, and integrated payment processing.',
      tags:  ['Web App', 'Node.js', 'React', 'Stripe'],
    },
    {
      title: 'Photography Portfolio & Booking Site',
      desc:  'A portfolio and appointment booking platform for a photography business, with client galleries and session scheduling.',
      tags:  ['Web App', 'Angular', 'MongoDB', 'Payment Integration'],
    },
    {
      title: 'Learning Resources Marketplace',
      desc:  'A structured learning hub with paid and free resources, MCQ practice, flashcards, and user progress tracking.',
      tags:  ['SaaS', 'Angular', 'Stripe', 'MongoDB'],
    },
    {
      title: 'Admin Dashboard System',
      desc:  'A multi-role internal management dashboard with real-time analytics, user management, and full CMS capabilities.',
      tags:  ['Admin Panel', 'Angular', 'Real-Time Data', 'Role-Based Access'],
    },
  ];

  // ─── Icon helper ─────────────────────────────────────────────────────────────
  icon(name: string, size = 24): SafeHtml {
    const paths = P[name] ?? '';
    return this.san.bypassSecurityTrustHtml(
      `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
    );
  }

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
