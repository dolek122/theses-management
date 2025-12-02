import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user';

export const roleGuard: CanActivateFn = (route) => {
	const auth = inject(AuthService);
	const router = inject(Router);
	const requiredRole = route.data?.['role'] as UserRole | undefined;
	const requiredRoles = route.data?.['roles'] as UserRole[] | undefined;
	const current = auth.role();

	if (requiredRoles && current && requiredRoles.includes(current)) {
		return true;
	}

	if (requiredRole && current === requiredRole) {
		return true;
	}
	return router.parseUrl('/login');
};


