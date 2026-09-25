import 'virtual:uno.css';
import Alpine from 'alpinejs';
import htmx from 'htmx.org';
import { createStore } from './store.js';

window.htmx = htmx;
window.Alpine = Alpine;

Alpine.store('app', createStore());

// htmx handlers (preset save/delete) emit this to surface Laravel-side events as toasts
document.body.addEventListener('mewxus-toast', (e) => {
    Alpine.store('app').toast(e.detail.value, 'success');
});

Alpine.start();
