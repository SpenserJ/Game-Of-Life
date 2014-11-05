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

  var units = [], liveUnits = [];
  var sides = [[-1, -1], [0, -1], [1, -1],
               [-1,  0],          [1,  0],
               [-1,  1], [0,  1], [1,  1]];
  var tick = 0, unitsPerTick = 0, timePerTick = 0;

  // Prefill the x axis with arrays
  for (var x = -2; x < boardWidth + 2; x++) { units[x] = []; }

  // Seed the world with random units
  for (var i = 0; i < (boardWidth * boardHeight / 3); i++) {
    var x = Math.floor(Math.random() * boardWidth)
      , y = Math.floor(Math.random() * boardHeight);
    // Don't seed a coordinate twice. Try seeding another one
    if (typeof units[x][y] !== 'undefined') { i--; }
    else { units[x][y] = 0; liveUnits.push({ x: x, y: y }); }
  }

  function checkUnitLife(x, y, unit) {
    var count = 0;

    if (x < 0 || x > boardWidth || y < 0 || y > boardHeight) { return false; }

    for (s = 0; s < sides.length; s++) {
      if (typeof units[x + sides[s][0]][y + sides[s][1]] !== 'undefined') { count++; }
    }

    // Queue unit changes until all rendering is complete
    if (unit === false && birthReq.min <= count && count <= birthReq.max) {
      return true;
    } else if (unit !== false && (count < 2 || count > 3 || unit > unitLifespan)) {
      return false;
    }
    return null;
  }

  function updateUnits() {
    var start = window.performance.now();
    var unitDeaths = [], unitBirths = [];

    // Run through the rules of unit growth and death
    liveUnits.forEach(function (unit, index) {
      var s;
      var shouldLive = checkUnitLife(unit.x, unit.y, units[unit.x][unit.y]);
      if (shouldLive === false) { unit.index = index; unitDeaths.push(unit); }
      else { units[unit.x][unit.y]++; } // Age

      // Handle surrounding units
      for (s = 0; s < sides.length; s++) {
        var sx = unit.x + sides[s][0], sy = unit.y + sides[s][1];
        // Only check dead units
        if (typeof units[sx][sy] === 'undefined' && checkUnitLife(sx, sy, false) === true) {
          unitBirths.push({ x: sx, y: sy });
        }
      }
    });

    liveUnits = liveUnits.filter(function (unit) {
      if (unitDeaths.indexOf(unit) !== -1) {
        // Unit dies
        delete units[unit.x][unit.y];
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.fillRect(unit.x * unitSize, unit.y * unitSize, unitSize, unitSize);
        return false;
      } else {
        // Unit lives
        var intensity = Math.floor((255 / unitLifespan) * units[unit.x][unit.y]);
        ctx.fillStyle = 'rgb(' + intensity + ',' + intensity + ',' + intensity + ')';
        ctx.fillRect(unit.x * unitSize, unit.y * unitSize, unitSize, unitSize);
        return true;
      }
    });

    unitBirths.forEach(function (unit) {
      // If the unit already exists, don't recreate it
      if (typeof units[unit.x][unit.y] !== 'undefined') { return; }

      units[unit.x][unit.y] = 0;
      liveUnits.push({ x: unit.x, y: unit.y });
      ctx.fillStyle = 'rgb(0,0,0)';
      ctx.fillRect(unit.x * unitSize, unit.y * unitSize, unitSize, unitSize);
    });

    tick++;
    var executionTime = (window.performance.now() - start);
    timePerTick += executionTime;
    unitsPerTick += liveUnits.length;
    if (tick < 500 && tick % 10 === 1) {
      var timePerUnit = (timePerTick / unitsPerTick) * 1000;
      console.log(timePerUnit + ' per 1000 units');
      console.log(executionTime + ' for ' + liveUnits.length);
    }

    requestAnimationFrame(updateUnits);
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
