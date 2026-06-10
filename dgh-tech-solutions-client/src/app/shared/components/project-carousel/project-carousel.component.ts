import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models';
import { ProjectModalComponent } from '../project-modal/project-modal.component';

@Component({
  selector: 'app-project-carousel',
  standalone: true,
  imports: [RouterLink, ProjectModalComponent],
  templateUrl: './project-carousel.component.html',
  styleUrls: ['./project-carousel.component.scss'],
})
export class ProjectCarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewport') viewportRef!: ElementRef<HTMLElement>;

  // ── Data state ────────────────────────────────────────────────────────────
  projects  = signal<Project[]>([]);
  loading   = signal(true);
  error     = signal(false);

  // ── Modal state ───────────────────────────────────────────────────────────
  selectedProject = signal<Project | null>(null);

  // ── Carousel state ────────────────────────────────────────────────────────
  current   = signal(0);
  cols      = signal(3);
  viewportW = signal(0);
  paused    = signal(false);

  private readonly GAP   = 24;
  private readonly DELAY = 5000;
  private timer: ReturnType<typeof setInterval> | null = null;
  private touchStartX = 0;
  private touchStartY = 0;

  // ── Computed layout ───────────────────────────────────────────────────────
  maxIndex = computed(() => Math.max(0, this.projects().length - this.cols()));

  cardW = computed<number>(() => {
    const w = this.viewportW();
    if (!w) return 0;
    return (w - this.GAP * (this.cols() - 1)) / this.cols();
  });

  trackTransform = computed<string>(() => {
    const cw = this.cardW();
    if (!cw) return 'none';
    return `translateX(${-this.current() * (cw + this.GAP)}px)`;
  });

  trackWidth = computed<string>(() => {
    const cw = this.cardW();
    if (!cw) return 'auto';
    return `${this.projects().length * (cw + this.GAP) - this.GAP}px`;
  });

  cardWidthPx = computed<string>(() => {
    const cw = this.cardW();
    return cw ? `${cw}px` : '100%';
  });

  // One dot per valid scroll position, not one per project
  get dots(): number[] {
    const n = this.maxIndex() + 1;
    return n > 1 ? Array.from({ length: n }, (_, i) => i) : [];
  }

  readonly skeletons = [0, 1, 2];

  constructor(private projectSvc: ProjectService) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.measure();
    this.loadProjects();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.measure(), 0);
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  @HostListener('window:resize')
  onResize(): void { this.measure(); }

  // ── Data loading ──────────────────────────────────────────────────────────
  loadProjects(): void {
    this.loading.set(true);
    this.error.set(false);
    this.projectSvc.getFeatured().subscribe({
      next: (r) => {
        this.projects.set(r.data ?? []);
        this.loading.set(false);
        // Measure once the carousel DOM has been rendered
        setTimeout(() => {
          this.measure();
          if (this.projects().length > 1) this.startAutoplay();
        }, 0);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  retryLoad(): void { this.loadProjects(); }

  // ── Autoplay ──────────────────────────────────────────────────────────────
  pauseAutoplay():  void { this.paused.set(true);  this.stopAutoplay(); }
  resumeAutoplay(): void { this.paused.set(false); if (this.projects().length > 1) this.startAutoplay(); }

  private startAutoplay(): void {
    this.stopAutoplay();
    this.timer = setInterval(() => {
      this.current.update((c) => (c >= this.maxIndex() ? 0 : c + 1));
    }, this.DELAY);
  }

  private stopAutoplay(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  prev(): void {
    this.stopAutoplay();
    this.current.update((c) => Math.max(0, c - 1));
    if (!this.paused()) this.startAutoplay();
  }

  next(): void {
    this.stopAutoplay();
    this.current.update((c) => (c >= this.maxIndex() ? 0 : c + 1));
    if (!this.paused()) this.startAutoplay();
  }

  goTo(i: number): void {
    this.stopAutoplay();
    this.current.set(Math.max(0, Math.min(i, this.maxIndex())));
    if (!this.paused()) this.startAutoplay();
  }

  // ── Touch / swipe ─────────────────────────────────────────────────────────
  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.stopAutoplay();
  }

  onTouchEnd(e: TouchEvent): void {
    const dx = this.touchStartX - e.changedTouches[0].clientX;
    const dy = this.touchStartY - e.changedTouches[0].clientY;
    // Swipe only when horizontal movement clearly dominates vertical
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx > 0 ? this.next() : this.prev();
    } else {
      if (!this.paused()) this.startAutoplay();
    }
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  openModal(p: Project): void {
    this.selectedProject.set(p);
    this.pauseAutoplay();
  }

  closeModal(): void {
    this.selectedProject.set(null);
    if (!this.paused()) this.startAutoplay();
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.selectedProject()) return; // let modal handle keys when open
    if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private measure(): void {
    const w = window.innerWidth;
    this.cols.set(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    if (this.viewportRef?.nativeElement) {
      this.viewportW.set(this.viewportRef.nativeElement.offsetWidth);
    }
    this.current.set(Math.min(this.current(), this.maxIndex()));
  }
}
