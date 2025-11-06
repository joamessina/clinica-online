import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-specialist-dashboard',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './specialist-dashboard.component.html',
  styleUrls: ['./specialist-dashboard.component.scss'],
})
export class SpecialistDashboardComponent {}
