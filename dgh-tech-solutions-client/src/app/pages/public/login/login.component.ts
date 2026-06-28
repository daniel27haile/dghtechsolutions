import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserAuthService } from '../../../core/services/user-auth.service';

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
      next:  () => this.router.navigateByUrl(this.returnUrl),
      error: (e: { error?: { message?: string } }) => {
        this.errorMsg.set(e?.error?.message || 'Login failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
