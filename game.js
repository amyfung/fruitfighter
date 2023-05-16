/**
 * Amy Fung and Lana Abdi
 * CS307 - Graphics
 * HW6: Creative Scene
 */
let fruitParams, scene, camera, renderer, fruits, container, raycaster, mouse, score,
  highScore, isMouseDown, explosionParticles;
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
  };

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
    "./assets/images/orange.jpg",
    // https://thumbs.dreamstime.com/b/watermelon-skin-texture-close-up-watermelon-skin-texture-watermelon-rind-stripes-102872998.jpg
    "./assets/images/watermelon.jpg",
    //https://stock.adobe.com/ie/images/close-up-photo-of-red-apple-background-apples-fruit-peel-texture-macro-view-beautiful-natural-wallpaper/428378061
    "./assets/images/apple.jpg",
    //https://stock.adobe.com/images/kiwi-fruit-peel-macro-texture/62101744
    "./assets/images/kiwi.jpg",
    //https://seamless-pixels.blogspot.com/2012/01/seamless-banana-skin.html
    "./assets/images/banana.jpg"
    //"./assets/images/celery.jpg"
    //"./assets/images/pear.jpg"
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

/**
 * Given a radius dimension and texture material, creates a parent object
 * and a watermelon mesh before scaling the mesh and adding it to the parent
 * object.
 * @param {number} radius - The radius of the watermelon.
 * @param {THREE.Material} material - The material to be applied to the watermelon mesh.
 * @returns {THREE.Object3D} A watermelon object.
 */
function createWatermelon(radius, material) {
  const watermelon = new THREE.Object3D();
  const watermelonGeom = new THREE.SphereGeometry(radius, 40, 40);
  const melonMesh = new THREE.Mesh(watermelonGeom, material);
  melonMesh.scale.set(1, 1.4, 1);
  watermelon.add(melonMesh);

  return watermelon;
}

/**
 * Given a radius dimension and texture material, creates a parent object, an 
 * orange mesh, and an orange stem mesh before adding both meshes to the parent
 * object.
 * @param {number} radius - The radius of the orange.
 * @param {THREE.Material} material - The material to be applied to the 
 *  orange mesh.
 * @returns {THREE.Object3D} An orange object.
 */
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

/**
 * Given a radius dimension and texture material, creates a parent object, an 
 * apple mesh, and an apple stem mesh before adding both meshes to the parent
 * object.
 * @param {number} radius - The radius of the apple.
 * @param {THREE.Material} material - The material to be applied to the apple 
 *  mesh.
 * @returns {THREE.Object3D} An apple object.
 */
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

/**
 * Given a radius dimension and texture material, creates a parent object and a
 * kiwi mesh before scaling the mesh and adding it to the parent object.
 * @param {number} radius - The radius of the kiwi.
 * @param {THREE.Material} material - The material to be applied to the kiwi
 *  mesh.
 * @returns {THREE.Object3D} A kiwi object.
 */
function createKiwi(radius, material) {
  const kiwi = new THREE.Object3D();
  const kiwiGeom = new THREE.SphereGeometry(radius, 40, 40);
  const kiwiMesh = new THREE.Mesh(kiwiGeom, material);
  kiwiMesh.scale.set(1, 1.25, 1);
  kiwi.add(kiwiMesh);

  return kiwi;
}

/**
 * Given a radius dimension and texture material, creates a parent object
 * and a celery mesh before scaling the mesh and adding it to the parent
 * object.
 * @param {number} radius - The radius of the celery.
 * @param {THREE.Material} material - The material to be applied to the celery mesh.
 * @returns {THREE.Object3D} A celery object.
 */
function createCelery(material) {
  const celery = new THREE.Object3D();
  const celeryGeom = new THREE.CylinderGeometry(2, 2, 14,7,1,true,0,4);
  const celeryMesh = new THREE.Mesh(celeryGeom, material);
  //CeleryMesh.scale.set(1, 1.4, 1);
  celery.add(celeryMesh);
  return celery;
}

/**
 * Given a texture material, creates a parent object and a pear mesh and adds
 * the mesh to the parent object before returning it.
 * @param {THREE.Material} material - The material to be applied to the pear
 * @returns {THREE.Object3D} A pear object.
 */
function createPear(material) {
  var pearParams = {
    'ctrlPt0 x': -26,
    'ctrlPt0 y': 14,
    'ctrlPt0 z': 0,
    'ctrlPt1 x': 25,
    'ctrlPt1 y': 25,
    'ctrlPt1 z': 10,
    'ctrlPt2 x': 75,
    'ctrlPt2 y': 1,
    'ctrlPt2 z': -5,
    'ctrlPt3 x': 80,
    'ctrlPt3 y': -1,
    'ctrlPt3 z': -11,
    radius0: 0,
    radius1: 10,
    radius2: 20,
    radius3: 0,
  };
  var bezierCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(bananafruitParams['ctrlPt0 x'], bananafruitParams['ctrlPt0 y'], bananafruitParams['ctrlPt0 z']),
    new THREE.Vector3(bananafruitParams['ctrlPt1 x'], bananafruitParams['ctrlPt1 y'], bananafruitParams['ctrlPt1 z']),
    new THREE.Vector3(bananafruitParams['ctrlPt2 x'], bananafruitParams['ctrlPt2 y'], bananafruitParams['ctrlPt2 z']),
    new THREE.Vector3(bananafruitParams['ctrlPt3 x'], bananafruitParams['ctrlPt3 y'], bananafruitParams['ctrlPt3 z'])
  );

  var radii = [pearParams.radius0, pearParams.radius1, pearParams.radius2, pearParams.radius3];

  var pearGeom = new THREE.TubeRadialGeometry(bezierCurve, 32, radii, 16, false);
  var pearMat = new THREE.MeshNormalMaterial();
  pearMat.side = THREE.DoubleSide;
  var pear = new THREE.Mesh(pearGeom, material);

  return pear;
}

/**
 * Given a radius dimension, creates a parent object, a bomb mesh, a bomb top
 * mesh, and a detonating cord mesh before positioning the meshes and adding
 * them to the parent object.
 * @param {number} radius - The radius of the bomb body.
 * @returns {THREE.Object3D} A bomb object.
 */
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
// Explosion animation
// ----------------------------------------------------------------------
var colors = [0xff9900, 0x9D00FF, 0x39FF14];

function createExplosionParticles() {
  const particleCount = 500;
  const particleGeometry = new THREE.SphereGeometry(.5);
  var num = getRandNum(0, colors.length - 1)
  const particleMaterial = new THREE.MeshBasicMaterial({ color: colors[num] });

  explosionParticles = new THREE.Group();
  for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.velocity = new THREE.Vector3();
    explosionParticles.add(particle);
    particle.visible = false;
  }
  explosionParticles.lifeSpan = 0;
}

function explodeFruit(fruit) {
  container.remove(explosionParticles);
  createExplosionParticles();
  for (let i = 0; i < explosionParticles.children.length; i++) {
    const particle = explosionParticles.children[i];
    particle.position.copy(fruit.position);
    particle.visible = true;

    const velocity = new THREE.Vector3(
      getRandNum(-2,2),
      getRandNum(-2,2),
      getRandNum(-2,2)
    );
    particle.velocity = velocity;
  }
}

// ----------------------------------------------------------------------
// Fruit animation
// ----------------------------------------------------------------------
/**
 * Generates a random number between min and max (inclusive).
 * @param {number} min - The minimum number.
 * @param {number} max - The maximum number.
 * @returns {number} A random number between min and max.
 */
function getRandNum(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}

/**
 * Sets a random position for a fruit object.
 * @param {THREE.Object3D} fruit - The fruit object to set the position for.
*/
function setRandPos(fruit) {
  fruit.position = new THREE.Vector3();
  fruit.position.x = Math.random() * 16 - 4;
  fruit.position.y = 0; // Change the initial y position to be below the screen
  fruit.position.z = Math.random() * 6 - 3;
  /* var randX = getRandNum(-camera.aspect, fruitParams.max * camera.aspect);
  var randZ = getRandNum(0, fruitParams.max);
  fruit.position = new THREE.Vector3(randX, -fruitParams.max / 2, randZ); */
}

/**
 * Sets a random velocity for a fruit object.
 * @param {THREE.Object3D} fruit - The fruit object to set the velocity for.
 */
function setRandVelocity(fruit) {
  fruit.velocity = new THREE.Vector3();
  fruit.velocity.x = (Math.random() - 0.5) * 0.2;
  fruit.velocity.y = Math.random() * 1.5 + 0.5; // Launch the fruit upwards
  fruit.velocity.z = (Math.random() - 0.5) * 0.2;
  // numbers based on desired speed, position, and scene parameters
  /* var x = getRandNum(-.1, .5);
  var y = getRandNum(.3, 1);
  var z = getRandNum(-.1, .3);
  fruit.velocity = new THREE.Vector3(x, y, z); */
}

/**
 * Resets the fruit by resetting its position, velocity, life span, and 
 *  visibility.
 * @param {THREE.Object3D} fruit - The fruit object to be reset.
 */
function resetFruit(fruit) {
  setRandPos(fruit);
  setRandVelocity(fruit);
  fruit.lifeSpan = 0;
  fruit.visible = true;
  return fruit;
}

/**
 * Given a number, generates a fruit or bomb and pushes it to the fruits array.
 * @param {THREE.Object3D[]} fruits - An array to store the generated fruit or bomb.
 * @param {number} num - A number to determine the type of fruit or bomb to be generated.
 * @param {number} radius - The radius of the fruit.
 * @param {THREE.Material} material - The material to be applied to the fruit mesh.
 */
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
    case 4:
      fruit = createBanana(radius / 2, material);
      break;
    case 5:
      fruit = createCelery(radius, material);
      break;
    case 6:
      fruit = createPear(radius, material);
      break;        
    case 7:
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

/**
 * Generates fruits using the given textures.
 * @param {Array} textures - An array of textures for the fruits.
 */
function generateFruits(textures) {
  const materials = makeMaterials(textures);
  fruits = [];
  for (let i = 0; i <= materials.length; i++) {
    if (i < materials.length) {
      addFruit(fruits, i, fruitParams.radius, materials[i]);
    } if (i == materials.length) {
      addFruit(fruits, i, fruitParams.radius, null) // Bomb does not use a texture
    }
    //resetFruit(fruits[i]);
  }
}

function animate() {
  if (!stopped) {
    requestAnimationFrame(function () { animate() });
  }

  // Update fruit positions
  // Generate number to select a fruit or bomb randomly
  for (let i = 0; i < fruitParams.fruitCount; i++) {
    var num = getRandNum(0, fruits.length - 1);
    var fruit = fruits[num];
    fruit.position.add(fruit.velocity);
    fruit.velocity.y -= 0.05; // Apply gravity to the fruit's velocity
    fruit.rotation.x += 0.02;
    fruit.rotation.y += 0.02;
    fruit.lifeSpan++;

    // Reset fruit position and life span
    if (fruit.lifeSpan > 150) {
      fruits[num] = resetFruit(fruit);
    }
  }
  for (let fruit of fruits) {
    if (fruit.visible) {
      container.add(fruit);
    }
  }

  if (explosionParticles) {
    for (let i = 0; i < explosionParticles.children.length; i++) {
      const particle = explosionParticles.children[i];
      if (particle.visible) {
        particle.position.add(particle.velocity);
        particle.velocity.y -= 0.05;
        particle.scale.multiplyScalar(0.9);
        particle.lifeSpan++;
        if (particle.lifeSpan > 30) { // Adjust the number to control the life span of particles
          particle.visible = false;
        }
      }
    }
    container.add(explosionParticles);
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

function checkFruitSlicing() {
  if (stopped) return;
  raycaster.setFromCamera(mouse, camera);
  // Add 'true' to enable recursive search for child objects
  const intersects = raycaster.intersectObjects(container.children, true);

  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object;
    const fruit = object.parent; // Get the parent of the intersected object
    // Remove fruit and update score
    if (fruit.visible && object !== fruit) { // Check if the intersected object is not the parent (i.e. it's the mesh)
      if (fruit.name == "bomb") {
        explodeFruit(fruit);
        fruit.visible = false;
        explosionParticles.visible = false;
        endGame();
        return; // Score is not incremented if a bomb is sliced
      }
      if (fruit.name == "fruit") {
        explodeFruit(fruit);
        fruit.visible = false;
        score++;
        updateScoreText();
        // Delay fruit respawn
        setTimeout(() => {
          resetFruit(fruit);
        }, 700);
      }
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

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

    var pause = document.getElementById("pause");
    if (pause.addEventListener)
      pause.addEventListener("click", pauseGame, false);
    else if (pause.attachEvent)
      pause.attachEvent('onclick', pauseGame);
}
// ----------------------------------------------------------------------
// Game display
// ----------------------------------------------------------------------
/**
 * 
 */
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

/**
 * Starts the game again by hiding game over components, resetting the fruit, 
 * and animating without resetting the high score
 */
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

function pauseGame() {
  if (stopped) {
    console.log("Unpausing");
    stopped = false; 
    renderer.domElement.style.pointerEvents = 'auto';
    animate();
  } else {
    console.log("Pausing");
    stopped = true; 
    renderer.domElement.style.pointerEvents = 'auto';
  }
  
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
    80, // fov
    window.innerWidth / window.innerHeight, // aspect
    30, // near
    500 // far
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
