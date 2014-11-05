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
  //window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();

  var units = [], liveUnits = [];
  var sides = [[-1, -1], [0, -1], [1, -1],
               [-1,  0],          [1,  0],
               [-1,  1], [0,  1], [1,  1]];
  var tick = 0, unitsPerTick = 0, timePerTick = 0;

  // Prefill the world with dead units
  for (var x = -2; x < boardWidth + 2; x++) {
    var unitCol = [];
    for (var y = -2; y < boardHeight + 2; y++) {
      unitCol[y] = {
        x: x,
        y: y,
        alive: false,
        dying: false,
        siblings: [],
      };
    }
    units[x] = unitCol;
  }

  var sx, sy;
  // Mark all of the siblings
  for (var x = 0; x < boardWidth; x++) {
    for (var y = 0; y < boardHeight; y++) {
      for (var s = 0; s < sides.length; s++) {
        sx = x + sides[s][0];
        sy = y + sides[s][1];
        // Only add a sibling if it is within bounds
        if (sx < 0 || sx > boardWidth || sy < 0 || sy > boardHeight) { continue; }
        units[x][y].siblings.push(units[sx][sy]);
      }
    }
  }

  // Seed the world with random living units
  for (var i = 0; i < (boardWidth * boardHeight / 3); i++) {
    var x = Math.floor(Math.random() * boardWidth)
      , y = Math.floor(Math.random() * boardHeight);
    // Don't seed a coordinate twice. Try seeding another one
    if (units[x][y].alive !== false) { i--; }
    else { units[x][y].alive = 0; liveUnits.push(units[x][y]); }
  }

  function checkUnitLife(unit) {
    if (unit.x < 0 || unit.x > boardWidth || unit.y < 0 || unit.y > boardHeight) { return false; }

    var count = unit.siblings.filter(function (sibling) { return sibling.alive !== false; }).length;

    // Queue unit changes until all rendering is complete
    if (unit.alive === false && birthReq.min <= count && count <= birthReq.max) {
      // Unit should be born
      return true;
    } else if (unit.alive !== false && (count < 2 || count > 3 || unit.alive > unitLifespan)) {
      // Unit should die
      return false;
    }
    // Unit shouldn't change
    return null;
  }

  function updateUnits() {
    var start = window.performance.now();
    var unitBirths = [];

    // Run through the rules of unit growth and death
    liveUnits.forEach(function (unit) {
      var s;
      var shouldLive = checkUnitLife(unit);
      if (shouldLive === false) { unit.dying = true; }
      else { unit.alive++; } // Age

      // Handle surrounding units
      unit.siblings.forEach(function (sibling) {
        if (sibling.alive === false && checkUnitLife(sibling) === true) {
          unitBirths.push(sibling);
        }
      });
    });

    liveUnits = liveUnits.filter(function (unit) {
      if (unit.dying === true) {
        // Unit dies
        unit.alive = false;
        unit.dying = false;
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.fillRect(unit.x * unitSize, unit.y * unitSize, unitSize, unitSize);
      } else {
        // Unit lives
        var intensity = Math.floor((255 / unitLifespan) * unit.alive);
        ctx.fillStyle = 'rgb(' + intensity + ',' + intensity + ',' + intensity + ')';
        ctx.fillRect(unit.x * unitSize, unit.y * unitSize, unitSize, unitSize);
      }
      return (unit.alive !== false);
    });

    ctx.fillStyle = 'rgb(0,0,0)';
    unitBirths.forEach(function (unit) {
      // If the unit already exists, don't recreate it
      if (unit.alive !== false) { return; }

      unit.alive = 0;
      liveUnits.push(unit);
      ctx.fillRect(unit.x * unitSize, unit.y * unitSize, unitSize, unitSize);
    });

    tick++;
    var executionTime = (window.performance.now() - start);
    timePerTick += executionTime;
    unitsPerTick += liveUnits.length;
    if (executionTime > 16 && tick % 10 === 1) {
      var timePerUnit = (timePerTick / unitsPerTick) * 1000;
      console.log(timePerUnit + ' per 1000 units');
      console.log(executionTime + ' for ' + liveUnits.length);
      timePerTick = 0;
      unitsPerTick = 0;
    }

    setTimeout(function () { requestAnimationFrame(updateUnits); }, 1000 / fps);
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
