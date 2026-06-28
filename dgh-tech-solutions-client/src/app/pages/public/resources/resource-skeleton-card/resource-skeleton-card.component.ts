import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-resource-skeleton-card',
  standalone: true,
  templateUrl: './resource-skeleton-card.component.html',
  styleUrls: ['./resource-skeleton-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceSkeletonCardComponent {}
