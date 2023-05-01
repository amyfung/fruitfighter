let fruitParams, scene, camera, renderer, fruits, container, raycaster, mouse, score,
  highScore, isMouseDown, particleMaterial;
let stopped = false;

// Initialize game
init();

/* *
 * Initializes the game by creating the scene, setting up the main global variables,
 * and attaching event listeners.
 */
function init() {
  fruitParams = {
    radius: 4,
    fruitCount: 5,
    max: 4,
  }

  // Create scene and container
  scene = createScene();
  container = new THREE.Object3D();
  container.name = "container";
  scene.add(container);

  // Load textures and generate fruits
  loadTextures(() => {
    // Call animate() function after the fruits have been generated
    animate();
  });

  particleMaterial = new THREE.PointsMaterial({
    size: 0.2,
    color: 0xff9900,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: new THREE.TextureLoader().load('./images/particles.png'),
  });
  // Create camera
  createCamera();

  // Initializing raycaster and mouse
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Hide game over components
  showGameOver(false);

  // Initialize score
  score = 0;
  highScore = 0;
  updateScoreText();

  // Create and add lighting
  createLighting(scene);

  renderer = createRenderer();

  // Add controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Add event listeners
  addEventListeners();
}

// ----------------------------------------------------------------------
// Fruit models
// ----------------------------------------------------------------------

function loadTextures(callback) {
  TW.loadTextures([
    // storage.needpix.com/rsynced_images/citrus-fruit-skin-2523487_1280.jpg
    "./images/orange.jpg",
    // https://thumbs.dreamstime.com/b/watermelon-skin-texture-close-up-watermelon-skin-texture-watermelon-rind-stripes-102872998.jpg
    "./images/watermelon.jpg",
    //https://stock.adobe.com/ie/images/close-up-photo-of-red-apple-background-apples-fruit-peel-texture-macro-view-beautiful-natural-wallpaper/428378061
    "./images/apple.jpg",
    //https://stock.adobe.com/images/kiwi-fruit-peel-macro-texture/62101744
    "./images/kiwi.jpg",
    //https://seamless-pixels.blogspot.com/2012/01/seamless-banana-skin.html
    //"./images/banana.jpg"
  ],
    function (textures) {
      generateFruits(textures);
      if (callback) {
        callback();
      }
    });
}

/**
 * For each texture given, sets properties for the texture, creates a material
 * mapped to that texture, and adds the material to an array that
 * it returns.
 * @param {THREE.Texture[]} textures - The array of textures to create materials from.
 * @returns {THREE.MeshPhongMaterial[]} The array of materials.
 */
function makeMaterials(textures) {
  var materials = [];
  for (var i = 0; i < textures.length; i++) {
    textures[i].flipY = false;
    textures[i].needsUpdate = true;
    textures[i].repeat.set(2, 2);
    textures[i].wrapS = THREE.MirroredRepeatWrapping;
    textures[i].wrapT = THREE.MirroredRepeatWrapping;
    materials.push(new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: textures[i]
    }));
  }
  return materials;
}


function createWatermelon(radius, material) {
  const watermelon = new THREE.Object3D();
  const watermelonGeom = new THREE.SphereGeometry(radius, 40, 40);
  const melonMesh = new THREE.Mesh(watermelonGeom, material);
  melonMesh.scale.set(1, 1.4, 1);
  watermelon.add(melonMesh);

  return watermelon;
}

function createOrange(radius, material) {
  const orange = new THREE.Object3D();
  const orangeGeometry = new THREE.SphereGeometry(radius, 40, 40);
  const orangeMesh = new THREE.Mesh(orangeGeometry, material);
  orange.add(orangeMesh);

  // stem
  const stemGeom = new THREE.CylinderGeometry(radius / 20, radius / 8, .8);
  const stemMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color("green") });
  const stem = new THREE.Mesh(stemGeom, stemMaterial);
  stem.position.set(0, radius, 0);
  orange.add(stem);

  return orange;
}


function createApple(radius, material) {
  const apple = new THREE.Object3D();
  const appleGeom = new THREE.SphereGeometry(radius, 40, 40);
  const appleMesh = new THREE.Mesh(appleGeom, material);
  apple.add(appleMesh);

  // stem
  const appleStemGeom = new THREE.CylinderGeometry(radius / 20, radius / 20, radius / 4);
  const appleStemMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color('rgb(111, 78, 55)') });
  const appleStem = new THREE.Mesh(appleStemGeom, appleStemMaterial);
  appleStem.position.set(0, radius, 0);
  apple.add(appleStem);

  return apple;
}

/**
 * Given a texture material, creates a parent object and a banana mesh and adds
 * the mesh to the parent object before returning it.
 * @param {THREE.Material} material - The material to be applied to the banana
 * @returns {THREE.Object3D} A banana object.
 */
function createBanana(material) {
  var bananafruitParams = {
    'ctrlPt0 x': -14,
    'ctrlPt0 y': 14,
    'ctrlPt0 z': 5,
    'ctrlPt1 x': -18,
    'ctrlPt1 y': 8,
    'ctrlPt1 z': 10,
    'ctrlPt2 x': 25,
    'ctrlPt2 y': -14,
    'ctrlPt2 z': -5,
    'ctrlPt3 x': 31,
    'ctrlPt3 y': 21,
    'ctrlPt3 z': 2,
    radius0: 0,
    radius1: 3,
    radius2: 5,
    radius3: 1,
  };
  var bezierCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(bananafruitParams['ctrlPt0 x'], bananafruitParams['ctrlPt0 y'], bananafruitParams['ctrlPt0 z']),
    new THREE.Vector3(bananafruitParams['ctrlPt1 x'], bananafruitParams['ctrlPt1 y'], bananafruitParams['ctrlPt1 z']),
    new THREE.Vector3(bananafruitParams['ctrlPt2 x'], bananafruitParams['ctrlPt2 y'], bananafruitParams['ctrlPt2 z']),
    new THREE.Vector3(bananafruitParams['ctrlPt3 x'], bananafruitParams['ctrlPt3 y'], bananafruitParams['ctrlPt3 z'])
  );

  var radii = [bananafruitParams.radius0, bananafruitParams.radius1, bananafruitParams.radius2, bananafruitParams.radius3];

  var bananaGeom = new THREE.TubeRadialGeometry(bezierCurve, 32, radii, 16, false);
  var bananaMat = new THREE.MeshNormalMaterial();
  bananaMat.side = THREE.DoubleSide;
  var banana = new THREE.Mesh(bananaGeom, material);

  return banana;
}

function createKiwi(radius, material) {
  const kiwi = new THREE.Object3D();
  const kiwiGeom = new THREE.SphereGeometry(radius, 40, 40);
  const kiwiMesh = new THREE.Mesh(kiwiGeom, material);
  kiwiMesh.scale.set(1, 1.25, 1);
  kiwi.add(kiwiMesh);

  return kiwi;
}


function createBomb(radius) {
  const bomb = new THREE.Object3D();
  const bombGeom = new THREE.SphereGeometry(radius, 40, 40);
  const bombMaterial = new THREE.MeshPhongMaterial({ color: new THREE.Color("black") })
  const bombMesh = new THREE.Mesh(bombGeom, bombMaterial);
  bomb.add(bombMesh);

  const bombTop = new THREE.CylinderGeometry(radius / 3, radius / 3, 1, 20);
  const bombTopMesh = new THREE.Mesh(bombTop, bombMaterial);
  bombTopMesh.position.set(0, radius, 0);
  bomb.add(bombTopMesh);

  // Create detonating cord using Bezier curves and tube geometry 
  var bezierCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-.7, 1.1, .23),
    new THREE.Vector3(.4, 1.3, 0),
    new THREE.Vector3(.2, 1.9, .23)
  );
  var geom = new THREE.TubeGeometry(bezierCurve, 32, .1, 10, false);
  var tube = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: THREE.ColorKeywords.grey }));

  tube.position.set(0, radius + radius / 3, 0); // Place at top center of the bomb
  bomb.add(tube);

  bomb.name = "bomb"; // For later detection of bomb

  return bomb;
}

// ----------------------------------------------------------------------
// Fruit animation
// ----------------------------------------------------------------------
function getRandNum(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}

function setRandPos(fruit) {
  var randX = getRandNum(-fruitParams.max / 2 * camera.aspect, fruitParams.max * camera.aspect);
  var randZ = getRandNum(0, fruitParams.max);
  fruit.position = new THREE.Vector3(randX, -fruitParams.max / 2, randZ);
}

function setRandVelocity(fruit) {
  // numbers based on desired speed, position, and scene parameters
  var x = getRandNum(-.1, .5);
  var y = getRandNum(.5, .8);
  var z = getRandNum(-.1, .3);
  fruit.velocity = new THREE.Vector3(x, y, z);
}

function resetFruit(fruit) {
  setRandPos(fruit);
  setRandVelocity(fruit);
  fruit.lifeSpan = 0;
  fruit.visible = true;
}

function addFruit(fruits, num, radius, material) {
  var fruit;
  switch (num) {
    case 0:
      fruit = createOrange(radius, material);
      break;
    case 1:
      fruit = createWatermelon(radius * 2, material);
      break;
    case 2:
      fruit = createApple(radius, material);
      break;
    case 3:
      fruit = createKiwi(radius / 2, material);
      break;
    case 4:/* 
      fruit = createBanana(radius / 2, material);
      break;
    case 5: */
      fruit = createBomb(radius * .75);
      break;
  }
  resetFruit(fruit);
  if (material) {
    fruit.name = "fruit";
  }
  fruits.push(fruit);
  return fruit;
}

function generateFruits(textures) {
  const materials = makeMaterials(textures);
  fruits = [];
  for (let i = 0; i <= materials.length; i++) {
    if (i < materials.length) {
      addFruit(fruits, i, fruitParams.radius, materials[i]);
    } if (i == materials.length) {
      addFruit(fruits, i, fruitParams.radius, null) // Bomb does not use a texture
    }
  }
}

/**
 * Animates the fruits in the scene by updating their positions and rotations.
 */
function animate() {
  if (!stopped) {
    requestAnimationFrame(function () { animate() });
  }

  // Update fruit positions
  for (let i = 0; i < fruitParams.fruitCount; i++) {
    // Generate number to select a fruit or bomb randomly
    var num = getRandNum(0, fruits.length - 1);
    var fruit = fruits[num];
    fruit.position.add(fruit.velocity);
    fruit.velocity.y -= 0.01; // Apply gravity to the fruit's velocity
    fruit.rotation.x += 0.02;
    fruit.rotation.y += 0.02;
    container.add(fruit);
    fruit.lifeSpan++;

    // Reset fruit position and life span
    if (fruit.lifeSpan > 200) {
      resetFruit(fruit);
    }
  }
  
  renderer.render(scene, camera);
}

// ----------------------------------------------------------------------
// User interaction
// ----------------------------------------------------------------------

function onMouseUp(event) {
  event.preventDefault();
  isMouseDown = false;
}

function onMouseDown(event) {
  event.preventDefault();
  isMouseDown = true;
}

function onMouseMove(event) {
  event.preventDefault();
  if (!event.target == renderer.domElement) {
    return;
  }
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  checkFruitSlicing();
}

/**
 * Checks if any fruits have been sliced and updates their visibility and the 
 * score if so.
 */
function checkFruitSlicing() {
  if (stopped) return;
  raycaster.setFromCamera(mouse, camera);
  //raycaster.params.Points.threshold = 1;
  // Add 'true' to enable recursive search for child objects
  const intersects = raycaster.intersectObjects(container.children, true);

  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object;
    const fruit = object.parent; // Get the parent of the intersected object
    // Remove fruit and update score
    if (fruit.visible && object !== fruit) { // Check if the intersected object is not the parent (i.e. it's the mesh)
      if (fruit.name == "bomb") {
        //createExplosion(fruit);
        endGame();
        return; // Score is not incremented if a bomb is sliced
      }
      if (fruit.name == "fruit") {
        fruit.visible = false;
        //createExplosion(fruit);
        score++;
        updateScoreText();
        // Delay fruit respawn
        setTimeout(() => {
          resetFruit(fruit);
        }, 800);
      }
    }
  }
}

function createExplosion(fruit) {
  const explosion = new THREE.Object3D();
  const geometry = new THREE.SphereGeometry(.5, 32, 32); // Increased size
  const material = new THREE.MeshBasicMaterial({ color: 0xff4500 }); // Changed color to make more noticeable

  for (let i = 0; i < 200; i++) { // Increased the number of particles
    const mesh = new THREE.Mesh(geometry, material);
    mesh.velocity = fruit.velocity;
    mesh.position.copy(fruit.position);
    mesh.scale.multiplyScalar(Math.random() * .5); // Increased scale
    mesh.lifetime = 0;
    explosion.add(mesh);
    container.add(explosion);
    if (mesh.lifetime < 10) { // Decreased lifetime
      mesh.lifetime++;
      mesh.position.add(mesh.velocity);
      mesh.scale.multiplyScalar(0.9); // Increased shrinking rate
      requestAnimationFrame(animateExplosion);
    } else {
      container.remove(explosion);
    }
  }
  // Animate and remove explosion particles
 
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Adds event listeners for mouse events and window resize events.
 */
function addEventListeners() {
  renderer.domElement.addEventListener('mousedown', onMouseDown, false);
  renderer.domElement.addEventListener('mouseup', onMouseUp, false);
  renderer.domElement.addEventListener('resize', onWindowResize, false);
  renderer.domElement.addEventListener('mousemove', onMouseMove, false);

  var el = document.getElementById("retry");
  if (el.addEventListener)
    el.addEventListener("click", retryGame, false);
  else if (el.attachEvent)
    el.attachEvent('onclick', retryGame);
}
// ----------------------------------------------------------------------
// Game display
// ----------------------------------------------------------------------

function updateScoreText() {
  document.getElementById("score").innerHTML = `Score: ${score}`;
}

function updateHighScore() {
  document.getElementById("highScore").innerHTML = `High Score: ${highScore}`;
}

function showGameOver(visible) {
  const gameOverDiv = document.getElementById('gameOver');
  if (visible) {
    console.log("Showing game over msg")
    gameOverDiv.style.visibility = 'visible';
  } else {
    console.log("Hiding game over msg")
    gameOverDiv.style.visibility = 'hidden';
  }
}

function endGame() {
  if (score > highScore) {
    highScore = score;
  }
  updateHighScore();
  renderer.domElement.style.pointerEvents = 'none';
  showGameOver(true);
  stopped = true;
}

function retryGame() {
  console.log("Retrying");
  stopped = false;
  score = 0;
  updateScoreText();
  showGameOver(false);
  renderer.domElement.style.pointerEvents = 'auto';
  for (let i = 0; i < fruits.length; i++) {
    resetFruit(fruits[i]);
  }
  animate();
}

// ----------------------------------------------------------------------
// Scene Utils
// ----------------------------------------------------------------------

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("white");
  return scene;
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  renderer.setSize(window.innerWidth, window.innerHeight);
  return renderer;
}

function createCamera() {
  camera = new THREE.PerspectiveCamera(
    75, // fov
    window.innerWidth / window.innerHeight, // aspect
    .1, // near
    1000 // far
  );
  console.log(camera.aspect);
  camera.position.set(0, 0, 50);
  scene.add(camera);
  return camera;
}


function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, .5);
  pointLight.position.set(25, 50, 25);
  scene.add(pointLight);
}

/* var level2Light = new THREE.SpotLight(new THREE.Color('grey'),2,0,Math.PI/4);level2Light.position.set(-40,10,-40)level2Light.target.position.set(-40,40,-40)scene.add(level2Light.target);scene.add(level2Light);
var level3Light = new THREE.SpotLight(new THREE.Color('grey'),4,0,Math.PI/4);level3Light.position.set(-40,10,-40)level3Light.target.position.set(-40,40,-40)scene.add(level3Light.target);scene.add(level3Light);///var lightParams = { level1:true, level2:true, level3:true}
function level1V() {
//.visible = lightParams.level1;TW.render();}
function level2V() {
level2Light.visible = lightParams.level2;
  TW.render();
}


function level3V() {
level3Light.visible = lightParams.level3;
  TW.render();
}
// Render scene

var renderer = new THREE.WebGLRenderer();
TW.mainInit(renderer,scene);
//TW.cameraSetup

var gui = new dat.GUI();gui.add(lightParams, 'level1').onChange(level3V);gui.add(lightParams, 'level2').onChange(level2V);gui.add(lightParams, 'level3').onChange(level3V);
 */
