import { TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BadgeComponent] });
  });

  it('renders the given label and applies the given variant class', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    fixture.componentInstance.label = 'In Progress';
    fixture.componentInstance.variant = 'badge-status-in-progress';
    fixture.detectChanges();

    const span: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(span.textContent?.trim()).toBe('In Progress');
    expect(span.classList.contains('badge-status-in-progress')).toBe(true);
    expect(span.classList.contains('badge')).toBe(true);
  });
});
