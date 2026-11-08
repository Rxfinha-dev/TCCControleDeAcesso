import '@testing-library/jest-dom';

// O jsdom não implementa showModal/close de <dialog>: sem isso, Drawer e ConfirmDialog nunca abrem nos testes.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
}

beforeEach(() => {
  localStorage.clear();
});
