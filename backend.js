const API_URL = 'https://script.google.com/macros/s/AKfycbw5O3lfKdZnzM7SAfKzVBN67npszkwJOcWUKD-o3v7iBQE6BhJhoDC8tYzH0QOlGP7O/exec?sheet=Itasset';

async function loadAssetsFromAPI() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    assetManager.assets = data.records || [];
    assetManager.nextId = assetManager.assets.length ? Math.max(...assetManager.assets.map(a => Number(a.ID) || 0)) + 1 : 1;
    assetManager.renderAssets();
    assetManager.updateDashboard();
  } catch (err) {
    console.error("Failed to load assets:", err);
    assetManager.showNotification("Failed to load data from server", "error");
  }
}

async function addAsset(data) {
  try {
    data.ID = assetManager.nextId++;
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      assetManager.showNotification("Asset added successfully!", "success");
      assetManager.resetForm();
      assetManager.showView('assets');
      await loadAssetsFromAPI();
    }
  } catch (err) {
    console.error(err);
    assetManager.showNotification("Failed to add asset", "error");
  }
}

async function updateAsset(id, data) {
  try {
    data.ID = id;
    const res = await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      assetManager.showNotification("Asset updated successfully!", "success");
      assetManager.resetForm();
      assetManager.showView('assets');
      await loadAssetsFromAPI();
    } else {
      assetManager.showNotification("Failed to update asset", "error");
    }
  } catch (err) {
    console.error(err);
    assetManager.showNotification("Failed to update asset", "error");
  }
}

async function deleteAsset(id) {
  if (!confirm("Are you sure you want to delete this asset?")) return;

  try {
    const res = await fetch(API_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ID: id })
    });
    const result = await res.json();
    if (result.success) {
      assetManager.showNotification("Asset deleted successfully!", "success");
      await loadAssetsFromAPI();
    } else {
      assetManager.showNotification("Failed to delete asset", "error");
    }
  } catch (err) {
    console.error(err);
    assetManager.showNotification("Failed to delete asset", "error");
  }
}

AssetManager.prototype.loadAssetsFromAPI = loadAssetsFromAPI;
AssetManager.prototype.addAsset = addAsset;
AssetManager.prototype.updateAsset = updateAsset;
AssetManager.prototype.deleteAsset = deleteAsset;