
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  // Replace with your actual admin emails
  private adminEmails = ['ramsatt@gmail.com', 'your.email@gmail.com']; 

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.user$.pipe(
      take(1),
      map(user => {
        // For development, you might relax this or check specific emails
        if (user) {
             // In a real app, check user.email against allowlist strictly
             // return this.adminEmails.includes(user.email || '');
             return true; // Allowing any logged-in user for now as per "Migrating..." phase
        }
        return this.router.createUrlTree(['/home']);
      })
    );
  }
}
