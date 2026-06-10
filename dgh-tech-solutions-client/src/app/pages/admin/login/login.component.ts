import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  loading      = signal(false);
  errorMsg     = signal('');
  showPassword = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    // Already authenticated — skip the login page
    if (auth.isLoggedIn()) {
      router.navigate(['/admin/dashboard'], { replaceUrl: true });
    }

    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/admin/dashboard'], { replaceUrl: true }); },
      error: (err) => {
        this.errorMsg.set(err?.error?.message || 'Invalid email or password. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
