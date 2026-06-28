import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, AfterViewInit,
  HostListener, ElementRef, ViewChild,
  Inject, signal, computed,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Resource, ResourceCategory } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

const PAGE_SIZE = 8;

@Component({
  selector: 'app-resource-contents-modal',
  standalone: true,
  imports: [StarRatingComponent],
  templateUrl: './resource-contents-modal.component.html',
  styleUrls: ['./resource-contents-modal.component.scss'],
})
export class ResourceContentsModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() resources: Resource[] = [];
  @Input() categories: (ResourceCategory | 'All')[] = [];

  @Output() closed         = new EventEmitter<void>();
  @Output() resourceOpened = new EventEmitter<Resource>();

  @ViewChild('closeBtn') closeBtnRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('panel')    panelRef!:    ElementRef<HTMLDivElement>;

  searchQuery    = signal('');
  activeCategory = signal<ResourceCategory | 'All'>('All');
  visibleCount   = signal(PAGE_SIZE);

  private _searchTimer?: ReturnType<typeof setTimeout>;

  filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase().trim();
    const cat = this.activeCategory();
    return this.resources.filter(r => {
      const matchCat = cat === 'All' || r.category === cat;
      const matchQ   = !q
        || r.title.toLowerCase().includes(q)
        || r.description.toLowerCase().includes(q)
        || (r.tags ?? []).some(t => t.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  });

  visibleItems = computed(() => this.filtered().slice(0, this.visibleCount()));
  hasMore      = computed(() => this.visibleCount() < this.filtered().length);
  remaining    = computed(() => this.filtered().length - this.visibleCount());
  totalCount   = computed(() => this.filtered().length);

  constructor(@Inject(DOCUMENT) private doc: Document) {}

  ngOnInit(): void {
    this.doc.body.style.overflow = 'hidden';
  }

  ngAfterViewInit(): void {
    this.closeBtnRef?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = '';
    clearTimeout(this._searchTimer);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.close();
      return;
    }
    if (e.key !== 'Tab') return;

    const panel = this.panelRef?.nativeElement;
    if (!panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, a[href], [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length < 2) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement) === e.currentTarget) this.close();
  }

  close(): void { this.closed.emit(); }

  setCategory(cat: ResourceCategory | 'All'): void {
    this.activeCategory.set(cat);
    this.visibleCount.set(PAGE_SIZE);
  }

  onSearch(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.searchQuery.set(val);
      this.visibleCount.set(PAGE_SIZE);
    }, 250);
  }

  clearSearch(inputEl: HTMLInputElement): void {
    inputEl.value = '';
    this.searchQuery.set('');
    this.visibleCount.set(PAGE_SIZE);
    inputEl.focus();
  }

  loadMore(): void {
    this.visibleCount.update(n => n + PAGE_SIZE);
  }

  open(r: Resource): void {
    this.resourceOpened.emit(r);
    this.close();
  }

  typeBadge(type: string): string {
    const m: Record<string, string> = {
      PDF: 'PDF Guide', MULTIPLE_CHOICE: 'Multiple Choice',
      SHORT_ANSWER: 'Flashcards', BUNDLE: 'Bundle',
    };
    return m[type] ?? type;
  }

  typeClass(type: string): string {
    const m: Record<string, string> = {
      PDF: 'type--pdf', MULTIPLE_CHOICE: 'type--mcq',
      SHORT_ANSWER: 'type--sa', BUNDLE: 'type--bundle',
    };
    return m[type] ?? '';
  }
}
