import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  sidebarOpen = signal(true);
  mobileOpen  = signal(false);

  navLinks = [
    { path: '/admin/dashboard',    label: 'Dashboard',    icon: '⊞' },
    { path: '/admin/projects',     label: 'Projects',     icon: '◧' },
    { path: '/admin/services',     label: 'Services',     icon: '◉' },
    { path: '/admin/messages',     label: 'Messages',     icon: '◎' },
    { path: '/admin/site-content', label: 'Site Content', icon: '◫' },
    { path: '/admin/settings',     label: 'Settings',     icon: '◌' },
  ];

  constructor(readonly auth: AuthService, private router: Router) {}

  toggleSidebar(): void { this.sidebarOpen.update((v) => !v); }
  openMobile():   void { this.mobileOpen.set(true); }
  closeMobile():  void { this.mobileOpen.set(false); }

  logout(): void { this.auth.logout(); }
}
