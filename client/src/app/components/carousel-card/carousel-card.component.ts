import { Component, Input } from '@angular/core';
import { ResourceData } from '../../data/resource-data';

@Component({ selector: 'app-carousel-card', templateUrl: './carousel-card.component.html', styleUrls: ['./carousel-card.component.css'], standalone: false })
export class CarouselCardComponent {
    @Input() resource!: ResourceData;
}
