
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

async function loadMap() {}

async function loadOldLogs() {
  const resp= await fetch('/logs');
  const logs= await resp.json();
  logs.forEach( line => showLogLine(line) );
}

async function loadAllVehicles() {}

function subscribeLogEvents() {
  const sse= new EventSource('./logs/live');
  sse.onerror= () => alert('Server connection for log events closed');
  sse.onmessage= e => showLogLine( JSON.parse(e.data), true );
}

function subscribeVehicleEvents() {}

(async function() {

  await loadMap();
  await loadOldLogs();
  await loadAllVehicles();

  subscribeLogEvents();
  subscribeVehicleEvents();
  
})();

