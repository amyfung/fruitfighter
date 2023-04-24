let scene, camera, renderer, fruits, container, raycaster;
let mouse, score, highScore, isMouseDown;
let stopped = false;

// Initialize game
init();

/**
 * Initializes the game by creating the scene, setting up the main global variables,
 * and attaching event listeners.
 */
function init() {
  let params = {
    radius: 4,
    fruitCount: 5,
  }

  // -- Initialize main global variables
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("white"); // TODO: change

  // Create container
  container = new THREE.Object3D();
  scene.add(container);

  // Load textures and generate fruits
  loadTextures((params) => {
    // Call animate() function after the fruits have been generated
    animate(params);
  }, params);

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

  renderer = new THREE.WebGLRenderer();
  document.body.appendChild(renderer.domElement);
  TW.mainInit(renderer, scene);

  // Add controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Add event listeners
  renderer.domElement.addEventListener('mousedown', onMouseDown, false);
  renderer.domElement.addEventListener('mousemove', onMouseMove, false);
  renderer.domElement.addEventListener('mouseup', onMouseUp, false);

  var el = document.getElementById("retry");
  if (el.addEventListener)
    el.addEventListener("click", retryGame, false);
  else if (el.attachEvent)
    el.attachEvent('onclick', retryGame);
}


// ----------------------------------------------------------------------
// Fruit models
// ----------------------------------------------------------------------
function loadTextures(callback, params) {
  TW.loadTextures(["./images/orange.jpg", "./images/watermelon.jpg", "./images/apple.jpg", "./images/kiwi.jpg"],
    function (textures) {
      generateFruits(params.radius, textures);
      if (callback) {
        callback(params);
      }
    });
}

/**
 * For each texture given, sets properties for the texture, creates a mesh 
 * mapped to that texture, and adds the mesh to an array that it returns.
 * @param {*} textures 
 * @returns {}
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
  melonMesh.scale.y = 1.4;
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
  // https://storage.needpix.com/rsynced_images/citrus-fruit-skin-2523487_1280.jpg
  const orangeMesh = new THREE.Mesh(orangeGeometry, material);
  orange.add(orangeMesh);

  // stem
  const stemGeom = new THREE.CylinderGeometry(radius / 20, .25, .8);
  const stemMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color("green") });
  const stem = new THREE.Mesh(stemGeom, stemMaterial);
  stem.position.set(0, 3, 0);
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
  const appleStemGeom = new THREE.CylinderGeometry(.2, .25, .8);
  const appleStemMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color("brown") });
  const appleStem = new THREE.Mesh(appleStemGeom, appleStemMaterial);
  appleStem.position.set(.25, .25, 1);
  apple.add(appleStem);

  // NOTE: add leaf

  return apple;
}

/**
 * Given a radius dimension and texture material, creates a parent object and a
 * coconut mesh before adding the coconut mesh to the parent object.
 * @param {number} radius - The radius of the apple.
 * @param {THREE.Material} material - The material to be applied to the apple 
 *  mesh.
 * @returns {THREE.Object3D} An apple object.
 */
function createCoconut(material) {
  const coconut = new THREE.Object3D();
  const coconutGeom = new THREE.SphereGeometry(2, 40, 4);
  const coconutMesh = new THREE.Mesh(coconutGeom, material);
  coconut.add(coconutMesh);

  return coconut;
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
  kiwiMesh.scale.y = 1.25;
  kiwi.add(kiwiMesh);

  return kiwi;
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

  const bombTop = new THREE.CylinderGeometry(1, 1, 1, 20);
  const bombTopMesh = new THREE.Mesh(bombTop, bombMaterial);
  bombTopMesh.position.set(0, 3, 0);
  bomb.add(bombTopMesh);

  // create detonating cord using Bezier curves and tube geometry 
  var bezierCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0), // bottom, center
    new THREE.Vector3(-.7, 1.1, .23),
    new THREE.Vector3(.4, 1.3, 0),
    new THREE.Vector3(.2, 1.9, .23)
  );
  var geom = new THREE.TubeGeometry(bezierCurve, 32, .1, 10, false);
  var tube = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: THREE.ColorKeywords.grey }));

  tube.position.set(0, 3, 0);
  bomb.add(tube);

  bomb.name = "bomb";

  return bomb;
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
 * Sets the x and z position coordinates of the given fruit to randomly 
 * generated numbers and the y position coordinate to -5.
 * @param {THREE.Object3D} fruit - The fruit whose position is to be set.
 */
function setRandPos(fruit) {
  fruit.position = new THREE.Vector3(getRandNum(-3, 3), -5, getRandNum(-1, 3));
}

/**
 * Randomly the velocity of the given fruit.
 * @param {THREE.Object3D} fruit - The fruit whose velocity is to be set.
 */
function setRandVelocity(fruit) {
  var x = getRandNum(-.5, .5);
  var y = getRandNum(.5, .5);
  var z = getRandNum(-.1, .5);
  fruit.velocity = new THREE.Vector3(x, y, z);
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
}

/**
 * Given a number, generates a fruit or bomb and pushe sit 
 * @param {Array} fruits - An array to store the generated fruit or bomb.
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
      fruit = createBomb(radius * .75);
      break;
  }

  resetFruit(fruit);
  fruits.push(fruit);
}

/**
 * Generates fruits using the given radius and textures.
 * @param {number} radius - The radius of the fruits.
 * @param {Array} textures - An array of textures for the fruits.
 */
function generateFruits(radius, textures) {
  const materials = makeMaterials(textures);
  fruits = [];
  for (let i = 0; i <= materials.length; i++) {
    if (i < materials.length) {
      addFruit(fruits, i, radius, materials[i]);
    } if (i == materials.length) {
      addFruit(fruits, i, radius, null) // bomb does not have texture
    }
  }
}

/**
 * Animates the fruits in the scene by updating their positions and rotations.
 * Resets a fruit when its life span reaches a threshold value.
 * @param {Object} params - An object containing parameters for the animation
 */
function animate(params) {
  if (!stopped) {
    requestAnimationFrame(function () { animate(params) });
  }

  // Update fruit positions
  for (let i = 0; i < params.fruitCount; i++) {
    // Generate number to select a fruit or bomb randomly
    var num = getRandNum(0, fruits.length - 1);
    var fruit = fruits[num];
    fruit.position.add(fruit.velocity);
    fruit.velocity.y -= 0.006; // Apply gravity to the fruit's velocity
    fruit.rotation.x += 0.02;
    fruit.rotation.y += 0.02;
    container.add(fruit);
    fruit.lifeSpan++;

    // Reset fruit position and life span
    if (fruit.lifeSpan > 240) {
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
  if (event.target == renderer.domElement) {
    // Use canvas offset to determine mouse coordinates in canvas coordinate frame
    var rect = event.target.getBoundingClientRect();
    var canvasX = event.clientX - rect.left;
    var canvasY = event.clientY - rect.top;
  } else {
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
  const intersects = raycaster.intersectObjects(container.children, true); // Add 'true' to enable recursive search for child objects

  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object;
    const fruit = object.parent; // Get the parent of the intersected object

    // Remove fruit and update score
    if (fruit.visible && object !== fruit) { // Check if the intersected object is not the parent (i.e. it's the mesh)
      fruit.visible = false;
      //scene.remove(fruit); 
      if (fruit.name == "bomb") {
        endGame();
        return;
      }

      score++;
      updateScoreText();

      // Delay fruit respawn
      setTimeout(() => {
        resetFruit(fruit);
      }, 3000);
    }
  }
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// -------- Score
/**
 * Updates the displayed score text.
 */
function updateScoreText() {
  document.getElementById("score").innerHTML = `Score: ${score}`;
}

/**
 * Updates the high score text on the screen.
 */
function updateHighScore() {
  document.getElementById("highScore").innerHTML = `High Score: ${highScore}`;
}

// -------- Pausing
function pause() {

}


// -------- Game over
/**
 * Hides or shows the game over components based on the specified visibility.
 * @param {boolean} visible - Determines whether the game over message should be 
 *  visible or hidden
 */
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

/**
 * Called when a bomb is sliced and updates the high score, displays the game
 * over components, and stops the game.
 */
function endGame() {
  if (score > highScore) {
    highScore = score;
  }
  updateHighScore();
  //updateScoreText();
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
  updateScoreText();
  showGameOver(false);
  renderer.domElement.style.pointerEvents = 'auto';
  for (let i = 0; i < fruits.length; i++) {
    resetFruit(fruits[i]);
  }
  animate();
}

// -------- scene utils
function createCamera() {
  camera = new THREE.PerspectiveCamera(
    100,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 30);
}

function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, .5);
  pointLight.position.set(25, 50, 25);
  scene.add(pointLight);
}

// -------- user interaction

