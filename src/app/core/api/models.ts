import { components } from './schema';

type Schema<Name extends keyof components['schemas']> = components['schemas'][Name];

export type Product = Schema<'ProductResponse'>;
export type ProductDetails = Schema<'ProductDetailsResponse'>;
export type ProductType = Schema<'ProductType'>;
export type ProductSortField = Schema<'ProductSortField'>;
export type ProductsPageResponse = Schema<'ProductsPageResponse'>;
export type CreateProductRequest = Schema<'CreateProductRequest'>;
export type UpdateProductRequest = Schema<'UpdateProductRequest'>;
export type Order = Schema<'OrderResponse'>;
export type OrderItem = Schema<'OrderItemResponse'>;
export type OrderItemsPageResponse = Schema<'OrderItemsPageResponse'>;
export type OrdersPageResponse = Schema<'OrdersPageResponse'>;
export type CreateOrderRequest = Schema<'CreateOrderRequest'>;
export type UpdateOrderRequest = Schema<'UpdateOrderRequest'>;
export type CreateOrderItemRequest = Schema<'CreateOrderItemRequest'>;
export type UpdateOrderItemRequest = Schema<'UpdateOrderItemRequest'>;
export type Customer = Schema<'CustomerResponse'>;
export type CustomersPageResponse = Schema<'CustomersPageResponse'>;
export type CreateCustomerRequest = Schema<'CreateCustomerRequest'>;
export type UpdateCustomerRequest = Schema<'UpdateCustomerRequest'>;
export type Image = Schema<'ImageResponse'>;
export type UpdateImageOrderRequest = Schema<'UpdateImageOrderRequest'>;
export type AccessToken = Schema<'AccessTokenResponse'>;
export type UserProfile = Schema<'UserProfileResponse'>;
export type ProductTypeDefinition = Schema<'ProductTypeResponse'>;
export type AttributeDefinition = Schema<'AttributeDefinitionResponse'>;
