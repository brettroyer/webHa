$(function() {
    // --- Initialization & theme ---
    const body = $('body');

    function setTheme(t) {
        body.attr('data-theme', t);
        localStorage.setItem('ui_theme', t);
        $('#themeToggle').text(t === 'dark' ? 'Light Mode' : 'Dark Mode');
    }
    const saved = localStorage.getItem('ui_theme') || 'light';
    setTheme(saved === 'dark' ? 'dark' : '');

    $('#themeToggle').click(function() {
        const curr = body.attr('data-theme') === 'dark' ? '' : 'dark';
        setTheme(curr);
    });

    // Logging helper
    function log(msg) {
        const ts = new Date().toLocaleTimeString();
        $('#log').prepend(`<div>[${ts}] ${msg}</div>`);
    }

    // Buttons & switches
    $('#btnStart').click(() => {
        $('#stMode').text('Running');
        log('Start');
        $('#btnStart').addClass('primary');
    });
    $('#btnStop').click(() => {
        $('#stMode').text('Stopped');
        log('Stop');
        $('#btnStart').removeClass('primary');
    });
    $('#btnHold').click(function() {
        $(this).toggleClass('active');
        log('Hold ' + ($(this).hasClass('active') ? 'ON' : 'OFF'));
    });

    $('#swMain').click(function() {
        $(this).toggleClass('on');
        $('#stPower').text($(this).hasClass('on') ? 'ON' : 'OFF');
        log('Main power ' + ($('#stPower').text()));
    });

    // Segmented fan
    $('#segFan button').click(function() {
        $('#segFan button').removeClass('active');
        $(this).addClass('active');
        const f = $(this).data('val') == 1 ? 'Low' : $(this).data('val') == 2 ? 'Med' : 'High';
        $('#stFan').text(f);
        log('Fan ' + f);
    });

    // Sliders
    $('#sliderTemp').on('input change', function() {
        $('#lblTemp').text($(this).val());
        $('#stTemp').text($(this).val() + '°C');
    });
    $('#sliderBright').on('input change', function() {
        $('#stBright').text($(this).val() + '%');
    });
    $('#humidityRange').on('input change', function() {
        $('#humidityVal').text($(this).val() + '%');
    });

    // Combo min/max
    function fixCombo() {
        let min = parseInt($('#comboMin').val());
        let max = parseInt($('#comboMax').val());
        if (min > max - 5) {
            min = max - 5;
            $('#comboMin').val(min);
        }
        if (max < min + 5) {
            max = min + 5;
            $('#comboMax').val(max);
        }
        $('#comboMinVal').text(min);
        $('#comboMaxVal').text(max);
        $('#stMode').text('Range ' + min + '-' + max);
    }
    $('#comboMin,#comboMax').on('input change', fixCombo);
    fixCombo();

    // Pressure dual
    function updatePressure() {
        let low = parseInt($('#rangeLow').val()),
            high = parseInt($('#rangeHigh').val());
        if (low > high - 5) {
            low = high - 5;
            $('#rangeLow').val(low);
        }
        if (high < low + 5) {
            high = low + 5;
            $('#rangeHigh').val(high);
        }
        $('#labelLow').text(low);
        $('#labelHigh').text(high);
        $('#stPressure').text(low + ' - ' + high);
    }
    $('#rangeLow,#rangeHigh').on('input change', updatePressure);
    updatePressure();

    // Stepper
    function setStep(v) {
        $('#stepVal').text(v);
        $('#stRetries').text(v);
    }
    $('#inc').click(() => {
        setStep(parseInt($('#stepVal').text()) + 1);
        log('Retries -> ' + $('#stepVal').text());
    });
    $('#dec').click(() => {
        setStep(Math.max(0, parseInt($('#stepVal').text()) - 1));
        log('Retries -> ' + $('#stepVal').text());
    });

    // Pulse & misc
    $('#btnPulse').on('mousedown touchstart', function() {
            $(this).css('background', '#e6f7ff');
            log('Pulse start');
        })
        .on('mouseup touchend mouseleave', function() {
            $(this).css('background', '');
            log('Pulse end');
        });
    $('#btnDebug').click(() => {
        log('DEBUG: ' + JSON.stringify(grabState()));
    });
    $('#btnClear').click(() => {
        $('#log').empty();
        log('Cleared log');
    });

    // --- SVG Knob implementation (drag + keyboard + MIDI) ---
    const svg = document.getElementById('svgKnob');
    const pointer = document.getElementById('pointer');
    const knobValueText = document.getElementById('knobValue');
    let value = 50; // 0..100
    let angle = valueToAngle(value); // -135..135
    let dragging = false;

    // draw ticks
    (function drawTicks() {
        const g = document.getElementById('ticks');
        for (let i = 0; i <= 10; i++) {
            const a = -135 + (i / 10) * 270;
            const rad = a * Math.PI / 180;
            const x1 = Math.cos(rad) * 44;
            const y1 = Math.sin(rad) * 44;
            const x2 = Math.cos(rad) * 48;
            const y2 = Math.sin(rad) * 48;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', 'var(--border)');
            line.setAttribute('stroke-width', i % 5 === 0 ? 2 : 1);
            g.appendChild(line);
        }
    })();

    function valueToAngle(v) {
        return -135 + (v / 100) * 270;
    }

    function angleToValue(a) {
        return Math.round(((a + 135) / 270) * 100);
    }

    function setKnobVal(v, source) {
        if (v < 0) v = 0;
        if (v > 100) v = 100;
        value = Math.round(v);
        angle = valueToAngle(value);
        pointer.setAttribute('transform', 'rotate(' + angle + ')');
        knobValueText.textContent = value;
        svg.setAttribute('aria-valuenow', value);
        $('#stKnob').text(value);
        if (source !== 'init') log('Knob -> ' + value + (source ? (' (' + source + ')') : ''));
    }

    // pointer calculation helpers
    function pointToAngle(clientX, clientY) {
        const rect = svg.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const x = clientX - cx;
        const y = clientY - cy;
        const a = Math.atan2(y, x) * (180 / Math.PI);
        return a;
    }

    svg.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        dragging = true;
    });
    window.addEventListener('pointermove', function(e) {
        if (!dragging) return;
        const a = pointToAngle(e.clientX, e.clientY);
        // clamp between -135 and 135
        let clamped = a;
        if (clamped < -135) clamped = -135;
        if (clamped > 135) clamped = 135;
        setKnobVal(angleToValue(clamped), 'drag');
    });
    window.addEventListener('pointerup', function(e) {
        if (dragging) {
            dragging = false;
            log('Knob settled ' + value);
        }
    });

    // keyboard control (when wrapper focused)
    const svgWrap = document.getElementById('svgKnobWrap');
    svgWrap.addEventListener('keydown', function(e) {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            setKnobVal(value + step, 'keyboard');
            e.preventDefault();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            setKnobVal(value - step, 'keyboard');
            e.preventDefault();
        }
        if (e.key === 'PageUp') {
            setKnobVal(value + 10, 'keyboard');
            e.preventDefault();
        }
        if (e.key === 'PageDown') {
            setKnobVal(value - 10, 'keyboard');
            e.preventDefault();
        }
        if (e.key === 'Home') {
            setKnobVal(0, 'keyboard');
            e.preventDefault();
        }
        if (e.key === 'End') {
            setKnobVal(100, 'keyboard');
            e.preventDefault();
        }
    });
    // init knob
    setKnobVal(value, 'init');

    // --- Web MIDI (optional) ---
    let midiAccess = null;
    let midiEnabled = false;
    const midiButton = $('#midiEnable');
    async function enableMIDI() {
        if (!navigator.requestMIDIAccess) {
            log('WebMIDI not available in this browser');
            alert('WebMIDI not available');
            return;
        }
        try {
            midiAccess = await navigator.requestMIDIAccess();
            midiEnabled = true;
            midiButton.text('MIDI Enabled');
            log('MIDI enabled. Listening to inputs...');
            midiAccess.inputs.forEach(input => {
                input.onmidimessage = handleMIDIMessage;
            });
            midiAccess.onstatechange = (ev) => {
                log('MIDI state change: ' + ev.port.name + ' ' + ev.port.state);
                midiAccess.inputs.forEach(input => input.onmidimessage = handleMIDIMessage);
            };
        } catch (err) {
            log('MIDI permission denied or error: ' + err.message);
        }
    }

    function handleMIDIMessage(evt) {
        // Basic mapping: Control Change (B0 ...), use data2 (0..127) to map to 0..100
        const [status, data1, data2] = evt.data;
        const type = status & 0xf0;
        if (type === 0xB0) { // control change
            const mapped = Math.round((data2 / 127) * 100);
            setKnobVal(mapped, 'midi cc' + data1);
        } else if (type === 0xE0) { // pitchbend (14bit)
            const value14 = (data2 << 7) | data1; // 0..16383
            const mapped = Math.round((value14 / 16383) * 100);
            setKnobVal(mapped, 'midi pb');
        }
    }
    midiButton.click(enableMIDI);

    // --- Export / Import functionality ---
    function grabState() {
        return {
            power: $('#swMain').hasClass('on'),
            hold: $('#btnHold').hasClass('active'),
            mode: $('#stMode').text(),
            tempSP: $('#sliderTemp').val(),
            brightness: $('#sliderBright').val(),
            comboMin: $('#comboMin').val(),
            comboMax: $('#comboMax').val(),
            fan: $('#segFan button.active').data('val') || 2,
            humidity: $('#humidityRange').val(),
            pressureLow: $('#rangeLow').val(),
            pressureHigh: $('#rangeHigh').val(),
            retries: $('#stepVal').text(),
            knob: value,
            timestamp: new Date().toISOString()
        };
    }

    $('#btnExport').click(function() {
        const state = grabState();
        const json = JSON.stringify(state, null, 2);
        $('#snippet').val(json);
        // copy to clipboard
        navigator.clipboard?.writeText(json).then(() => {
            log('Copied JSON to clipboard');
        }, () => {
            log('Copy to clipboard failed');
        });
    });

    $('#btnDownload').click(function() {
        const state = grabState(),
            json = JSON.stringify(state, null, 2);
        const blob = new Blob([json], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'automation_state.json';
        a.click();
        URL.revokeObjectURL(url);
        log('Downloaded JSON file');
    });

    $('#btnLoad').click(function() {
        const txt = $('#snippet').val().trim();
        if (!txt) {
            alert('No JSON in snippet box to load');
            return;
        }
        try {
            const obj = JSON.parse(txt);
            // apply a few values (safe)
            if (obj.power) $('#swMain').addClass('on');
            else $('#swMain').removeClass('on');
            $('#btnHold').toggleClass('active', !!obj.hold);
            if (obj.tempSP) $('#sliderTemp').val(obj.tempSP).trigger('change');
            if (obj.brightness) $('#sliderBright').val(obj.brightness).trigger('change');
            if (obj.comboMin) $('#comboMin').val(obj.comboMin);
            if (obj.comboMax) $('#comboMax').val(obj.comboMax);
            fixCombo();
            if (obj.knob !== undefined) setKnobVal(Number(obj.knob), 'load');
            if (obj.pressureLow) $('#rangeLow').val(obj.pressureLow);
            if (obj.pressureHigh) $('#rangeHigh').val(obj.pressureHigh);
            updatePressure();
            if (obj.retries !== undefined) setStep(Number(obj.retries));
            log('Loaded state from snippet');
        } catch (err) {
            alert('Invalid JSON: ' + err.message);
        }
    });

    $('#btnCopy').click(function() {
        const txt = $('#snippet').val();
        if (!txt) return alert('No snippet to copy');
        navigator.clipboard?.writeText(txt).then(() => log('Snippet copied'), () => log('Copy failed'));
    });

    $('#btnPaste').click(function() {
        navigator.clipboard?.readText().then(txt => {
            $('#snippet').val(txt);
            log('Pasted clipboard into snippet box');
        }).catch(() => alert('Paste failed or unsupported'));
    });

    // initial state log
    log('Automation UI ready');

    $(".example").inputCounter({
    selectors: {
        addButtonSelector: '.btn-add',
        subtractButtonSelector: '.btn-subtract',
        inputSelector: '.input-counter',

            // check the valus is within the min and max values
            checkValue: true,

            // is read only?
            isReadOnly: true
  }
});

});