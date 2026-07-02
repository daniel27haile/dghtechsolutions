import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserAuthService } from '../../../core/services/user-auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-user-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class UserSignupComponent {
  form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
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

  ctrl(name: string): AbstractControl { return this.form.get(name)!; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    const { name, email, password } = this.form.value;
    this.userAuth.register(name!, email!, password!).subscribe({
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
        this.errorMsg.set(e?.error?.message || 'Registration failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
