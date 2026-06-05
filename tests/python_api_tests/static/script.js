document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const viewPanels = document.querySelectorAll('.view-panel');
    const viewTitle = document.getElementById('view-title');
    const runBtn = document.getElementById('run-btn');
    const jsonOutput = document.getElementById('json-output');
    const statusBadge = document.getElementById('status-badge');

    let currentScenario = 'dashboard';

    // Navigation Logic
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const viewId = item.getAttribute('data-view');
            currentScenario = viewId;
            viewTitle.textContent = item.textContent.trim();

            viewPanels.forEach(panel => {
                if(panel.id === `view-${viewId}`) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
            
            // Reset output
            jsonOutput.textContent = "Ready to execute scenario...";
            statusBadge.classList.add('hidden');
        });
    });

    // Run Button Logic
    runBtn.addEventListener('click', async () => {
        jsonOutput.textContent = "Executing scenario...\nFetching data from API...";
        runBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4"></path></svg> Running`;
        statusBadge.classList.add('hidden');
        
        try {
            let endpoint = '';
            let method = 'GET';
            let payload = null;

            switch(currentScenario) {
                case 'auth':
                    endpoint = '/api/run-scenario/login';
                    method = 'POST';
                    payload = {
                        email: document.getElementById('login-email').value,
                        password: document.getElementById('login-password').value
                    };
                    break;
                case 'transactions':
                    endpoint = '/api/run-scenario/submit-tx';
                    method = 'POST';
                    payload = {
                        amount: document.getElementById('tx-amount').value,
                        customerId: document.getElementById('tx-customer').value,
                        mcc: document.getElementById('tx-mcc').value,
                        country: document.getElementById('tx-country').value
                    };
                    break;
                case 'dashboard':
                    endpoint = '/api/run-scenario/dashboard-stats';
                    break;
                case 'alerts':
                    endpoint = '/api/run-scenario/alerts';
                    break;
            }

            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            };
            if(payload) options.body = JSON.stringify(payload);

            const res = await fetch(endpoint, options);
            const responseData = await res.json();
            
            // Format Status
            statusBadge.classList.remove('hidden');
            statusBadge.textContent = `${responseData.status} Response`;
            
            if(responseData.status >= 200 && responseData.status < 300) {
                statusBadge.className = 'badge success';
            } else {
                statusBadge.className = 'badge error';
            }

            // Display JSON
            jsonOutput.textContent = JSON.stringify(responseData.data, null, 2);

        } catch (err) {
            jsonOutput.textContent = `Error executing scenario:\n${err.message}`;
            statusBadge.className = 'badge error';
            statusBadge.textContent = 'Network Error';
            statusBadge.classList.remove('hidden');
        } finally {
            runBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run Scenario`;
        }
    });
});
