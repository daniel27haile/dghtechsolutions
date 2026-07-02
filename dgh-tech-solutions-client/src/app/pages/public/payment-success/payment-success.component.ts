import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { Resource } from '../../../core/models';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss'],
})
export class PaymentSuccessComponent implements OnInit {
  loading       = signal(true);
  /** Single-resource purchase */
  resource      = signal<Resource | null>(null);
  /** Cart purchase — multiple resources */
  resources     = signal<Resource[]>([]);
  isCart        = signal(false);
  /** Payment received but webhook not yet processed */
  pending       = signal(false);
  errorMsg      = signal('');

  constructor(
    private route:      ActivatedRoute,
    private router:     Router,
    private paymentSvc: PaymentService,
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) {
      this.router.navigate(['/resources']);
      return;
    }

    this.paymentSvc.verifySession(sessionId).subscribe({
      next: (res) => {
        const d = res.data;
        if (d?.paid) {
          this.isCart.set(d.isCart);
          if (d.isCart) {
            if (d.resources.length > 0) {
              this.resources.set(d.resources);
            } else {
              // Webhook hasn't processed yet
              this.pending.set(true);
            }
          } else {
            if (d.resource) {
              this.resource.set(d.resource);
            } else {
              // Webhook hasn't processed yet
              this.pending.set(true);
            }
          }
        } else {
          this.errorMsg.set('Payment was not completed. Please try again or contact support.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Could not verify payment. Please check your library.');
        this.loading.set(false);
      },
    });
  }

  openResource(): void {
    const r = this.resource();
    if (r?._id) this.router.navigate(['/resources', r._id]);
  }
}
