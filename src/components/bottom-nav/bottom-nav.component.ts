
import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  viewChange = output<'map' | 'feed'>();
  createTrip = output<void>();
  
  activeView = signal<'map' | 'feed'>('feed');

  changeView(view: 'map' | 'feed') {
    this.activeView.set(view);
    this.viewChange.emit(view);
  }

  onCreateTrip() {
    this.createTrip.emit();
  }
}
