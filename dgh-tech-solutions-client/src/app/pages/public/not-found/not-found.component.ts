import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="nf">
      <div class="code">404</div>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <a routerLink="/" class="btn btn-primary">Back to Home</a>
    </div>
  `,
  styles: [`
    .nf { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2rem; }
    .code { font-size:8rem; font-weight:900; color:var(--clr-primary); line-height:1; margin-bottom:1rem; opacity:.2; }
    h1 { font-size:2rem; font-weight:700; color:var(--clr-dark); margin:0 0 1rem; }
    p { color:var(--clr-text); margin-bottom:2rem; }
  `],
})
export class NotFoundComponent {}
