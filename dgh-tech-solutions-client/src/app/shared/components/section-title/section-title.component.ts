import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-title',
  standalone: true,
  template: `
    <div class="section-title" [class.center]="center" [class.is-dark]="dark">
      @if (subtitle) { <p class="subtitle">{{ subtitle }}</p> }
      <h2 [attr.id]="headingId || null">{{ title }}</h2>
      @if (description) { <p class="description">{{ description }}</p> }
    </div>
  `,
  styles: [`
    .section-title { margin-bottom:3rem; }
    .section-title.center { text-align:center; }
    .subtitle {
      font-size:.8rem; font-weight:700; letter-spacing:.12em;
      text-transform:uppercase; color:var(--clr-primary); margin-bottom:.5rem; display:block;
    }
    h2 { font-size:clamp(1.7rem,3vw,2.5rem); font-weight:700; letter-spacing:-.02em; line-height:1.15; color:var(--text-main, #111827); margin:0 0 .75rem; }
    .description { color:var(--text-body, #374151); max-width:56ch; line-height:1.75; font-size:.97rem; }
    .center .description { margin:0 auto; }
    /* Dark background overrides (footer-style sections) */
    .is-dark h2 { color:var(--text-light, #f9fafb); }
    .is-dark .description { color:var(--color-text-muted, #d1d5db); }
  `],
})
export class SectionTitleComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() description = '';
  @Input() center = false;
  @Input() dark = false;
  /** Optional id placed on the h2 for aria-labelledby. */
  @Input() headingId = '';
}
