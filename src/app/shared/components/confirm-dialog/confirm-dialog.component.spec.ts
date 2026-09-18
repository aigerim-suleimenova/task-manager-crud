import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] });
  });

  function createFixture(overrides: Partial<ConfirmDialogComponent> = {}) {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentInstance.title = 'Delete Task?';
    fixture.componentInstance.message = 'Are you sure?';
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the given title and message', () => {
    const fixture = createFixture({ title: 'Delete Task?', message: 'Are you sure you want to delete "X"?' });

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Delete Task?');
    expect(text).toContain('Are you sure you want to delete "X"?');
  });

  it('emits confirm when the confirm (Delete) button is clicked', () => {
    const fixture = createFixture();
    let confirmed = false;
    fixture.componentInstance.confirm.subscribe(() => (confirmed = true));

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const deleteButton = buttons.find((button) => button.textContent?.trim() === 'Delete');
    deleteButton?.click();

    expect(confirmed).toBe(true);
  });

  it('emits cancel when the Cancel button is clicked', () => {
    const fixture = createFixture();
    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => (cancelled = true));

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const cancelButton = buttons.find((button) => button.textContent?.trim() === 'Cancel');
    cancelButton?.click();

    expect(cancelled).toBe(true);
  });

  it('emits cancel when the backdrop is clicked, not confirm', () => {
    const fixture = createFixture();
    let cancelled = false;
    let confirmed = false;
    fixture.componentInstance.cancel.subscribe(() => (cancelled = true));
    fixture.componentInstance.confirm.subscribe(() => (confirmed = true));

    const modal: HTMLElement = fixture.nativeElement.querySelector('.modal');
    modal.click();

    expect(cancelled).toBe(true);
    expect(confirmed).toBe(false);
  });
});
