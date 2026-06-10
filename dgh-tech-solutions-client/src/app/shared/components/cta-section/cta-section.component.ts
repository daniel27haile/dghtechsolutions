import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cta-section" [attr.aria-label]="heading">
      <div class="container">
        <h2>{{ heading }}</h2>
        <p>{{ sub }}</p>
        <div class="actions">
          <a [routerLink]="primaryLink" class="btn btn--primary">{{ primaryLabel }}</a>
          @if (secondaryLabel) {
            <a [routerLink]="secondaryLink" class="btn-outline-light">{{ secondaryLabel }}</a>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cta-section {
      background: #f3f4f6;
      border-top: 1px solid #d1d5db;
      color: #111827;
      text-align: center;
      padding: 5rem 1.5rem;
    }
    .container { max-width: 700px; margin: 0 auto; }
    h2 { font-size: clamp(1.8rem,3vw,2.6rem); font-weight: 700; letter-spacing: -.02em; margin: 0 0 1rem; color: var(--text-main, #111827); }
    p  { font-size: 1.1rem; margin: 0 0 2rem; color: var(--text-body, #374151); }
    .actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn-outline-light {
      border: 2px solid var(--primary, #2563eb);
      color: var(--primary, #2563eb);
      background: transparent;
      padding: .75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600;
      transition: all .2s;
    }
    .btn-outline-light:hover {
      background: var(--primary, #2563eb);
      color: #fff;
      transform: translateY(-2px);
    }
  `],
})
export class CtaSectionComponent {
  @Input() heading = 'Ready to Build Something Amazing?';
  @Input() sub = 'Let\'s turn your vision into a world-class digital product.';
  @Input() primaryLabel = 'Get In Touch';
  @Input() primaryLink = '/contact';
  @Input() secondaryLabel = 'View Our Work';
  @Input() secondaryLink = '/projects';
}
