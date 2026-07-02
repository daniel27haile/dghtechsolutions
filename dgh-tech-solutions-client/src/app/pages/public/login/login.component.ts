import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserAuthService } from '../../../core/services/user-auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class UserLoginComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading  = signal(false);
  errorMsg = signal('');

  private returnUrl = '/my-library';

  constructor(
    private fb:       FormBuilder,
    private userAuth: UserAuthService,
    private cartSvc:  CartService,
    private router:   Router,
    route:            ActivatedRoute,
  ) {
    this.returnUrl = route.snapshot.queryParams['returnUrl'] ?? '/my-library';
    if (userAuth.isLoggedIn()) router.navigate([this.returnUrl]);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    const { email, password } = this.form.value;
    this.userAuth.login(email!, password!).subscribe({
      next: () => {
        const hadGuestItems = this.cartSvc.guestItems().length > 0;
        this.cartSvc.mergeGuestCart().subscribe(() => {
          this.cartSvc.load();
          this.router.navigateByUrl(this.returnUrl).then(() => {
            if (hadGuestItems) this.cartSvc.openDrawer();
          });
        });
      },
      error: (e: { error?: { message?: string } }) => {
        this.errorMsg.set(e?.error?.message || 'Login failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
