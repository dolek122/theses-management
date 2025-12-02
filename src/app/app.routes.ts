import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{
		path: 'login',
		loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
	},
	{
		path: 'register',
		loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
	},
	{
		path: 'student',
		canActivate: [roleGuard],
		data: { role: 'student' },
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
			{
				path: 'dashboard',
				loadComponent: () => import('./features/student/student-dashboard.component').then(m => m.StudentDashboardComponent)
			},
			{
				path: 'schedule',
				loadComponent: () => import('./features/student/student-schedule.component').then(m => m.StudentScheduleComponent)
			},
			{
				path: 'documents',
				loadComponent: () => import('./features/student/student-documents.component').then(m => m.StudentDocumentsComponent)
			},
			{
				path: 'consultations',
				loadComponent: () => import('./features/student/student-consultations.component').then(m => m.StudentConsultationsComponent)
			}
		]
	},
	{
		path: 'promoter',
		canActivate: [roleGuard],
		data: { roles: ['promoter', 'reviewer'] },
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
			{
				path: 'dashboard',
				loadComponent: () => import('./features/promoter/promoter-dashboard.component').then(m => m.PromoterDashboardComponent)
			},
			{
				path: 'thesis-registration',
				canActivate: [roleGuard],
				data: { role: 'promoter' },
				loadComponent: () => import('./features/promoter/promoter-thesis-registration.component').then(m => m.PromoterThesisRegistrationComponent)
			},
			{
				path: 'student-link',
				canActivate: [roleGuard],
				data: { role: 'promoter' },
				loadComponent: () => import('./features/promoter/promoter-student-link.component').then(m => m.PromoterStudentLinkComponent)
			},
			{
				path: 'evaluations',
				loadComponent: () => import('./features/promoter/promoter-evaluations.component').then(m => m.PromoterEvaluationsComponent)
			},
			{
				path: 'remarks',
				loadComponent: () => import('./features/promoter/promoter-remarks.component').then(m => m.PromoterRemarksComponent)
			},
			{
				path: 'consultations',
				loadComponent: () => import('./features/promoter/promoter-consultations.component').then(m => m.PromoterConsultationsComponent)
			},
			{
				path: 'students',
				loadComponent: () => import('./features/promoter/promoter-students.component').then(m => m.PromoterStudentsComponent)
			}
		]
	},
	{
		path: 'admin',
		canActivate: [roleGuard],
		data: { role: 'admin' },
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'users' },
			{
				path: 'users',
				loadComponent: () => import('./features/admin/user-management.component').then(m => m.UserManagementComponent)
			}
		]
	},
	{ path: '**', redirectTo: 'login' }
];
