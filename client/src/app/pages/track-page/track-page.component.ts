import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrackData } from '../../data/track-data';
import { SpotifyService } from '../../services/spotify.service';

@Component({ selector: 'app-track-page', templateUrl: './track-page.component.html', styleUrls: ['./track-page.component.css'], standalone: false })
export class TrackPageComponent implements OnInit {
    trackId: string = '';
    track: TrackData | null = null;
    errorMessage: string = '';

    constructor(private route: ActivatedRoute, private spotifyService: SpotifyService) {
    }

    ngOnInit(): void {
        this.trackId = this.route.snapshot.paramMap.get('id') || 'unknown';
        this.spotifyService.getTrack(this.trackId).then((track) => {
            this.track = track;
        }).catch(() => {
            this.errorMessage = 'Unable to load this track.';
        });
    }
}
