import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NoticeService } from './api';
import { Toast } from './shared/toast';

@Component({
  selector: 'app-root',
  imports: [DatePipe, RouterOutlet, RouterLink, RouterLinkActive, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly today = new Date();
  readonly menuOpen = signal(false);
  constructor(readonly notice: NoticeService) {}
  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
