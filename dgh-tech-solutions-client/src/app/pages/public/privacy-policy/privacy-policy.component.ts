import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  template: `
    <div class="legal-page">
      <div class="container">
        <h1>Privacy Policy</h1>
        <p class="updated">Last updated: January 1, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly (name, email, message) when you use our contact form. We also collect anonymous usage data (page visits, device type, browser) to improve our services. We do not store raw IP addresses — only a one-way cryptographic hash.</p>

        <h2>2. How We Use Your Information</h2>
        <p>We use your contact information solely to respond to your inquiry. Anonymous analytics help us understand how visitors use our site so we can improve the experience.</p>

        <h2>3. Data Sharing</h2>
        <p>We do not sell, rent, or share your personal information with third parties except as required by law.</p>

        <h2>4. Cookies</h2>
        <p>We use a single session identifier stored in memory (not persisted as a cookie) to group analytics events. We do not use tracking cookies.</p>

        <h2>5. Security</h2>
        <p>We implement industry-standard security measures including HTTPS, rate limiting, and input validation to protect your data.</p>

        <h2>6. Contact</h2>
        <p>If you have questions about this policy, please contact us at privacy&#64;dghtechsolutions.com.</p>
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
export class PrivacyPolicyComponent {}
