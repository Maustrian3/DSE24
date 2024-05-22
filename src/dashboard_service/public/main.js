
function showLogLine( line, prepend= false ) {
  const date= new Date( line.time ); 
  const formattedDate= date.toLocaleString();

  const rows= document.getElementById('log-rows');

  const row= document.createElement('tr');
  if( prepend ) {
    rows.prepend( row );
  } else {
    rows.append( row );
  }

  row.appendChild( document.createElement('td') ).innerText= formattedDate;
  row.appendChild( document.createElement('td') ).innerText= line.severity;
  row.appendChild( document.createElement('td') ).innerText= line.message;

  const dataDetails= row.appendChild( document.createElement('details') );
  dataDetails.appendChild( document.createElement('summary') ).innerText= 'Data';
  dataDetails.appendChild( document.createElement('p') )
    .appendChild( document.createElement('code') ).innerText= JSON.stringify(line.data);
}

const leadingIcon= L.divIcon({className: 'leading-marker-icon'});
const followingIcon= L.divIcon({className: 'following-marker-icon'});

const knownVehicles= new Map();
function showVehicleMarker( map, vehicle ) {
  const {long, lat}= vehicle.location;
  const entry= knownVehicles.get( vehicle.vin );
  if( entry ) {
    entry.setLatLng([long, lat]);
    return;
  }

  const icon= vehicle.kind === 'leading' ? leadingIcon : followingIcon;
  const marker= L.marker([long, lat], {icon}).bindPopup(`VIN: ${vehicle.vin}<br>Kind: ${vehicle.kind}`).addTo( map );
  knownVehicles.set( vehicle.vin, marker );
}

async function loadMap() {
  const resp= await fetch('/map');
  const {long, lat, zoom}= await resp.json();

  const map = L.map('leaflet-map').setView([long, lat], zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  return map;
}

async function loadOldLogs() {
  const resp= await fetch('./logs');
  const logs= await resp.json();
  logs.forEach( line => showLogLine(line) );
}

async function loadAllVehicles( map ) {
  const resp= await fetch('./vehicles');
  const vehicles= await resp.json();
  vehicles.forEach( vehicle => showVehicleMarker( map, vehicle ) );
}

function subscribeLogEvents() {
  const sse= new EventSource('./logs/live');
  sse.onerror= () => alert('Server connection for log events closed');
  sse.onmessage= e => showLogLine( JSON.parse(e.data), true );
}

function subscribeVehicleEvents( map ) {
  const sse= new EventSource('./vehicles/live');
  sse.onerror= () => alert('Server connection for vehicle events closed');
  sse.onmessage= e => showVehicleMarker( map, JSON.parse(e.data) );
}

(async function() {

  const map= await loadMap();
  await loadOldLogs();
  await loadAllVehicles( map );

  subscribeLogEvents();
  subscribeVehicleEvents( map );
  
})();

