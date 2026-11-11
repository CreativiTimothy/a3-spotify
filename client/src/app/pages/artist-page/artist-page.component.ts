import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArtistData } from '../../data/artist-data';
import { AlbumData } from '../../data/album-data';
import { TrackData } from '../../data/track-data';
import { SpotifyService } from '../../services/spotify.service';

@Component({ selector: 'app-artist-page', templateUrl: './artist-page.component.html', styleUrls: ['./artist-page.component.css'], standalone: false })
export class ArtistPageComponent implements OnInit {
    artistId: string = '';
    artist: ArtistData | null = null;
    topTracks: TrackData[] = [];
    albums: AlbumData[] = [];
    errorMessage: string = '';

    constructor(private route: ActivatedRoute, private spotifyService: SpotifyService) {
    }

    ngOnInit(): void {
        this.artistId =
            this.route.snapshot.paramMap.get("id") || "unknown";

        this.spotifyService
            .getArtist(this.artistId)
            .then((artist) => {
                this.artist = artist;
            })
            .catch((error) => {
                console.error(
                    "Unable to load artist information:",
                    error
                );

                this.errorMessage =
                    "Unable to load this artist's information.";
            });

        this.spotifyService
            .getAlbumsForArtist(this.artistId)
            .then((albums) => {
                this.albums = albums;
            })
            .catch((error) => {
                console.error(
                    "Unable to load artist albums:",
                    error
                );

                this.albums = [];
            });

        this.spotifyService
            .getTopTracksForArtist(this.artistId)
            .then((tracks) => {
                this.topTracks = tracks;
            })
            .catch((error) => {
                console.error(
                    "Unable to load artist top tracks:",
                    error
                );

                this.topTracks = [];
            });
    }
}
