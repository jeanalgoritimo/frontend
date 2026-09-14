import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TemaAplicacao = 'claro' | 'escuro';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly temaSubject = new BehaviorSubject<TemaAplicacao>(this.temaInicial());
  readonly tema$ = this.temaSubject.asObservable();

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.aplicar(this.temaSubject.value);
  }

  alternarTema(): void {
    const tema = this.temaSubject.value === 'claro' ? 'escuro' : 'claro';
    localStorage.setItem('painel-gestao-tema', tema);
    this.temaSubject.next(tema);
    this.aplicar(tema);
  }

  private temaInicial(): TemaAplicacao {
    if (typeof localStorage === 'undefined') return 'claro';
    const salvo = localStorage.getItem('painel-gestao-tema');
    if (salvo === 'claro' || salvo === 'escuro') return salvo;
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  }

  private aplicar(tema: TemaAplicacao): void {
    this.document.documentElement.setAttribute('data-bs-theme', tema === 'escuro' ? 'dark' : 'light');
    this.document.body.classList.toggle('tema-escuro', tema === 'escuro');
  }
}
