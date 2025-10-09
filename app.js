const API_URL = 'https://script.google.com/macros/s/AKfycbw5O3lfKdZnzM7SAfKzVBN67npszkwJOcWUKD-o3v7iBQE6BhJhoDC8tYzH0QOlGP7O/exec?sheet=Itasset';

class AssetManager {
  constructor() {
    this.assets = [];
    this.editingAssetId = null;
    this.nextId = 1;
    this.init();
  }

  async init() {
    await this.loadAssetsFromAPI();
    this.bindEvents();
    this.showView('dashboard');
  }

  bindEvents() {
    document.getElementById('asset-form').addEventListener('submit', (e) => this.handleFormSubmit(e));
    document.getElementById('search-input').addEventListener('input', () => this.filterAssets());
    document.getElementById('category-filter').addEventListener('change', () => this.filterAssets());
    document.getElementById('status-filter').addEventListener('change', () => this.filterAssets());
  }

  handleFormSubmit(e) {
    e.preventDefault();
    const formData = {
      "Asset Name *": document.getElementById('asset-name').value,
      "Asset Tag": document.getElementById('asset-tag').value,
      "Category *": document.getElementById('asset-category').value,
      "Status *": document.getElementById('asset-status').value,
      "Manufacturer": document.getElementById('asset-manufacturer').value,
      "Model": document.getElementById('asset-model').value,
      "Serial Number": document.getElementById('asset-serial').value,
      "Location": document.getElementById('asset-location').value,
      "Purchase Date": document.getElementById('asset-purchase-date').value,
      "Purchase Cost": parseFloat(document.getElementById('asset-cost').value) || 0,
      "Warranty Expiry": document.getElementById('asset-warranty').value,
      "Assigned To": document.getElementById('asset-assignee').value,
      "Notes": document.getElementById('asset-notes').value
    };

    if (this.editingAssetId) {
      this.updateAsset(this.editingAssetId, formData);
    } else {
      this.addAsset(formData);
    }
  }

  async loadAssetsFromAPI() {
    try {
      const res = await fetch(API_URL, { redirect: 'follow' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      this.assets = data.records || [];
      this.nextId = this.assets.length ? Math.max(...this.assets.map(a => Number(a.ID) || 0)) + 1 : 1;
      this.renderAssets();
      this.updateDashboard();
    } catch (err) {
      console.error("Failed to load assets:", err);
      this.showNotification("Failed to load data from server", "error");
    }
  }

  async addAsset(data) {
    try {
      data.ID = this.nextId++;
      data['Date Added'] = new Date().toISOString().split('T')[0]; // Auto-add date for sorting
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        this.showNotification("Asset added successfully!", "success");
        this.resetForm();
        this.showView('assets');
        await this.loadAssetsFromAPI();
      } else {
        this.showNotification("Failed to add asset: " + (result.error || 'Unknown error'), "error");
      }
    } catch (err) {
      console.error(err);
      this.showNotification("Failed to add asset", "error");
    }
  }

  async updateAsset(id, data) {
    try {
      const payload = { action: 'update', data: data };
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        this.showNotification("Asset updated successfully!", "success");
        this.resetForm();
        this.showView('assets');
        await this.loadAssetsFromAPI();
      } else {
        this.showNotification("Failed to update asset: " + (result.error || 'Unknown error'), "error");
      }
    } catch (err) {
      console.error(err);
      this.showNotification("Failed to update asset", "error");
    }
  }

  async deleteAsset(id) {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      const payload = { action: 'delete', data: { ID: id } };
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        this.showNotification("Asset deleted successfully!", "success");
        await this.loadAssetsFromAPI();
      } else {
        this.showNotification("Failed to delete asset: " + (result.error || 'Unknown error'), "error");
      }
    } catch (err) {
      console.error(err);
      this.showNotification("Failed to delete asset", "error");
    }
  }

  viewAsset(id) {
    const asset = this.assets.find(a => a.ID === id);
    if (!asset) return;

    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><strong class="text-gray-700 dark:text-gray-300">Name:</strong> <span class="text-gray-900 dark:text-white">${asset["Asset Name *"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Asset Tag:</strong> <span class="text-gray-900 dark:text-white">${asset["Asset Tag"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Category:</strong> <span class="text-gray-900 dark:text-white">${asset["Category *"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Status:</strong> <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusClass(asset["Status *"])}">${asset["Status *"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Manufacturer:</strong> <span class="text-gray-900 dark:text-white">${asset["Manufacturer"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Model:</strong> <span class="text-gray-900 dark:text-white">${asset["Model"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Serial Number:</strong> <span class="text-gray-900 dark:text-white">${asset["Serial Number"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Location:</strong> <span class="text-gray-900 dark:text-white">${asset["Location"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Purchase Date:</strong> <span class="text-gray-900 dark:text-white">${asset["Purchase Date"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Cost:</strong> <span class="text-gray-900 dark:text-white">${asset["Purchase Cost"] ? '$' + asset["Purchase Cost"].toFixed(2) : 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Warranty Expiry:</strong> <span class="text-gray-900 dark:text-white">${asset["Warranty Expiry"] || 'N/A'}</span></div>
        <div><strong class="text-gray-700 dark:text-gray-300">Assigned To:</strong> <span class="text-gray-900 dark:text-white">${asset["Assigned To"] || 'N/A'}</span></div>
      </div>
      ${asset["Notes"] ? `<div class="mt-4"><strong class="text-gray-700 dark:text-gray-300">Notes:</strong><p class="text-gray-900 dark:text-white mt-1">${asset["Notes"]}</p></div>` : ''}
    `;

    document.getElementById('asset-modal').classList.remove('hidden');
    document.getElementById('asset-modal').classList.add('flex');
  }

  editAsset(id) {
    const asset = this.assets.find(a => a.ID === id);
    if (!asset) return;

    this.editingAssetId = id;
    document.getElementById('asset-name').value = asset["Asset Name *"] || '';
    document.getElementById('asset-tag').value = asset["Asset Tag"] || '';
    document.getElementById('asset-category').value = asset["Category *"] || '';
    document.getElementById('asset-status').value = asset["Status *"] || '';
    document.getElementById('asset-manufacturer').value = asset["Manufacturer"] || '';
    document.getElementById('asset-model').value = asset["Model"] || '';
    document.getElementById('asset-serial').value = asset["Serial Number"] || '';
    document.getElementById('asset-location').value = asset["Location"] || '';
    document.getElementById('asset-purchase-date').value = asset["Purchase Date"] || '';
    document.getElementById('asset-cost').value = asset["Purchase Cost"] || '';
    document.getElementById('asset-warranty').value = asset["Warranty Expiry"] || '';
    document.getElementById('asset-assignee').value = asset["Assigned To"] || '';
    document.getElementById('asset-notes').value = asset["Notes"] || '';
    document.getElementById('form-submit-text').textContent = 'Update Asset';

    this.showView('add-asset');
  }

  filterAssets() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;

    const filteredAssets = this.assets.filter(asset => {
      const matchesSearch = !searchTerm ||
        (asset["Asset Name *"] && asset["Asset Name *"].toLowerCase().includes(searchTerm)) ||
        (asset["Asset Tag"] && asset["Asset Tag"].toLowerCase().includes(searchTerm)) ||
        (asset["Manufacturer"] && asset["Manufacturer"].toLowerCase().includes(searchTerm)) ||
        (asset["Model"] && asset["Model"].toLowerCase().includes(searchTerm)) ||
        (asset["Assigned To"] && asset["Assigned To"].toLowerCase().includes(searchTerm));

      const matchesCategory = !categoryFilter || asset["Category *"] === categoryFilter;
      const matchesStatus = !statusFilter || asset["Status *"] === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    this.renderAssets(filteredAssets);
  }

  renderAssets(assetsToRender = this.assets) {
    const tbody = document.getElementById('assets-table-body');
    const noAssetsDiv = document.getElementById('no-assets');

    if (assetsToRender.length === 0) {
      tbody.innerHTML = '';
      noAssetsDiv.classList.remove('hidden');
      return;
    }

    noAssetsDiv.classList.add('hidden');

    tbody.innerHTML = assetsToRender.map(asset => `
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900 dark:text-white">${asset["Asset Name *"]}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">${asset["Asset Tag"] || 'No tag'}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${asset["Category *"]}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusClass(asset["Status *"])}">
            ${asset["Status *"]}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${asset["Location"] || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${asset["Purchase Date"] || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="assetManager.viewAsset(${asset.ID})" class="text-primary hover:text-primary-dark mr-3">View</button>
          <button onclick="assetManager.editAsset(${asset.ID})" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
          <button onclick="assetManager.deleteAsset(${asset.ID})" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  getStatusClass(status) {
    const statusClasses = {
      'Active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Maintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Retired': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }

  updateDashboard() {
    const total = this.assets.length;
    const active = this.assets.filter(a => a["Status *"] === 'Active').length;
    const maintenance = this.assets.filter(a => a["Status *"] === 'Maintenance').length;
    const retired = this.assets.filter(a => a["Status *"] === 'Retired').length;

    document.getElementById('total-assets').textContent = total;
    document.getElementById('active-assets').textContent = active;
    document.getElementById('maintenance-assets').textContent = maintenance;
    document.getElementById('retired-assets').textContent = retired;

    const recentAssets = [...this.assets]
      .sort((a, b) => new Date(b["Date Added"] || new Date()) - new Date(a["Date Added"] || new Date()))
      .slice(0, 5);

    const recentAssetsDiv = document.getElementById('recent-assets');
    if (recentAssets.length === 0) {
      recentAssetsDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No assets added yet.</p>';
    } else {
      recentAssetsDiv.innerHTML = recentAssets.map(asset => `
        <div class="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded border">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">${asset["Asset Name *"]}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">${asset["Category *"]} • ${asset["Location"] || 'No location'}</div>
          </div>
          <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusClass(asset["Status *"])}">
            ${asset["Status *"]}
          </span>
        </div>
      `).join('');
    }
  }

  resetForm() {
    document.getElementById('asset-form').reset();
    this.editingAssetId = null;
    document.getElementById('form-submit-text').textContent = 'Add Asset';
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-transform transform translate-x-full`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
      view.classList.add('hidden');
    });

    document.getElementById(`${viewName}-view`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('bg-white', 'bg-opacity-20');
    });

    if (viewName === 'assets') {
      this.renderAssets();
    } else if (viewName === 'dashboard') {
      this.updateDashboard();
    } else if (viewName === 'add-asset') {
      this.resetForm();
    }
  }
}

function showView(viewName) {
  assetManager.showView(viewName);
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

function cancelForm() {
  assetManager.resetForm();
  showView('assets');
}

function closeModal() {
  document.getElementById('asset-modal').classList.add('hidden');
  document.getElementById('asset-modal').classList.remove('flex');
}

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (event.matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

const assetManager = new AssetManager();