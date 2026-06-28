import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../../core/models';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './project-modal.component.html',
  styleUrls: ['./project-modal.component.scss'],
})
export class ProjectModalComponent implements OnChanges, OnDestroy {
  @Input() project: Project | null = null;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('closeBtn') closeBtnRef?: ElementRef<HTMLButtonElement>;

  ngOnChanges(): void {
    if (this.project) {
      document.body.style.overflow = 'hidden';
      // Move focus to close button once the modal DOM has rendered
      setTimeout(() => this.closeBtnRef?.nativeElement.focus(), 40);
    } else {
      document.body.style.overflow = '';
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.project) this.closed.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }
}
