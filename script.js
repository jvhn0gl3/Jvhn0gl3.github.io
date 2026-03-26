let fundraisers = [];

function loadFromStorage() {
  const stored = localStorage.getItem('fundraiserHub');
  if (stored) {
    try {
      fundraisers = JSON.parse(stored);
    } catch(e) { console.warn(e); }
  }
  if (!fundraisers || fundraisers.length === 0) {
    fundraisers = [
      {
        id: "starter-001",
        title: "My First Campaign",
        category: "Community",
        description: "Help me make a difference! Edit this description, goal, and details to match your cause.",
        goal: 5000,
        raised: 0,
        link: "",
        image: "/cohesive.jpg"
      }
    ];
    saveToStorage();
  }
}

function saveToStorage() {
  localStorage.setItem('fundraiserHub', JSON.stringify(fundraisers));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

function renderDashboard() {
  const grid = document.getElementById('fundraisersGrid');
  const emptyDiv = document.getElementById('emptyMessage');
  
  if (!fundraisers.length) {
    grid.innerHTML = '';
    emptyDiv.style.display = 'block';
    document.getElementById('totalCampaignsCount').innerText = '0';
    document.getElementById('totalRaisedSum').innerText = '$0';
    return;
  }
  
  emptyDiv.style.display = 'none';
  
  const totalCampaigns = fundraisers.length;
  const totalRaised = fundraisers.reduce((sum, f) => sum + (f.raised || 0), 0);
  document.getElementById('totalCampaignsCount').innerText = totalCampaigns;
  document.getElementById('totalRaisedSum').innerText = `$${totalRaised.toLocaleString()}`;
  
  grid.innerHTML = fundraisers.map(f => {
    const percent = Math.min(100, Math.floor(((f.raised || 0) / (f.goal || 1)) * 100));
    const raisedFormatted = (f.raised || 0).toLocaleString();
    const goalFormatted = (f.goal || 0).toLocaleString();
    const linkHref = f.link && f.link.trim() !== "" ? f.link : "#";
    const linkTarget = (f.link && f.link.trim() !== "") ? '_blank' : '_self';
    const linkRel = (f.link && f.link.trim() !== "") ? 'noopener noreferrer' : '';
    const imageUrl = f.image && f.image.trim() !== "" ? f.image : null;
    
    return `
      <div class="card" data-id="${f.id}">
        ${imageUrl ? `<img class="card-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(f.title)}" onerror="this.style.display='none'">` : ''}
        <div class="card-header">
          <span class="fundraiser-title">${escapeHtml(f.title)}</span>
          <span class="category-tag">${escapeHtml(f.category || 'Other')}</span>
        </div>
        <div class="description">${escapeHtml(f.description || 'No description provided.')}</div>
        <div class="progress-section">
          <div class="goal-row">
            <span>${percent}% funded</span>
            <span>$${raisedFormatted} / $${goalFormatted}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>
        <div class="amount-row">
          <span class="raised">$${raisedFormatted} raised</span>
          <span class="target">goal $${goalFormatted}</span>
        </div>
        <div class="card-actions">
          <a href="${linkHref}" target="${linkTarget}" rel="${linkRel}" class="btn-link">🔗 Visit page</a>
          <button class="btn-donate donate-simulate" data-id="${f.id}">💖 Donate $50</button>
          <button class="edit-btn edit-fundraiser" data-edit-id="${f.id}">✏️ Edit</button>
        </div>
      </div>
    `;
  }).join('');
  
  document.querySelectorAll('.donate-simulate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      simulateDonation(id);
    });
  });
  
  document.querySelectorAll('.edit-fundraiser').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-edit-id');
      if(id) openModalForEdit(id);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
    return c;
  });
}

function simulateDonation(id) {
  const index = fundraisers.findIndex(f => f.id === id);
  if (index !== -1) {
    let currentRaised = fundraisers[index].raised || 0;
    const goal = fundraisers[index].goal || 1;
    let newRaised = currentRaised + 50;
    if (newRaised > goal) newRaised = goal;
    fundraisers[index].raised = newRaised;
    saveToStorage();
    renderDashboard();
    const msg = newRaised >= goal ? "🎉 Goal reached! Amazing support!" : "❤️ +$50 donated! Thank you!";
    showToast(msg);
  }
}

function showToast(msg) {
  let toast = document.getElementById('dynamicToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dynamicToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#1e293b';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '60px';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '500';
    toast.style.zIndex = '1100';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 2500);
}

function saveFundraiser(event) {
  event.preventDefault();
  const title = document.getElementById('campaignTitle').value.trim();
  if (!title) {
    alert('Please enter a campaign title');
    return;
  }
  const category = document.getElementById('campaignCategory').value;
  const description = document.getElementById('campaignDesc').value.trim();
  let goal = parseFloat(document.getElementById('campaignGoal').value);
  let raised = parseFloat(document.getElementById('campaignRaised').value);
  const link = document.getElementById('campaignLink').value.trim();
  const image = document.getElementById('campaignImage').value.trim();
  const editId = document.getElementById('editId').value;
  
  if (isNaN(goal) || goal <= 0) goal = 100;
  if (isNaN(raised)) raised = 0;
  if (raised > goal) raised = goal;
  
  if (editId) {
    const index = fundraisers.findIndex(f => f.id === editId);
    if (index !== -1) {
      fundraisers[index] = {
        ...fundraisers[index],
        title: title,
        category: category,
        description: description || "Help us make a difference!",
        goal: goal,
        raised: raised,
        link: link,
        image: image || null,
        id: editId
      };
      saveToStorage();
      renderDashboard();
      closeModal();
      showToast('✅ Fundraiser updated!');
    }
  }
}

function openModalForEdit(id) {
  const fundraiser = fundraisers.find(f => f.id === id);
  if (!fundraiser) return;
  document.getElementById('modalTitle').innerText = '✏️ Edit fundraiser';
  document.getElementById('campaignTitle').value = fundraiser.title;
  document.getElementById('campaignCategory').value = fundraiser.category || 'Other';
  document.getElementById('campaignDesc').value = fundraiser.description || '';
  document.getElementById('campaignGoal').value = fundraiser.goal;
  document.getElementById('campaignRaised').value = fundraiser.raised;
  document.getElementById('campaignLink').value = fundraiser.link || '';
  document.getElementById('campaignImage').value = fundraiser.image || '';
  document.getElementById('editId').value = id;
  document.getElementById('fundraiserModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('fundraiserModal').style.display = 'none';
  document.getElementById('fundraiserForm').reset();
  document.getElementById('editId').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderDashboard();
  
  const modal = document.getElementById('fundraiserModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const form = document.getElementById('fundraiserForm');
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
  form.addEventListener('submit', saveFundraiser);
});