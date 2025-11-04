$(function() {
  const ctx = document.getElementById('chart');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Simulated Value',
        data: [],
        borderWidth: 1
      }]
    },
    options: {scales: {x: {display: false}}}
  });

  function addData(ts, val) {
    chart.data.labels.push(ts);
    chart.data.datasets[0].data.push(val);
    if (chart.data.labels.length > 60) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update('none');
  }

  const logContainer = $('#logContainer');
  function appendLog(msg) {
    logContainer.prepend($('<div>').text(msg));
  }

  $('#startBtn').click(() => $.post('/api/start'));
  $('#stopBtn').click(() => $.post('/api/stop'));
  $('#applyBtn').click(() => {
    $.ajax({
      url:'/api/params',
      method:'POST',
      contentType:'application/json',
      data: JSON.stringify({setpoint: $('#setpointInput').val()})
    });
  });

  const sse = new EventSource('/stream');

      sse.addEventListener('logs', e => {
        const logs = JSON.parse(e.data);
        logs.forEach(l => appendLog(`${l.ts} - ${l.text}`));
        });

      sse.addEventListener('status', e => {
        const d = JSON.parse(e.data);
        if (d.status.sim_value !== undefined)
          addData(new Date(d.ts * 1000).toLocaleTimeString(), d.status.sim_value);
        });

});
