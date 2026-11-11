import { Component } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';
import { ResourceData } from '../../data/resource-data';
import { TrackData } from '../../data/track-data';

@Component({ selector: 'app-search', templateUrl: './search.component.html', styleUrls: ['./search.component.css'], standalone: false })
export class SearchComponent {
    searchString: string = '';
    searchCategory: string = 'artist';
    searchCategories: string[] = ['artist', 'album', 'track'];
    resources: ResourceData[] = [];
    loading: boolean = false;
    errorMessage: string = '';

    constructor(private spotifyService: SpotifyService) {
    }

    search(): void {
        const query = this.searchString.trim();
        if (!query) {
            this.resources = [];
            return;
        }
        this.loading = true;
        this.errorMessage = '';
        this.spotifyService.searchFor(this.searchCategory, query).then((resources) => {
            this.resources = resources;
        }).catch(() => {
            this.resources = [];
            this.errorMessage = 'Search failed. Make sure the webserver is running.';
        }).finally(() => {
            this.loading = false;
        });
    }

    get trackResults(): TrackData[] {
        return this.resources as TrackData[];
    }
}
