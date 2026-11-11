import { Component } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';

@Component({ selector: 'app-about', templateUrl: './about.component.html', styleUrls: ['./about.component.css'], standalone: false })
export class AboutComponent {
    name: string = '';
    profile_pic: string = 'assets/unknown.jpg';
    profile_link: string = '';
    loading: boolean = false;
    errorMessage: string = '';

    constructor(private spotifyService: SpotifyService) {
    }

    loadAboutMe(): void {
        this.loading = true;
        this.errorMessage = '';
        this.spotifyService.aboutMe().then((profile) => {
            this.name = profile.name;
            this.profile_pic = profile.imageURL;
            this.profile_link = profile.spotifyProfile;
        }).catch(() => {
            this.errorMessage = 'Unable to load profile information. Make sure the webserver is running.';
        }).finally(() => {
            this.loading = false;
        });
    }
}
