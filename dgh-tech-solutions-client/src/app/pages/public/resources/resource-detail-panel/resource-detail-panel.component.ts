import {
  Component, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { Resource, ResourceCurriculumSection } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-resource-detail-panel',
  standalone: true,
  imports: [StarRatingComponent],
  templateUrl: './resource-detail-panel.component.html',
  styleUrls: ['./resource-detail-panel.component.scss'],
})
export class ResourceDetailPanelComponent implements OnChanges {
  @Input({ required: true }) resource!: Resource;
  @Input() purchased    = false;
  /**
   * When false the identity block (badges + title) is hidden.
   * Set to false when the panel is hosted inside a modal that provides
   * its own header with the title.  Defaults to true for the desktop side panel.
   */
  @Input() showIdentity = true;

  readonly LEARN_LIMIT      = 6;
  readonly CURR_LIMIT       = 3;

  showAllLearn     = false;
  showAllCurriculum = false;

  ngOnChanges(changes: SimpleChanges): void {
    // Reset "see more" toggles when a different resource is selected
    if (changes['resource']) {
      this.showAllLearn     = false;
      this.showAllCurriculum = false;
    }
  }

  get hasRating(): boolean { return (this.resource.reviewCount ?? 0) > 0; }

  get reviewCountText(): string {
    const n = this.resource.reviewCount ?? 0;
    return `${n} ${n === 1 ? 'Review' : 'Reviews'}`;
  }

  /** Smart "Included" items derived from existing resource data. */
  get includedItems(): string[] {
    const r = this.resource;
    const items: string[] = [];

    if (r.type === 'BUNDLE' && (r.includedResourceIds?.length ?? 0) > 0) {
      items.push(`${r.includedResourceIds!.length} Resources Included`);
    } else if (r.lessonCount && r.lessonCount > 0) {
      const unit = r.type === 'MULTIPLE_CHOICE' ? 'Practice Questions'
                 : r.type === 'SHORT_ANSWER'    ? 'Flashcards'
                 : r.type === 'PDF'             ? 'Pages' : 'Items';
      items.push(`${r.lessonCount} ${unit}`);
    }

    if (r.duration) items.push(r.duration);

    items.push('Lifetime Access');

    if (r.type !== 'BUNDLE') {
      items.push('Progress Tracking');
    }

    return items;
  }

  get learnItems(): string[] {
    const all = this.resource.whatYouWillLearn ?? [];
    return this.showAllLearn ? all : all.slice(0, this.LEARN_LIMIT);
  }
  get remainingLearn(): number {
    return Math.max(0, (this.resource.whatYouWillLearn?.length ?? 0) - this.LEARN_LIMIT);
  }

  get curriculumSections(): ResourceCurriculumSection[] {
    const all = this.resource.curriculum ?? [];
    return this.showAllCurriculum ? all : all.slice(0, this.CURR_LIMIT);
  }
  get remainingCurriculum(): number {
    return Math.max(0, (this.resource.curriculum?.length ?? 0) - this.CURR_LIMIT);
  }

  get totalLessons(): number {
    return this.resource.curriculum?.reduce(
      (acc, s) => acc + (s.lessons?.length ?? 0), 0
    ) ?? 0;
  }

  get typeBadge(): string {
    return {
      PDF:             'PDF Guide',
      MULTIPLE_CHOICE: 'Multiple Choice',
      SHORT_ANSWER:    'Flashcards',
      BUNDLE:          'Bundle',
    }[this.resource.type] ?? this.resource.type;
  }

  get typeColorClass(): string {
    return {
      PDF:             'type-pdf',
      MULTIPLE_CHOICE: 'type-mcq',
      SHORT_ANSWER:    'type-sa',
      BUNDLE:          'type-bundle',
    }[this.resource.type] ?? '';
  }

  get formattedDate(): string {
    if (!this.resource.updatedAt) return '';
    return new Date(this.resource.updatedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }
}
