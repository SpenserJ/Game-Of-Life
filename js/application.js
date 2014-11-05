document.addEventListener("DOMContentLoaded", function(event) {
  var canvas = document.getElementById('gameoflife')
    , ctx = canvas.getContext('2d')
    , boardWidth
    , boardHeight;

  // Configuration Options
  var unitSize = 4
    , unitLifespan = 50
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

  function draw() {
    // Draw on the next animation frame
    setTimeout(function () { requestAnimationFrame(draw); }, 1000 / fps);

    // Color the background
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var unitDeaths = [], unitBirths = [];

    // Run through the rules of unit growth and death
    for (var x = 0; x < boardWidth; x++) {
      for (var y = 0; y < boardHeight; y++) {
        var count = 0;
        var sides = [[-1, -1], [0, -1], [1, -1],
                     [-1,  0],          [1,  0],
                     [-1,  1], [0,  1], [1,  1]];

        for (var s = 0; s < sides.length; s++) {
          if (typeof units[x + sides[s][0]][y + sides[s][1]] !== 'undefined') { count++; }
        }

        var unitExists = (typeof units[x][y] !== 'undefined');

        if (unitExists === true) {
          var alpha = 1 - ((1 / unitLifespan) * units[x][y]);
          ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
          ctx.fillRect(x * unitSize, y * unitSize, unitSize, unitSize);
          units[x][y]++;
        }

        // Queue unit changes until all rendering is complete
        if (unitExists === true && (count < 2 || count > 3 || units[x][y] === unitLifespan)) {
          unitDeaths.push({ x: x, y: y });
        } else if (count === 3 && unitExists === false) {
          unitBirths.push({ x: x, y: y });
        }
      }
    }

    unitDeaths.forEach(function (unit) { delete units[unit.x][unit.y]; });
    unitBirths.forEach(function (unit) { units[unit.x][unit.y] = 0; });
  }

  draw();
});
