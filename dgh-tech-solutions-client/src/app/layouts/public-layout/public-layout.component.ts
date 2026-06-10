import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <app-navbar />
    <main id="main-content">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`main { min-height: 100vh; padding-top: 70px; }`],
})
export class PublicLayoutComponent {}
