import { useEffect, useRef, useState } from 'react';
import {
  login,
  register,
  getCategories,
  getProducts,
  createCategory,
  createProduct,
  deleteProduct,
  inventoryAction,
  getHistory,
} from './api';

const TOKEN_KEY = 'smart-stock-token';

function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function apiErrorMessage(error) {
  return error?.message || String(error);
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [me, setMe] = useState(() => decodeJwt(localStorage.getItem(TOKEN_KEY) || ''));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', categoryId: '' });
  const [inventoryForms, setInventoryForms] = useState({});
  const [history, setHistory] = useState({});
  const messageClearRef = useRef(null);

  function showMessage(msg) {
    setMessage(msg);
    setError('');
    clearTimeout(messageClearRef.current);
    messageClearRef.current = setTimeout(() => setMessage(''), 4000);
  }

  function showError(err) {
    setError(apiErrorMessage(err));
    setMessage('');
  }

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      setMe(decodeJwt(token));
      loadCategories(token);
      loadProducts(token, '');
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setMe(null);
      setCategories([]);
      setProducts([]);
    }
  }, [token]);

  async function loadCategories(tok = token) {
    try {
      const response = await getCategories(tok);
      setCategories(response || []);
    } catch (err) {
      showError(err);
    }
  }

  async function loadProducts(tok = token, q = search) {
    setLoading(true);
    try {
      const response = await getProducts(tok, q);
      setProducts(response || []);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
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
    setLoading(true);
    try {
      const response = await login(form.username, form.password);
      setToken(response.token);
      showMessage('Logged in successfully.');
      setForm({ username: '', password: '' });
      setActiveTab('browse');
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form.username, form.password);
      showMessage('Registration successful. You can now log in.');
      setForm({ username: '', password: '' });
      setActiveTab('login');
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await createCategory(categoryForm, token);
      setCategoryForm({ name: '', description: '' });
      showMessage('Category created.');
      loadCategories();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setLoading(true);
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
      showMessage('Product created.');
      loadProducts();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteProduct(id, token);
      showMessage(`"${name}" deleted.`);
      loadProducts();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInventory(productId, action) {
    const quantity = Number(inventoryForms[productId] || 0);
    if (!quantity || quantity <= 0) {
      showError(new Error('Please enter a positive quantity.'));
      return;
    }
    setLoading(true);
    try {
      await inventoryAction(productId, action, quantity, token, me?.sub || me?.username || 'admin');
      showMessage(`Inventory ${action} completed.`);
      setInventoryForms((prev) => ({ ...prev, [productId]: '' }));
      loadProducts();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadHistory(productId) {
    try {
      const response = await getHistory(productId, token);
      setHistory((prev) => ({ ...prev, [productId]: response || [] }));
    } catch (err) {
      showError(err);
    }
  }

  function dismissHistory(productId) {
    setHistory((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }

  function handleLogout() {
    setToken('');
    setHistory({});
    setMessage('Logged out.');
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    loadProducts(token, search);
  }

  const isAdmin = me?.roles?.includes('ROLE_ADMIN');
  const displayName = me?.username || me?.sub || me?.email;

  return (
    <div className="app-shell">
      <div className="header">
        <div>
          <h1 className="title">Smart Stock</h1>
          {me && (
            <p className="subtitle">
              Signed in as <strong>{displayName}</strong>
              {isAdmin && <span className="badge admin-badge">Admin</span>}
            </p>
          )}
        </div>
        <nav className="nav-buttons">
          <button onClick={() => setActiveTab('browse')} className={activeTab === 'browse' ? 'active' : ''}>Browse</button>
          {!token && <button onClick={() => setActiveTab('login')} className={activeTab === 'login' ? 'active' : ''}>Login</button>}
          {!token && <button onClick={() => setActiveTab('register')} className={activeTab === 'register' ? 'active' : ''}>Register</button>}
          {isAdmin && <button onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'active' : ''}>Admin</button>}
          {token && <button className="secondary" onClick={handleLogout}>Logout</button>}
        </nav>
      </div>

      {(message || error) && (
        <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
          <span>{error || message}</span>
          <button className="alert-close" onClick={() => { setMessage(''); setError(''); }}>×</button>
        </div>
      )}

      <div className="content">
        {activeTab === 'login' && !token && (
          <section className="panel">
            <h2>Login</h2>
            <form onSubmit={handleLogin} className="form-stack">
              <div className="field">
                <label>Username</label>
                <input type="text" name="username" value={form.username} onChange={handleInput} required autoFocus />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleInput} required />
              </div>
              <div>
                <button type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'register' && !token && (
          <section className="panel">
            <h2>Register</h2>
            <form onSubmit={handleRegister} className="form-stack">
              <div className="field">
                <label>Username</label>
                <input type="text" name="username" value={form.username} onChange={handleInput} required autoFocus />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleInput} required />
              </div>
              <div>
                <button type="submit" disabled={loading}>{loading ? 'Registering…' : 'Register'}</button>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'browse' && (
          <section className="panel">
            <div className="panel-header">
              <h2>Products</h2>
              {loading && <span className="spinner" />}
            </div>
            {!token ? (
              <p className="hint">Please log in to view products.</p>
            ) : (
              <>
                <form className="search-bar" onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button type="submit">Search</button>
                  {search && (
                    <button type="button" className="secondary" onClick={() => { setSearch(''); loadProducts(token, ''); }}>
                      Clear
                    </button>
                  )}
                </form>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Price</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 && !loading && (
                      <tr><td colSpan="6" className="empty-cell">No products found.</td></tr>
                    )}
                    {products.map((product) => {
                      const lowStock =
                        product.stock != null &&
                        product.lowStockThreshold != null &&
                        product.stock <= product.lowStockThreshold;
                      return (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td className="muted">{product.sku || '—'}</td>
                          <td>{product.categoryName || product.category?.name || 'Uncategorized'}</td>
                          <td>
                            {product.stock ?? 'N/A'}
                            {lowStock && <span className="badge low-stock-badge">Low</span>}
                          </td>
                          <td>{product.price != null ? `$${Number(product.price).toFixed(2)}` : '—'}</td>
                          <td>
                            <button type="button" className="secondary small" onClick={() => handleLoadHistory(product.id)}>
                              History
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </section>
        )}

        {activeTab === 'admin' && isAdmin && (
          <section className="panel">
            <h2>Admin Controls</h2>

            <div className="admin-forms">
              <div>
                <h3>Create Category</h3>
                <form onSubmit={handleCreateCategory} className="form-stack">
                  <div className="field">
                    <label>Name</label>
                    <input type="text" name="name" value={categoryForm.name} onChange={handleCategoryInput} required />
                  </div>
                  <div className="field">
                    <label>Description</label>
                    <textarea name="description" value={categoryForm.description} onChange={handleCategoryInput} />
                  </div>
                  <div>
                    <button type="submit" disabled={loading}>Create Category</button>
                  </div>
                </form>
              </div>
              <div>
                <h3>Create Product</h3>
                <form onSubmit={handleCreateProduct} className="form-stack">
                  <div className="field">
                    <label>Name</label>
                    <input type="text" name="name" value={productForm.name} onChange={handleProductInput} required />
                  </div>
                  <div className="field">
                    <label>Description</label>
                    <textarea name="description" value={productForm.description} onChange={handleProductInput} />
                  </div>
                  <div className="field">
                    <label>Price</label>
                    <input type="number" step="0.01" min="0" name="price" value={productForm.price} onChange={handleProductInput} required />
                  </div>
                  <div className="field">
                    <label>Category</label>
                    <select name="categoryId" value={productForm.categoryId} onChange={handleProductInput} required>
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button type="submit" disabled={loading}>Create Product</button>
                  </div>
                </form>
              </div>
            </div>

            <h3>Inventory Actions</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
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
                        onChange={(e) => handleInventoryInput(product.id, e)}
                        placeholder="Qty"
                        style={{ width: '80px' }}
                      />
                    </td>
                    <td className="action-cell">
                      <button type="button" onClick={() => handleInventory(product.id, 'add')} disabled={loading}>Add</button>
                      <button type="button" className="secondary" onClick={() => handleInventory(product.id, 'remove')} disabled={loading}>Remove</button>
                      <button type="button" className="secondary" onClick={() => handleInventory(product.id, 'correct')} disabled={loading}>Correct</button>
                      <button type="button" className="danger" onClick={() => handleDeleteProduct(product.id, product.name)} disabled={loading}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {Object.entries(history).map(([productId, records]) => {
          const product = products.find((p) => String(p.id) === productId);
          return (
            <section className="panel" key={productId}>
              <div className="panel-header">
                <h2>History — {product?.name || `Product ${productId}`}</h2>
                <button className="secondary small" onClick={() => dismissHistory(productId)}>Close</button>
              </div>
              {records.length === 0 ? (
                <p className="hint">No history available.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((entry, index) => {
                      const type = (entry.type || entry.action || '').toLowerCase();
                      return (
                        <tr key={`${productId}-${index}`}>
                          <td className="muted">{entry.date || entry.timestamp || entry.createdAt || '—'}</td>
                          <td>
                            <span className={`badge type-badge-${type}`}>
                              {entry.type || entry.action || '—'}
                            </span>
                          </td>
                          <td>{entry.quantity ?? '—'}</td>
                          <td className="muted">{entry.note || entry.description || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
