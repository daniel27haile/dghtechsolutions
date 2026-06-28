import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>Site Settings</h1>
        @if (saved()) { <span class="saved-msg">&#10003; Saved!</span> }
      </div>

      <div class="form-panel">
        @if (loading()) {
          <p style="color:var(--clr-text-sub)">Loading...</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="section-header">Brand</div>
            <div class="row-2">
              <div class="form-group">
                <label>Business Name</label>
                <input formControlName="businessName" class="form-control" />
              </div>
              <div class="form-group">
                <label>Logo Text <span class="hint">(shown when no logo image is set)</span></label>
                <input formControlName="logoText" class="form-control" />
              </div>
            </div>
            <div class="row-2">
              <div class="form-group">
                <label>Founder Name</label>
                <input formControlName="founderName" class="form-control" />
              </div>
              <div class="form-group">
                <label>Domain</label>
                <input formControlName="domain" class="form-control" placeholder="https://dghtechsolutions.com" />
              </div>
            </div>

            <div class="section-header">Logo Images</div>
            <div class="logo-fields">
              <div class="form-group">
                <label for="headerLogoUrl">Header Logo URL</label>
                <input id="headerLogoUrl" formControlName="headerLogoUrl" class="form-control"
                  [class.input-error]="isLogoUrlInvalid('headerLogoUrl')"
                  placeholder="https://example.com/logo.png" />
                @if (isLogoUrlInvalid('headerLogoUrl')) {
                  <span class="field-error">Must be a valid image URL (.png, .jpg, .jpeg, .gif, .svg, .webp)</span>
                }
                @if (headerLogoPreview()) {
                  <div class="logo-preview">
                    <span class="preview-label">Preview</span>
                    <div class="preview-box preview-box--light">
                      <img [src]="headerLogoPreview()" alt="Header logo preview"
                           (error)="onImgError('headerLogoUrl')" />
                    </div>
                  </div>
                }
              </div>

              <div class="form-group">
                <label for="footerLogoUrl">Footer Logo URL</label>
                <input id="footerLogoUrl" formControlName="footerLogoUrl" class="form-control"
                  [class.input-error]="isLogoUrlInvalid('footerLogoUrl')"
                  placeholder="https://example.com/logo-white.png" />
                @if (isLogoUrlInvalid('footerLogoUrl')) {
                  <span class="field-error">Must be a valid image URL (.png, .jpg, .jpeg, .gif, .svg, .webp)</span>
                }
                @if (footerLogoPreview()) {
                  <div class="logo-preview">
                    <span class="preview-label">Preview</span>
                    <div class="preview-box preview-box--dark">
                      <img [src]="footerLogoPreview()" alt="Footer logo preview"
                           (error)="onImgError('footerLogoUrl')" />
                    </div>
                  </div>
                }
              </div>
            </div>
            <p class="logo-tip">Leave blank to use the Logo Text fallback. Use a white/light version of your logo for the footer (dark background). Recommended max height: 40px.</p>

            <div class="section-header">Contact</div>
            <div class="row-2">
              <div class="form-group">
                <label>Email</label>
                <input formControlName="email" class="form-control" type="email" />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input formControlName="phone" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label>Location</label>
              <input formControlName="location" class="form-control" placeholder="United States (Remote)" />
            </div>

            <div class="section-header">Social Links</div>
            <div class="row-2">
              <div class="form-group">
                <label>LinkedIn</label>
                <input formControlName="linkedin" class="form-control" placeholder="https://linkedin.com/in/..." />
              </div>
              <div class="form-group">
                <label>GitHub</label>
                <input formControlName="github" class="form-control" placeholder="https://github.com/..." />
              </div>
            </div>
            <div class="row-2">
              <div class="form-group">
                <label>Twitter / X</label>
                <input formControlName="twitter" class="form-control" placeholder="https://x.com/..." />
              </div>
              <div class="form-group">
                <label>Instagram</label>
                <input formControlName="instagram" class="form-control" placeholder="https://instagram.com/..." />
              </div>
            </div>
            <div class="row-2">
              <div class="form-group">
                <label>Facebook</label>
                <input formControlName="facebook" class="form-control" placeholder="https://facebook.com/..." />
              </div>
              <div class="form-group">
                <label>YouTube</label>
                <input formControlName="youtube" class="form-control" placeholder="https://youtube.com/..." />
              </div>
            </div>

            <div class="section-header">SEO</div>
            <div class="form-group">
              <label>Meta Description</label>
              <textarea formControlName="metaDescription" class="form-control" rows="3" maxlength="160"></textarea>
            </div>

            <div class="section-header">Footer</div>
            <div class="form-group">
              <label>Footer Text</label>
              <input formControlName="footerText" class="form-control" />
            </div>

            <div class="section-header">Publisher &amp; Payout Settings</div>
            <div class="row-2">
              <div class="form-group">
                <label>Platform Fee % <span class="hint">(taken from each sale before publisher payout)</span></label>
                <input formControlName="platformFeePercent" class="form-control" type="number" min="0" max="100" />
              </div>
              <div class="form-group">
                <label>Minimum Payout ($)</label>
                <input formControlName="payoutMinimumAmount" class="form-control" type="number" min="0" />
              </div>
            </div>
            <div class="form-group" style="max-width:260px">
              <label>Payout Waiting Period (days) <span class="hint">(between approved payouts)</span></label>
              <input formControlName="payoutWaitingDays" class="form-control" type="number" min="0" />
            </div>

            @if (errorMsg()) { <div class="alert-error">{{ errorMsg() }}</div> }

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save Settings' }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-page { max-width:900px; }
    .page-header { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; }
    h1 { font-size:1.5rem; font-weight:700; color:var(--clr-dark); margin:0; }
    .saved-msg { font-size:.875rem; font-weight:600; color:#16a34a; background:#dcfce7; padding:.3rem .85rem; border-radius:999px; }
    .form-panel { background:#fff; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,.05); padding:2rem; }
    .section-header { font-size:.8rem; font-weight:700; color:var(--clr-text-muted); text-transform:uppercase; letter-spacing:.08em; margin:1.75rem 0 1rem; padding-bottom:.5rem; border-bottom:1px solid var(--clr-border); }
    .section-header:first-child { margin-top:0; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
    @media(max-width:600px) { .row-2 { grid-template-columns:1fr; } }
    .form-group { display:flex; flex-direction:column; gap:.4rem; margin-bottom:1.25rem; }
    label { font-size:.875rem; font-weight:600; color:var(--clr-dark); }
    .hint { font-size:.78rem; font-weight:400; color:var(--clr-text-muted); }
    .logo-fields { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
    @media(max-width:640px) { .logo-fields { grid-template-columns:1fr; } }
    .input-error { border-color:var(--clr-danger) !important; }
    .field-error { font-size:.78rem; color:var(--clr-danger); }
    .logo-preview { margin-top:.6rem; }
    .preview-label { font-size:.72rem; font-weight:600; color:var(--clr-text-muted); text-transform:uppercase; letter-spacing:.06em; display:block; margin-bottom:.35rem; }
    .preview-box { display:inline-flex; align-items:center; justify-content:center; padding:.75rem 1.25rem; border-radius:8px; border:1px solid var(--clr-border); min-width:120px; min-height:56px; }
    .preview-box--light { background:#f9fafb; }
    .preview-box--dark  { background:#0a0a0a; }
    .preview-box img { max-height:40px; max-width:200px; object-fit:contain; display:block; }
    .logo-tip { font-size:.8rem; color:var(--clr-text-muted); margin-top:.25rem; margin-bottom:0; line-height:1.6; }
    .alert-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:.75rem 1rem; border-radius:8px; font-size:.875rem; margin-bottom:1rem; }
    .form-actions { margin-top:1.5rem; }
  `],
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading  = signal(true);
  saving   = signal(false);
  saved    = signal(false);
  errorMsg = signal('');

  headerLogoPreview = signal('');
  footerLogoPreview = signal('');

  private brokenLogos = new Set<string>();
  private sub = new Subscription();

  private static readonly IMG_EXT = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i;

  constructor(private fb: FormBuilder, private settingsSvc: SettingsService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      businessName:    [''],
      logoText:        [''],
      headerLogoUrl:   [''],
      footerLogoUrl:   [''],
      founderName:     [''],
      domain:          [''],
      email:           [''],
      phone:           [''],
      location:        [''],
      linkedin:        [''],
      github:          [''],
      twitter:         [''],
      instagram:       [''],
      facebook:        [''],
      youtube:         [''],
      metaDescription:       [''],
      footerText:            [''],
      platformFeePercent:    [20],
      payoutMinimumAmount:   [20],
      payoutWaitingDays:     [30],
    });

    // Live preview: update signals whenever the URL fields change
    this.sub.add(this.form.get('headerLogoUrl')!.valueChanges.subscribe(url => {
      this.brokenLogos.delete('headerLogoUrl');
      this.updatePreview('headerLogoUrl', url);
    }));
    this.sub.add(this.form.get('footerLogoUrl')!.valueChanges.subscribe(url => {
      this.brokenLogos.delete('footerLogoUrl');
      this.updatePreview('footerLogoUrl', url);
    }));

    this.settingsSvc.get().subscribe({
      next: (r) => {
        const d = r.data;
        if (d) {
          this.form.patchValue({
            businessName:    d.businessName    ?? '',
            logoText:        d.logoText        ?? '',
            headerLogoUrl:   d.headerLogoUrl   ?? '',
            footerLogoUrl:   d.footerLogoUrl   ?? '',
            founderName:     d.founderName     ?? '',
            domain:          d.domain          ?? '',
            email:           d.email           ?? '',
            phone:           d.phone           ?? '',
            location:        d.location        ?? '',
            linkedin:        d.socialLinks?.linkedin  ?? '',
            github:          d.socialLinks?.github    ?? '',
            twitter:         d.socialLinks?.twitter   ?? '',
            instagram:       d.socialLinks?.instagram ?? '',
            facebook:        d.socialLinks?.facebook  ?? '',
            youtube:         d.socialLinks?.youtube   ?? '',
            metaDescription:       d.metaDescription ?? '',
            footerText:            d.footerText      ?? '',
            platformFeePercent:    (d as any).platformFeePercent   ?? 20,
            payoutMinimumAmount:   (d as any).payoutMinimumAmount  ?? 20,
            payoutWaitingDays:     (d as any).payoutWaitingDays    ?? 30,
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private updatePreview(field: 'headerLogoUrl' | 'footerLogoUrl', url: string): void {
    const clean = (url ?? '').trim();
    const valid = clean && AdminSettingsComponent.IMG_EXT.test(clean) && !this.brokenLogos.has(field);
    if (field === 'headerLogoUrl') this.headerLogoPreview.set(valid ? clean : '');
    else                           this.footerLogoPreview.set(valid ? clean : '');
  }

  isLogoUrlInvalid(field: 'headerLogoUrl' | 'footerLogoUrl'): boolean {
    const url = this.form?.get(field)?.value?.trim();
    return url && !AdminSettingsComponent.IMG_EXT.test(url);
  }

  onImgError(field: 'headerLogoUrl' | 'footerLogoUrl'): void {
    this.brokenLogos.add(field);
    if (field === 'headerLogoUrl') this.headerLogoPreview.set('');
    else                           this.footerLogoPreview.set('');
  }

  save(): void {
    if (this.isLogoUrlInvalid('headerLogoUrl') || this.isLogoUrlInvalid('footerLogoUrl')) {
      this.errorMsg.set('Fix the invalid logo URL(s) before saving.');
      return;
    }
    this.saving.set(true);
    this.saved.set(false);
    this.errorMsg.set('');
    const v = this.form.value;
    const payload = {
      businessName:    v.businessName,
      logoText:        v.logoText,
      headerLogoUrl:   v.headerLogoUrl.trim(),
      footerLogoUrl:   v.footerLogoUrl.trim(),
      founderName:     v.founderName,
      domain:          v.domain,
      email:           v.email,
      phone:           v.phone,
      location:        v.location,
      socialLinks: {
        linkedin:  v.linkedin,
        github:    v.github,
        twitter:   v.twitter,
        instagram: v.instagram,
        facebook:  v.facebook,
        youtube:   v.youtube,
      },
      metaDescription:       v.metaDescription,
      footerText:            v.footerText,
      platformFeePercent:    +v.platformFeePercent,
      payoutMinimumAmount:   +v.payoutMinimumAmount,
      payoutWaitingDays:     +v.payoutWaitingDays,
    };
    this.settingsSvc.update(payload).subscribe({
      next: () => {
        this.brokenLogos.clear();
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (e) => { this.errorMsg.set(e?.error?.message || 'Save failed.'); this.saving.set(false); },
    });
  }
}
