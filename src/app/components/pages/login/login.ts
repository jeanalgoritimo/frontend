import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

/**
 * Tela de login. Credenciais fixas (admin/admin) usadas apenas para fins
 * educacionais/demonstração — ver comentários em AuthService.
 */
@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    senha: ['', Validators.required],
  });

  // Usamos signals (em vez de campos simples) para que a UI reaja corretamente
  // em change detection zoneless após o retorno assíncrono do AuthService.
  readonly autenticando = signal(false);
  readonly senhaVisivel = signal(false);
  readonly mensagemErro = signal<string | null>(null);

  alternarVisibilidadeSenha(): void {
    this.senhaVisivel.update((visivel) => !visivel);
  }

  entrar(): void {
    if (this.form.invalid || this.autenticando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.mensagemErro.set(null);
    this.autenticando.set(true);
    const { usuario, senha } = this.form.getRawValue();

    this.authService.login(usuario, senha).subscribe({
      next: (sucesso) => {
        this.autenticando.set(false);
        if (sucesso) {
          this.router.navigate(['/dashboard']);
        } else {
          this.mensagemErro.set('Usuário ou senha inválidos.');
        }
      },
      error: () => {
        this.autenticando.set(false);
        this.mensagemErro.set('Usuário ou senha inválidos.');
      },
    });
  }
}
