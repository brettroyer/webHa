$(function () {
    const socket = io();

    // These will be set when server sends initial_data
    let topics = [];
    let gaugeCount = 0;
    const maxPoints = 500;

    // chart variables
    let chart = null;

    function createUIForTopics(tops, data) {
        topics = tops;
        gaugeCount = topics.length;
        const colors = ['#00ccff', '#ff9933', '#33ff77', '#ff3366', '#9b59b6', '#f1c40f'];
        const container = $("#gaugesContainer").empty();
        for (let i = 0; i < gaugeCount; i++) {
            const color = colors[i % colors.length];
            const topic = topics[i]
            const alarm_en_id = "chbox_"+topic
            const alarm_sp_id = "sp_"+topic
            const alarm_id = "alarm_"+topic
            const box = $(`
                <div class="gauge-box" data-index="${i}">
                  <div class="alarm-indicator" id=${alarm_id}></div>
                  <input type="text" class="tempGauge" id="g${i}" 
                        data-width="150" data-min="0" data-max="400" 
                        data-fgColor="${color}" value="0">
                  <div class="alarm-controls">
                    <label><input type="checkbox" id=${alarm_en_id} class="alarmToggle"> Alarm</label>
                    <input type="number" id=${alarm_sp_id} class="setpoint" placeholder="Setpoint °F" style="width:80px;">
                    <div style="font-size:12px;margin-top:6px;color:#ccc">${tops[i]}</div>
                  </div>
                </div>
          `);

            // Set Initial Alarm Enabled and Set Point for each gauge.
            box.find('.setpoint').val(data.setpoints[i]);
            box.find('.alarmToggle').prop('checked', data.alarms[i]);
            container.append(box);
            }

        // init knobs
        $(".tempGauge").knob({
            readOnly: true,
            thickness: 0.3,
            angleOffset: -125,
            angleArc: 250,
            linecap: 'round'
        });

        // build chart
        const ctx = document.getElementById('trendChart').getContext('2d');
        const datasets = [];
        for (let i = 0; i < gaugeCount; i++) {
            datasets.push({
                label: `Sensor ${i + 1}`,
                data: [],
                borderColor: colors[i % colors.length],
                fill: false,
                tension: 0.2,
                pointRadius: 0
            });
        }
        chart = new Chart(ctx, {
            type: 'line',
            data: {labels: [], datasets: datasets},
            options: {scales: {y: {min: 0, max: 400}}, plugins: {legend: {labels: {color: '#fff'}}}}
        });
    }

    function logEvent(message) {
        const log = $("#eventLog");
        const timestamp = new Date().toLocaleTimeString();
        log.append(`<div class='event'>[${timestamp}] ${message}</div>`);
        log.scrollTop(log.prop("scrollHeight"));
    }

    // Handle initial histories
    socket.on("initial_data", function (payload) {
        // payload: { topics: [...], histories: [ [ {t,v}, ... ], ... ] }
        logEvent("Initial Data Loaded!!")
        console.log("[MQTT Initial DATA]", payload)
        createUIForTopics(payload.topics || [], payload);
        // createUIForTopics(payload || []);
        // Populate histories into chart
        const histories = payload.histories || [];
        // build label array from longest history (timestamps -> human labels)
        const maxLen = Math.max(...histories.map(h => h.length), 0);
        const labels = [];
        // We'll use the timestamps from the last N points across sensors; for simplicity just use the latest sensor's timestamps if available
        if (histories.length > 0) {
            // assemble labels from latest non-empty history
            for (let s = 0; s < histories.length; s++) {
                if (histories[s].length > 0) {
                    histories[s].forEach(pt => labels.push(new Date(pt.t).toLocaleTimeString()));
                    break;
                }
            }
        }
        // if still empty, labels keep empty
        chart.data.labels = labels.slice(-maxPoints);

        // fill datasets
        for (let i = 0; i < chart.data.datasets.length; i++) {
            const ds = histories[i] || [];
            chart.data.datasets[i].data = ds.map(pt => pt.v).slice(-maxPoints);
            // set corresponding gauge to last value if exists
            if (ds.length > 0) {
                const last = ds[ds.length - 1].v;
                $(`#g${i}`).val(last.toFixed(1)).trigger('change');
            }
        }
        chart.update();
    });

    // Handle live updates from server
    socket.on("mqtt_update", function (msg) {
        // msg: { index:int, value:float, timestamp:ms }
        // mag: need to add { alarm_sp: int, alarm_en: bool, alarm: bool }
        // console.log("[MQTT DATA]", msg)
        const gaugeId = msg.index;  // GaugeID
        const value = parseFloat(msg.value);  // Gauge Value

        // Validate Value
        if (isNaN(value)) return;

        // update gauge
        const gauge = $(`#g${gaugeId}`);
        gauge.val(value.toFixed(1)).trigger('change');

        // update chart: push label at end
        const label = new Date(msg.timestamp).toLocaleTimeString();
        chart.data.labels.push(label);

        // ensure labels length matches datasets length (we'll cap at maxPoints)
        if (chart.data.labels.length > maxPoints)
            chart.data.labels.shift();
            chart.data.datasets[gaugeId].data.push(value);

            if (chart.data.datasets[gaugeId].data.length > maxPoints)
            chart.data.datasets[gaugeId].data.shift();

        chart.update();

        // update alarm per gauge.
        const $box = gauge.closest('.gauge-box');
        const $indicator = $box.find('.alarm-indicator');

        //----------------------------------------------------
        // Update alarm enabled checkbox
        //----------------------------------------------------
        if ("alarm_en" in msg) {
            const $chk = $box.find(".alarmToggle");
            $chk.prop("checked", msg.alarm_en);
        }

        //----------------------------------------------------
        // Update alarm setpoint
        //----------------------------------------------------
        if ("alarm_sp" in msg) {
            const $sp = $box.find(".setpoint");
            $sp.val(msg.alarm_sp);

            // keep ID updated too ("sp1", "sp2", etc.)
            if ($sp.attr("id") === undefined) {
                const idx = $box.data("index");
                $sp.attr("id", "sp" + idx);
            }
        }

        //----------------------------------------------------
        // Update alarm visual indicator
        //----------------------------------------------------
        if ("alarm" in msg) {
            $indicator.toggleClass("alarm-active", msg.alarm);
        }

        //----------------------------------------------------
        // check alarms (client-side) and update log
        //----------------------------------------------------
        const alarmEnabled = $(".alarmToggle").eq(gaugeId).is(":checked");
        const setpoint = parseFloat($(".setpoint").eq(gaugeId).val());
        if (alarmEnabled && !isNaN(setpoint) && value > setpoint) {
            logEvent(`⚠️ Alarm on Sensor ${gaugeId + 1}: ${value.toFixed(1)} °F exceeds ${setpoint} °F`);
        }
    });


    socket.on("connect_error", (err) => {
        // console.error("Socket.IO connect error:", err);
        logEvent("Socket.IO connect error: " + err);
    });


    //--------------------------------------------------------
    // 4. AJAX handler for ANY element whose ID starts with 'sp'
    //--------------------------------------------------------
    $(document).on("change", "[id^='sp']", function () {
        const id = $(this).attr("id");
        const value = $(this).val();
        // debugger
        console.log("[SP UPDATE]", id, value);

        $.ajax({
            url: "/igrill/update_sp",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                id: id,
                setpoint: value
            }),
            success: function (resp) {
                console.log("[SP UPDATED OK]", resp);
            },
            error: function (xhr) {
                console.log("[SP UPDATE ERROR]", xhr.responseText);
            }
        });
    });

    //--------------------------------------------------------
    // AJAX handler for ANY checkbox whose ID starts with "chbox"
    //--------------------------------------------------------
    $(document).on("change", "[id^='chbox']", function () {
        const id = $(this).attr("id");
        const value = $(this).prop("checked");   // true / false

        console.log("[CHBOX UPDATE]", id, value);

        $.ajax({
            url: "/igrill/update_checkbox",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                id: id,
                enabled: value
            }),
            success: function (resp) {
                console.log("[CHBOX UPDATED OK]", resp);
            },
            error: function (xhr) {
                console.log("[CHBOX UPDATE ERROR]", xhr.responseText);
            }
        });
    });



});