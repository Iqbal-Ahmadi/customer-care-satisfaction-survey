import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { roleGuard } from './auth/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/root-redirect/root-redirect.component').then(
        (module) => module.RootRedirectComponent
      )
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((module) => module.LoginComponent)
  },
  {
    path: 'surveys',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./employee/active-surveys/active-surveys.component').then(
        (module) => module.ActiveSurveysComponent
      )
  },
  {
    path: 'surveys/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./employee/survey-fill/survey-fill.component').then(
        (module) => module.SurveyFillComponent
      )
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    loadComponent: () =>
      import('./admin/admin-dashboard/admin-dashboard.component').then(
        (module) => module.AdminDashboardComponent
      )
  },
  {
    path: 'admin/surveys',
    canActivate: [authGuard, roleGuard],
    loadComponent: () =>
      import('./admin/surveys/admin-surveys.component').then(
        (module) => module.AdminSurveysComponent
      )
  },
  {
    path: 'admin/surveys/new',
    canActivate: [authGuard, roleGuard],
    loadComponent: () =>
      import('./admin/surveys/survey-editor.component').then(
        (module) => module.SurveyEditorComponent
      )
  },
  {
    path: 'admin/surveys/:id',
    canActivate: [authGuard, roleGuard],
    loadComponent: () =>
      import('./admin/surveys/survey-editor.component').then(
        (module) => module.SurveyEditorComponent
      )
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard],
    loadComponent: () =>
      import('./admin/users/admin-users.component').then(
        (module) => module.AdminUsersComponent
      )
  },
  {
    path: 'admin/reports',
    canActivate: [authGuard, roleGuard],
    loadComponent: () =>
      import('./admin/reports/admin-reports.component').then(
        (module) => module.AdminReportsComponent
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];
