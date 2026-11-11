import { Component, Input, OnDestroy } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';

declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: (() => void) | undefined;
        Spotify: any;
    }
}

@Component({
    selector: 'app-spotify-player',
    templateUrl: './spotify-player.component.html',
    styleUrls: ['./spotify-player.component.css'],
    standalone: false
})
export class SpotifyPlayerComponent implements OnDestroy {
    @Input() spotifyUri: string = '';

    player: any;
    deviceId: string = '';
    ready: boolean = false;
    paused: boolean = true;
    connecting: boolean = false;
    playingSelectedTrack: boolean = false;
    status: string = 'Connect the browser player to begin playback.';

    constructor(private spotifyService: SpotifyService) {
    }

    connect(): void {
        if (this.connecting || this.ready) {
            return;
        }

        this.connecting = true;
        this.status = 'Loading the Spotify player...';

        this.loadSdk()
            .then(() => {
                this.createPlayer();
            })
            .catch((error) => {
                console.error('Unable to load Spotify Web Playback SDK:', error);
                this.connecting = false;
                this.status =
                    'Unable to load the Spotify player. Confirm that the real webserver is running and that you logged in with Spotify.';
            });
    }

    private loadSdk(): Promise<void> {
        if (window.Spotify) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector(
                'script[src="https://sdk.scdn.co/spotify-player.js"]'
            );

            window.onSpotifyWebPlaybackSDKReady = () => {
                resolve();
            };

            if (existingScript) {
                // The script already exists, so wait for Spotify's ready callback.
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            script.onerror = () => {
                reject(new Error('Spotify SDK script failed to load.'));
            };
            document.body.appendChild(script);
        });
    }

    private createPlayer(): void {
        this.status = 'Connecting to Spotify...';

        this.player = new window.Spotify.Player({
            name: 'IN4MATX 133 Spotify Browser',
            getOAuthToken: (callback: (token: string) => void) => {
                this.spotifyService
                    .getPlaybackToken()
                    .then((token) => {
                        callback(token);
                    })
                    .catch((error) => {
                        console.error('Unable to retrieve playback token:', error);
                        this.connecting = false;
                        this.status = 'Spotify login is required before connecting the player.';
                    });
            },
            volume: 0.5
        });

        this.player.addListener('ready', ({ device_id }: any) => {
            this.deviceId = device_id;

            /*
             * The SDK device must become the active Spotify Connect device before
             * the selected track can be sent to it.
             */
            this.spotifyService
                .transferPlayback(device_id)
                .then(() => {
                    this.ready = true;
                    this.connecting = false;
                    this.status = 'Player ready. Click \"Play\".';
                })
                .catch((error) => {
                    console.error('Unable to transfer Spotify playback:', error);
                    this.ready = true;
                    this.connecting = false;
                    this.status =
                        'Player connected, but Spotify could not activate it. Click Log in with Spotify, reconnect the player, and try again.';
                });
        });

        this.player.addListener('not_ready', () => {
            this.ready = false;
            this.connecting = false;
            this.status = 'The browser player is offline. Connect again.';
        });

        this.player.addListener('player_state_changed', (state: any) => {
            if (state) {
                this.paused = state.paused;
            }
        });

        this.player.addListener('initialization_error', ({ message }: any) => {
            this.handlePlayerError('Player initialization failed', message);
        });

        this.player.addListener('authentication_error', ({ message }: any) => {
            this.handlePlayerError('Spotify authentication failed', message);
        });

        this.player.addListener('account_error', ({ message }: any) => {
            this.handlePlayerError('Spotify Premium playback is unavailable', message);
        });

        this.player.addListener('playback_error', ({ message }: any) => {
            this.handlePlayerError('Spotify playback failed', message);
        });

        this.player.connect().then((connected: boolean) => {
            if (!connected) {
                this.connecting = false;
                this.status = 'Spotify did not accept the player connection.';
            }
        });
    }

    private handlePlayerError(prefix: string, message: string): void {
        console.error(prefix + ':', message);
        this.connecting = false;
        this.status = prefix + '. ' + message;
    }

    playSelectedTrack(): void {
        if (!this.ready || !this.deviceId) {
            this.status = 'Connect the player before starting the track.';
            return;
        }

        if (!this.spotifyUri) {
            this.status = 'The selected track does not include a Spotify URI.';
            return;
        }

        this.playingSelectedTrack = true;
        this.status = 'Starting the selected track...';

        this.spotifyService
            .playTrack(this.deviceId, this.spotifyUri)
            .then(() => {
                this.playingSelectedTrack = false;
                this.paused = false;
                this.status = 'Playing the selected track.';
            })
            .catch((error) => {
                console.error('Unable to play selected track:', error);
                this.playingSelectedTrack = false;
                this.status =
                    'Unable to start the selected track. Log in again and confirm that Spotify Premium playback is available.';
            });
    }

    togglePlayback(): void {
        if (!this.player || !this.ready) {
            this.status = 'Connect the player first.';
            return;
        }

        this.player.togglePlay().catch((error: any) => {
            console.error('Unable to toggle playback:', error);
            this.status = 'Unable to pause or resume playback.';
        });
    }

    ngOnDestroy(): void {
        if (this.player) {
            this.player.disconnect();
        }
    }
}
