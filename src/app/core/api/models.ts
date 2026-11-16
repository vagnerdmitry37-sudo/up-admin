import { components } from './schema';

type Schema<Name extends keyof components['schemas']> = components['schemas'][Name];

export type Product = Schema<'ProductResponse'>;
export type ProductType = Schema<'ProductType'>;
export type ProductSortField = Schema<'ProductSortField'>;
export type ProductsPageResponse = Schema<'ProductsPageResponse'>;
export type CreateProductRequest = Schema<'CreateProductRequest'>;
export type UpdateProductRequest = Schema<'UpdateProductRequest'>;
export type Order = Schema<'OrderResponse'>;
export type OrdersPageResponse = Schema<'OrdersPageResponse'>;
export type CreateOrderRequest = Schema<'CreateOrderRequest'>;
export type CreateOrderItemRequest = Schema<'CreateOrderItemRequest'>;
export type UpdateOrderCustomerRequest = Schema<'UpdateOrderCustomerRequest'>;
export type Image = Schema<'ImageResponse'>;
export type UpdateImageOrderRequest = Schema<'UpdateImageOrderRequest'>;
export type AccessToken = Schema<'AccessTokenResponse'>;
export type UserProfile = Schema<'UserProfileResponse'>;
export type ProductTypeDefinition = Schema<'ProductTypeResponse'>;
export type AttributeDefinition = Schema<'AttributeDefinitionResponse'>;
