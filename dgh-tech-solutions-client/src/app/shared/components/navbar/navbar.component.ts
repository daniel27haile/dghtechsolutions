import {
  Component, DestroyRef, HostListener, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService }  from '../../../core/services/settings.service';
import { UserAuthService } from '../../../core/services/user-auth.service';
import { CartService }     from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  scrolled      = signal(false);
  menuOpen      = signal(false);
  logoText      = signal('DGH Tech');
  headerLogoUrl = signal('');

  private destroyRef = inject(DestroyRef);

  cartSvc = inject(CartService);

  constructor(
    private settingsService: SettingsService,
    public  userAuth:        UserAuthService,
  ) {}

  ngOnInit(): void {
    // Trigger the initial HTTP fetch (no-op if already cached)
    this.settingsService.get().subscribe();

    // Stay subscribed to the reactive stream — updates instantly when admin saves
    this.settingsService.latest$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => {
        this.logoText.set(s.logoText || 'DGH Tech');
        this.headerLogoUrl.set(s.headerLogoUrl || '');
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 60);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.userAuth.logout();
    this.closeMenu();
  }
}
