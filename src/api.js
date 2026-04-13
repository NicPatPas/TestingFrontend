const BASE_URL = '/api';

function jsonHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const payload = text && contentType.includes('application/json') ? JSON.parse(text) : text ? { message: text } : null;
  if (!response.ok) {
    throw new Error(payload?.message || response.statusText || 'Request failed');
  }
  return payload;
}

export async function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ username, password }),
  });
}

export async function register(username, password) {
  return request('/auth/register', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ username, password, role: 'USER' }),
  });
}

export async function getCategories(token) {
  return request('/categories', { headers: jsonHeaders(token) });
}

export async function getCategory(id, token) {
  return request(`/categories/${id}`, { headers: jsonHeaders(token) });
}

export async function createCategory(category, token) {
  return request('/admin/categories', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(category),
  });
}

export async function getProducts(token, query = '') {
  return request(`/products${query ? `?name=${encodeURIComponent(query)}` : ''}`, {
    headers: jsonHeaders(token),
  });
}

export async function getProduct(id, token) {
  return request(`/products/${id}`, { headers: jsonHeaders(token) });
}

export async function createProduct(product, token) {
  return request('/admin/products', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id, product, token) {
  return request(`/admin/products/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id, token) {
  return request(`/admin/products/${id}`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });
}

export async function inventoryAction(productId, action, quantity, token, changedBy) {
  return request(`/admin/inventory/${productId}/${action}`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify({ quantity, changedBy, note: 'web-ui' }),
  });
}

export async function getHistory(productId, token) {
  return request(`/inventory/history/${productId}`, { headers: jsonHeaders(token) });
}
