let scene, camera, renderer, fruits, fruitLifeSpan, container, raycaster;
let mouse, score, isMouseDown;
const fruitCount = 3;
let highScore = 0;
let isGameOver = false;

// Initialize game
init();
//animate();

function init() {
  loadTextures();

  // -- Initialize main global variables
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("white"); // TODO: change

  // Create camera
  createCamera();

  // Create container
  container = new THREE.Object3D();
  scene.add(container);

  // Initializing raycaster and mouse
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Hide game over components
  //showGameOver(false);

  // Initialize score
  score = 0;
  updateScoreText();
  
  // Create and add lighting
  createLighting();
  
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

function getRandomNumber(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}


// -------- Create fruit models
function loadTextures() {
  TW.loadTextures(["./images/orange.jpg", "./images/watermelon.jpg", "./images/apple.jpg", "./images/kiwi.jpg","./images/coconut.jpg"],
    function (textures) {
      generateFruits(textures);
      animate();
    });
}

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

function createWatermelon(material) {
  const watermelon = new THREE.Object3D();
  const watermelonGeom = new THREE.SphereGeometry(4, 40, 40);
  const melonMesh = new THREE.Mesh(watermelonGeom, material);
  melonMesh.scale.y = 1.4;
  watermelon.add(melonMesh);

  return watermelon;
}

// TODO: Pass radius and other dimensions as arguments to avoid magical constants
function createOrange(material) {
  const orange = new THREE.Object3D();

  const orangeGeometry = new THREE.SphereGeometry(3, 40, 40);
  // https://storage.needpix.com/rsynced_images/citrus-fruit-skin-2523487_1280.jpg
  const orangeMesh = new THREE.Mesh(orangeGeometry, material);
  orange.add(orangeMesh);

  // stem
  const stemGeom = new THREE.CylinderGeometry(.2, .25, .8);
  const stemMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color("green") });
  const stem = new THREE.Mesh(stemGeom, stemMaterial);
  stem.position.set(0, 3, 0);
  orange.add(stem);

  return orange;
}

function createApple(material) {
  const apple = new THREE.Object3D();
  const appleGeom = new THREE.SphereGeometry(2, 40, 40);
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

function createCoconut(material) {
  const coconut = new THREE.Object3D();
  const coconutGeom = new THREE.SphereGeometry(2, 40, 4);
  const coconutMesh = new THREE.Mesh(coconutGeom, material);
  coconut.add(coconutMesh);

  return coconut;
}

function createKiwi(material) {
  const kiwi = new THREE.Object3D();
  const kiwiGeom = new THREE.SphereGeometry(2, 40, 40);
  const kiwiMesh = new THREE.Mesh(kiwiGeom, material);
  kiwiMesh.scale.y = 1.25;
  kiwi.add(kiwiMesh);

  return kiwi;
}

function createBomb() {
  const bomb = new THREE.Object3D();
  const bombGeom = new THREE.SphereGeometry(3, 40, 40);
  const bombMaterial = new THREE.MeshPhongMaterial({ color: new THREE.Color("black") })
  const bombMesh = new THREE.Mesh(bombGeom, bombMaterial);
  bomb.add(bombMesh);

  const bombTop = new THREE.CylinderGeometry(1, 1, 1, 20);
  const bombTopMesh = new THREE.Mesh(bombTop, bombMaterial);
  bombTopMesh.position.set(0, 3, 0);
  bomb.add(bombTopMesh);
 
  // create detonating cord using Bezier curves and tube geometry 
  var bezierCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0,0,0), // bottom, center
    new THREE.Vector3(-.7,1.1,.23), 
    new THREE.Vector3(.4,1.3,0), 
    new THREE.Vector3(.2,1.9,.23)
 );
  var geom = new THREE.TubeGeometry(bezierCurve, 32, .1, 10, false);
  var tube = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({color: THREE.ColorKeywords.grey}));

  tube.position.set(0,3,0);
  bomb.add(tube);

  bomb.name = "bomb";

  return bomb;
}

// -------- Fruit animation
function generateFruits(textures) {
  const materials = makeMaterials(textures);
  fruits = [];
  fruitLifeSpan = [];

  for (let i = 0; i < fruitCount; i++) {
    var fruit = null;

    // randomly choose a fruit or a bomb
    switch(getRandomNumber(4, materials.length)) {
      case 0:
        fruit = createOrange(materials[0]);
        break;
      case 1:
        fruit = createWatermelon(materials[1]);
        break;
      case 2:
        fruit = createApple(materials[2]);
        break;
      case 3:
        fruit = createKiwi(materials[3]);
        break;
      case 4:
        fruit = createCoconut(materials[4]);
        break;
      case 5:
        fruit = createBomb();
        break;
    }
    fruit.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.2, Math.random() * 0.2 + 0.25 ), (Math.random() - 0.5) * 0.2;
    
    //container.add(fruit);
    fruits.push(fruit);
    fruitLifeSpan.push(0);
  }
}

function animate() {
  if (!isGameOver) {
    requestAnimationFrame(animate);
  } 

  // Update fruit positions
  for (let i = 0; i < fruits.length; i++) {
    fruits[i].position.add(fruits[i].velocity);
    fruits[i].velocity.y -= 0.006; // Apply gravity to the fruit's velocity
    container.add(fruits[i]);
    fruitLifeSpan[i]++;

    // Reset fruit position and life span
    if (fruitLifeSpan[i] > 300) {
      resetFruit(fruits[i]);
      fruitLifeSpan[i] = 0;
    }
  }

  for (let i = 0; i < fruits.length; i++) {
    fruits[i].rotation.x += 0.02;
    fruits[i].rotation.y += 0.02;
  }

  renderer.render(scene, camera);
}

function checkFruitSlicing() {
  if (isGameOver) return;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(container.children, true); // Add 'true' to enable recursive search for child objects

  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object;
    const fruit = object.parent; // Get the parent (THREE.Object3D) of the intersected object (either orange mesh or stem mesh)

    // Remove fruit and update score
    if (fruit.visible && object !== fruit) { // Check if the intersected object is not the parent (i.e. it's the orange mesh)
      fruit.visible = false;
      if (fruit.name == "bomb") {
        gameOver();
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

function resetFruit(fruit) {
  fruit.position.x = Math.random() * 20 - 10;
  fruit.position.y = -5; // Change the initial y position to be below the screen
  fruit.position.z = Math.random() * 20 - 10;

  // Set initial velocity
  fruit.velocity.x = (Math.random() - 0.5) * 0.2;
  fruit.velocity.y = Math.random() * 0.2 + 0.25; // Launch the fruit upwards
  fruit.velocity.z = (Math.random() - 0.5) * 0.2;

  fruit.visible = true;
}

// -------- Score
function updateScoreText() {
  document.getElementById("score").innerHTML = `Score: ${score}`;
}

function updateHighScore() {
  document.getElementById("highScore").innerHTML = `High Score: ${highScore}`;
}

// -------- Game over
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

function gameOver() {
  if (score > highScore) {
    highScore = score;
  }
  updateHighScore();
  updateScoreText();
  renderer.domElement.style.pointerEvents = 'none';
  showGameOver(true);
  isGameOver = true;
}

function retryGame() {
  console.log("Retrying");
  isGameOver = false;
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
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 30);
}

function createLighting() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, .5);
  pointLight.position.set(25, 50, 25);
  scene.add(pointLight);
}

// -------- user interaction
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

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
