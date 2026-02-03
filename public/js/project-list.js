const API_BASE = 'http://localhost/Hackdash-aiweekend/backend/public/';
const CURRENT_SLUG = "hola";

document.addEventListener('DOMContentLoaded', () => {
    const allProjectsGrid = document.getElementById('allProjectsGrid');
    const paginationControls = document.getElementById('paginationControls');
    let currentPage = 1;
    const projectsPerPage = 6;
    let cachedProjects = [];

    async function fetchDashboardsAndProjects() {
        try {
            allProjectsGrid.innerHTML = '<p>Cargando proyectos...</p>';
            const dashboardsResp = await fetch(`${API_BASE}dashboards`);
            if (!dashboardsResp.ok) {
                throw new Error(`Error dashboards ${dashboardsResp.status}`);
            }
            const dashboardsData = await dashboardsResp.json();
            if (!dashboardsData.success || !Array.isArray(dashboardsData.data) || dashboardsData.data.length === 0) {
                allProjectsGrid.innerHTML = '<p>No hay dashboards disponibles.</p>';
                return;
            }

            const firstDashboard = dashboardsData.data[0];
            const slug = firstDashboard.slug || firstDashboard.dashboard_slug || firstDashboard.id || '';
            if (!slug) {
                allProjectsGrid.innerHTML = '<p>No se pudo determinar el slug del dashboard.</p>';
                return;
            }

            const projectsResp = await fetch(`${API_BASE}project/getProjects?slug=${CURRENT_SLUG}`);
            if (!projectsResp.ok) {
                throw new Error(`Error projects ${projectsResp.status}`);
            }
            const projectsData = await projectsResp.json();
            if (!projectsData.success || !Array.isArray(projectsData.data)) {
                allProjectsGrid.innerHTML = '<p>Error al cargar proyectos.</p>';
                return;
            }

            cachedProjects = projectsData.data;
            currentPage = 1;
            renderPage();
        } catch (error) {
            console.error('Error fetching dashboards/projects:', error);
            allProjectsGrid.innerHTML = '<p>No se pudieron cargar los proyectos. Inténtalo de nuevo más tarde.</p>';
        }
    }

    function renderPage() {
        const totalPages = Math.max(1, Math.ceil(cachedProjects.length / projectsPerPage));
        const start = (currentPage - 1) * projectsPerPage;
        const end = start + projectsPerPage;
        const pageItems = cachedProjects.slice(start, end);
        renderProjects(pageItems);
        renderPagination(totalPages, currentPage);
    }

    function renderProjects(projects) {
        allProjectsGrid.innerHTML = '';
        if (!projects || projects.length === 0) {
            allProjectsGrid.innerHTML = '<p>No hay proyectos disponibles en este momento.</p>';
            return;
        }

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            const status = project.status === 'completed' ? 'status-completed' : 'status-in-progress';
            const statusText = project.status === 'completed' ? 'Completado' : 'En Progreso';
            const dashSlug = project.dashboard_slug || firstSafe(project.dashboard, 'slug') || '';
            const dashName = project.dashboard_name || firstSafe(project.dashboard, 'title') || dashSlug || 'Dashboard';
            
            // HTML structure for the new catalog design
            projectCard.innerHTML = `
                <div>
                    <h3>${escapeHtml(project.title || 'Proyecto sin Título')}</h3>
                    <p>${escapeHtml(project.description || 'Sin descripción.')}</p>
                </div>
                <div class="project-meta">
                    <span class="status ${status}">${statusText}</span>
                    <span class="dashboard-link">Dashboard: ${dashSlug ? `<a href="dashboard?slug=${encodeURIComponent(dashSlug)}">${escapeHtml(dashName)}</a>` : escapeHtml(dashName)}</span>
                </div>
                <a href="project-detail?id=${encodeURIComponent(project.id)}" class="btn-ver-mas">Ver detalles</a>
            `;
            allProjectsGrid.appendChild(projectCard);
        });
    }

    function renderPagination(totalPages, page) {
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-button';
        prevButton.disabled = page === 1;
        prevButton.textContent = 'Anterior';
        prevButton.addEventListener('click', () => {
            currentPage = Math.max(1, currentPage - 1);
            renderPage();
        });
        paginationControls.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'pagination-button';
            if (i === page) {
                pageButton.classList.add('active');
            }
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderPage();
            });
            paginationControls.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-button';
        nextButton.disabled = page === totalPages;
        nextButton.textContent = 'Siguiente';
        nextButton.addEventListener('click', () => {
            currentPage = Math.min(totalPages, currentPage + 1);
            renderPage();
        });
        paginationControls.appendChild(nextButton);
    }

    function firstSafe(obj, key) {
        return obj && obj[key] ? obj[key] : '';
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    fetchDashboardsAndProjects();
});