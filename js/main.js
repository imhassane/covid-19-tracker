const TOKENS = {
    LAST_UPDATE: 'x-covid-tracker-last-update',
    DAILY:       'x-covid-tracker-daily',
    COUNTRIES:   'x-covid-tracker-countries',
    LOCATIONS:   'x-covid-tracker-location',
    LOCATION_TAB:'x-covid-tracker-location-tab',
    CHART_DATA:  'x-covid-tracker-chart-data',
    RECOVERED:   'x-covid-tracker-recovered'
};

const fetchData = async () => {
    try {
        const API           = "https://coronavirus-tracker-api.herokuapp.com/v2";
        const MATHROD_API   = "https://covid19.mathdro.id/api";

        const lastUpdate = sessionStorage.getItem(TOKENS.LAST_UPDATE);

        // Implementing the small cache system.
        const response  = await fetch(MATHROD_API);
        const data      = await response.json();
        sessionStorage.setItem(TOKENS.LAST_UPDATE, data.lastUpdate);

        // We update the datas only if they've changed.
        if(lastUpdate !== data.lastUpdate) {
            
            // Getting the latest updates.
            const dailyResponse     = await fetch(`${MATHROD_API}/daily`);
            const countriesResponse = await fetch(`${MATHROD_API}/countries`);
            const locationsResponse = await fetch(`${API}/locations`);

            const dailyData     = await dailyResponse.json();
            const countriesData = await countriesResponse.json();
            const locationsData = await locationsResponse.json();

            // Saving updates to the storage.
            sessionStorage.setItem(TOKENS.RECOVERED,  JSON.stringify(data));
            sessionStorage.setItem(TOKENS.DAILY,      JSON.stringify(dailyData));
            sessionStorage.setItem(TOKENS.COUNTRIES,  JSON.stringify(countriesData));
            sessionStorage.setItem(TOKENS.LOCATIONS,  JSON.stringify(locationsData));
            
            // Deleting the cached html table rows and the chart data.
            sessionStorage.removeItem(TOKENS.LOCATION_TAB);
            sessionStorage.removeItem(TOKENS.CHART_DATA);

            // Updating the last update time.
            sessionStorage.setItem(TOKENS.LAST_UPDATE, data.lastUpdate);
        }

    } catch(ex) {
        sessionStorage.removeItem(TOKENS.LAST_UPDATE);
        document.write("<p><strong>Une erreur est survenue</strong></p>");
    }
}

/**
 * This function will apply all the updates in the DOM.
 * It will get datas from the session storage and
 * will display it.
 */
const applyUpdates = () => {
    const   _totalCases  = document.querySelector('#total-cases'),
            _totalDeaths = document.querySelector('#total-deaths'),
            _totalHealed = document.querySelector('#total-healed'),
            _tableData   = document.querySelector('#countries-data');

    const { locations } = JSON.parse(sessionStorage.getItem(TOKENS.LOCATIONS));
    const { recovered, confirmed, deaths } = JSON.parse(sessionStorage.getItem(TOKENS.RECOVERED));

    _totalCases.textContent  = confirmed.value;
    _totalDeaths.textContent = deaths.value;
    _totalHealed.textContent = recovered.value;

    let cachedTable = sessionStorage.getItem(TOKENS.LOCATION_TAB);
    if(!cachedTable) {
        let line = `
            <tr>
                <td>World</td>
                <td>${confirmed.value}</td>
                <td>${deaths.value}</td>
                <td>${recovered.value}</td>
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
        sessionStorage.setItem(TOKENS.LOCATION_TAB, cachedTable);
    }
    // Adding the elements on the DOM.
    _tableData.innerHTML = cachedTable;

}

const displayChart = (chart, data) => new Chart(chart, {
    type: 'line',
    data
});

window.addEventListener('load', async () => {

    const _graph = document.querySelector('#graph');

    // Dynamically creating the canvas where the chart will be displayed.
    const _chart = document.createElement('canvas');
    _chart.width = 360;
    _chart.height = 250;
    _graph.append(_chart);

    // Disable automatic style injection
    Chart.platform.disableCSSInjection = true;

    // If the was cached we fetch it
    let data = JSON.parse(sessionStorage.getItem(TOKENS.CHART_DATA));

    // else we set a default data.
    if(!data) {
        data = {
            labels: ["December", "January", "February", "March", "April"],
            datasets: [
                {
                    label: "Per month",
                    data: [300, 2000, 150000, 900000, 2000000]
                }
            ]
        }
    }

    // Displaying a default chart like a placeholder.
    displayChart(_chart, data);

    // Fetching the datas if necessery and updating the DOM.
    await fetchData();
    applyUpdates();

    // If the chart wasn't cached, we create its data and display it.
    if(!sessionStorage.getItem(TOKENS.CHART_DATA)) {
        // Updating the chart datas.
        const daily = JSON.parse(sessionStorage.getItem(TOKENS.DAILY));
        
        // Building the chart values.
        let labels = [], confirmed = [], deaths = [];
        for(let d of daily) {
            labels.push(d.reportDate);
            confirmed.push(d.confirmed.total);
            deaths.push(d.deaths.total);
        }
        data = {
            labels,
            datasets: [
                { label: "confirmed cases", data: confirmed, fill: true },
                { label: "deaths", data: deaths, fill: true, borderColor: 'red', backgroundColor: 'rgb(255, 0, 0, 0.5)' }
            ]
        };
        sessionStorage.setItem(TOKENS.CHART_DATA, JSON.stringify(data));
        displayChart(_chart, data);
    }
});