import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TopNavComponent } from './shared/components/top-nav/top-nav.component';
import { IdleTimeoutService } from './shared/services/idle-timeout.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor(
    private readonly idleTimeoutService: IdleTimeoutService,
    readonly router: Router
  ) {}

  get showTopNav(): boolean {
    return this.router.url !== '/login';
  }

  ngOnInit(): void {
    // Start idle timeout tracking for automatic logout.
    this.idleTimeoutService.start();
  }
}
