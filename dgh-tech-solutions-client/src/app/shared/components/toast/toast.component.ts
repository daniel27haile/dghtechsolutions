import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (t of toastSvc.toasts(); track t.id) {
        <div class="toast toast--{{ t.type }}" role="alert">
          <span class="toast__msg">{{ t.message }}</span>
          <button class="toast__close" type="button" (click)="toastSvc.remove(t.id)" aria-label="Dismiss notification">&#10005;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column-reverse;
      gap: .5rem;
      pointer-events: none;
      @media (max-width: 480px) { right: 1rem; left: 1rem; bottom: 1rem; }
    }
    .toast {
      display: flex;
      align-items: center;
      gap: .75rem;
      min-width: 200px;
      max-width: 340px;
      padding: .7rem 1rem;
      border-radius: 10px;
      font-size: .875rem;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,.2);
      pointer-events: all;
      animation: toast-in .2s ease;
      @media (max-width: 480px) { max-width: 100%; }
      &:is(.toast--success) { background: #059669; color: #fff; }
      &:is(.toast--error)   { background: #dc2626; color: #fff; }
      &:is(.toast--info)    { background: #2563eb; color: #fff; }
    }
    .toast__msg  { flex: 1; }
    .toast__close {
      flex-shrink: 0;
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: .85rem;
      padding: .1rem .25rem;
      opacity: .75;
      border-radius: 4px;
      &:hover { opacity: 1; }
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class ToastComponent {
  toastSvc = inject(ToastService);
}
