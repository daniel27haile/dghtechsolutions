import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ElementRef, ViewChild, signal, computed, inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResourceService }       from '../../../core/services/resource.service';
import { PaymentService }        from '../../../core/services/payment.service';
import { UserAuthService }       from '../../../core/services/user-auth.service';
import { CartService }           from '../../../core/services/cart.service';
import { ToastService }          from '../../../core/services/toast.service';
import { Resource, ResourceCategory } from '../../../core/models';
import { ResourceCardComponent }        from './resource-card/resource-card.component';
import { ResourceSkeletonCardComponent } from './resource-skeleton-card/resource-skeleton-card.component';
import { ResourceContentsModalComponent } from './resource-contents-modal/resource-contents-modal.component';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [
    FormsModule,
    ResourceCardComponent,
    ResourceSkeletonCardComponent,
    ResourceContentsModalComponent,
  ],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss'],
})
export class ResourcesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('catList') catListRef!: ElementRef<HTMLUListElement>;

  private resourceSvc = inject(ResourceService);
  private paymentSvc  = inject(PaymentService);
  private userAuthSvc = inject(UserAuthService);
  private cartSvc     = inject(CartService);
  private toastSvc    = inject(ToastService);
  private router      = inject(Router);

  resources         = signal<Resource[]>([]);
  loading           = signal(true);
  errorMsg          = signal('');
  searchQuery       = signal('');
  activeCategory    = signal<ResourceCategory | 'All'>('All');
  canScrollLeft     = signal(false);
  canScrollRight    = signal(false);
  modalOpen         = signal(false);
  purchasedIds      = signal<Set<string>>(new Set());
  savedIds          = signal<Set<string>>(new Set());
  sortBy            = signal<'newest' | 'popular' | 'highest-rated' | 'price-asc' | 'price-desc'>('newest');
  priceFilter       = signal<'all' | 'free' | 'paid'>('all');
  levelFilter       = signal<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  /** Array used to render N skeleton cards during loading. */
  readonly skeletonItems = Array(6).fill(0);

  private _resizeObserver?: ResizeObserver;

  readonly categories: (ResourceCategory | 'All')[] = [
    'All',
    'Interview Questions',
    'Certification Questions',
    'Useful Resources',
    'Multiple Choice Practice',
    'Short Answer / Flashcards',
  ];

  readonly priceOptions: { label: string; value: 'all' | 'free' | 'paid' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Free', value: 'free' },
    { label: 'Paid', value: 'paid' },
  ];

  hasActiveFilters = computed(() =>
    this.searchQuery() !== '' || this.activeCategory() !== 'All' ||
    this.sortBy() !== 'newest' || this.priceFilter() !== 'all' || this.levelFilter() !== 'all'
  );

  filtered = computed(() => {
    const cat  = this.activeCategory();
    const q    = this.searchQuery().toLowerCase().trim();
    const pf   = this.priceFilter();
    const lf   = this.levelFilter();
    const sort = this.sortBy();

    let list = this.resources().filter(r => {
      const matchCat   = cat === 'All' || r.category === cat;
      const matchQ     = !q
        || r.title.toLowerCase().includes(q)
        || r.description.toLowerCase().includes(q)
        || r.category.toLowerCase().includes(q)
        || (r.tags ?? []).some(t => t.toLowerCase().includes(q));
      const matchPrice = pf === 'all' || (pf === 'free' ? !r.isPaid : r.isPaid);
      const lvl        = (r.level ?? '').toLowerCase();
      const matchLevel = lf === 'all'
        || (lf === 'beginner'     && lvl.includes('beginner'))
        || (lf === 'intermediate' && lvl.includes('intermediate'))
        || (lf === 'advanced'     && lvl.includes('advanced'));
      return matchCat && matchQ && matchPrice && matchLevel;
    });

    switch (sort) {
      case 'popular':
        list = [...list].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0)); break;
      case 'highest-rated':
        list = [...list].sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)); break;
      case 'price-asc':
        list = [...list].sort((a, b) =>
          (a.pricing?.salePrice ?? a.price ?? 0) - (b.pricing?.salePrice ?? b.price ?? 0)); break;
      case 'price-desc':
        list = [...list].sort((a, b) =>
          (b.pricing?.salePrice ?? b.price ?? 0) - (a.pricing?.salePrice ?? a.price ?? 0)); break;
      default: // newest
        list = [...list].sort((a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()); break;
    }

    return list;
  });

  ngOnInit(): void {
    this.resourceSvc.getPublished().subscribe({
      next: (res) => {
        this.resources.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load resources. Please try again later.');
        this.loading.set(false);
      },
    });

    if (this.userAuthSvc.isLoggedIn()) {
      this.paymentSvc.getMyLibrary().subscribe({
        next: (res) => {
          const data = res.data ?? { purchased: [], savedFree: [] };
          this.purchasedIds.set(new Set(data.purchased.map(i => i.resource._id!).filter(Boolean)));
          this.savedIds.set(new Set(data.savedFree.map(i => i.resource._id!).filter(Boolean)));
        },
        error: () => {},
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.checkScroll(), 0);
    this._resizeObserver = new ResizeObserver(() => this.checkScroll());
    this._resizeObserver.observe(this.catListRef.nativeElement);
  }

  ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
  }

  // ─── Resource navigation ───────────────────────────────────────────────────

  openResource(r: Resource): void {
    this.router.navigate(['/resources', r._id], { state: { resource: r } });
  }

  addResourceToCart(r: Resource): void {
    if (!r._id) return;
    this.cartSvc.addItem(r._id).subscribe({
      next: () => {
        this.toastSvc.show(`"${r.title}" added to cart!`);
        this.cartSvc.openDrawer();
      },
      error: (e: { error?: { message?: string } }) => {
        this.toastSvc.show(e?.error?.message || 'Could not add to cart.', 'error');
      },
    });
  }

  isPurchased(id?: string): boolean {
    return !!id && this.purchasedIds().has(id);
  }

  isSaved(id?: string): boolean {
    return !!id && this.savedIds().has(id);
  }

  saveResource(r: Resource): void {
    if (!r._id) return;
    if (!this.userAuthSvc.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.paymentSvc.saveResource(r._id).subscribe({
      next: () => {
        this.savedIds.update(s => new Set([...s, r._id!]));
        this.toastSvc.show(`"${r.title}" saved to your library!`);
      },
      error: (e: { error?: { message?: string } }) => {
        this.toastSvc.show(e?.error?.message || 'Could not save resource.', 'error');
      },
    });
  }

  unsaveResource(r: Resource): void {
    if (!r._id) return;
    this.paymentSvc.unsaveResource(r._id).subscribe({
      next: () => {
        this.savedIds.update(s => { const n = new Set(s); n.delete(r._id!); return n; });
        this.toastSvc.show(`"${r.title}" removed from library.`, 'info');
      },
      error: (e: { error?: { message?: string } }) => {
        this.toastSvc.show(e?.error?.message || 'Could not remove resource.', 'error');
      },
    });
  }

  // ─── Category tabs ─────────────────────────────────────────────────────────

  onCatScroll(): void { this.checkScroll(); }

  private checkScroll(): void {
    const el = this.catListRef?.nativeElement;
    if (!el) return;
    this.canScrollLeft.set(el.scrollLeft > 2);
    this.canScrollRight.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }

  scrollCats(dir: -1 | 1): void {
    this.catListRef?.nativeElement.scrollBy({ left: dir * 180, behavior: 'smooth' });
  }

  setCategory(cat: ResourceCategory | 'All'): void {
    this.activeCategory.set(cat);
    setTimeout(() => {
      const list = this.catListRef?.nativeElement;
      if (!list) return;
      const active = list.querySelector<HTMLElement>('.cat-tab.active');
      if (!active) return;
      const lr = list.getBoundingClientRect();
      const ar = active.getBoundingClientRect();
      list.scrollBy({ left: ar.left - lr.left - lr.width / 2 + ar.width / 2, behavior: 'smooth' });
    }, 0);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.activeCategory.set('All');
    this.sortBy.set('newest');
    this.priceFilter.set('all');
    this.levelFilter.set('all');
  }

  // ─── Contents modal (mobile) ───────────────────────────────────────────────

  openModal(): void  { this.modalOpen.set(true); }
  closeModal(): void { this.modalOpen.set(false); }
}
