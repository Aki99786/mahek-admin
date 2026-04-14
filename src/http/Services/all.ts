import { api } from '@/http/api';

/**
 * Fetches a list of Products pages using the provided query string.
 *
 * @param {string} [queryString] - Optional query string beginning with `?`.
 */
export const getProductsList = async (queryString = '') => api.get(`products/${queryString}`);

/**
 * Create a new product.
 *
 * @param {any} payload - Product data payload.
 *
 * @returns {Promise<any>} - Returns the API response promise.
 */
export const createProduct = async (payload: any) => api.post(`products/add-product`, payload);


/**
 * Delete a product based on their unique ID.
 * This function sends a DELETE request to remove
 * a specific product record from the backend.
 *
 * @param {string} id - Unique ID of the product to be deleted.
 *
 * @returns {Promise<any>} - Returns the API response promise.
 */
export const deleteProduct = async (id: string) => api.delete(`products/delete/${id}`);


/**
 * Get a product by ID.
 *
 * @param {string} id - Unique ID of the product.
 *
 * @returns {Promise<any>} - Returns the API response promise.
 */
export const getProductById = async (id: string) => api.get(`products/${id}`);

/**
 * Update an existing product.
 *
 * @param {string} id - Unique ID of the product to be updated.
 * @param {any} payload - Product data payload.
 *
 * @returns {Promise<any>} - Returns the API response promise.
 */
export const updateProduct = async (id: string, payload: any) => api.put(`products/update-product/${id}`, payload);


/**
 * Sends a DELETE request to the server to remove a product by its ID.
 *
 * @param id - The unique identifier of the product to be deleted.
 * @returns A promise that resolves with the API response after successful deletion.
 */
export const deleteProduct = async (id: string) => api.delete(`products/delete/${id}`);



// Users APIs Start

/**
 * Fetches a list of Users pages using the provided query string.
 *
 * @param {string} [queryString] - Optional query string beginning with `?`.
 */
export const getUsersList = async (queryString = '') => api.get(`admin/users/${queryString}`);

/**
 * Get an user by ID.
 *
 * @param {string} id - Unique ID of the user.
 *
 * @returns {Promise<any>} - Returns the API response promise.
 */
export const getUserById = async (id: string) => api.get(`admin/users/${id}`);


// Get DashBoard Data Start
/**
 * Fetches a Dashboard pages using the provided query string.
 *
 * @param {string} [queryString] - Optional query string beginning with `?`.
 */
export const getDashBoardData = async (queryString = '') => api.get(`admin/dashboard?${queryString}`);

// Orders APIs Start

/**
 * Fetches a list of Orders using the provided query string.
 *
 * @param {string} [queryString] - Optional query string beginning with `?`.
 */
export const getOrdersList = async (queryString = '') => api.get(`admin/orders/${queryString}`);


/**
 * Update order status.
 *
 * @param {string} id - Unique ID of the order.
 * @param {string} status - New status.
 *
 * @returns {Promise<any>} - Returns the API response promise.
 */
export const updateOrderStatus = async (id: string, status: string) => api.patch(`orders/${id}/status`, { orderStatus: status });


// Fetches the list of orders from the admin API.
// Accepts an optional query string for filters, pagination, or sorting.
export const getOrderList = async (queryString = '') => api.get(`admin/orders/${queryString}`);


// Fetches a single order by its unique ID from the admin API.
// Used to get detailed information of a specific order.
export const getOrderById = async (id: string) => api.get(`admin/orders/${id}`);









