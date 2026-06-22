import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      gymId?: string;
    };
    accessToken: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    gymId?: string;
    accessToken: string;
    refreshToken: string;
    twoFaEnabled: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    gymId?: string;
    accessToken: string;
    refreshToken: string;
  }
}
