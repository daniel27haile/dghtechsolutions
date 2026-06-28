import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { CartDrawerComponent } from '../../shared/components/cart-drawer/cart-drawer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastComponent, CartDrawerComponent],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <app-navbar />
    <main id="main-content">
      <router-outlet />
    </main>
    <app-footer />
    <app-toast />
    <app-cart-drawer />
  `,
  styles: [`
    main { min-height: 100vh; padding-top: 130px; }
    @media (max-width: 768px) { main { padding-top: 130px; } }
  `],
})
export class PublicLayoutComponent {}
