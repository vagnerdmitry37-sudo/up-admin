import { components } from './schema';

type Schema<Name extends keyof components['schemas']> = components['schemas'][Name];

export type Product = Schema<'ProductResponse'>;
export type ProductType = Schema<'ProductType'>;
export type CreateProductRequest = Schema<'CreateProductRequest'>;
export type AccessToken = Schema<'AccessTokenResponse'>;
export type UserProfile = Schema<'UserProfileResponse'>;
