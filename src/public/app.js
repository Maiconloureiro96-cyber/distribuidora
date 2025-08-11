// Configuração da API
const API_BASE_URL = '/api';

// Estado da aplicação
let currentPage = 'dashboard';
let currentOrderId = null;
let currentChatContact = null;
let ordersData = [];
let currentOrdersPage = 1;
const ordersPerPage = 10;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadDashboardData();
    setupLogoUpload();
}

// Event Listeners
function setupEventListeners() {
    // Navegação da sidebar
    document.querySelectorAll('.sidebar nav ul li').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page) {
                navigateToPage(page);
            }
        });
    });
    
    // Event listener para busca de produtos com Enter
    const productSearchInput = document.getElementById('product-search');
    if (productSearchInput) {
        productSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }

    // Botão "Ver Todos" do dashboard
    document.querySelector('.view-all').addEventListener('click', function() {
        const page = this.getAttribute('data-page');
        if (page) {
            navigateToPage(page);
        }
    });

    // Filtros de pedidos
    document.getElementById('apply-filters').addEventListener('click', applyOrderFilters);

    // Paginação
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));

    // Modais
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Clique fora do modal para fechar
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    });

    // Botões do modal de detalhes do pedido
    document.getElementById('print-order').addEventListener('click', printOrder);
    document.getElementById('update-status').addEventListener('click', showUpdateStatusModal);
    document.getElementById('confirm-status-update').addEventListener('click', confirmStatusUpdate);

    // Mudança de status no modal
    document.getElementById('new-status').addEventListener('change', function() {
        const cancelReasonGroup = document.getElementById('cancel-reason-group');
        if (this.value === 'cancelled') {
            cancelReasonGroup.style.display = 'block';
        } else {
            cancelReasonGroup.style.display = 'none';
        }
    });

    // Busca de clientes no chat
    document.querySelector('.chat-search input').addEventListener('input', searchChatContacts);

    // Botão ver pedidos do cliente
    document.getElementById('view-orders').addEventListener('click', viewCustomerOrders);
}

// Navegação entre páginas
function navigateToPage(page) {
    // Atualizar sidebar
    document.querySelectorAll('.sidebar nav ul li').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Mostrar página
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');

    currentPage = page;

    // Carregar dados específicos da página
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'pedidos':
            loadOrdersData();
            break;
        case 'conversas':
            loadChatContacts();
            break;
        case 'produtos':
            loadProductsData();
            break;
        case 'relatorios':
            loadReportsData();
            break;
        case 'configuracoes':
            loadSettingsData();
            break;
    }
}

// Upload de logo
function setupLogoUpload() {
    const logoPlaceholder = document.getElementById('logo-upload');
    const logoInput = document.getElementById('logo-input');

    logoPlaceholder.addEventListener('click', () => {
        logoInput.click();
    });

    logoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                logoPlaceholder.innerHTML = `<img src="${e.target.result}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">`;
                // Aqui você pode salvar o logo no servidor se necessário
            };
            reader.readAsDataURL(file);
        }
    });
}

// Dashboard
async function loadDashboardData() {
    try {
        // Carregar estatísticas
        const stats = await fetchAPI('/reports/daily');
        updateDashboardStats(stats);

        // Carregar pedidos recentes
        const recentOrders = await fetchAPI('/orders?limit=5');
        updateRecentOrdersTable(recentOrders.orders || []);
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showNotification('Erro ao carregar dados do dashboard', 'error');
    }
}

function updateDashboardStats(stats) {
    document.getElementById('pedidos-hoje').textContent = stats.totalOrders || 0;
    document.getElementById('faturamento-hoje').textContent = formatCurrency(stats.totalRevenue || 0);
    document.getElementById('em-entrega').textContent = stats.ordersOutForDelivery || 0;
    document.getElementById('clientes-ativos').textContent = stats.activeCustomers || 0;
}

function updateRecentOrdersTable(orders) {
    const tbody = document.getElementById('recent-orders-table');
    tbody.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer_name}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewOrderDetails(${order.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn print-btn" onclick="printOrderDirect(${order.id})">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Pedidos
async function loadOrdersData() {
    try {
        const response = await fetchAPI(`/orders?page=${currentOrdersPage}&limit=${ordersPerPage}`);
        ordersData = response.orders || [];
        updateOrdersTable(ordersData);
        updatePagination(response.pagination);
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        showNotification('Erro ao carregar pedidos', 'error');
    }
}

function updateOrdersTable(orders) {
    const tbody = document.getElementById('orders-table');
    tbody.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer_name}</td>
            <td>${order.customer_phone}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>${formatDate(order.created_at)}</td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewOrderDetails(${order.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="showUpdateStatusModal(${order.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn print-btn" onclick="printOrderDirect(${order.id})">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function applyOrderFilters() {
    const status = document.getElementById('status-filter').value;
    const date = document.getElementById('date-filter').value;
    
    let url = `/orders?page=1&limit=${ordersPerPage}`;
    
    if (status !== 'all') {
        url += `&status=${status}`;
    }
    
    if (date) {
        url += `&date=${date}`;
    }
    
    try {
        const response = await fetchAPI(url);
        ordersData = response.orders || [];
        updateOrdersTable(ordersData);
        updatePagination(response.pagination);
        currentOrdersPage = 1;
    } catch (error) {
        console.error('Erro ao filtrar pedidos:', error);
        showNotification('Erro ao filtrar pedidos', 'error');
    }
}

function changePage(direction) {
    const newPage = currentOrdersPage + direction;
    if (newPage >= 1) {
        currentOrdersPage = newPage;
        loadOrdersData();
    }
}

function updatePagination(pagination) {
    if (pagination) {
        document.getElementById('page-info').textContent = `Página ${pagination.currentPage} de ${pagination.totalPages}`;
        document.getElementById('prev-page').disabled = pagination.currentPage <= 1;
        document.getElementById('next-page').disabled = pagination.currentPage >= pagination.totalPages;
    }
}

// Detalhes do pedido
async function viewOrderDetails(orderId) {
    try {
        const order = await fetchAPI(`/orders/${orderId}`);
        currentOrderId = orderId;
        showOrderDetailsModal(order);
    } catch (error) {
        console.error('Erro ao carregar detalhes do pedido:', error);
        showNotification('Erro ao carregar detalhes do pedido', 'error');
    }
}

function showOrderDetailsModal(order) {
    const modalBody = document.getElementById('order-details-body');
    
    modalBody.innerHTML = `
        <div class="order-info">
            <div class="order-info-item">
                <span class="order-info-label">ID do Pedido:</span>
                <span class="order-info-value">#${order.id}</span>
            </div>
            <div class="order-info-item">
                <span class="order-info-label">Cliente:</span>
                <span class="order-info-value">${order.customer_name}</span>
            </div>
            <div class="order-info-item">
                <span class="order-info-label">Telefone:</span>
                <span class="order-info-value">${order.customer_phone}</span>
            </div>
            <div class="order-info-item">
                <span class="order-info-label">Endereço:</span>
                <span class="order-info-value">${order.delivery_address}</span>
            </div>
            <div class="order-info-item">
                <span class="order-info-label">Status:</span>
                <span class="order-info-value"><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></span>
            </div>
            <div class="order-info-item">
                <span class="order-info-label">Data:</span>
                <span class="order-info-value">${formatDate(order.created_at)}</span>
            </div>
        </div>
        
        <div class="order-items">
            <h3>Itens do Pedido</h3>
            ${order.items.map(item => `
                <div class="order-item">
                    <span class="order-item-name">${item.product_name}</span>
                    <span class="order-item-quantity">${item.quantity}x</span>
                    <span class="order-item-price">${formatCurrency(item.price * item.quantity)}</span>
                </div>
            `).join('')}
            
            <div class="order-total">
                <span>Total:</span>
                <span>${formatCurrency(order.total_amount)}</span>
            </div>
        </div>
        
        ${order.notes ? `
            <div class="order-notes">
                <h3>Observações</h3>
                <p>${order.notes}</p>
            </div>
        ` : ''}
    `;
    
    document.getElementById('order-details-modal').classList.add('active');
}

// Atualização de status
function showUpdateStatusModal(orderId = null) {
    if (orderId) {
        currentOrderId = orderId;
    }
    
    document.getElementById('update-status-modal').classList.add('active');
    document.getElementById('new-status').value = 'confirmed';
    document.getElementById('cancel-reason-group').style.display = 'none';
    document.getElementById('cancel-reason').value = '';
}

async function confirmStatusUpdate() {
    const newStatus = document.getElementById('new-status').value;
    const cancelReason = document.getElementById('cancel-reason').value;
    
    if (!currentOrderId) {
        showNotification('Erro: ID do pedido não encontrado', 'error');
        return;
    }
    
    try {
        const payload = { status: newStatus };
        if (newStatus === 'cancelled' && cancelReason) {
            payload.cancel_reason = cancelReason;
        }
        
        await fetchAPI(`/orders/${currentOrderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
        
        showNotification('Status do pedido atualizado com sucesso!', 'success');
        closeModal();
        
        // Recarregar dados
        if (currentPage === 'dashboard') {
            loadDashboardData();
        } else if (currentPage === 'pedidos') {
            loadOrdersData();
        }
        
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showNotification('Erro ao atualizar status do pedido', 'error');
    }
}

// Impressão de pedidos
async function printOrder() {
    if (!currentOrderId) {
        showNotification('Erro: ID do pedido não encontrado', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${currentOrderId}/pdf`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pedido-${currentOrderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('PDF do pedido baixado com sucesso!', 'success');
        } else {
            throw new Error('Erro ao gerar PDF');
        }
    } catch (error) {
        console.error('Erro ao imprimir pedido:', error);
        showNotification('Erro ao gerar PDF do pedido', 'error');
    }
}

async function printOrderDirect(orderId) {
    currentOrderId = orderId;
    await printOrder();
}

// Chat/Conversas
async function loadChatContacts() {
    try {
        // Buscar conversas recentes (simulado - você pode implementar um endpoint específico)
        const orders = await fetchAPI('/orders?limit=50');
        const contacts = extractUniqueContacts(orders.orders || []);
        updateChatContactsList(contacts);
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        showNotification('Erro ao carregar contatos', 'error');
    }
}

function extractUniqueContacts(orders) {
    const contactsMap = new Map();
    
    orders.forEach(order => {
        const key = order.customer_phone;
        if (!contactsMap.has(key)) {
            contactsMap.set(key, {
                name: order.customer_name,
                phone: order.customer_phone,
                lastMessage: `Último pedido: #${order.id}`,
                lastMessageTime: order.created_at,
                ordersCount: 1
            });
        } else {
            const contact = contactsMap.get(key);
            contact.ordersCount++;
            if (new Date(order.created_at) > new Date(contact.lastMessageTime)) {
                contact.lastMessage = `Último pedido: #${order.id}`;
                contact.lastMessageTime = order.created_at;
            }
        }
    });
    
    return Array.from(contactsMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
}

function updateChatContactsList(contacts) {
    const container = document.getElementById('chat-contacts');
    container.innerHTML = '';
    
    contacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'chat-contact';
        contactElement.innerHTML = `
            <div class="chat-contact-name">${contact.name}</div>
            <div class="chat-contact-preview">${contact.lastMessage}</div>
        `;
        
        contactElement.addEventListener('click', () => selectChatContact(contact));
        container.appendChild(contactElement);
    });
}

function selectChatContact(contact) {
    // Remover seleção anterior
    document.querySelectorAll('.chat-contact').forEach(c => c.classList.remove('active'));
    
    // Selecionar novo contato
    event.currentTarget.classList.add('active');
    currentChatContact = contact;
    
    // Atualizar header do chat
    document.getElementById('chat-contact-name').textContent = contact.name;
    document.getElementById('chat-contact-status').textContent = `${contact.phone} • ${contact.ordersCount} pedidos`;
    
    // Carregar mensagens (simulado)
    loadChatMessages(contact);
}

function loadChatMessages(contact) {
    const chatBody = document.getElementById('chat-body');
    
    // Simulação de mensagens - você pode implementar um sistema real de mensagens
    chatBody.innerHTML = `
        <div class="message message-incoming">
            <div>Olá! Gostaria de fazer um pedido.</div>
            <div class="message-time">10:30</div>
        </div>
        <div class="message message-outgoing">
            <div>Olá! Claro, posso te ajudar. Qual produto você gostaria?</div>
            <div class="message-time">10:31</div>
        </div>
        <div class="message message-incoming">
            <div>Queria uma cerveja Skol lata.</div>
            <div class="message-time">10:32</div>
        </div>
        <div class="message message-outgoing">
            <div>Perfeito! Temos Skol lata 350ml por R$ 3,50. Quantas você gostaria?</div>
            <div class="message-time">10:33</div>
        </div>
    `;
}

function searchChatContacts() {
    const searchTerm = event.target.value.toLowerCase();
    const contacts = document.querySelectorAll('.chat-contact');
    
    contacts.forEach(contact => {
        const name = contact.querySelector('.chat-contact-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            contact.style.display = 'block';
        } else {
            contact.style.display = 'none';
        }
    });
}

async function viewCustomerOrders() {
    if (!currentChatContact) {
        showNotification('Selecione um cliente primeiro', 'warning');
        return;
    }
    
    try {
        const orders = await fetchAPI(`/orders/phone/${currentChatContact.phone}`);
        // Navegar para a página de pedidos com filtro do cliente
        navigateToPage('pedidos');
        // Aqui você pode implementar um filtro específico por telefone
        showNotification(`Mostrando pedidos de ${currentChatContact.name}`, 'info');
    } catch (error) {
        console.error('Erro ao carregar pedidos do cliente:', error);
        showNotification('Erro ao carregar pedidos do cliente', 'error');
    }
}

// Utilitários
async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'confirmed': 'Confirmado',
        'preparing': 'Preparando',
        'out_for_delivery': 'Saiu para Entrega',
        'delivered': 'Entregue',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    currentOrderId = null;
}

function showNotification(message, type = 'info') {
    // Implementação simples de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#F44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#FF9800';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Produtos
async function loadProductsData() {
    try {
        const response = await fetchAPI('/products');
        const products = response.data || [];
        updateProductsGrid(products);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showNotification('Erro ao carregar produtos', 'error');
    }
}

function updateProductsGrid(products) {
    const grid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="empty-state">Nenhum produto encontrado</div>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <i class="fas fa-box"></i>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                <div class="product-stock">Estoque: ${product.stock}</div>
                <div class="product-category">${product.category || 'Sem categoria'}</div>
            </div>
            <div class="product-actions">
                <button class="btn-secondary" onclick="editProduct('${product.id}')">Editar</button>
                <button class="btn-danger" onclick="deleteProduct('${product.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

// Relatórios
async function loadReportsData() {
    try {
        const period = document.getElementById('report-period')?.value || 'daily';
        const response = await fetchAPI(`/reports/${period}`);
        updateReportContent(response);
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        showNotification('Erro ao carregar relatórios', 'error');
    }
}

function updateReportContent(reportData) {
    const content = document.getElementById('report-content');
    
    if (!reportData) {
        content.innerHTML = '<div class="empty-state">Nenhum dado encontrado para o período selecionado</div>';
        return;
    }
    
    content.innerHTML = `
        <div class="report-summary">
            <div class="report-card">
                <h3>Vendas Totais</h3>
                <div class="report-value">R$ ${(reportData.total_revenue || 0).toFixed(2)}</div>
            </div>
            <div class="report-card">
                <h3>Pedidos</h3>
                <div class="report-value">${reportData.total_orders || 0}</div>
            </div>
            <div class="report-card">
                <h3>Ticket Médio</h3>
                <div class="report-value">R$ ${(reportData.average_order_value || 0).toFixed(2)}</div>
            </div>
        </div>
        <div class="report-details">
            <h3>Produtos Mais Vendidos</h3>
            <div class="top-products">
                ${(reportData.top_products || []).map(product => `
                    <div class="product-item">
                        <span class="product-name">${product.product_name}</span>
                        <span class="product-quantity">${product.quantity_sold} vendidos</span>
                        <span class="product-revenue">R$ ${product.revenue.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Configurações
async function loadSettingsData() {
    try {
        // Verificar status do bot
        const botStatus = await fetchAPI('/bot/status');
        updateBotStatus(botStatus.connected || false);
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        updateBotStatus(false);
    }
}

function updateBotStatus(connected) {
    const statusElement = document.getElementById('bot-status');
    const connectButton = document.getElementById('connect-bot');
    
    if (connected) {
        statusElement.textContent = 'Conectado';
        statusElement.className = 'status-indicator connected';
        connectButton.textContent = 'Desconectar Bot';
    } else {
        statusElement.textContent = 'Desconectado';
        statusElement.className = 'status-indicator disconnected';
        connectButton.textContent = 'Conectar Bot';
    }
}

// Funções para produtos
async function editProduct(productId) {
    try {
        const response = await fetchAPI(`/products/${productId}`);
        const product = response.data;
        
        if (!product) {
            showNotification('Produto não encontrado', 'error');
            return;
        }
        
        // Criar modal de edição
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Editar Produto</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="edit-product-form">
                    <div class="form-group">
                        <label for="product-name">Nome:</label>
                        <input type="text" id="product-name" value="${product.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="product-description">Descrição:</label>
                        <textarea id="product-description">${product.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="product-price">Preço:</label>
                        <input type="number" id="product-price" value="${product.price}" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="product-stock">Estoque:</label>
                        <input type="number" id="product-stock" value="${product.stock}" required>
                    </div>
                    <div class="form-group">
                        <label for="product-category">Categoria:</label>
                        <input type="text" id="product-category" value="${product.category || ''}">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listener para o formulário
        document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedProduct = {
                name: document.getElementById('product-name').value,
                description: document.getElementById('product-description').value,
                price: parseFloat(document.getElementById('product-price').value),
                stock: parseInt(document.getElementById('product-stock').value),
                category: document.getElementById('product-category').value
            };
            
            try {
                await fetchAPI(`/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedProduct)
                });
                
                showNotification('Produto atualizado com sucesso!', 'success');
                closeModal();
                loadProductsData(); // Recarregar a lista
            } catch (error) {
                console.error('Erro ao atualizar produto:', error);
                showNotification('Erro ao atualizar produto', 'error');
            }
        });
        
    } catch (error) {
        console.error('Erro ao carregar produto:', error);
        showNotification('Erro ao carregar dados do produto', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }
    
    try {
        await fetchAPI(`/products/${productId}`, {
            method: 'DELETE'
        });
        
        showNotification('Produto excluído com sucesso!', 'success');
        loadProductsData(); // Recarregar a lista
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showNotification('Erro ao excluir produto', 'error');
    }
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Função para criar novo produto
function createNewProduct() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Novo Produto</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="new-product-form">
                <div class="form-group">
                    <label for="new-product-name">Nome:</label>
                    <input type="text" id="new-product-name" required>
                </div>
                <div class="form-group">
                    <label for="new-product-description">Descrição:</label>
                    <textarea id="new-product-description"></textarea>
                </div>
                <div class="form-group">
                    <label for="new-product-price">Preço:</label>
                    <input type="number" id="new-product-price" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="new-product-stock">Estoque:</label>
                    <input type="number" id="new-product-stock" required>
                </div>
                <div class="form-group">
                    <label for="new-product-category">Categoria:</label>
                    <input type="text" id="new-product-category">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn-primary">Criar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listener para o formulário
    document.getElementById('new-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newProduct = {
            name: document.getElementById('new-product-name').value,
            description: document.getElementById('new-product-description').value,
            price: parseFloat(document.getElementById('new-product-price').value),
            stock: parseInt(document.getElementById('new-product-stock').value),
            category: document.getElementById('new-product-category').value
        };
        
        try {
            await fetchAPI('/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct)
            });
            
            showNotification('Produto criado com sucesso!', 'success');
            closeModal();
            loadProductsData(); // Recarregar a lista
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            showNotification('Erro ao criar produto', 'error');
        }
    });
}

// Função para buscar produtos
async function searchProducts() {
    const searchTerm = document.getElementById('product-search').value;
    try {
        const response = await fetchAPI(`/products/search?name=${encodeURIComponent(searchTerm)}`);
        const products = response.data || [];
        updateProductsGrid(products);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        showNotification('Erro ao buscar produtos', 'error');
    }
}

// Função para gerar relatório
async function generateReport() {
    const period = document.getElementById('report-period').value;
    try {
        const response = await fetchAPI(`/reports/${period}`);
        updateReportContent(response);
        showNotification('Relatório atualizado!', 'success');
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showNotification('Erro ao gerar relatório', 'error');
    }
}

// Função para conectar/desconectar bot
async function toggleBotConnection() {
    const connectButton = document.getElementById('connect-bot');
    const isConnected = connectButton.textContent === 'Desconectar Bot';
    
    try {
        if (isConnected) {
            await fetchAPI('/bot/disconnect', { method: 'POST' });
            showNotification('Bot desconectado', 'info');
        } else {
            await fetchAPI('/bot/connect', { method: 'POST' });
            showNotification('Bot conectado com sucesso!', 'success');
        }
        loadSettingsData(); // Atualizar status
    } catch (error) {
        console.error('Erro ao alterar conexão do bot:', error);
        showNotification('Erro ao alterar conexão do bot', 'error');
    }
}

// CSS para animação da notificação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);