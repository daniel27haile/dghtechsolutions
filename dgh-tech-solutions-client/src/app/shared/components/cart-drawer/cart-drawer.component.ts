import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserAuthService } from '../../../core/services/user-auth.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './cart-drawer.component.html',
  styleUrls: ['./cart-drawer.component.scss'],
})
export class CartDrawerComponent implements OnInit {
  cartSvc   = inject(CartService);
  toastSvc  = inject(ToastService);
  userAuth  = inject(UserAuthService);
  private router = inject(Router);

  couponInput = signal('');
  couponError = signal('');
  applying    = signal(false);
  checkingOut = signal(false);

  itemCount    = computed(() => this.userAuth.isLoggedIn() ? this.cartSvc.cart().itemCount : this.cartSvc.guestItems().length);
  guestSubtotal = computed(() => this.cartSvc.guestItems().reduce((s, i) => s + i.price, 0));

  ngOnInit(): void {
    if (this.userAuth.isLoggedIn()) {
      this.cartSvc.load();
    }
  }

  close(): void {
    this.cartSvc.closeDrawer();
  }

  remove(resourceId: string): void {
    if (!this.userAuth.isLoggedIn()) {
      this.cartSvc.removeFromGuestCart(resourceId);
      return;
    }
    this.cartSvc.removeItem(resourceId).subscribe({
      error: () => this.toastSvc.show('Could not remove item.', 'error'),
    });
  }

  applyCoupon(): void {
    const code = this.couponInput().trim();
    if (!code) return;
    this.applying.set(true);
    this.couponError.set('');
    this.cartSvc.applyCoupon(code).subscribe({
      next:  () => { this.applying.set(false); this.toastSvc.show('Coupon applied!'); this.couponInput.set(''); },
      error: (e: { error?: { message?: string } }) => {
        this.applying.set(false);
        this.couponError.set(e?.error?.message || 'Invalid coupon.');
      },
    });
  }

  removeCoupon(): void {
    this.cartSvc.removeCoupon().subscribe({ error: () => {} });
    this.couponError.set('');
    this.couponInput.set('');
  }

  checkout(): void {
    if (!this.userAuth.isLoggedIn()) {
      this.close();
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/resources' } });
      return;
    }
    this.checkingOut.set(true);
    this.cartSvc.stripeCartCheckout().subscribe({
      next: (res) => {
        this.checkingOut.set(false);
        if (res.data?.free) {
          this.toastSvc.show('Resources unlocked — enjoy!');
          this.cartSvc.load();
          this.close();
        } else if (res.data?.url) {
          window.location.href = res.data.url;
        }
      },
      error: (e: { error?: { message?: string } }) => {
        this.checkingOut.set(false);
        this.toastSvc.show(e?.error?.message || 'Checkout failed. Please try again.', 'error');
      },
    });
  }
}
