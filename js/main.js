const TOKENS = {
    LAST_UPDATE: 'x-covid-tracker-last-update',
    DAILY:       'x-covid-tracker-daily',
    COUNTRIES:   'x-covid-tracker-countries',
    LOCATIONS:   'x-covid-tracker-location',
    LOCATION_TAB:'x-covid-tracker-location-tab'
};

const fetchData = async () => {
    try {
        const API           = "https://coronavirus-tracker-api.herokuapp.com/v2";
        const MATHROD_API   = "https://covid19.mathdro.id/api";

        const lastUpdate = localStorage.getItem(TOKENS.LAST_UPDATE);

        // Implementing the small cache system.
        const response  = await fetch(MATHROD_API);
        const data      = await response.json();
        localStorage.setItem(TOKENS.LAST_UPDATE, data.lastUpdate);

        // We update the datas only if they've changed.
        if(lastUpdate !== data.lastUpdate) {
            // Updating the last update time.
            localStorage.setItem(TOKENS.LAST_UPDATE, data.lastUpdate);

            // Getting the latest updates.
            const dailyResponse     = await fetch(`${MATHROD_API}/daily`);
            const countriesResponse = await fetch(`${MATHROD_API}/countries`);
            const locationsResponse = await fetch(`${API}/locations`);

            const dailyData     = await dailyResponse.json();
            const countriesData = await countriesResponse.json();
            const locationsData = await locationsResponse.json();

            // Saving updates to the storage.
            localStorage.setItem(TOKENS.DAILY,      JSON.stringify(dailyData));
            localStorage.setItem(TOKENS.COUNTRIES,  JSON.stringify(countriesData));
            localStorage.setItem(TOKENS.LOCATIONS,  JSON.stringify(locationsData));
            
            // Deleting the cached html table rows.
            localStorage.removeItem(TOKENS.LOCATION_TAB);
        }

    } catch(ex) {
        alert("erreur");
        console.log(ex);
    }
}

const applyUpdates = () => {
    const   _totalCases  = document.querySelector('#total-cases'),
            _totalDeaths = document.querySelector('#total-deaths'),
            _totalHealed = document.querySelector('#total-healed'),
            _tableData   = document.querySelector('#countries-data');

    const { latest, locations } = JSON.parse(localStorage.getItem(TOKENS.LOCATIONS));
    
    _totalCases.textContent  = latest.confirmed;
    _totalDeaths.textContent = latest.deaths;
    _totalHealed.textContent = latest.recovered;

    let cachedTable = localStorage.getItem(TOKENS.LOCATION_TAB);
    if(!cachedTable) {
        let line = `
            <tr>
                <td>World</td>
                <td>${latest.confirmed}</td>
                <td>${latest.deaths}</td>
                <td>${latest.recovered}</td>
                <td>world</td>
            </tr>
        `;
        for(let loc of locations) {
            line += `
                <tr>
                    <td>${loc.province.length > 0 ? loc.province + "("+loc.country_code+")" : loc.country}</td>
                    <td>${loc.latest.confirmed}</td>
                    <td>${loc.latest.deaths}</td>
                    <td>${loc.latest.recovered}</td>
                    <td>${loc.country_code}</td>
                </tr>
            `;
        }
        cachedTable = `
            <thead>
                <th>Name</th>
                <th>Total</th>
                <th>Deaths</th>
                <th>Recovered</th>
                <th>Code</th>
            </thead>
            <tbody>
                ${line}
            </tbody>
        `;
        localStorage.setItem(TOKENS.LOCATION_TAB, cachedTable);
    }
    _tableData.innerHTML = cachedTable;

}

const displayChart = (chart, data) => new Chart(chart, {
    options: {
        scales: {
            yAxes: [{
                stacked: true
            }]
        }
    },
    type: 'line',
    data
});

window.addEventListener('load', async () => {

    const _graph = document.querySelector('#graph');

    const _chart = document.createElement('canvas');
    _chart.width = 360;
    _chart.height = 250;
    _graph.append(_chart);

    // Disable automatic style injection
    Chart.platform.disableCSSInjection = true;

    let data = {
        labels: ["December", "January", "February", "March", "April"],
        datasets: [
            {
                label: "Per month",
                data: [300, 2000, 150000, 900000, 2000000]
            }
        ]
    }
    displayChart(_chart, data);
    await fetchData();
    applyUpdates();
    displayChart(_chart, data);
});