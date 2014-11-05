$(document).ready(function() {
  var canvas = document.getElementById('gameoflife')
    , ctx = canvas.getContext('2d')
    , boardWidth
    , boardHeight;

  // Configuration Options
  var unitSize = 4
    , unitLifespan = 50
    , birthReq = { min: 3, max: 3 }
    , fps = 15;

  // Resize the canvas to fill browser window dynamically
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    boardWidth  = Math.floor(canvas.width  / unitSize);
    boardHeight = Math.floor(canvas.height / unitSize);
  }
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();

  var units = [];

  // Prefill the x axis with arrays
  for (var x = -1; x < boardWidth + 1; x++) { units[x] = []; }

  // Seed the world with random units
  for (var i = 0; i < (boardWidth * boardHeight / 3); i++) {
    var x = Math.floor(Math.random() * boardWidth)
      , y = Math.floor(Math.random() * boardHeight);
    // Don't seed a coordinate twice. Try seeding another one
    if (typeof units[x][y] !== 'undefined') { i--; }
    else { units[x][y] = 0; }
  }

  function updateUnits() {
    var unitDeaths = [], unitBirths = [];

    var sides = [[-1, -1], [0, -1], [1, -1],
                 [-1,  0],          [1,  0],
                 [-1,  1], [0,  1], [1,  1]]
      , x, y, count, s, unitExists, alpha;

    // Run through the rules of unit growth and death
    for (x = 0; x < boardWidth; x++) {
      for (y = 0; y < boardHeight; y++) {
        count = 0;

        for (s = 0; s < sides.length; s++) {
          if (typeof units[x + sides[s][0]][y + sides[s][1]] !== 'undefined') { count++; }
        }

        unitExists = (typeof units[x][y] !== 'undefined');

        if (unitExists === true) { units[x][y]++; }

        // Queue unit changes until all rendering is complete
        if (unitExists === true && (count < 2 || count > 3 || units[x][y] === unitLifespan)) {
          unitDeaths.push({ x: x, y: y });
        } else if (unitExists === false && birthReq.min <= count && count <= birthReq.max) {
          unitBirths.push({ x: x, y: y });
        }
      }
    }

    unitDeaths.forEach(function (unit) {
      delete units[unit.x][unit.y];
      ctx.fillStyle = 'rgb(255,255,255)';
      ctx.fillRect(unit.x * unitSize, unit.y * unitSize, unitSize, unitSize);
    });

    unitBirths.forEach(function (unit) { units[unit.x][unit.y] = 0; });
    draw();
  }

  function draw() {
    // Draw on the next animation frame
    //setTimeout(function () { requestAnimationFrame(updateUnits); }, 1000 / fps);
    requestAnimationFrame(updateUnits);

    for (x = 0; x < boardWidth; x++) {
      for (y = 0; y < boardHeight; y++) {
        alpha = units[x][y];
        if (typeof alpha === 'undefined') { continue; }

        alpha = Math.floor((255 / unitLifespan) * units[x][y]);
        ctx.fillStyle = 'rgb(' + alpha + ',' + alpha + ',' + alpha + ')';
        ctx.fillRect(x * unitSize, y * unitSize, unitSize, unitSize);
      }
    }
  }

  updateUnits();

  var $controls = $('#controls');
  
  var $fps = $controls.find('.fps')
    , $fpsDisplay = $fps.find('.value');
  $fps.find('input').on('input', function (e) {
    var val = $(this).val();
    fps = val;
    $fpsDisplay.text(val);
  }).trigger('input');

  var $generations = $controls.find('.generations')
    , $generationsDisplay = $generations.find('.value');
  $generations.find('input').on('input', function (e) {
    var val = $(this).val();
    if (val <= 0) {
      console.log('Cannot set generations to zero');
      return;
    }

    unitLifespan = val;
    $generationsDisplay.text(val);
  }).trigger('input');

  var $birth = $controls.find('.birth')
    , $birthDisplay = $birth.find('.value')
    , $birthMin = $birth.find('#birth_min')
    , $birthMax = $birth.find('#birth_max');
  $birth.find('#birth_min').on('input', function () {
    birthReq.min = $(this).val();
    $birthMax.attr('min', birthReq.min).val(0).val(birthReq.max);
  });
  $birth.find('#birth_max').on('input', function () {
    birthReq.max = $(this).val();
    $birthMin.attr('max', birthReq.max).val(0).val(birthReq.min);
  });
  $birth.find('input').on('input', function (e) {
    if (birthReq.min === birthReq.max) {
      return $birthDisplay.text(birthReq.min + ' neighbours');
    }
    $birthDisplay.text(birthReq.min + ' to ' + birthReq.max + ' neighbours');
  }).trigger('input');
  
});
