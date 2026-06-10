import { Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  template: `
    <div class="legal-page">
      <div class="container">
        <h1>Terms of Service</h1>
        <p class="updated">Last updated: January 1, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing our website, you agree to these Terms of Service. If you do not agree, please do not use our site.</p>

        <h2>2. Services</h2>
        <p>DGH Tech Solutions provides software development, consulting, and related digital services. Specific project terms are governed by separate contracts.</p>

        <h2>3. Intellectual Property</h2>
        <p>All content on this website is owned by DGH Tech Solutions unless otherwise stated. You may not reproduce or distribute our content without written permission.</p>

        <h2>4. Limitation of Liability</h2>
        <p>DGH Tech Solutions is not liable for any indirect or incidental damages arising from your use of this website or our services beyond what is expressly agreed in a signed contract.</p>

        <h2>5. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use of the site after changes constitutes acceptance of the updated terms.</p>

        <h2>6. Governing Law</h2>
        <p>These terms are governed by the laws of the State of Iowa, United States.</p>

        <h2>7. Contact</h2>
        <p>Questions about these terms? Email us at legal&#64;dghtechsolutions.com.</p>
      </div>
    </div>
  `,
  styles: [`
    .legal-page { padding:8rem 1.5rem 5rem; min-height:100vh; }
    .container { max-width:760px; margin:0 auto; }
    h1 { font-size: clamp(2rem,4vw,3rem); font-weight:700; letter-spacing:-.02em; line-height:1.1; color:var(--clr-dark); margin-bottom:.5rem; }
    .updated { color:var(--clr-text); font-size:.9rem; margin-bottom:3rem; }
    h2 { font-size:1.2rem; font-weight:700; color:var(--clr-dark); margin:2rem 0 .75rem; }
    p { color:var(--clr-text); line-height:1.8; }
  `],
})
export class TermsComponent {}
