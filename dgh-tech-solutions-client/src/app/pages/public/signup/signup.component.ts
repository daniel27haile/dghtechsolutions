import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserAuthService } from '../../../core/services/user-auth.service';

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

  constructor(
    private fb:       FormBuilder,
    private userAuth: UserAuthService,
    private router:   Router,
  ) {
    if (userAuth.isLoggedIn()) router.navigate(['/my-library']);
  }

  ctrl(name: string): AbstractControl { return this.form.get(name)!; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    const { name, email, password } = this.form.value;
    this.userAuth.register(name!, email!, password!).subscribe({
      next:  () => this.router.navigate(['/my-library']),
      error: (e: { error?: { message?: string } }) => {
        this.errorMsg.set(e?.error?.message || 'Registration failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
