import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

// Access token TTL en segundos (API expira en 15min, refrescamos a los 14min)
const ACCESS_TOKEN_TTL = 14 * 60;

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  return data;
}

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
            accessTokenExpiry: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL,
            twoFaEnabled: data.user.twoFaEnabled,
          };
        } catch (err) {
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Primera vez — login
      if (user) {
        const u = user as unknown as {
          id: string;
          role: string;
          gymId?: string;
          accessToken: string;
          refreshToken: string;
          accessTokenExpiry: number;
        };
        token.id = u.id;
        token.role = u.role;
        token.gymId = u.gymId;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.accessTokenExpiry = u.accessTokenExpiry;
        return token;
      }

      // Token aún vigente
      const expiry = token.accessTokenExpiry as number | undefined;
      if (expiry && Math.floor(Date.now() / 1000) < expiry) {
        return token;
      }

      // Token expirado — intentar refresh
      const refreshToken = token.refreshToken as string | undefined;
      if (!refreshToken) return { ...token, error: 'RefreshTokenMissing' };

      const refreshed = await refreshAccessToken(refreshToken);
      if (!refreshed) return { ...token, error: 'RefreshTokenExpired' };

      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpiry: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL,
        error: undefined,
      };
    },
    session({ session, token }) {
      session.user.id = token.id;
      (session.user as { role: string }).role = token.role;
      (session.user as { gymId?: string }).gymId = token.gymId;
      (session as { accessToken: string }).accessToken = token.accessToken;
      if (token.error) {
        (session as { error?: string }).error = token.error as string;
      }
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
