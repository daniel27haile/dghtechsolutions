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
  loading  = signal(true);
  resource = signal<Resource | null>(null);
  errorMsg = signal('');

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
        if (res.data?.paid && res.data.resource) {
          this.resource.set(res.data.resource);
        } else {
          this.errorMsg.set('Payment verification failed. Please contact support.');
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
    if (r) this.router.navigate(['/resources', r._id], { state: { resource: r } });
  }
}
