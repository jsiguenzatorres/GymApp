import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** @Public() — marca el endpoint como público (sin JWT requerido) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
