// button
export type UIButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';

export type UIButtonSize = 'small' | 'medium' | 'large';

export type AuthUser = {
    id: number;
    username: string;
    email: string;
    token: string;
}

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
};
