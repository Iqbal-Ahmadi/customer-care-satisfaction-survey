import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ...MATERIAL_MODULES],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  surveyCount = 0;
  userCount = 0;
  responseCount = 0;
  loading = false;

  constructor(
    private readonly adminService: AdminService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load admin summary metrics.
    this.loading = true;
    this.changeDetectorRef.markForCheck();

    forkJoin({
      surveys: this.adminService.getSurveys().pipe(catchError(() => of([]))),
      users: this.adminService.getUsers().pipe(catchError(() => of([]))),
      responses: this.adminService.getResponseCount().pipe(catchError(() => of(0)))
    }).subscribe({
      next: ({ surveys, users, responses }) => {
        this.surveyCount = surveys.length;
        this.userCount = users.length;
        this.responseCount = responses;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      }
      
    });
  }
}
