/**
 * Amy Fung and Lana Abdi
 * CS307 - Graphics
 * HW6: Creative Scene
 * 
 * This program creates a Fruit Ninja clone game, wherein users can earn points
 * by swiping and thus slicing fruit. If the user slices a bomb, the game is 
 * over, and they can retry in order to beat their high score. The game includes
 * pausing functionality and uses hierarchical modeling, Bezier curves, lighting, 
 * a camera, transparency, textures, user interaction, and animation: especially
 * hierarchical modeling, Bezier curves, textures, user interaction, and 
 * animation. 
 * 
 * The game can be easily adjusted to allow for changes in the maximum numbers 
 * of fruit to have onscreen at once, fruit sizes, and fruit life spans.
 * 
 * The functions to create the different fruit can also be taken and used 
 * outside of the program; only a radius value and a material need to be provided
 * for each function.
 */
let fruitParams, scene, camera, renderer, fruits, container, raycaster, mouse, score,
  highScore, isMouseDown, explosionParticles, activeFruits;
let stopped = false;

// Initialize game
init();

/* *
 * Initializes the game by creating the scene, setting up the main global variables,
 * and attaching event listeners.
 */
function init() {
  // Can be changed accordingly
  fruitParams = {
    radius: 4,
    fruitCount: 2, // Maximum number of fruit on screen at once
    maxLifeSpan: 150, // Maximum amount of time a fruit can be active
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

  // Initialize activeFruits, the fruits currently visible and available to be
  // swiped
  activeFruits = [];

  // Create and add camera
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

  // Add event listeners
  addEventListeners();
}

// ----------------------------------------------------------------------
// Fruit models
// ----------------------------------------------------------------------

/**
 * Loads textures for various fruits from different sources. 
 * Executes a callback function after the textures have been loaded and the fruits have been generated.
 * @param {function} callback - The callback function to be executed after the textures are loaded and the fruits are generated.
 */
function loadTextures(callback) {
  TW.loadTextures([
    // storage.needpix.com/rsynced_images/citrus-fruit-skin-2523487_1280.jpg
    "./assets/images/orange.jpg",
    // https://thumbs.dreamstime.com/b/watermelon-skin-texture-close-up-watermelon-skin-texture-watermelon-rind-stripes-102872998.jpg
    "./assets/images/watermelon.jpg",
    // https://stock.adobe.com/ie/images/close-up-photo-of-red-apple-background-apples-fruit-peel-texture-macro-view-beautiful-natural-wallpaper/428378061
    "./assets/images/apple.jpg",
    // https://stock.adobe.com/images/kiwi-fruit-peel-macro-texture/62101744
    "./assets/images/kiwi.jpg",
    // https://media.istockphoto.com/id/1397948009/photo/banana-skin-close-up-background-of-ripe-banana-peel-texture-banana-macro-photo-tropical-fruit.jpg?s=612x612&w=0&k=20&c=T-hIrIe1TULCh935vq5N0a3LjvpgMSrPpNndVFoFmsE=
    "./assets/images/banana.jpg",
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
 * @param {number} radius - The radius of the banana at its widest point.
 * @param {THREE.Material} material - The material to be applied to the banana
 * @returns {THREE.Object3D} A banana object.
 */
function createBanana(radius, material) {
  const banana = new THREE.Object3D();
  // Define the control points for a typical banana shape
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(7, 0, 0), 
    new THREE.Vector3(1.5, 4, 0), 
    new THREE.Vector3(-1.5, 4, 0),
    new THREE.Vector3(-7, 0, 0)
  );

  // Make the radius increase and then decrease and calculate values based on
  // the radius.
  const radii = [.25, radius * 5 / 6, radius, radius, radius * 5 / 6, .25];
  const bananaGeom = new THREE.TubeRadialGeometry(curve, 20, radii, 20, false);
  const bananaMesh = new THREE.Mesh(bananaGeom, material);
  banana.add(bananaMesh);
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

/**
 * Creates a group of explosion particles for explosion animations.
 */
function createExplosionParticles() {
  const particleCount = 500;
  const particleGeometry = new THREE.SphereGeometry(.5);
  // Randomly select a color for the explosion animation
  var num = getRandNum(0, colors.length - 1)
  const particleMaterial = new THREE.MeshPhongMaterial({ color: colors[num] ,
                                                         transparent: true, 
                                                         opacity: .8});

  // Create a group of explosion particles
  explosionParticles = new THREE.Group();
  for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.velocity = new THREE.Vector3();
    explosionParticles.add(particle);
    particle.visible = false;
  }
  explosionParticles.lifeSpan = 0;
}

/**
 * Called when a fruit is sliced. Creates explosion particles, sets their position
 * based on the position of the fruit that was sliced, and sets their velocity. 
 * @param {THREE.Object3D} fruit - The fruit that was sliced
 */
function explodeFruit(fruit) {
  container.remove(explosionParticles);
  createExplosionParticles();
  for (let i = 0; i < explosionParticles.children.length; i++) {
    const particle = explosionParticles.children[i];
    // Place the explosion animation where the sliced fruit was
    particle.position.copy(fruit.position);
    particle.visible = true;

    // Generate a random velocity based on the fruit size
    const velocity = new THREE.Vector3(
      getRandNum(-fruitParams.radius / 2, fruitParams.radius / 2),
      getRandNum(-fruitParams.radius / 2, fruitParams.radius / 2),
      getRandNum(-fruitParams.radius / 2, fruitParams.radius / 2),
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
  // Numbers based on desired speed, position, and scene parameters
  fruit.position.x = getRandNum(-4, 12);
  fruit.position.y = 0; // Initially at the bottom of the screen and then launched upward
  fruit.position.z = getRandNum(-3, 3);
}

/**
 * Sets a random velocity for a fruit object.
 * @param {THREE.Object3D} fruit - The fruit object to set the velocity for.
 */
function setRandVelocity(fruit) {
  fruit.velocity = new THREE.Vector3();
  // Main motion should be upward, so y-coordinate for velocity allowed most
  // variation
  fruit.velocity.x = getRandNum(0, .2);
  fruit.velocity.y = getRandNum(.5, 2); // Launch the fruit upwards
  fruit.velocity.z = getRandNum(0, .2);
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
      fruit = createBanana(radius * .375, material);
      break;
    case 5:
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
  }
}

/**
 * Animates the game by randomly selecting fruit to add to the container and
 * adjusting the position and visibility of the active fruit. Also adjusts the 
 * position, velocity, and visibility of the explosion particles.
 */
function animate() {
  // If game is paused or over, does not continue animation.
  if (!stopped) {
    requestAnimationFrame(animate);
  }

  // Get a random set of fruits based on the fruit count parameter
  while (activeFruits.length < fruitParams.fruitCount) {
    let fruitIndex = getRandNum(0, fruits.length - 1);
    activeFruits.push(fruits[fruitIndex]);
  }

  // Update positions and visibility of the active fruit
  for (let i = 0; i < activeFruits.length; i++) {
    let fruit = activeFruits[i];
    fruit.position.add(fruit.velocity);
    fruit.velocity.y -= 0.05; // Apply gravity to the fruit's velocity
    fruit.rotation.x += 0.02;
    fruit.rotation.y += 0.02;

    // Add fruit to container and increase lifespan
    container.add(fruit);
    fruit.lifeSpan++;

    // Reset fruit position and velocity and make inactive if maxLifeSpan exceeded.
    if (fruit.lifeSpan > fruitParams.maxLifeSpan) {
      container.remove(fruit);
      resetFruit(fruit);
      activeFruits.splice(activeFruits.indexOf(fruit), 1);
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
/**
 * Handles the mouse up event. Sets the isMouseDown flag to false.
 * @param {Event} event - The mouse up event.
 */
function onMouseUp(event) {
  event.preventDefault();
  isMouseDown = false;
}

/**
 * Handles the mouse down event. Sets the isMouseDown flag to true.
 * @param {Event} event - The mouse down event.
 */
function onMouseDown(event) {
  event.preventDefault();
  isMouseDown = true;
}

/**
 * Handles the mouse move event, updates the mouse coordinates, and checks if 
 * a fruit is sliced.
 * @param {Event} event - The mouse move event.
 */
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
  // Add 'true' to enable recursive search for child objects
  const intersects = raycaster.intersectObjects(container.children, true);

  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object;
    const fruit = object.parent; // Get the parent of the intersected object
    // Remove fruit and update score
    if (object !== fruit) { // Check if the intersected object is not the parent (i.e. it's the mesh)
      if (fruit.name == "bomb") {
        explodeFruit(fruit);
        activeFruits.splice(activeFruits.indexOf(fruit), 1);
        container.remove(fruit);
        explosionParticles.visible = false;
        endGame();
        return; // Score is not incremented if a bomb is sliced
      }
      if (fruit.name == "fruit") {
        explodeFruit(fruit);
        // Remove fruit from container and make inactive
        activeFruits.splice(activeFruits.indexOf(fruit), 1);
        container.remove(fruit);
        // Increment score
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

/**
 * Resizes the camera and renderer when the window is resized.
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Adds listeners for mouse events and window resize events.
 */
function addEventListeners() {
  renderer.domElement.addEventListener('mousedown', onMouseDown, false);
  renderer.domElement.addEventListener('mouseup', onMouseUp, false);
  window.addEventListener('resize', onWindowResize, false);
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

/**
 * Hides or shows the game over and pause components based on the specified 
 * visibility.
 * @param {boolean} visible - Determines whether the game over message should be 
 *  visible or hidden
 */
function showGameOver(visible) {
  const gameOverDiv = document.getElementById('gameOver');
  const pauseDiv = document.getElementById('settings');
  if (visible) {
    gameOverDiv.style.display = 'block'; 
    pauseDiv.style.display = 'none'; // Hide the pause button when the game is over
  } else {
    gameOverDiv.style.display = 'none'; 
    pauseDiv.style.display = 'block'; // Show the pause button when the game is not over
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

/**
 * Pauses or unpauses the game based on the current state. Adjusts the pause
 * button accordingly.
 */
function pauseGame() {
  if (stopped) { // Unpause
    console.log("Unpausing");
    stopped = false; 
    document.getElementById("pause").value = `Pause`;
    renderer.domElement.style.pointerEvents = 'auto';
    animate();
  } else { // Pause
    console.log("Pausing");
    stopped = true; 
    document.getElementById("pause").value = `Play`;
    renderer.domElement.style.pointerEvents = 'auto';
  }
}

// ----------------------------------------------------------------------
// Scene Utils
// ----------------------------------------------------------------------

/**
 * Creates and returns a THREE.Scene.
 * @returns scene - The created THREE.Scene.
 */
function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("white");
  return scene;
}

/**
 * Creates a new THREE.WebGLRenderer and sets it parameters based on those
 * of the window.
 * @returns renderer - The renderer
 */
function createRenderer() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  renderer.setSize(window.innerWidth, window.innerHeight);
  return renderer;
}

/**
 * Creates a camera and adds it to the container.
 */
function createCamera() {
  camera = new THREE.PerspectiveCamera(
    80, // fov
    window.innerWidth / window.innerHeight, // aspect
    30, // near
    500 // far
  );
  camera.position.set(0, 0, 50);
  container.add(camera);
}

/**
 * Creates and adds lighting to the given scene.
 * @param {THREE.Scene} scene - The scene to which the lighting is added
 */
function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.5);
  // Based on the position of the camera
  pointLight.position.set(25, 50, 25);
  scene.add(pointLight);
}