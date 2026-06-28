import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const ADMIN_NAV = [
  { path: '/admin/dashboard',    label: 'Dashboard',    icon: '⊞' },
  { path: '/admin/projects',     label: 'Projects',     icon: '◧' },
  { path: '/admin/services',     label: 'Services',     icon: '◉' },
  { path: '/admin/resources',    label: 'Resources',    icon: '◈' },
  { path: '/admin/progress',     label: 'Progress',     icon: '⊙' },
  { path: '/admin/coupons',      label: 'Coupons',      icon: '◇' },
  { path: '/admin/publishers',   label: 'Publishers',   icon: '◐' },
  { path: '/admin/payouts',      label: 'Payouts',      icon: '◒' },
  { path: '/admin/messages',     label: 'Messages',     icon: '◎' },
  { path: '/admin/site-content', label: 'Site Content', icon: '◫' },
  { path: '/admin/settings',     label: 'Settings',     icon: '◌' },
];

const PUBLISHER_NAV = [
  { path: '/admin/publisher-dashboard', label: 'Dashboard',    icon: '⊞' },
  { path: '/admin/resources',           label: 'My Resources', icon: '◈' },
  { path: '/admin/coupons',             label: 'Coupons',      icon: '◇' },
  { path: '/admin/payouts',             label: 'Payouts',      icon: '◒' },
];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  sidebarOpen  = signal(true);
  mobileOpen   = signal(false);
  dropdownOpen = signal(false);

  // ── Profile modal ──────────────────────────────────────────────────────────
  profileOpen   = signal(false);
  profileName   = signal('');
  profileSaving = signal(false);
  profileError  = signal('');

  // ── Password modal ─────────────────────────────────────────────────────────
  pwOpen    = signal(false);
  pwCurrent = signal('');
  pwNew     = signal('');
  pwConfirm = signal('');
  pwSaving  = signal(false);
  pwError   = signal('');
  pwSuccess = signal(false);

  isPublisher = computed(() => this.auth.currentAdmin()?.role === 'publisher');
  brandLabel  = computed(() => this.isPublisher() ? 'Publisher' : 'Admin');
  navLinks    = computed(() => this.isPublisher() ? PUBLISHER_NAV : ADMIN_NAV);
  displayName = computed(() =>
    this.auth.currentAdmin()?.fullName || this.auth.currentAdmin()?.email || this.brandLabel()
  );
  initial = computed(() => this.auth.currentAdmin()?.fullName?.[0]?.toUpperCase() || 'A');

  constructor(readonly auth: AuthService, private router: Router) {}

  toggleSidebar(): void { this.sidebarOpen.update((v) => !v); }
  openMobile():   void { this.mobileOpen.set(true); }
  closeMobile():  void { this.mobileOpen.set(false); }
  logout():       void { this.auth.logout(); }

  toggleDropdown(): void { this.dropdownOpen.update((v) => !v); }
  closeDropdown():  void { this.dropdownOpen.set(false); }

  // ── Profile ────────────────────────────────────────────────────────────────
  openProfile(): void {
    this.dropdownOpen.set(false);
    this.profileName.set(this.auth.currentAdmin()?.fullName ?? '');
    this.profileError.set('');
    this.profileOpen.set(true);
  }

  closeProfile(): void {
    this.profileOpen.set(false);
    this.profileError.set('');
  }

  saveProfile(): void {
    const name = this.profileName().trim();
    if (!name) { this.profileError.set('Display name is required.'); return; }
    this.profileSaving.set(true);
    this.profileError.set('');
    this.auth.updateProfile(name).subscribe({
      next:  () => { this.profileSaving.set(false); this.closeProfile(); },
      error: (err) => {
        this.profileSaving.set(false);
        this.profileError.set(err?.error?.message ?? 'Failed to save. Please try again.');
      },
    });
  }

  // ── Password ───────────────────────────────────────────────────────────────
  openPw(): void {
    this.dropdownOpen.set(false);
    this.pwCurrent.set('');
    this.pwNew.set('');
    this.pwConfirm.set('');
    this.pwError.set('');
    this.pwSuccess.set(false);
    this.pwOpen.set(true);
  }

  closePw(): void {
    this.pwOpen.set(false);
    this.pwError.set('');
    this.pwSuccess.set(false);
  }

  savePw(): void {
    this.pwError.set('');
    const current = this.pwCurrent().trim();
    const next    = this.pwNew().trim();
    const confirm = this.pwConfirm().trim();

    if (!current)         { this.pwError.set('Current password is required.'); return; }
    if (next.length < 8)  { this.pwError.set('New password must be at least 8 characters.'); return; }
    if (next !== confirm)  { this.pwError.set('Passwords do not match.'); return; }

    this.pwSaving.set(true);
    this.auth.changePassword(current, next).subscribe({
      next:  () => { this.pwSaving.set(false); this.pwSuccess.set(true); },
      error: (err) => {
        this.pwSaving.set(false);
        this.pwError.set(err?.error?.message ?? 'Failed to change password. Check current password.');
      },
    });
  }
}
