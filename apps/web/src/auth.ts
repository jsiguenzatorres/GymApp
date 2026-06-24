import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        totp: { label: 'Código 2FA', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const totpRaw = credentials.totp as string | undefined;
          const totpCode = totpRaw && /^\d{6}$/.test(totpRaw) ? totpRaw : undefined;

          const loginBody: Record<string, string> = {
            email: credentials.email as string,
            password: credentials.password as string,
          };
          if (totpCode) loginBody.totp = totpCode;

          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginBody),
          });

          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { message?: string };
            // Propagar mensajes de error específicos para manejo en el form
            throw new Error(body.message ?? 'Credenciales inválidas');
          }

          const data = (await res.json()) as {
            accessToken: string;
            refreshToken: string;
            user: {
              id: string;
              email: string;
              role: string;
              gymId?: string;
              firstName?: string;
              lastName?: string;
              twoFaEnabled: boolean;
            };
          };

          return {
            id: data.user.id,
            email: data.user.email,
            name:
              [data.user.firstName, data.user.lastName].filter(Boolean).join(' ') ||
              data.user.email,
            role: data.user.role,
            gymId: data.user.gymId,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            twoFaEnabled: data.user.twoFaEnabled,
          };
        } catch (err) {
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.gymId = (user as { gymId?: string }).gymId;
        token.accessToken = (user as { accessToken: string }).accessToken;
        token.refreshToken = (user as { refreshToken: string }).refreshToken;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      (session.user as { role: string }).role = token.role;
      (session.user as { gymId?: string }).gymId = token.gymId;
      (session as { accessToken: string }).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
});
