import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SiteContentService } from '../../../core/services/site-content.service';
import { SiteContentSection } from '../../../core/models';

interface BlockConfig {
  key: string;
  label: string;
  page: string;
  showBody?: boolean;
  showImageUrl?: boolean;
  showButtons?: boolean;
  showHighlights?: boolean;
  showContactInfo?: boolean;
}

const BLOCKS: BlockConfig[] = [
  { key: 'home.hero',            label: 'Hero Banner',       page: 'Home',     showButtons: true, showImageUrl: true },
  { key: 'home.feature',         label: 'Feature Section',   page: 'Home',     showBody: true,   showImageUrl: true },
  { key: 'home.aboutPreview',    label: 'About Preview',     page: 'Home',     showBody: true,   showHighlights: true, showImageUrl: true },
  { key: 'home.servicesPreview', label: 'Services Preview',  page: 'Home' },
  { key: 'home.projectsPreview', label: 'Projects Preview',  page: 'Home' },
  { key: 'home.contactCta',      label: 'Contact CTA',       page: 'Home',     showButtons: true },
  { key: 'about.main',           label: 'About Page',        page: 'About',    showBody: true, showHighlights: true, showImageUrl: true },
  { key: 'services.main',        label: 'Services Page',     page: 'Services', showBody: true },
  { key: 'contact.main',         label: 'Contact Page',      page: 'Contact',  showContactInfo: true },
  { key: 'footer.main',          label: 'Footer',            page: 'Footer',   showBody: true },
];

const PAGES = ['Home', 'About', 'Services', 'Contact', 'Footer'];

@Component({
  selector: 'app-site-content',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './site-content.component.html',
  styleUrls: ['./site-content.component.scss'],
})
export class SiteContentComponent implements OnInit, OnDestroy {
  readonly pages  = PAGES;
  readonly blocks = BLOCKS;

  activeKey    = signal('home.hero');
  loading      = signal(false);
  saving       = signal(false);
  saved        = signal(false);
  errorMsg     = signal('');
  imagePreview = signal('');

  form!: FormGroup;

  private imgSub?: Subscription;

  get activeBlock(): BlockConfig {
    return BLOCKS.find((b) => b.key === this.activeKey()) ?? BLOCKS[0];
  }

  blocksForPage(page: string): BlockConfig[] {
    return BLOCKS.filter((b) => b.page === page);
  }

  constructor(private fb: FormBuilder, private contentSvc: SiteContentService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title:               [''],
      subtitle:            [''],
      body:                [''],
      imageUrl:            [''],
      primaryButtonText:   [''],
      primaryButtonUrl:    [''],
      secondaryButtonText: [''],
      secondaryButtonUrl:  [''],
      highlights:          [''],   // comma-separated → metadata.highlights[]
      email:               [''],   // → metadata.email
      phone:               [''],   // → metadata.phone
      responseTime:        [''],   // → metadata.responseTime
      availability:        [''],   // → metadata.availability
    });
    this.imgSub = this.form.get('imageUrl')!.valueChanges.subscribe((url: string) => {
      this.imagePreview.set((url ?? '').trim());
    });
    this.loadContent(this.activeKey());
  }

  ngOnDestroy(): void { this.imgSub?.unsubscribe(); }

  selectBlock(key: string): void {
    if (key === this.activeKey()) return;
    this.activeKey.set(key);
    this.saved.set(false);
    this.errorMsg.set('');
    this.loadContent(key);
  }

  private loadContent(key: string): void {
    this.loading.set(true);
    this.imagePreview.set('');
    this.form.reset();
    this.contentSvc.getByKey(key).subscribe({
      next: (r) => { this.patchForm(r.data); this.loading.set(false); },
      error: () => this.loading.set(false), // block not seeded yet — blank form is fine
    });
  }

  private patchForm(d: SiteContentSection): void {
    this.imagePreview.set((d.imageUrl ?? '').trim());
    const meta = (d.metadata ?? {}) as Record<string, unknown>;
    const highlights = Array.isArray(meta['highlights'])
      ? (meta['highlights'] as string[]).join(', ')
      : '';
    this.form.patchValue({
      title:               d.title               ?? '',
      subtitle:            d.subtitle            ?? '',
      body:                d.body                ?? '',
      imageUrl:            d.imageUrl            ?? '',
      primaryButtonText:   d.primaryButtonText   ?? '',
      primaryButtonUrl:    d.primaryButtonUrl    ?? '',
      secondaryButtonText: d.secondaryButtonText ?? '',
      secondaryButtonUrl:  d.secondaryButtonUrl  ?? '',
      highlights,
      email:        (meta['email']        as string) ?? '',
      phone:        (meta['phone']        as string) ?? '',
      responseTime: (meta['responseTime'] as string) ?? '',
      availability: (meta['availability'] as string) ?? '',
    });
  }

  save(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.errorMsg.set('');
    const v = this.form.value;
    const block = this.activeBlock;

    const payload: Record<string, unknown> = {
      title:    v.title    ?? '',
      subtitle: v.subtitle ?? '',
    };

    if (block.showBody)     payload['body']     = v.body ?? '';
    if (block.showImageUrl) payload['imageUrl'] = v.imageUrl ?? '';

    if (block.showButtons) {
      payload['primaryButtonText']   = v.primaryButtonText   ?? '';
      payload['primaryButtonUrl']    = v.primaryButtonUrl    ?? '';
      payload['secondaryButtonText'] = v.secondaryButtonText ?? '';
      payload['secondaryButtonUrl']  = v.secondaryButtonUrl  ?? '';
    }

    const metadata: Record<string, unknown> = {};

    if (block.showHighlights) {
      metadata['highlights'] = v.highlights
        ? (v.highlights as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
    }

    if (block.showContactInfo) {
      metadata['email']        = v.email        ?? '';
      metadata['phone']        = v.phone        ?? '';
      metadata['responseTime'] = v.responseTime ?? '';
      metadata['availability'] = v.availability ?? '';
    }

    if (Object.keys(metadata).length) payload['metadata'] = metadata;

    this.contentSvc.upsert(this.activeKey(), payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (e: { error?: { message?: string } }) => {
        this.errorMsg.set(e?.error?.message || 'Save failed. Please try again.');
        this.saving.set(false);
      },
    });
  }
}
