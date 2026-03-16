document.addEventListener('DOMContentLoaded', () => {
    const machineTypeSelect = document.getElementById('machineType');
    const dynamicMetricsContainer = document.getElementById('dynamicMetrics');
    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('machineDataForm');

    // UI Feedback elements
    const nodeLocal = document.getElementById('nodeLocal');
    const nodeEdge = document.getElementById('nodeEdge');
    const nodeCloud = document.getElementById('nodeCloud');
    const decisionText = document.getElementById('decisionText');
    const toast = document.getElementById('toast');
    const backlogBody = document.getElementById('backlogBody');
    
    // Performance Chart Instance
    let perfChart;
    let chartTimeCounter = 0;

    // Define the metrics required for each machine type
    const machineMetricsMap = {
        cnc: [
            { id: 'cnc_temp', label: 'Temperature (°C)', type: 'number', min: 20, max: 120, unit: '°C' },
            { id: 'cnc_vib', label: 'Vibration (mm/s)', type: 'number', min: 0, max: 20, step: '0.1', unit: 'mm/s' },
            { id: 'cnc_spindle', label: 'Spindle Speed (RPM)', type: 'number', min: 0, max: 20000, unit: 'RPM' },
            { id: 'cnc_load', label: 'Motor Load (%)', type: 'number', min: 0, max: 100, unit: '%' }
        ],
        welding: [
            { id: 'weld_current', label: 'Welding Current (A)', type: 'number', min: 50, max: 500, unit: 'A' },
            { id: 'weld_temp', label: 'Machine Temp (°C)', type: 'number', min: 20, max: 150, unit: '°C' },
            { id: 'weld_power', label: 'Power Consumption (kW)', type: 'number', min: 0, max: 50, step: '0.1', unit: 'kW' }
        ],
        cutting: [
            { id: 'cut_speed', label: 'Cutting Speed (m/min)', type: 'number', min: 0, max: 150, unit: 'm/min' },
            { id: 'cut_temp', label: 'Machine Temp (°C)', type: 'number', min: 20, max: 130, unit: '°C' },
            { id: 'cut_energy', label: 'Energy Consum. (kWh)', type: 'number', min: 0, max: 100, step: '0.1', unit: 'kWh' }
        ],
        assembly: [
            { id: 'asm_queue', label: 'Queue Length (units)', type: 'number', min: 0, max: 50, unit: 'units' },
            { id: 'asm_ptime', label: 'Processing Time (s)', type: 'number', min: 1, max: 600, unit: 's' },
            { id: 'asm_idle', label: 'Idle Time (%)', type: 'number', min: 0, max: 100, unit: '%' }
        ],
        painting: [
            { id: 'paint_temp', label: 'Temperature (°C)', type: 'number', min: 15, max: 40, unit: '°C' },
            { id: 'paint_hum', label: 'Humidity (%)', type: 'number', min: 30, max: 80, unit: '%' },
            { id: 'paint_cycle', label: 'Cycle Time (s)', type: 'number', min: 60, max: 1200, unit: 's' }
        ]
    };

    // Initialize Chart
    function initChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        Chart.defaults.color = '#a0a0b0';
        Chart.defaults.font.family = 'Inter';

        perfChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'GBFS Response Time (ms)',
                        data: [],
                        borderColor: '#ff007f', // var(--gbfs-color)
                        backgroundColor: 'rgba(255, 0, 127, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'PSO Response Time (ms)',
                        data: [],
                        borderColor: '#00e5ff', // var(--pso-color)
                        backgroundColor: 'rgba(0, 229, 255, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#f0f0f5'
                        }
                    }
                }
            }
        });
    }

    // Call init on load
    initChart();

    // Handle Machine Type Selection Change
    machineTypeSelect.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        renderDynamicMetrics(selectedType);
        submitBtn.disabled = false;
        resetDashboard();
    });

    // Render appropriate input fields
    function renderDynamicMetrics(type) {
        dynamicMetricsContainer.innerHTML = '';
        const metrics = machineMetricsMap[type];

        if (!metrics) return;

        metrics.forEach(metric => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            // Auto fill max value to max or half logic for faster testing.
            const randomVal = (Math.random() * (metric.max - metric.min) + metric.min).toFixed(metric.step ? 1 : 0);

            formGroup.innerHTML = `
                <label for="${metric.id}">${metric.label}</label>
                <input type="${metric.type}" id="${metric.id}" name="${metric.id}" required 
                       min="${metric.min}" max="${metric.max}" ${metric.step ? `step="${metric.step}"` : ''} 
                       value="${randomVal}" placeholder="Enter ${metric.unit}">
            `;
            dynamicMetricsContainer.appendChild(formGroup);
        });
    }

    // Handle Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // UI loading state
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Processing at Edge...';
        submitBtn.querySelector('.loader-spinner').style.display = 'block';

        // Capture current selected machine type
        const currentMachineType = machineTypeSelect.options[machineTypeSelect.selectedIndex].text;

        // Simulate network latency & computation (1.5 seconds)
        setTimeout(() => {
            simulateTaskOffloading(currentMachineType);
            
            // Revert Button
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Send to Edge Server';
            submitBtn.querySelector('.loader-spinner').style.display = 'none';

            // Show success toast
            showToast('Task processed via Edge Server algorithms successfully!');
        }, 1500);
    });

    function resetDashboard() {
        nodeLocal.classList.remove('active');
        nodeEdge.classList.remove('active');
        nodeCloud.classList.remove('active');
        decisionText.textContent = 'Waiting for data submission...';
        
        // Reset bars
        document.querySelectorAll('.bar').forEach(bar => bar.style.width = '0%');
        document.querySelectorAll('.labels span span[id^="val"]').forEach(lbl => lbl.textContent = '0');
    }

    function simulateTaskOffloading(machineTypeName) {
        // 1. Task Offloading Decision Simulation
        // For visual sake, randomizing where the task is processed, though in real life 
        // it relates to the input weights.
        const r = Math.random();
        let decisionNode = '';
        let nodeShort = '';
        let nodeClass = '';

        if (r < 0.3) {
            decisionNode = 'local';
            nodeShort = 'Local Machine';
            nodeClass = 'node-loc';
            nodeLocal.classList.add('active');
            nodeEdge.classList.remove('active');
            nodeCloud.classList.remove('active');
            decisionText.textContent = 'Decision: Process on Local Machine';
        } else if (r < 0.8) {
            decisionNode = 'edge';
            nodeShort = 'Edge Server';
            nodeClass = 'node-edg';
            nodeLocal.classList.remove('active');
            nodeEdge.classList.add('active');
            nodeCloud.classList.remove('active');
            decisionText.textContent = 'Decision: Offload to Edge Server for lower latency';
        } else {
            decisionNode = 'cloud';
            nodeShort = 'Cloud Server';
            nodeClass = 'node-cld';
            nodeLocal.classList.remove('active');
            nodeEdge.classList.remove('active');
            nodeCloud.classList.add('active');
            decisionText.textContent = 'Decision: Offload to Cloud Server (Heavy computation)';
        }

        // 2. Algorithm Performance Simulation (GBFS vs PSO)
        // Usually, PSO explores better than GBFS but might take slightly higher initial response/computation time
        // However, PSO yields better resource utilization.
        
        // Latency (ms) - lower is better. Max scale ~ 200ms
        const lat_gbfs = Math.floor(Math.random() * 50) + 30;
        const lat_pso = Math.floor(Math.random() * 40) + 20; // PSO finds a slightly better path
        
        // Response time (ms) - Max scale ~ 500ms
        const rt_gbfs = lat_gbfs + Math.floor(Math.random() * 100) + 50;
        const rt_pso = lat_pso + Math.floor(Math.random() * 80) + 60; // PSO might have slightly higher computation overhead but lower transmission path
        
        // Resource Utilization (%) - Max scale 100
        const res_gbfs = Math.floor(Math.random() * 30) + 60; // 60-90
        const res_pso = Math.floor(Math.random() * 20) + 40; // 40-60 (Better load balancing)
        
        // Throughput (Tasks/s) - Max scale ~ 1000
        const thr_gbfs = Math.floor(Math.random() * 300) + 400; // 400-700
        const thr_pso = Math.floor(Math.random() * 200) + 650; // 650-850 (Better overall throughput)

        updateAnalyticsBar('latency', lat_gbfs, lat_pso, 200);
        updateAnalyticsBar('responseTime', rt_gbfs, rt_pso, 500);
        updateAnalyticsBar('resource', res_gbfs, res_pso, 100);
        updateAnalyticsBar('throughput', thr_gbfs, thr_pso, 1000);

        // 3. Update Chart
        updateChartData(rt_gbfs, rt_pso);

        // 4. Update Backlog Table
        addBacklogEntry(machineTypeName, nodeShort, nodeClass, lat_gbfs, lat_pso);
    }

    function updateChartData(rt_gbfs, rt_pso) {
        chartTimeCounter++;
        perfChart.data.labels.push(`T${chartTimeCounter}`);
        perfChart.data.datasets[0].data.push(rt_gbfs);
        perfChart.data.datasets[1].data.push(rt_pso);

        // Keep only last 10 points
        if (perfChart.data.labels.length > 10) {
            perfChart.data.labels.shift();
            perfChart.data.datasets[0].data.shift();
            perfChart.data.datasets[1].data.shift();
        }

        perfChart.update();
    }

    function addBacklogEntry(machine, nodeStr, nodeCls, gbfsLat, psoLat) {
        // Remove empty row text if it exists
        const emptyRow = backlogBody.querySelector('.empty-row');
        if (emptyRow) emptyRow.remove();

        const tr = document.createElement('tr');
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        tr.innerHTML = `
            <td>${timeStr}</td>
            <td><strong>${machine}</strong></td>
            <td><span class="node-badge ${nodeCls}">${nodeStr}</span></td>
            <td>${gbfsLat} ms</td>
            <td>${psoLat} ms</td>
            <td><span class="status-badge status-success">Completed</span></td>
        `;

        // Prepend to top
        backlogBody.insertBefore(tr, backlogBody.firstChild);

        // Keep maximum 10 tasks in backlog
        if (backlogBody.children.length > 10) {
            backlogBody.removeChild(backlogBody.lastChild);
        }
    }

    function updateAnalyticsBar(metricId, gbfsVal, psoVal, maxVal) {
        // ID Mapping: e.g., latencyGbfs, valLatGbfs
        let lblPrefix = '';
        if (metricId === 'latency') lblPrefix = 'Lat';
        if (metricId === 'responseTime') lblPrefix = 'Rt';
        if (metricId === 'resource') lblPrefix = 'Res';
        if (metricId === 'throughput') lblPrefix = 'Thr';

        const gbfsPct = (gbfsVal / maxVal) * 100;
        const psoPct = (psoVal / maxVal) * 100;

        document.getElementById(`${metricId}Gbfs`).style.width = `${gbfsPct}%`;
        document.getElementById(`${metricId}Pso`).style.width = `${psoPct}%`;

        document.getElementById(`val${lblPrefix}Gbfs`).textContent = gbfsVal;
        document.getElementById(`val${lblPrefix}Pso`).textContent = psoVal;
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
});
