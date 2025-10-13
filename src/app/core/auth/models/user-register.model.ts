export interface userRegister {
  nom: string | null;
  prenom: string | null;
  pseudo: string | null;
  email: string | null;
  password: string | null;
  role: 'user';
}
