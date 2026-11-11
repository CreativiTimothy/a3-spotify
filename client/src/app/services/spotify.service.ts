import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ArtistData } from '../data/artist-data';
import { AlbumData } from '../data/album-data';
import { TrackData } from '../data/track-data';
import { ResourceData } from '../data/resource-data';
import { ProfileData } from '../data/profile-data';
import { Popularity } from '../data/popularity';

@Injectable({ providedIn: 'root' })
export class SpotifyService {
    expressBaseUrl: string = 'http://127.0.0.1:8888';

    /* Automatic server detection result. */
    private useSpotifySession: boolean | null = null;
    private serverDetectionPromise: Promise<boolean> | null = null;

    constructor(private http: HttpClient) {
    }

    private detectSpotifySession(): Promise<boolean> {
        if (this.serverDetectionPromise !== null) {
            return this.serverDetectionPromise;
        }

        /*
         * Probe without credentials. The untouched dummy server returns 404
         * because /playback-token is absent. The real server returns a
         * non-404 authentication response before login or 200 after login.
         */
        this.serverDetectionPromise = firstValueFrom(
            this.http.get(this.expressBaseUrl + '/playback-token')
        )
            .then(() => {
                this.useSpotifySession = true;
                return true;
            })
            .catch((error) => {
                if (error.status === 404) {
                    this.useSpotifySession = false;
                    return false;
                }

                if ([400, 401, 403, 500].indexOf(error.status) !== -1) {
                    this.useSpotifySession = true;
                    return true;
                }

                this.serverDetectionPromise = null;
                return Promise.reject(error);
            });

        return this.serverDetectionPromise;
    }

    isRealSpotifyServer(): Promise<boolean> {
        return this.detectSpotifySession();
    }

    private sendRequestToExpress(endpoint: string): Promise<any> {
        return this.detectSpotifySession().then((usesSession) => {
            const uri = this.expressBaseUrl + endpoint;

            return firstValueFrom(this.http.get(uri, {
                withCredentials: usesSession
            }));
        });
    }

    /*
     * Spotify's live Development Mode responses can omit fields that exist in
     * the instructor's saved JSON. Normalizing only the response objects keeps
     * the supplied data classes unchanged and remains compatible with both servers.
     */
    private normalizeArtist(artist: any): any {
        const source = artist || {};

        return {
            ...source,
            id: source.id || 'unknown',
            name: source.name || 'Unknown Artist',
            images: Array.isArray(source.images) ? source.images : [],
            genres: Array.isArray(source.genres) ? source.genres : [],
            followers: source.followers || { total: 0 },
            external_urls: source.external_urls || {
                spotify: source.id
                    ? 'https://open.spotify.com/artist/' + source.id
                    : 'https://open.spotify.com/'
            }
        };
    }

    private normalizeAlbum(album: any): any {
        const source = album || {};

        return {
            ...source,
            id: source.id || 'unknown',
            name: source.name || 'Unknown Album',
            images: Array.isArray(source.images) ? source.images : [],
            genres: Array.isArray(source.genres) ? source.genres : [],
            artists: (source.artists || []).map((artist: any) => {
                return this.normalizeArtist(artist);
            }),
            external_urls: source.external_urls || {
                spotify: source.id
                    ? 'https://open.spotify.com/album/' + source.id
                    : 'https://open.spotify.com/'
            }
        };
    }

    private normalizeTrack(track: any): any {
        const source = track || {};

        return {
            ...source,
            id: source.id || 'unknown',
            name: source.name || 'Unknown Track',
            duration_ms: source.duration_ms || 0,
            artists: (source.artists || []).map((artist: any) => {
                return this.normalizeArtist(artist);
            }),
            album: source.album
                ? this.normalizeAlbum(source.album)
                : undefined,
            uri: source.uri || (source.id
                ? 'spotify:track:' + source.id
                : ''),
            external_urls: source.external_urls || {
                spotify: source.id
                    ? 'https://open.spotify.com/track/' + source.id
                    : 'https://open.spotify.com/'
            }
        };
    }

    private createArtist(data: any): ArtistData {
        const artist = new ArtistData(this.normalizeArtist(data));

        // Live Spotify responses may omit these fields.
        if (artist.followers === undefined || artist.followers === null) {
            artist.followers = 0;
        }
        if (!artist.popularity) {
            artist.popularity = new Popularity(0);
        }

        return artist;
    }

    private createAlbum(data: any): AlbumData {
        const album = new AlbumData(this.normalizeAlbum(data));

        if (!album.popularity) {
            album.popularity = new Popularity(0);
        }

        return album;
    }

    private createTrack(data: any): TrackData {
        const normalized = this.normalizeTrack(data);
        const track = new TrackData(normalized);

        if (!track.popularity) {
            track.popularity = new Popularity(0);
        }

        /*
         * TrackData from the starter project does not declare uri, but the
         * playback component needs it. Add it to the instance without changing
         * the instructor-provided model class.
         */
        (track as any).uri = normalized.uri;

        return track;
    }

    aboutMe(): Promise<ProfileData> {
        return this.sendRequestToExpress('/me').then((data) => {
            return new ProfileData(data);
        });
    }

    searchFor(category: string, resource: string): Promise<ResourceData[]> {
        const endpoint = '/search/' + category + '/' + encodeURIComponent(resource);

        return this.sendRequestToExpress(endpoint).then((data) => {
            const resultGroup = data[category + 's'];
            const items = resultGroup && resultGroup.items
                ? resultGroup.items
                : [];

            if (category === 'artist') {
                return items.map((item: any) => this.createArtist(item));
            }
            if (category === 'album') {
                return items.map((item: any) => this.createAlbum(item));
            }
            if (category === 'track') {
                return items.map((item: any) => this.createTrack(item));
            }
            return [];
        });
    }

    getArtist(artistId: string): Promise<ArtistData> {
        return this.sendRequestToExpress(
            '/artist/' + encodeURIComponent(artistId)
        ).then((data) => this.createArtist(data));
    }

    getTopTracksForArtist(artistId: string): Promise<TrackData[]> {
        return this.sendRequestToExpress(
            '/artist-top-tracks/' + encodeURIComponent(artistId)
        ).then((data) => {
            return (data.tracks || []).map((track: any) => {
                return this.createTrack(track);
            });
        });
    }

    getAlbumsForArtist(artistId: string): Promise<AlbumData[]> {
        return this.sendRequestToExpress(
            '/artist-albums/' + encodeURIComponent(artistId)
        ).then((data) => {
            return (data.items || []).map((album: any) => {
                return this.createAlbum(album);
            });
        });
    }

    getAlbum(albumId: string): Promise<AlbumData> {
        return this.sendRequestToExpress(
            '/album/' + encodeURIComponent(albumId)
        ).then((data) => this.createAlbum(data));
    }

    getTracksForAlbum(albumId: string): Promise<TrackData[]> {
        return this.sendRequestToExpress(
            '/album-tracks/' + encodeURIComponent(albumId)
        ).then((data) => {
            return (data.items || []).map((track: any) => {
                return this.createTrack(track);
            });
        });
    }

    getTrack(trackId: string): Promise<TrackData> {
        return this.sendRequestToExpress(
            '/track/' + encodeURIComponent(trackId)
        ).then((data) => this.createTrack(data));
    }

    getPlaybackToken(): Promise<string> {
        return this.sendRequestToExpress('/playback-token').then((data) => {
            return data.access_token;
        });
    }

    transferPlayback(deviceId: string): Promise<any> {
        return firstValueFrom(this.http.put(
            this.expressBaseUrl + '/playback/transfer',
            { device_id: deviceId },
            { withCredentials: true }
        ));
    }


    playTrack(deviceId: string, spotifyUri: string): Promise<any> {
        return firstValueFrom(this.http.put(
            this.expressBaseUrl + '/playback/play',
            {
                device_id: deviceId,
                spotify_uri: spotifyUri
            },
            { withCredentials: true }
        ));
    }
}
