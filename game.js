// TODO: Make params dictionary
let scene, camera, renderer, fruits, fruitLifeSpan, container, raycaster;
let mouse, score, isMouseDown, prevMouse, plane;
const fruitCount = 8;
let highScore = 0;

// Initialize game
init();
animate();

function generateRandomPosition(min, max){
  return Math.round(Math.random() * (max - min)) + min;
}

function loadTextures(scene, params) {
  TW.loadTextures(["./images/orange.jpg", ],
      function (textures) {
          showResult(scene, params, textures);
      });
}

function makeMaterials(textures) {
  var materials = [];
  for (var i = 0; i < textures.length; i++) {
      textures[i].flipY = false;
      textures[i].needsUpdate = true;
      if (i < 2) {
          textures[i].repeat.set(2, 2);
          textures[i].wrapS = THREE.MirroredRepeatWrapping;
          textures[i].wrapT = THREE.MirroredRepeatWrapping;
      } else {
          textures[i].repeat.set(3, 3);
          textures[i].wrapS = THREE.RepeatWrapping;
          textures[i].wrapT = THREE.RepeatWrapping;
      }
      materials.push(new THREE.MeshPhongMaterial({
          color: 0xffffff,
          map: textures[i]
      }));
  }
  return materials;
}

function createWatermelon() {
  const watermelon = new THREE.Object3D();
  const watermelonGeom = new THREE.SphereGeometry(4, 40, 40);
  const melonTexture = new THREE.TextureLoader().load("./images/watermelon.jpg");
  melonTexture.repeat.set(2,2);
  melonTexture.wrapS = THREE.MirroredRepeatWrapping;
  melonTexture.wrapT = THREE.MirroredRepeatWrapping;
  melonTexture.needsUpdate = true;

  const melonMaterial = new THREE.MeshPhongMaterial({ map: melonTexture });
  const melonMesh = new THREE.Mesh(watermelonGeom, melonMaterial);
  melonMesh.scale.y = 1.5;
  watermelon.add(melonMesh);

  return watermelon;
}

// TODO: Pass radius and other dimensions as arguments to avoid magical constants
function createOrange(radius) {
  const orange = new THREE.Object3D();

  const orangeGeometry = new THREE.SphereGeometry(3, 40, 40);
  // https://storage.needpix.com/rsynced_images/citrus-fruit-skin-2523487_1280.jpg
  const orangeTexture = new THREE.TextureLoader().load("./images/orange.jpg");
  orangeTexture.repeat.set(2,2);
  orangeTexture.wrapS = THREE.MirroredRepeatWrapping;
  orangeTexture.wrapT = THREE.MirroredRepeatWrapping;
  orangeTexture.needsUpdate = true;

  const orangeMaterial = new THREE.MeshPhongMaterial({ map: orangeTexture });
  const orangeMesh = new THREE.Mesh(orangeGeometry, orangeMaterial);
  orange.add(orangeMesh);
  // stem

  const stemGeom = new THREE.CylinderGeometry(.2, .25, .8);
  const stemMaterial = new THREE.MeshLambertMaterial({color: new THREE.Color("green")});
  const stem = new THREE.Mesh(stemGeom, stemMaterial);
  stem.position.set(0, 3, 0);
  orange.add(stem);

  return orange;
}

function createFruits() {
  const arr = [];
  const orange = createOrange();
  arr.push(orange);
  const watermelon = createWatermelon();
  arr.push(watermelon);
  return arr;
}

function generateFruits(container) {
  const arr = createFruits();
  fruits = [];
  fruitLifeSpan = [];
  for (let i = 0; i < fruitCount; i++) {
    const fruit = arr[generateRandomPosition(0,1)];
    fruit.velocity = new THREE.Vector3();
    container.add(fruit);
    fruits.push(fruit);
    fruitLifeSpan.push(0);
  }
}

function init() {
  // Create the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("lavender"); // TODO: change

  // Create camera
  createCamera();

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create container
  container = new THREE.Object3D();
  scene.add(container);

  generateFruits(container);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  prevMouse = new THREE.Vector2();

  // Initialize score
  score = 0;
  updateScoreText();

  // Create lighting
  createLighting();

  // Add controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Add event listeners
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mouseup', onMouseUp, false);
  window.addEventListener('resize', onWindowResize, false);
}



function updateScoreText() {
  document.getElementById("score").innerHTML = `Score: ${score}`;
}

function updateHighScore() {
  document.getElementById("highScore").innerHTML = `High Score: ${highScore}`;
}


function animate() {
  requestAnimationFrame(animate);

  // Update fruit positions
  for (let i = 0; i < fruits.length; i++) {
    fruits[i].position.add(fruits[i].velocity);
    fruits[i].velocity.y -= 0.006; // Apply gravity to the fruit's velocity
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
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(container.children, true); // Add 'true' to enable recursive search for child objects

  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object;
    const fruit = object.parent; // Get the parent (THREE.Object3D) of the intersected object (either orange mesh or stem mesh)

    // Remove fruit and update score
    if (fruit.visible && object !== fruit) { // Check if the intersected object is not the parent (i.e. it's the orange mesh)
      fruit.visible = false;
      score++;
      updateScoreText();

      // Delay fruit respawn
      setTimeout(() => {
        resetFruit(fruit);
      }, 3000);
    }
  }
}

function createTrail() {
  const trailGeometry = new THREE.Geometry();
  const trailMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 2,
  });

  trailGeometry.vertices.push(prevMouse.clone());
  trailGeometry.vertices.push(mouse.clone());

  const trail = new THREE.Line(trailGeometry, trailMaterial);
  scene.add(trail);

  setTimeout(() => {
    scene.remove(trail);
  }, 150);
}


// TODO - add pausing feature


function gameOver() {
  if (score > highScore) {
    highScore = score;
  }
  updateHighScore();
  score = 0;
  updateScoreText();
  for (let i = 0; i < fruits.length; i++) {
    resetFruit(fruits[i]);
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

  isMouseDown = false;;
}

function onMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  checkFruitSlicing();
}

function onMouseMove(event) {
  event.preventDefault();
  if (event.target == renderer.domElement) {
    // use canvas offset to determine mouse coordinates in canvas coordinate frame
    var rect = event.target.getBoundingClientRect();
    var canvasX = event.clientX - rect.left;
    var canvasY = event.clientY - rect.top;
  } else {
    return;
  }
  prevMouse.copy(mouse);

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  createTrail();
  checkFruitSlicing();
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

