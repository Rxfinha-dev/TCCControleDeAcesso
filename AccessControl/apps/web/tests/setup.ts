import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Com vários workers em paralelo, a tela pode levar mais que o 1 s padrão para aparecer: sem folga, os testes falham por tempo.
configure({ asyncUtilTimeout: 5000 });
jest.setTimeout(30_000);

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
