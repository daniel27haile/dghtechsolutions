import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, NavigationCancel, NavigationError, RouterOutlet } from '@angular/router';
import { AnalyticsService } from './core/services/analytics.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (initializing) {
      <div class="app-init-loader" aria-hidden="true">
        <div class="init-spinner"></div>
      </div>
    }
    <router-outlet />
  `,
  styles: [`
    .app-init-loader {
      position: fixed; inset: 0;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    }
    .init-spinner {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: app-spin .65s linear infinite;
    }
    @keyframes app-spin { to { transform: rotate(360deg); } }
  `],
})
export class AppComponent implements OnInit {
  initializing = true;

  constructor(private analytics: AnalyticsService, private router: Router) {}

  ngOnInit(): void {
    this.analytics.init();

    // Hide the loader after the first navigation completes (covers refresh + deep links)
    const sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.initializing = false;
        sub.unsubscribe();
      }
    });
  }
}
