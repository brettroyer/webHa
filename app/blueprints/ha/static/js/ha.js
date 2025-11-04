const devices=[
    {name:'Smart TV',icon:'fa-tv',status:true,extra:'Active for 3 hours'},
    {name:'Speaker',icon:'fa-speaker',status:false,extra:'Active for 1 hour'},
    {name:'Router',icon:'fa-wifi',status:true,extra:'Active for 3 hours'},
    {name:'WiFi',icon:'fa-signal',status:true,extra:'Active for 3 hours'},
    {name:'Heater',icon:'fa-radiation',status:false,extra:'Idle'},
    {name:'Socket',icon:'fa-plug',status:true,extra:'Active for 2 hours'}
];

const appliances=[
    {label:'TV set',state:true},
    {label:'Stereo system',state:false},
    {label:'Play Station 4',state:false},
    {label:'Computer',state:true}
];

const people=[
    'https://i.pravatar.cc/40?img=3',
    'https://i.pravatar.cc/40?img=5',
    'https://i.pravatar.cc/40?img=7',
    'https://i.pravatar.cc/40?img=9',
    'https://i.pravatar.cc/40?img=10'
];

function renderCards() {
    const $c = $('#deviceCards');
    $c.empty();
    devices.forEach((d, i) => {
        const on = d.status ? 'checked' : '';
        const card = $(`<div class="card"><div class="title">${d.name}</div><small class="small">${d.extra}</small><label class="toggle"><input type="checkbox" class="dev-toggle" data-index="${i}" ${on}></label></div>`);
        $c.append(card);
    });
}

function renderAppliances() {
    const $a = $('#applianceList');
    $a.empty();
    appliances.forEach((ap, i) => {
        const $el = $(`<div class="appliance"><div>${ap.label}</div><label><input type="checkbox" class="ap-toggle" data-index="${i}" ${ap.state?'checked':''}></label></div>`);
        $a.append($el);
    });
}

function renderPeople() {
    const $p = $('#peopleRow');
    $p.empty();
    people.forEach(src => {
        $p.append(`<img src="${src}" alt="p">`)
    });
    $p.append('<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e6eefc;color:var(--accent);font-weight:600">+</div>');
}

function renderMiniChart() {
    const $ch = $('#miniChart');
    $ch.empty();
    const data = [12, 18, 25, 20, 14, 30, 22, 26, 19, 28];
    const max = Math.max(...data);
    data.forEach(v => {
        const h = (v / max) * 100;
        $ch.append(`<div class='bar' style='height:${h}%;'></div>`);
    });
}

$(function(){

    renderCards();
    renderAppliances();
    renderPeople();
    renderMiniChart();

//     $(".sidebar").hide(); // Hides the element with id="mainNav"

    $(document).on('change', '.dev-toggle', function() {
      const i = $(this).data('index');
      devices[i].status = this.checked;
      $(this).closest('.card').css('opacity', this.checked ? 1 : 0.65);
    });

    $(document).on('change', '.ap-toggle', function() {
      const i = $(this).data('index');
      appliances[i].state = this.checked;
    });

    let temp = 22;

    $('#tempDial').on('click', function() {
      temp = (temp % 30) + 1;
      $(this).html(temp + '&deg;');
    });

    $('#humRange').on('input change', function() {
      $('#humValue').text($(this).val() + '%');
    });

    $('.mode').on('click', function() {
      $('.mode').css('borderColor', '#eee');
      $(this).css('borderColor', 'var(--accent)');
    });

    $('.card').css('transition', 'all 200ms');

    $('.card').each(function(i) {
      if (!devices[i].status) $(this).css('opacity', 0.65);
    });

});