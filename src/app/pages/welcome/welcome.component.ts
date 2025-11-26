import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-welcome',
  imports: [CommonModule, RouterLink,TranslatePipe],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {}
