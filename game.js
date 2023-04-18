// Variables
let scene, camera, renderer, fruits, fruitLifeSpan, container, raycaster;
let mouse, intersects, scoreText, score;
let sliceLine, isMouseDown, prevMouse, plane;
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

function generateFruits() {
  // Create fruit geometry and material
  const fruitGeometry = new THREE.SphereGeometry(1, 16, 16);
  const fruitMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  const bombMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
  // Create fruits and add them to the container
  fruits = [];
  fruitLifeSpan = [];
  for (let i = 0; i < fruitCount; i++) {
    const material = i % 8 === 0 ? bombMaterial : fruitMaterial;
    const fruit = new THREE.Mesh(fruitGeometry, material);
    container.add(fruit);
    fruits.push(fruit);
    fruitLifeSpan.push(0);
  }
}

function init() {
  // Create the scene
  scene = new THREE.Scene();

  // Create camera
  createCamera();

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create container
  container = new THREE.Object3D();
  scene.add(container);

  generateFruits();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  prevMouse = new THREE.Vector2();

  // Initialize score
  score = 0;
  updateScoreText();

  // Create slicing line
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 2,
  });
  const lineGeometry = new THREE.BufferGeometry();
  const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
  lineGeometry.setFromPoints(points);
  sliceLine = new THREE.Line(lineGeometry, lineMaterial);
  sliceLine.visible = false;
  scene.add(sliceLine);

  // Add the invisible plane in the init function
  const planeGeometry = new THREE.PlaneGeometry(100, 100);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });
  plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.set(0, 0, 0);
  scene.add(plane);

  // Create lighting
  createLighting();

  // Add event listeners
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mouseup', onMouseUp, false);
}
function createLighting() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(25, 50, 25);
  scene.add(pointLight);
}

function updateScoreText() {
  document.getElementById("score").innerHTML = `Score: ${score}`;
}

function onMouseUp(event) {
  event.preventDefault();

  isMouseDown = false;
  sliceLine.visible = false;
}

function onMouseMove(event) {
  event.preventDefault();

  if (!isMouseDown) {
    return;
  }

  prevMouse.copy(mouse);

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  updateLinePosition(prevMouse);
  checkFruitSlicing();
}

  
function updateLinePosition(position) {
  raycaster.setFromCamera(position, camera);
  const planeIntersect = raycaster.intersectObject(plane, true);

  if (planeIntersect.length > 0) {
    const linePositions = sliceLine.geometry.attributes.position.array;
    linePositions[3] = linePositions[0];
    linePositions[4] = linePositions[1];
    linePositions[5] = linePositions[2];

    linePositions[0] = planeIntersect[0].point.x;
    linePositions[1] = planeIntersect[0].point.y;
    linePositions[2] = planeIntersect[0].point.z;

    sliceLine.geometry.attributes.position.needsUpdate = true;
  }
}


function animate() {
  requestAnimationFrame(animate);

  // Update fruit positions
  for (let i = 0; i < fruits.length; i++) {
    fruits[i].position.y -= 0.2;
    fruitLifeSpan[i]++;

    // Reset fruit position and life span
    if (fruitLifeSpan[i] > 150) {
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

function onMouseDown(event) {
    event.preventDefault();
  
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    checkFruitSlicing();
  }


function checkFruitSlicing() {
    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects(container.children);
  
    for (let i = 0; i < intersects.length; i++) {
      const fruit = intersects[i].object;
  
      // Remove fruit and update score
      if (fruit.visible) {
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
  

function gameOver() {
  if (score > highScore) {
    highScore = score;
  }
  alert("Game Over! High Score: " + highScore);
  score = 0;
  updateScoreText();
  for (let i = 0; i < fruits.length; i++) {
    resetFruit(fruits[i]);
  }
}

function resetFruit(fruit) {
  fruit.position.x = Math.random() * 20 - 10;
  fruit.position.y = 15;
  fruit.position.z = Math.random() * 20 - 10;
  fruit.visible = true;
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
