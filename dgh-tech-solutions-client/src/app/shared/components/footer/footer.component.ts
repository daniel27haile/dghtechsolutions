import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { SiteSettings, SiteContentSection } from '../../../core/models';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  settings      = signal<SiteSettings | null>(null);
  footerContent = signal<SiteContentSection | null>(null);
  year = new Date().getFullYear();

  private destroyRef = inject(DestroyRef);

  constructor(
    private settingsService: SettingsService,
    private contentSvc: SiteContentService,
  ) {}

  ngOnInit(): void {
    // Trigger the initial HTTP fetch (no-op if already cached)
    this.settingsService.get().subscribe();

    // Stay subscribed — logo and other settings update instantly when admin saves
    this.settingsService.latest$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => this.settings.set(s));

    this.contentSvc.getByKey('footer.main').subscribe({
      next: (r) => this.footerContent.set(r.data),
      error: () => {},
    });
  }
}
