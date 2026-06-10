import { Component, Input } from '@angular/core';
import { Service } from '../../../core/models';

@Component({
  selector: 'app-service-card',
  standalone: true,
  template: `
    <article class="service-card">
      @if (service.imageUrl) {
        <div class="card-thumb">
          <img [src]="service.imageUrl" [alt]="service.title" loading="lazy" />
        </div>
      }
      <div class="card-body">
        @if (!service.imageUrl) {
          <div class="icon" aria-hidden="true">{{ service.icon || '⚙️' }}</div>
        }
        <h3>{{ service.title }}</h3>
        <p>{{ service.shortDescription }}</p>
        @if (service.fullDescription) {
          <p class="full">{{ service.fullDescription }}</p>
        }
      </div>
    </article>
  `,
  styles: [`
    .service-card {
      background:#fff; border-radius:12px; box-shadow:0 2px 16px rgba(0,0,0,.06);
      overflow:hidden; transition:box-shadow .2s,transform .2s; height:100%;
      display:flex; flex-direction:column;
    }
    .service-card:hover { box-shadow:0 8px 32px rgba(0,0,0,.1); transform:translateY(-4px); }
    .card-thumb { height:180px; overflow:hidden; flex-shrink:0; }
    .card-thumb img { width:100%; height:100%; object-fit:cover; transition:transform .4s ease; }
    .card-thumb:hover img { transform:scale(1.05); }
    .card-body { padding:1.5rem 2rem 2rem; display:flex; flex-direction:column; gap:.75rem; flex:1; }
    .icon { font-size:2.5rem; line-height:1; }
    h3 { font-size:1.15rem; font-weight:700; color:var(--clr-dark); margin:0; }
    p { color:var(--clr-text); font-size:.95rem; line-height:1.6; margin:0; }
    .full { color:var(--clr-text-muted); font-size:.875rem; line-height:1.5; margin:0; }
  `],
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: Service;
}
