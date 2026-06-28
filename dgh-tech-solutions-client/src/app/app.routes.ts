import { Routes } from '@angular/router';
import { authGuard }     from './core/guards/auth.guard';
import { userAuthGuard } from './core/guards/user-auth.guard';

export const routes: Routes = [
  // ── Public layout ─────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/public/home/home.component').then((m) => m.HomeComponent),
        title: 'DGH Tech Solutions | Professional Web Development & Cloud Services',
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/public/services/services.component').then((m) => m.ServicesComponent),
        title: 'Web Development Services | DGH Tech Solutions',
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/public/about/about.component').then((m) => m.AboutComponent),
        title: 'About DGH Tech Solutions | Full-Stack Web Development',
      },
      {
        path: 'contact',
        loadComponent: () => import('./pages/public/contact/contact.component').then((m) => m.ContactComponent),
        title: 'Contact Us | DGH Tech Solutions',
      },
      {
        path: 'projects/:slug',
        loadComponent: () =>
          import('./pages/public/project-detail/project-detail.component').then((m) => m.ProjectDetailComponent),
        // Title is set dynamically in ProjectDetailComponent after the project loads
        title: 'Project | DGH Tech Solutions',
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./pages/public/resources/resources.component').then((m) => m.ResourcesComponent),
        title: 'Resources & Learning Hub | DGH Tech Solutions',
      },
      {
        path: 'resources/:id',
        loadComponent: () =>
          import('./pages/public/resources/resource-detail/resource-detail.component').then(
            (m) => m.ResourceDetailComponent
          ),
        title: 'Resource | DGH Tech Solutions',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/public/login/login.component').then((m) => m.UserLoginComponent),
        title: 'Sign In | DGH Tech Solutions',
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./pages/public/signup/signup.component').then((m) => m.UserSignupComponent),
        title: 'Create Account | DGH Tech Solutions',
      },
      {
        path: 'my-library',
        canActivate: [userAuthGuard],
        loadComponent: () =>
          import('./pages/public/my-library/my-library.component').then((m) => m.MyLibraryComponent),
        title: 'My Library | DGH Tech Solutions',
      },
      {
        path: 'payment-success',
        loadComponent: () =>
          import('./pages/public/payment-success/payment-success.component').then(
            (m) => m.PaymentSuccessComponent
          ),
        title: 'Payment Successful | DGH Tech Solutions',
      },
      {
        path: 'privacy-policy',
        loadComponent: () =>
          import('./pages/public/privacy-policy/privacy-policy.component').then((m) => m.PrivacyPolicyComponent),
        title: 'Privacy Policy | DGH Tech Solutions',
      },
      {
        path: 'terms',
        loadComponent: () => import('./pages/public/terms/terms.component').then((m) => m.TermsComponent),
        title: 'Terms of Service | DGH Tech Solutions',
      },
    ],
  },

  // ── Admin login (standalone — no layout) ──────────────────────────────────
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin/login/login.component').then((m) => m.LoginComponent),
    title: 'Admin Login',
  },

  // ── Admin (protected) ─────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard | Admin',
      },

      // ── Projects ──────────────────────────────────────────────────────────
      // Specific routes BEFORE generic to ensure correct matching
      {
        path: 'projects/new',
        loadComponent: () =>
          import('./pages/admin/projects/project-form/project-form.component').then((m) => m.ProjectFormComponent),
        title: 'New Project | Admin',
      },
      {
        path: 'projects/edit/:id',
        loadComponent: () =>
          import('./pages/admin/projects/project-form/project-form.component').then((m) => m.ProjectFormComponent),
        title: 'Edit Project | Admin',
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./pages/admin/projects/projects.component').then((m) => m.AdminProjectsComponent),
        title: 'Projects | Admin',
      },

      // ── Services ──────────────────────────────────────────────────────────
      {
        path: 'services/new',
        loadComponent: () =>
          import('./pages/admin/services/service-form/service-form.component').then((m) => m.ServiceFormComponent),
        title: 'New Service | Admin',
      },
      {
        path: 'services/edit/:id',
        loadComponent: () =>
          import('./pages/admin/services/service-form/service-form.component').then((m) => m.ServiceFormComponent),
        title: 'Edit Service | Admin',
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./pages/admin/services/services.component').then((m) => m.AdminServicesComponent),
        title: 'Services | Admin',
      },

      // ── Resources ─────────────────────────────────────────────────────────
      {
        path: 'resources/new',
        loadComponent: () =>
          import('./pages/admin/resources/resource-form/resource-form.component').then(
            (m) => m.ResourceFormComponent
          ),
        title: 'New Resource | Admin',
      },
      {
        path: 'resources/edit/:id',
        loadComponent: () =>
          import('./pages/admin/resources/resource-form/resource-form.component').then(
            (m) => m.ResourceFormComponent
          ),
        title: 'Edit Resource | Admin',
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./pages/admin/resources/resources.component').then((m) => m.AdminResourcesComponent),
        title: 'Resources | Admin',
      },

      // ── Course Progress ───────────────────────────────────────────────────
      {
        path: 'progress',
        loadComponent: () =>
          import('./pages/admin/progress/progress.component').then((m) => m.AdminProgressComponent),
        title: 'Course Progress | Admin',
      },

      // ── Coupons ───────────────────────────────────────────────────────────
      {
        path: 'coupons',
        loadComponent: () =>
          import('./pages/admin/coupons/coupons.component').then((m) => m.AdminCouponsComponent),
        title: 'Coupons | Admin',
      },

      // ── Publishers & Payouts ──────────────────────────────────────────────
      {
        path: 'publishers',
        loadComponent: () =>
          import('./pages/admin/publishers/publishers.component').then((m) => m.AdminPublishersComponent),
        title: 'Publishers | Admin',
      },
      {
        path: 'payouts',
        loadComponent: () =>
          import('./pages/admin/payouts/payouts.component').then((m) => m.AdminPayoutsComponent),
        title: 'Payouts | Admin',
      },
      {
        path: 'publisher-dashboard',
        loadComponent: () =>
          import('./pages/admin/publisher-dashboard/publisher-dashboard.component').then(
            (m) => m.PublisherDashboardComponent
          ),
        title: 'My Dashboard | Publisher',
      },

      // ── Other admin pages ─────────────────────────────────────────────────
      {
        path: 'site-content',
        loadComponent: () =>
          import('./pages/admin/site-content/site-content.component').then((m) => m.SiteContentComponent),
        title: 'Site Content | Admin',
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./pages/admin/messages/messages.component').then((m) => m.MessagesComponent),
        title: 'Messages | Admin',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/admin/settings/settings.component').then((m) => m.AdminSettingsComponent),
        title: 'Settings | Admin',
      },
    ],
  },

  // ── Fallback — redirect unknown URLs to the public home page ─────────────
  { path: '**', redirectTo: '' },
];
