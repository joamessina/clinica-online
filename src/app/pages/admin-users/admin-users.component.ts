import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProfileService,
  Profile,
  Role,
} from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent {
  private profileSrv = inject(ProfileService);
  users = signal<Profile[]>([]);
  loading = false;

  async ngOnInit() {
    await this.load();
  }
  async load() {
    this.loading = true;
    const { data, error } = await this.profileSrv.adminListUsers();
    if (!error) this.users.set(data as Profile[]);
    this.loading = false;
  }

  async toggleApproval(u: Profile) {
    await this.profileSrv.adminToggleApproval(u.id, !u.is_approved);
    await this.load();
  }
}
