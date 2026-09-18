import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

@Component({
  imports: [ModalComponent],
  template: `
    <app-modal ariaLabelledby="host-title" ariaDescribedby="host-desc" (close)="closed = true">
      <h5 id="host-title">Title</h5>
      <p id="host-desc">Description</p>
      <button type="button">Inner button</button>
    </app-modal>
  `,
})
class HostComponent {
  closed = false;
}

describe('ModalComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('projects content and binds aria-labelledby/aria-describedby', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Title');
    expect(fixture.nativeElement.textContent).toContain('Description');

    const modal: HTMLElement = fixture.nativeElement.querySelector('.modal');
    expect(modal.getAttribute('aria-labelledby')).toBe('host-title');
    expect(modal.getAttribute('aria-describedby')).toBe('host-desc');
  });

  it('emits close when the backdrop is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const modal: HTMLElement = fixture.nativeElement.querySelector('.modal');
    modal.click();

    expect(fixture.componentInstance.closed).toBe(true);
  });

  it('does not emit close when the dialog content is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('.modal-dialog');
    dialog.click();

    expect(fixture.componentInstance.closed).toBe(false);
  });

  it('emits close on Escape', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(fixture.componentInstance.closed).toBe(true);
  });
});
