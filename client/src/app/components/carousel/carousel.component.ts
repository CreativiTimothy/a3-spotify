import { Component, Input } from '@angular/core';
import { ResourceData } from '../../data/resource-data';

@Component({ selector: 'app-carousel', templateUrl: './carousel.component.html', styleUrls: ['./carousel.component.css'], standalone: false })
export class CarouselComponent {
    @Input() carouselId: string = 'resourceCarousel';
    @Input() resources: ResourceData[] = [];

    get carouselIdForBinding(): string { return '#' + this.carouselId; }
}
