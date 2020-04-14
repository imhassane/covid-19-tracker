window.addEventListener('load', () => {
    const _graph = document.querySelector('#graph');

    const _chart = document.createElement('canvas');
    _chart.width = 360;
    _chart.height = 250;
    _graph.append(_chart);

    // Disable automatic style injection
    Chart.platform.disableCSSInjection = true;
    
    const chart = new Chart(_chart, {
        type: 'line',
        data: {
            labels: ["December", "January", "February", "March", "April"],
            datasets: [
                {
                    label: "Per month",
                    data: [300, 2000, 150000, 900000, 2000000]
                }
            ]
        },
        options: {
            scales: {
                yAxes: [{
                    stacked: true
                }]
            }
        }
    });
});