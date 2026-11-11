import { Component, Input } from '@angular/core';
import { Popularity } from '../../data/popularity';

@Component({ selector: 'app-thermometer', templateUrl: './thermometer.component.html', styleUrls: ['./thermometer.component.css'], standalone: false })
export class ThermometerComponent {
    @Input() label: string = 'Popularity';
    @Input() popularity: Popularity = new Popularity(0);
}
