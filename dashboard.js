(() => {
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
if (!loggedInUser) {
    window.location.replace('login.html?returnTo=dashboard.html');
    return;
}
const isAdmin = loggedInUser.role === 'admin';
const mainContent = document.querySelector('.main-content');
const customerDashboard = document.getElementById('customerDashboard');
const accountView = document.getElementById('accountSettingsSection');
const adminViews = document.querySelectorAll('.admin-view');
const navButtons = document.querySelectorAll('.dashboard-nav');
const fallbackImage = 'user.png';

function switchView(viewName) {
    mainContent.hidden = viewName !== 'overview' || document.body.classList.contains('is-customer');
    customerDashboard.hidden = viewName !== 'customer-home';
    accountView.hidden = viewName !== 'account';
    adminViews.forEach((view) => {
        if (view !== accountView) {
            view.hidden = view.id !== `${viewName}View`;
        }
    });
    navButtons.forEach((button) => {
        const active = button.dataset.view === viewName;
        button.classList.toggle('is-active', active);
        if (active) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
        }
    });
}

navButtons.forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
document.querySelectorAll('[data-view]:not(.dashboard-nav)').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view));
});
document.getElementById('accountSettingsLink').addEventListener('click', () => switchView('account'));
document.getElementById('returnToDashboardBtn').addEventListener('click', () => {
    switchView(document.body.classList.contains('is-customer') ? 'customer-home' : 'overview');
});

function renderCustomerOrders(targetId, emptyId, customerOrders) {
    const body = document.getElementById(targetId);
    const emptyState = document.getElementById(emptyId);
    body.replaceChildren();
    const table = body.closest('table');
    table.hidden = customerOrders.length === 0;
    emptyState.hidden = customerOrders.length > 0;

    customerOrders.forEach((order) => {
        const row = document.createElement('tr');
        const date = new Date(order.completedAt || order.createdAt);
        const values = [
            order.id || 'Order',
            (Array.isArray(order.items) ? order.items : [])
                .map(item => `${item.name || 'Product'} × ${Number(item.quantity) || 1}`)
                .join(', ') || 'Order items',
            Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(),
            `$${(Number(order.total) || 0).toFixed(2)}`
        ];
        values.forEach((value) => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        const status = order.status || 'Processing';
        badge.className = `status-pill ${status.toLowerCase().replace(/\s+/g, '-')}`;
        badge.textContent = status;
        statusCell.appendChild(badge);
        row.appendChild(statusCell);
        body.appendChild(row);
    });
}

const customerOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]')
    .filter(order => order.username === loggedInUser.username)
    .sort((left, right) => new Date(right.completedAt || right.createdAt) - new Date(left.completedAt || left.createdAt));
renderCustomerOrders('customerRecentOrdersBody', 'customerRecentOrdersEmpty', customerOrders.slice(0, 5));
renderCustomerOrders('customerAllOrdersBody', 'customerAllOrdersEmpty', customerOrders);

const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
const customers = allUsers.filter(user => user.role !== 'admin');
const customerMetrics = document.getElementById('customerMetrics');
const customersBody = document.getElementById('customersTableBody');
const customersEmpty = document.getElementById('customersEmpty');
const customersTable = customersBody.closest('table');

function addMetric(container, label, value, detail) {
    const article = document.createElement('article');
    article.className = 'report-metric';
    const title = document.createElement('span');
    title.textContent = label;
    const number = document.createElement('strong');
    number.textContent = value;
    const note = document.createElement('small');
    note.textContent = detail;
    article.append(title, number, note);
    container.appendChild(article);
}

addMetric(customerMetrics, 'Registered customers', String(customers.length), 'Accounts stored on this browser');
addMetric(
    customerMetrics,
    'Administrator accounts',
    String(allUsers.filter(user => user.role === 'admin').length),
    'Not shown in the customer directory'
);

function renderCustomers(searchTerm = '') {
    const query = searchTerm.trim().toLowerCase();
    const filtered = customers.filter(user =>
        [user.firstName, user.lastName, user.username, user.email]
            .some(value => String(value || '').toLowerCase().includes(query))
    );
    customersBody.replaceChildren();

    filtered.forEach((user) => {
        const row = document.createElement('tr');
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Customer';
        [name, user.username || '—', user.email || '—'].forEach((value) => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'status-pill status-active';
        badge.textContent = 'Registered';
        statusCell.appendChild(badge);
        row.appendChild(statusCell);
        customersBody.appendChild(row);
    });

    customersTable.hidden = filtered.length === 0;
    customersEmpty.hidden = filtered.length > 0;
    customersEmpty.textContent = customers.length === 0
        ? 'No customer accounts yet. New customer signups will appear here.'
        : 'No customers match your search.';
}

renderCustomers();
document.getElementById('customerSearch').addEventListener('input', event => renderCustomers(event.target.value));

const orders = Array.from(document.querySelectorAll('.orders-table tr[id^="order"]')).map((row) => {
    const cells = row.cells;
    return {
        id: cells[0].textContent.trim(),
        product: cells[2].textContent.trim(),
        quantity: Number(cells[4].textContent.trim()),
        unitPrice: cells[5].textContent.trim(),
        customer: cells[7].textContent.trim(),
        status: cells[8].textContent.trim()
    };
});
const reportsBody = document.getElementById('reportsTableBody');
const statusFilter = document.getElementById('reportStatusFilter');
const counts = orders.reduce((result, order) => {
    const status = order.status.toLowerCase();
    result[status] = (result[status] || 0) + 1;
    return result;
}, {});
const totalUnits = orders.reduce((total, order) => total + order.quantity, 0);
const grossOrderValue = orders.reduce(
    (total, order) => total + order.quantity * Number(order.unitPrice.replace(/[^0-9.]/g, '')),
    0
);
const reportMetrics = document.getElementById('reportMetrics');
addMetric(reportMetrics, 'Orders in report', String(orders.length), 'Sample orders');
addMetric(reportMetrics, 'Units ordered', totalUnits.toLocaleString(), 'Across listed orders');
addMetric(reportMetrics, 'Gross order value', `$${grossOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Sample order quantities × unit prices');
addMetric(reportMetrics, 'Delivered', String(counts.delivered || 0), 'Orders completed');
addMetric(reportMetrics, 'In progress', String((counts.shipped || 0) + (counts['in transit'] || 0)), 'Shipped or in transit');

function renderReport(status = 'all') {
    reportsBody.replaceChildren();
    orders.filter(order => status === 'all' || order.status.toLowerCase() === status)
        .forEach((order) => {
            const row = document.createElement('tr');
            [order.id, order.product, String(order.quantity), order.unitPrice, order.customer].forEach((value) => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            const statusCell = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = `status-pill ${order.status.toLowerCase().replace(/\s+/g, '-')}`;
            badge.textContent = order.status;
            statusCell.appendChild(badge);
            row.appendChild(statusCell);
            reportsBody.appendChild(row);
        });
}

renderReport();
statusFilter.addEventListener('change', () => renderReport(statusFilter.value));
document.getElementById('exportOrdersBtn').addEventListener('click', () => {
    const rows = [['Order', 'Product', 'Quantity', 'Unit price', 'Customer', 'Status']];
    orders.filter(order => statusFilter.value === 'all' || order.status.toLowerCase() === statusFilter.value)
        .forEach(order => rows.push([order.id, order.product, order.quantity, order.unitPrice, order.customer, order.status]));
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const download = document.createElement('a');
    download.href = url;
    download.download = 'cybexhark-orders-report.csv';
    document.body.appendChild(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const preferenceKey = 'dashboardPreferences';
const preferences = JSON.parse(localStorage.getItem(preferenceKey) || '{}');
const themeSelector = document.getElementById('themeSelector');
document.querySelector('#settingsView .dashboard-page-heading > div > p:last-child').textContent =
    isAdmin
        ? 'Choose how the admin dashboard looks and which updates you want to receive.'
        : 'Personalize your dashboard and choose the updates you want to receive.';
const notificationPreferences = {
    email: document.getElementById('emailNotifications'),
    sms: document.getElementById('smsNotifications'),
    products: document.getElementById('newproductNotifications')
};
themeSelector.value = preferences.theme === 'light' ? 'light' : 'dark';
Object.entries(notificationPreferences).forEach(([key, input]) => {
    input.checked = Boolean(preferences[key]);
});
document.body.dataset.theme = themeSelector.value;
themeSelector.addEventListener('change', () => {
    document.body.dataset.theme = themeSelector.value;
});
document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const updatedPreferences = { theme: themeSelector.value };
    Object.entries(notificationPreferences).forEach(([key, input]) => {
        updatedPreferences[key] = input.checked;
    });
    localStorage.setItem(preferenceKey, JSON.stringify(updatedPreferences));
    const message = document.getElementById('settingsSaveMessage');
    message.textContent = 'Preferences saved on this device.';
    window.setTimeout(() => { message.textContent = ''; }, 3000);
});

const profileName = document.getElementById('profileName');
const profileRole = document.getElementById('profileRole');
const profilePicture = document.getElementById('profilePicture');
const coverPhoto = document.getElementById('coverPhoto');
const sidebarName = document.getElementById('sidebarName');
const sidebarRole = document.getElementById('sidebarRole');
const sidebarAvatar = document.getElementById('sidebarAvatar');

function persistUser(updatedUser, previousUsername = updatedUser.username) {
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(user => user.username === previousUsername);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        localStorage.setItem('users', JSON.stringify(users));
    }
    if (previousUsername !== updatedUser.username) {
        const customerOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
        let ordersChanged = false;
        customerOrders.forEach(order => {
            if (order.username === previousUsername) {
                order.username = updatedUser.username;
                ordersChanged = true;
            }
        });
        if (ordersChanged) {
            localStorage.setItem('customerOrders', JSON.stringify(customerOrders));
        }
        const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder') || 'null');
        if (pendingOrder && pendingOrder.username === previousUsername) {
            pendingOrder.username = updatedUser.username;
            localStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));
        }
    }
}

function displayProfile(user) {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
    profileName.textContent = fullName;
    profileRole.textContent = user.role === 'admin' ? 'Administrator' : 'Customer';
    document.getElementById('currentUsername').value = user.username || '';
    document.getElementById('currentEmail').value = user.email || '';
    profilePicture.src = user.profilePicture || fallbackImage;
    sidebarAvatar.src = user.profilePicture || fallbackImage;
    sidebarName.textContent = fullName;
    sidebarRole.textContent = user.role === 'admin' ? 'Administrator' : 'Customer';
    coverPhoto.style.backgroundImage = `url("${user.coverPhoto || 'gym.jpg'}")`;
}

displayProfile(loggedInUser);
document.body.classList.toggle('is-customer', !isAdmin);
document.body.classList.toggle('is-admin', isAdmin);
if (isAdmin) {
    switchView('overview');
} else {
    document.getElementById('customerDashboardTitle').textContent =
        `Welcome back, ${loggedInUser.firstName || loggedInUser.username}`;
    switchView('customer-home');
}

function saveUploadedImage(file, property) {
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        const updatedUser = { ...loggedInUser, [property]: reader.result };
        persistUser(updatedUser);
        displayProfile(updatedUser);
    });
    reader.readAsDataURL(file);
}

document.getElementById('uploadProfilePicture').addEventListener('change', event => {
    saveUploadedImage(event.target.files[0], 'profilePicture');
});
document.getElementById('uploadCoverPhoto').addEventListener('change', event => {
    saveUploadedImage(event.target.files[0], 'coverPhoto');
});

const changeModal = document.getElementById('changeModal');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const currentPasswordInput = document.getElementById('currentPasswordInput');
const currentPasswordContainer = document.getElementById('currentPasswordContainer');
let currentField = '';

function openChangeModal(field, title, isPassword = false) {
    currentField = field;
    modalTitle.textContent = title;
    modalInput.type = isPassword ? 'password' : 'text';
    modalInput.placeholder = isPassword ? 'Enter a new password' : `Enter ${title.toLowerCase()}`;
    currentPasswordContainer.style.display = isPassword ? 'block' : 'none';
    currentPasswordInput.value = '';
    modalInput.value = '';
    changeModal.style.display = 'flex';
    modalInput.focus();
}

document.getElementById('changeUsernameBtn').addEventListener('click', () => {
    openChangeModal('username', 'Change username');
});
document.getElementById('changeEmailBtn').addEventListener('click', () => {
    openChangeModal('email', 'Change email address');
});
document.getElementById('accountChangePasswordBtn').addEventListener('click', () => {
    openChangeModal('password', 'Change password', true);
});
document.getElementById('saveModalBtn').addEventListener('click', () => {
    const value = modalInput.value.trim();
    if (!value) {
        alert('Please enter a value.');
        return;
    }
    if (currentField === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        alert('Please enter a valid email address.');
        return;
    }
    const previousUsername = loggedInUser.username;
    if (currentField === 'password') {
        if (currentPasswordInput.value !== loggedInUser.password) {
            alert('Current password is incorrect.');
            return;
        }
        if (value.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }
        loggedInUser.password = value;
    } else if (currentField === 'username') {
        const duplicate = JSON.parse(localStorage.getItem('users') || '[]')
            .some(user => user.username === value && user.username !== loggedInUser.username);
        if (duplicate) {
            alert('That username is already taken.');
            return;
        }
        loggedInUser.username = value;
    } else if (currentField === 'email') {
        loggedInUser.email = value;
    }
    persistUser(loggedInUser, previousUsername);
    displayProfile(loggedInUser);
    changeModal.style.display = 'none';
});
document.getElementById('closeModalBtn').addEventListener('click', () => {
    changeModal.style.display = 'none';
});
changeModal.addEventListener('click', event => {
    if (event.target === changeModal) {
        changeModal.style.display = 'none';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    const recentAccounts = JSON.parse(localStorage.getItem('recentAccounts') || '[]');
    if (!recentAccounts.some(account => account.username === loggedInUser.username)) {
        recentAccounts.push({
            username: loggedInUser.username,
            name: `${loggedInUser.firstName || ''} ${loggedInUser.lastName || ''}`.trim()
        });
        localStorage.setItem('recentAccounts', JSON.stringify(recentAccounts));
    }
    localStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('pendingCartProduct');
    window.location.href = 'login.html';
});

if (window.Chart) {
    Chart.defaults.color = '#b8b8b8';
    Chart.defaults.font.family = '"Segoe UI", sans-serif';
    const axisStyle = {
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        ticks: { color: '#999999' }
    };
    const chartConfigs = [
        {
            id: 'salesChart',
            type: 'doughnut',
            labels: ['Wrist straps', 'Lever belt', 'Speed rope', 'Whey protein', 'Creatine', 'Dumbbells', 'T-shirt'],
            values: [120, 90, 150, 200, 180, 95, 110]
        },
        {
            id: 'orderChart',
            type: 'bar',
            labels: ['Jan', 'Feb', 'Mar', 'Apr'],
            values: [100, 150, 120, 180]
        },
        {
            id: 'revenueChart',
            type: 'line',
            labels: ['2022', '2023', '2024', '2025'],
            values: [1000, 7000, 8000, 15000]
        },
        {
            id: 'customerChart',
            type: 'doughnut',
            labels: ['Active', 'Inactive', 'New'],
            values: [100, 50, 200]
        }
    ];
    const chartColors = ['#e11935', '#a80016', '#740010', '#4a0b13', '#c63a4c', '#8f2635', '#d98b96'];

    chartConfigs.forEach((config) => {
        const canvas = document.getElementById(config.id);
        const isDoughnut = config.type === 'doughnut';
        new Chart(canvas, {
            type: config.type,
            data: {
                labels: config.labels,
                datasets: [{
                    label: config.id === 'salesChart' ? 'Units sold' : config.id === 'orderChart' ? 'Orders' : config.id === 'revenueChart' ? 'Revenue ($)' : 'Customers',
                    data: config.values,
                    backgroundColor: isDoughnut ? chartColors : 'rgba(168, 0, 22, 0.42)',
                    borderColor: isDoughnut ? '#141414' : '#e11935',
                    borderWidth: isDoughnut ? 2 : 2,
                    fill: config.type === 'line',
                    tension: 0.35,
                    borderRadius: config.type === 'bar' ? 7 : undefined
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: isDoughnut ? 'bottom' : 'top', labels: { usePointStyle: true, padding: 16 } }
                },
                scales: isDoughnut ? {} : { x: axisStyle, y: { ...axisStyle, beginAtZero: true } }
            }
        });
    });
}

document.querySelectorAll('.todo-list input[type="checkbox"]').forEach((checkbox, index) => {
    const key = `dashboardTodo${index}`;
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) {
        checkbox.checked = savedValue === 'true';
    }
    checkbox.addEventListener('change', () => localStorage.setItem(key, String(checkbox.checked)));
});
})();
