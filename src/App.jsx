import { useEffect, useState } from 'react';
import {
  login,
  register,
  getCategories,
  getProducts,
  createCategory,
  createProduct,
  inventoryAction,
  getHistory,
} from './api';

const TOKEN_KEY = 'smart-stock-token';

function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch (error) {
    return null;
  }
}

function apiErrorMessage(error) {
  return error?.message || String(error);
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [me, setMe] = useState(decodeJwt(token));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', categoryId: '' });
  const [inventoryForms, setInventoryForms] = useState({});
  const [history, setHistory] = useState({});

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      setMe(decodeJwt(token));
      loadCategories();
      loadProducts();
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setMe(null);
    }
  }, [token]);

  async function loadCategories() {
    try {
      const response = await getCategories(token);
      setCategories(response || []);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function loadProducts() {
    try {
      const response = await getProducts(token, search);
      setProducts(response || []);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  function handleInput(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCategoryInput(event) {
    const { name, value } = event.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleProductInput(event) {
    const { name, value } = event.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleInventoryInput(productId, event) {
    const { value } = event.target;
    setInventoryForms((prev) => ({ ...prev, [productId]: value }));
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await login(form.username, form.password);
      setToken(response.token);
      setMessage('Logged in successfully.');
      setForm({ username: '', password: '' });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await register(form.username, form.password);
      setMessage('Registration successful. You can now log in.');
      setForm({ username: '', password: '' });
      setActiveTab('login');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await createCategory(categoryForm, token);
      setCategoryForm({ name: '', description: '' });
      setMessage('Category created.');
      loadCategories();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await createProduct(
        {
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          categoryId: Number(productForm.categoryId),
        },
        token
      );
      setProductForm({ name: '', description: '', price: '', categoryId: '' });
      setMessage('Product created.');
      loadProducts();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleInventory(productId, action) {
    setError('');
    setMessage('');
    const quantity = Number(inventoryForms[productId] || 0);
    if (!quantity || quantity <= 0) {
      setError('Please enter a positive quantity.');
      return;
    }
    try {
      await inventoryAction(productId, action, quantity, token);
      setMessage(`Inventory ${action} completed.`);
      setInventoryForms((prev) => ({ ...prev, [productId]: '' }));
      loadProducts();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleLoadHistory(productId) {
    setError('');
    setMessage('');
    try {
      const response = await getHistory(productId, token);
      setHistory((prev) => ({ ...prev, [productId]: response || [] }));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  function handleLogout() {
    setToken('');
    setMessage('Logged out.');
  }

  return (
    <div className="app-shell">
      <div className="header">
        <div>
          <h1 className="title">Smart Stock Test UI</h1>
          <p>Backend must run at http://localhost:8080</p>
        </div>
        <div className="nav-buttons">
          <button onClick={() => setActiveTab('browse')}>Browse</button>
          {!token && <button onClick={() => setActiveTab('login')}>Login</button>}
          {!token && <button onClick={() => setActiveTab('register')}>Register</button>}
          {token && <button className="secondary" onClick={handleLogout}>Logout</button>}
        </div>
      </div>

      <div className="content">
        <div className="status-message">
          {me ? <div>Signed in as <strong>{me.username || me.sub || me.email}</strong> ({me.roles?.join(', ')})</div> : <div>Not signed in.</div>}
          {message && <div>{message}</div>}
          {error && <div className="error">{error}</div>}
        </div>

        {activeTab === 'login' && !token && (
          <section className="panel">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-row">
                <label>Username</label>
                <input type="text" name="username" value={form.username} onChange={handleInput} required />
              </div>
              <div className="form-row">
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleInput} required />
              </div>
              <button type="submit">Login</button>
            </form>
          </section>
        )}

        {activeTab === 'register' && !token && (
          <section className="panel">
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <div className="form-row">
                <label>Username</label>
                <input type="text" name="username" value={form.username} onChange={handleInput} required />
              </div>
              <div className="form-row">
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleInput} required />
              </div>
              <button type="submit">Register</button>
            </form>
          </section>
        )}

        <section className="panel">
          <h2>Browse Products</h2>
          <div className="form-row">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="button" onClick={loadProducts}>Refresh</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan="5">No products found.</td>
                </tr>
              )}
              {products.map((product) => (
                <tr key={product.id} className="product-row">
                  <td>{product.name}</td>
                  <td>{product.category?.name || 'Uncategorized'}</td>
                  <td>{product.stock ?? 'N/A'}</td>
                  <td>{product.price != null ? `$${product.price}` : '-'}</td>
                  <td>
                    <button type="button" onClick={() => handleLoadHistory(product.id)}>History</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {me?.roles?.includes('ROLE_ADMIN') && (
          <section className="panel admin-panel">
            <h2>Admin Controls</h2>
            <div className="form-row">
              <div>
                <h3>Create Category</h3>
                <form onSubmit={handleCreateCategory}>
                  <div className="form-row">
                    <label>Name</label>
                    <input type="text" name="name" value={categoryForm.name} onChange={handleCategoryInput} required />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea name="description" value={categoryForm.description} onChange={handleCategoryInput} />
                  </div>
                  <button type="submit">Create Category</button>
                </form>
              </div>
              <div>
                <h3>Create Product</h3>
                <form onSubmit={handleCreateProduct}>
                  <div className="form-row">
                    <label>Name</label>
                    <input type="text" name="name" value={productForm.name} onChange={handleProductInput} required />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea name="description" value={productForm.description} onChange={handleProductInput} />
                  </div>
                  <div className="form-row">
                    <label>Price</label>
                    <input type="number" step="0.01" name="price" value={productForm.price} onChange={handleProductInput} required />
                  </div>
                  <div className="form-row">
                    <label>Category</label>
                    <select name="categoryId" value={productForm.categoryId} onChange={handleProductInput} required>
                      <option value="">Pick a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit">Create Product</button>
                </form>
              </div>
            </div>
            <div>
              <h3>Inventory Actions</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.stock ?? 'N/A'}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={inventoryForms[product.id] || ''}
                          onChange={(event) => handleInventoryInput(product.id, event)}
                          placeholder="Qty"
                        />
                      </td>
                      <td>
                        <button type="button" onClick={() => handleInventory(product.id, 'add')}>Add</button>
                        <button type="button" onClick={() => handleInventory(product.id, 'remove')} className="secondary">Remove</button>
                        <button type="button" onClick={() => handleInventory(product.id, 'correct')} className="secondary">Correct</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {Object.entries(history).map(([productId, records]) => (
          <section className="panel" key={productId}>
            <h2>History for Product {productId}</h2>
            {records.length === 0 ? (
              <p>No inventory history available.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((entry, index) => (
                    <tr key={`${productId}-${index}`}>
                      <td>{entry.date || entry.timestamp || '—'}</td>
                      <td>{entry.type || entry.action || '—'}</td>
                      <td>{entry.quantity ?? '—'}</td>
                      <td>{entry.note || entry.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
