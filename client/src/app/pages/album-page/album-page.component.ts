import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlbumData } from '../../data/album-data';
import { TrackData } from '../../data/track-data';
import { SpotifyService } from '../../services/spotify.service';

@Component({ selector: 'app-album-page', templateUrl: './album-page.component.html', styleUrls: ['./album-page.component.css'], standalone: false })
export class AlbumPageComponent implements OnInit {
    albumId: string = '';
    album: AlbumData | null = null;
    tracks: TrackData[] = [];
    errorMessage: string = '';

    constructor(private route: ActivatedRoute, private spotifyService: SpotifyService) {
    }

    ngOnInit(): void {
        this.albumId = this.route.snapshot.paramMap.get('id') || 'unknown';
        Promise.all([
            this.spotifyService.getAlbum(this.albumId),
            this.spotifyService.getTracksForAlbum(this.albumId)
        ]).then(([album, tracks]) => {
            this.album = album;
            this.tracks = tracks;
        }).catch(() => {
            this.errorMessage = 'Unable to load this album.';
        });
    }
}
