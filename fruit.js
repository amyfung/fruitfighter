export default class Fruit {
    constructor(type) {
      this.type = type;
      this.velocity = { x: 0, y: 0 };
      this.position = { x: 0, y: 0 };
      this.sliced = false;
      this.gravity = -9.8;
    }
  
    isSliced(raycaster) {
      // Check if the fruit is sliced using the raycaster
      // Set this.sliced to true if the fruit is sliced
    }
  
    update(deltaTime) {
      // Update the position and velocity of the fruit based on deltaTime
      this.velocity.y += this.gravity * deltaTime;
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
    }
  }