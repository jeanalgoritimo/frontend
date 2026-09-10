export type PerfilUsuario = 'admin' | 'usuario';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

export interface UsuarioEstatisticas {
  totalUsuarios: number;
  usuariosAtivos: number;
  totalAdmins: number;
}
