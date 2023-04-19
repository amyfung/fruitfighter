// TODO: Make params dictionary
let scene, camera, renderer, fruits, fruitLifeSpan, container, raycaster;
let mouse, score, sliceLine, isMouseDown, prevMouse, plane;
const fruitCount = 8;
let highScore = 0;

// Initialize game
init();
animate();

function createCamera() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 30);
}

// TODO: Pass radius and other dimensions as arguments to avoid magical constants
function createOrange(radius) {
  const orange = new THREE.Object3D();

  const orangeGeometry = new THREE.SphereGeometry(3, 40, 40);
  const orangeTexture = new THREE.TextureLoader().load("./images/orange.jpg");
  orangeTexture.repeat.set(2,2);
  orangeTexture.wrapS = THREE.MirroredRepeatWrapping;
  orangeTexture.wrapT = THREE.MirroredRepeatWrapping;
  orangeTexture.needsUpdate = true;

  const orangeMaterial = new THREE.MeshLambertMaterial({ map: orangeTexture });
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

function generateFruits(container) {
  // Create fruit geometry and material
  const fruitGeometry = new THREE.SphereGeometry(1, 16, 16);
  const fruitMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  const bombMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
  // Create fruits and add them to the container
  fruits = [];
  fruitLifeSpan = [];
  for (let i = 0; i < fruitCount; i++) {
    // const material = i % 8 === 0 ? bombMaterial : fruitMaterial;
    //const fruit = new THREE.Mesh(fruitGeometry, material);
    const orange = createOrange(); // TODO: Generate other fruit and select randomly from fruit array
    orange.velocity = new THREE.Vector3();
    container.add(orange);
    fruits.push(orange);
    fruitLifeSpan.push(0);
  }
}

function init() {
  // Create the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("lavender");

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

function createLighting() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, .5);
  pointLight.position.set(25, 50, 25);
  scene.add(pointLight);
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