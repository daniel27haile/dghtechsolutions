import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrap">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .spinner-wrap { display:flex; justify-content:center; align-items:center; padding:3rem; }
    .spinner {
      width:40px; height:40px;
      border:3px solid rgba(var(--clr-primary-rgb),0.2);
      border-top-color:var(--clr-primary);
      border-radius:50%;
      animation:spin .7s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class LoadingSpinnerComponent {}
