import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { FeedViewComponent } from './components/feed-view/feed-view.component';
import { TripCreatorComponent } from './components/trip-creator/trip-creator.component';
import { TripService } from './services/trip.service';
import { Trip } from './models/trip.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BottomNavComponent,
    MapViewComponent,
    FeedViewComponent,
    TripCreatorComponent
  ]
})
export class AppComponent {
  private tripService = inject(TripService);
  activeView = signal<'map' | 'feed'>('feed');
  creatorState = signal<{ mode: 'hidden' | 'create' | 'edit', trip?: Trip }>({ mode: 'hidden' });

  onViewChange(view: 'map' | 'feed') {
    this.activeView.set(view);
  }

  onTripSelectedFromMap(tripId: string) {
    this.tripService.selectTripFromMap(tripId);
    this.onViewChange('feed');
  }

  onShowCreator() {
    this.creatorState.set({ mode: 'create' });
  }

  onCloseCreator() {
    this.creatorState.set({ mode: 'hidden' });
  }

  onEditTrip(trip: Trip) {
    this.creatorState.set({ mode: 'edit', trip });
  }
}
