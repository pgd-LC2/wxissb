// ==================== Perlin Noise ====================
class PerlinNoise {
    constructor(seed = Math.random() * 10000) {
        this.seed = seed;
        this.permutation = [];
        this.generatePermutation();
    }

    generatePermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }

        // Shuffle using seed
        let random = this.seed;
        for (let i = 255; i > 0; i--) {
            random = (random * 16807) % 2147483647;
            const j = Math.floor((random / 2147483647) * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }

        // Duplicate for overflow
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = p[i];
            this.permutation[i + 256] = p[i];
        }
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : (h === 12 || h === 14) ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y, z = 0) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const p = this.permutation;
        const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
        const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

        return this.lerp(
            this.lerp(
                this.lerp(this.grad(p[AA], x, y, z), this.grad(p[BA], x - 1, y, z), u),
                this.lerp(this.grad(p[AB], x, y - 1, z), this.grad(p[BB], x - 1, y - 1, z), u),
                v
            ),
            this.lerp(
                this.lerp(this.grad(p[AA + 1], x, y, z - 1), this.grad(p[BA + 1], x - 1, y, z - 1), u),
                this.lerp(this.grad(p[AB + 1], x, y - 1, z - 1), this.grad(p[BB + 1], x - 1, y - 1, z - 1), u),
                v
            ),
            w
        );
    }
}

// ==================== Block System ====================
const BLOCK_TYPES = {
    GRASS: { id: 0, name: '草地', color: 0x4CAF50 },
    DIRT: { id: 1, name: '泥土', color: 0x8B4513 },
    STONE: { id: 2, name: '石头', color: 0x808080 },
    WOOD: { id: 3, name: '木头', color: 0xA0522D },
    LEAVES: { id: 4, name: '树叶', color: 0x228B22 },
    SAND: { id: 5, name: '沙子', color: 0xF4A460 },
    WATER: { id: 6, name: '水', color: 0x0000FF },
    COBBLESTONE: { id: 7, name: '圆石', color: 0x696969 },
    PLANKS: { id: 8, name: '木板', color: 0xDEB887 }
};

class Block {
    constructor(type, x, y, z) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.mesh = null;
    }

    createMesh(scene, materials) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = materials[this.type.id];
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x + 0.5, this.y + 0.5, this.z + 0.5);
        this.mesh.userData = { block: this };
        scene.add(this.mesh);
        return this.mesh;
    }

    remove() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh = null;
        }
    }
}

// ==================== World System ====================
class World {
    constructor(scene, size = 32) {
        this.scene = scene;
        this.size = size;
        this.blocks = new Map();
        this.materials = this.createMaterials();
        this.perlin = new PerlinNoise();
        this.generateTerrain();
    }

    createMaterials() {
        const materials = {};
        Object.values(BLOCK_TYPES).forEach(blockType => {
            const texture = this.createBlockTexture(blockType);
            materials[blockType.id] = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: blockType.id === 6,
                opacity: blockType.id === 6 ? 0.7 : 1.0
            });
        });
        return materials;
    }

    createBlockTexture(blockType) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const baseColor = new THREE.Color(blockType.color);
        ctx.fillStyle = `rgb(${Math.floor(baseColor.r * 255)}, ${Math.floor(baseColor.g * 255)}, ${Math.floor(baseColor.b * 255)})`;
        ctx.fillRect(0, 0, 64, 64);
        
        this.addTexturePattern(ctx, blockType);
        this.addBorderEffect(ctx);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    addTexturePattern(ctx, blockType) {
        const baseColor = new THREE.Color(blockType.color);
        
        switch (blockType.name) {
            case '草地':
                for (let x = 0; x < 64; x += 2) {
                    for (let y = 0; y < 64; y += 2) {
                        const noise = Math.random() * 0.3;
                        const r = Math.floor((baseColor.r * 255) * (1 + noise * (Math.random() - 0.5)));
                        const g = Math.floor((baseColor.g * 255) * (1 + noise * (Math.random() - 0.5)));
                        const b = Math.floor((baseColor.b * 255) * (1 + noise * (Math.random() - 0.5)));
                        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                        ctx.fillRect(x, y, 2, 2);
                    }
                }
                break;
                
            case '泥土':
                for (let i = 0; i < 100; i++) {
                    const x = Math.random() * 64;
                    const y = Math.random() * 64;
                    const size = Math.random() * 4 + 2;
                    const shade = Math.random() * 30 - 15;
                    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.3)`;
                    ctx.fillRect(x, y, size, size);
                }
                break;
                
            case '石头':
                for (let i = 0; i < 50; i++) {
                    const x = Math.random() * 64;
                    const y = Math.random() * 64;
                    const length = Math.random() * 15 + 5;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + length, y + Math.random() * 5);
                    ctx.stroke();
                }
                break;
                
            case '木头':
                for (let x = 0; x < 64; x++) {
                    const noise = Math.sin(x * 0.5) * 10;
                    ctx.fillStyle = `rgba(${noise}, ${noise}, ${noise}, 0.2)`;
                    ctx.fillRect(x, 0, 1, 64);
                }
                for (let i = 0; i < 8; i++) {
                    const y = (i + 1) * 8;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(64, y);
                    ctx.stroke();
                }
                break;
                
            case '树叶':
                for (let x = 0; x < 64; x += 2) {
                    for (let y = 0; y < 64; y += 2) {
                        const shade = Math.random() * 40 - 20;
                        const r = Math.floor((baseColor.r * 255) + shade);
                        const g = Math.floor((baseColor.g * 255) + shade + 20);
                        const b = Math.floor((baseColor.b * 255) + shade);
                        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                        ctx.fillRect(x, y, 2, 2);
                    }
                }
                break;
                
            case '沙子':
                for (let i = 0; i < 200; i++) {
                    const x = Math.random() * 64;
                    const y = Math.random() * 64;
                    const size = Math.random() * 2 + 1;
                    const shade = Math.random() * 20 - 10;
                    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.4)`;
                    ctx.fillRect(x, y, size, size);
                }
                break;
                
            case '水':
                for (let y = 0; y < 64; y += 4) {
                    const shade = Math.sin(y * 0.2) * 20;
                    ctx.fillStyle = `rgba(${shade}, ${shade + 40}, ${shade + 80}, 0.3)`;
                    ctx.fillRect(0, y, 64, 4);
                }
                break;
                
            case '圆石':
                for (let i = 0; i < 30; i++) {
                    const x = Math.random() * 64;
                    const y = Math.random() * 64;
                    const size = Math.random() * 8 + 4;
                    const shade = Math.random() * 40 - 20;
                    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.5)`;
                    ctx.fillRect(x, y, size, size);
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, size, size);
                }
                break;
                
            case '木板':
                const plankWidth = 16;
                for (let i = 0; i < 4; i++) {
                    const x = i * plankWidth;
                    for (let px = 0; px < plankWidth; px++) {
                        const noise = Math.sin(px * 0.3) * 15;
                        ctx.fillStyle = `rgba(${noise}, ${noise}, ${noise}, 0.3)`;
                        ctx.fillRect(x + px, 0, 1, 64);
                    }
                }
                for (let i = 1; i < 4; i++) {
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(i * plankWidth, 0);
                    ctx.lineTo(i * plankWidth, 64);
                    ctx.stroke();
                }
                break;
        }
    }

    addBorderEffect(ctx) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 64, 64);
    }

    generateTerrain() {
        console.log('Generating terrain...');
        
        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                // Generate height using Perlin noise
                const height = Math.floor(
                    this.perlin.noise(x * 0.1, z * 0.1) * 8 + 
                    this.perlin.noise(x * 0.05, z * 0.05) * 4 + 5
                );

                for (let y = 0; y <= height; y++) {
                    let blockType;
                    
                    if (y === height) {
                        blockType = BLOCK_TYPES.GRASS;
                    } else if (y > height - 3) {
                        blockType = BLOCK_TYPES.DIRT;
                    } else {
                        blockType = BLOCK_TYPES.STONE;
                    }

                    this.addBlock(blockType, x, y, z);
                }

                // Occasionally add trees
                if (Math.random() < 0.02 && height > 3) {
                    this.generateTree(x, height + 1, z);
                }
            }
        }
        
        console.log('Terrain generation complete!');
    }

    generateTree(x, y, z) {
        // Trunk
        for (let i = 0; i < 4; i++) {
            this.addBlock(BLOCK_TYPES.WOOD, x, y + i, z);
        }

        // Leaves
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = 2; dy <= 5; dy++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (Math.abs(dx) + Math.abs(dy - 3) + Math.abs(dz) <= 4) {
                        if (!this.getBlock(x + dx, y + dy, z + dz)) {
                            this.addBlock(BLOCK_TYPES.LEAVES, x + dx, y + dy, z + dz);
                        }
                    }
                }
            }
        }
    }

    getBlock(x, y, z) {
        return this.blocks.get(`${x},${y},${z}`);
    }

    addBlock(type, x, y, z) {
        const key = `${x},${y},${z}`;
        if (this.blocks.has(key)) return null;

        const block = new Block(type, x, y, z);
        block.createMesh(this.scene, this.materials);
        this.blocks.set(key, block);
        return block;
    }

    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        const block = this.blocks.get(key);
        if (block) {
            block.remove();
            this.blocks.delete(key);
        }
        return block;
    }

    // Raycasting for block selection
    raycast(raycaster) {
        const blocks = Array.from(this.blocks.values()).map(b => b.mesh);
        const intersects = raycaster.intersectObjects(blocks);
        return intersects.length > 0 ? intersects[0] : null;
    }
}

// ==================== Player Controller ====================
class Player {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        // Movement settings - Minecraft original values
        this.moveSpeed = 4.3;  // Original Minecraft walk speed
        this.runSpeed = 5.6;   // Original Minecraft sprint speed
        this.jumpForce = 8.0;
        this.gravity = 29.4;    // Original Minecraft gravity
        
        // // Player state
        this.onGround = false;
        this.canJump = true;
        
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            run: false
        };

        // Physics - Minecraft original values
        this.playerHeight = 1.8;  // Original Minecraft player height
        this.playerRadius = 0.3;
        this.playerEyeHeight = 1.62;  // Original Minecraft eye height
        
        // Camera rotation (Minecraft style)
        this.rotationOrder = 'YXZ';
        this.yaw = 0;
        this.pitch = 0;
        this.sensitivity = 0.0008;  // Original Minecraft sensitivity
        
        // Position player above ground
        this.camera.position.set(16, 20, 16);
        this.camera.rotation.order = this.rotationOrder;
    }

    update(delta) {
        // Apply gravity
        this.velocity.y -= this.gravity * delta;

        // Get movement direction
        this.direction.set(0, 0, 0);
        
        if (this.keys.forward) this.direction.z -= 1;
        if (this.keys.backward) this.direction.z += 1;
        if (this.keys.left) this.direction.x -= 1;
        if (this.keys.right) this.direction.x += 1;

        // Normalize direction
        this.direction.normalize();

        // Apply movement speed
        const speed = this.keys.run ? this.runSpeed : this.moveSpeed;
        
        // Minecraft style movement - rotate based on yaw only (not pitch)
        const moveAngle = -this.yaw;
        const sin = Math.sin(moveAngle);
        const cos = Math.cos(moveAngle);
        
        const moveX = this.direction.x * cos - this.direction.z * sin;
        const moveZ = this.direction.x * sin + this.direction.z * cos;
        
        this.velocity.x = moveX * speed;
        this.velocity.z = moveZ * speed;

        // Apply jump
        if (this.keys.jump && this.onGround && this.canJump) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
            this.canJump = false;
        }

        // Move with collision detection
        this.moveWithCollision(delta);
    }

    moveWithCollision(delta) {
        const newPos = this.camera.position.clone();
        
        // Move X
        newPos.x += this.velocity.x * delta;
        if (this.checkCollision(newPos)) {
            newPos.x = this.camera.position.x;
        }
        
        // Move Z
        newPos.z += this.velocity.z * delta;
        if (this.checkCollision(newPos)) {
            newPos.z = this.camera.position.z;
        }
        
        // Move Y
        newPos.y += this.velocity.y * delta;
        if (this.checkCollision(newPos)) {
            if (this.velocity.y < 0) {
                this.onGround = true;
                this.canJump = true;
            }
            newPos.y = this.camera.position.y;
            this.velocity.y = 0;
        } else {
            this.onGround = false;
        }

        this.camera.position.copy(newPos);
    }

    checkCollision(position) {
        // Check collision with blocks
        const checkPoints = [
            [0, 0, 0],                           // Center
            [this.playerRadius, 0, 0],           // Right
            [-this.playerRadius, 0, 0],          // Left
            [0, 0, this.playerRadius],           // Front
            [0, 0, -this.playerRadius],          // Back
            [0, -this.playerHeight, 0],          // Bottom center
            [this.playerRadius, -this.playerHeight, 0],
            [-this.playerRadius, -this.playerHeight, 0],
            [0, -this.playerHeight, this.playerRadius],
            [0, -this.playerHeight, -this.playerRadius]
        ];

        for (const [dx, dy, dz] of checkPoints) {
            const bx = Math.floor(position.x + dx);
            const by = Math.floor(position.y + dy);
            const bz = Math.floor(position.z + dz);
            
            if (this.world.getBlock(bx, by, bz)) {
                return true;
            }
        }

        // Don't fall below y = -10
        if (position.y < -10) {
            return true;
        }

        return false;
    }

    setKey(key, pressed) {
        switch (key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = pressed;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = pressed;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = pressed;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = pressed;
                break;
            case ' ':
                this.keys.jump = pressed;
                break;
            case 'shift':
                this.keys.run = pressed;
                break;
        }
    }
}

// ==================== Inventory System ====================
class Inventory {
    constructor(blockTypesArray) {
        this.container = document.getElementById('inventory-slots');
        this.blockTypes = blockTypesArray;
        this.selectedIndex = 0;
        this.slots = [];
        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.slots = [];

        this.blockTypes.forEach((blockType, index) => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = index;

            // Create block preview
            const preview = document.createElement('div');
            preview.className = 'block-preview';
            this.createBlockPreview(preview, blockType);

            // Create slot number
            const number = document.createElement('div');
            number.className = 'slot-number';
            number.textContent = index + 1;

            slot.appendChild(preview);
            slot.appendChild(number);
            this.container.appendChild(slot);
            this.slots.push(slot);
        });

        this.updateSelected();
    }

    createBlockPreview(element, blockType) {
        const color = new THREE.Color(blockType.color);
        const r = Math.floor(color.r * 255);
        const g = Math.floor(color.g * 255);
        const b = Math.floor(color.b * 255);

        element.style.background = `linear-gradient(135deg, 
            rgb(${Math.min(r + 30, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)}),
            rgb(${r}, ${g}, ${b}),
            rgb(${Math.max(r - 30, 0)}, ${Math.max(g - 30, 0)}, ${Math.max(b - 30, 0)})`;

        // Add texture-like pattern based on block type
        if (blockType.name === '草地') {
            element.style.backgroundImage = 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)';
        } else if (blockType.name === '石头' || blockType.name === '圆石') {
            element.style.backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 10px)';
        } else if (blockType.name === '木头') {
            element.style.backgroundImage = 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.15) 8px, rgba(0,0,0,0.15) 10px)';
        } else if (blockType.name === '水') {
            element.style.backgroundImage = 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)';
        }
    }

    selectSlot(index) {
        if (index >= 0 && index < this.slots.length) {
            this.selectedIndex = index;
            this.updateSelected();
            return this.blockTypes[index];
        }
        return null;
    }

    updateSelected() {
        this.slots.forEach((slot, index) => {
            if (index === this.selectedIndex) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });
    }

    getSelectedBlock() {
        return this.blockTypes[this.selectedIndex];
    }
}

// ==================== Game Main ====================
class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.pauseScreen = document.getElementById('pause-screen');
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.isLocked = false;
        this.currentBlockType = BLOCK_TYPES.GRASS;
        this.blockTypesArray = Object.values(BLOCK_TYPES);
        
        this.setupRenderer();
        this.setupLighting();
        this.setupSky();
        
        this.world = new World(this.scene);
        this.player = new Player(this.camera, this.world);
        
        // Initialize inventory system
        this.inventory = new Inventory(this.blockTypesArray);
        this.currentBlockType = this.inventory.getSelectedBlock();
        
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 8;
        
        this.setupEventListeners();
        this.setupPointerLock();
        
        this.clock = new THREE.Clock();
        this.animate();
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue
        this.container.appendChild(this.renderer.domElement);
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);
    }

    setupSky() {
        // Sky color is set in renderer
        // Could add a skybox or gradient here
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Key events
        document.addEventListener('keydown', (e) => {
            this.player.setKey(e.key, true);
            
            // Number keys for block selection
            if (e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                const selectedBlock = this.inventory.selectSlot(index);
                if (selectedBlock) {
                    this.currentBlockType = selectedBlock;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.player.setKey(e.key, false);
        });

        // Mouse clicks for block interaction
        document.addEventListener('mousedown', (e) => {
            if (!this.isLocked) return;
            
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
            const intersection = this.world.raycast(this.raycaster);
            
            if (intersection) {
                const block = intersection.object.userData.block;
                
                if (e.button === 0) {
                    // Left click - remove block
                    this.world.removeBlock(block.x, block.y, block.z);
                    this.scene.remove(intersection.object);
                } else if (e.button === 2) {
                    // Right click - place block
                    const normal = intersection.face.normal;
                    const newX = block.x + Math.round(normal.x);
                    const newY = block.y + Math.round(normal.y);
                    const newZ = block.z + Math.round(normal.z);
                    
                    // Don't place block on player
                    const playerPos = this.camera.position;
                    const playerBlockX = Math.floor(playerPos.x);
                    const playerBlockY = Math.floor(playerPos.y - this.player.playerHeight);
                    const playerBlockZ = Math.floor(playerPos.z);
                    
                    if (!(newX === playerBlockX && newY === playerBlockY && newZ === playerBlockZ)) {
                        this.world.addBlock(this.currentBlockType, newX, newY, newZ);
                    }
                }
            }
        });

        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupPointerLock() {
        this.container.addEventListener('click', () => {
            if (!this.isLocked) {
                this.container.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.container;
            
            if (this.isLocked) {
                this.pauseScreen.classList.add('hidden');
            } else {
                this.pauseScreen.classList.remove('hidden');
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isLocked) {
                // Minecraft style camera rotation
                this.player.yaw -= e.movementX * this.player.sensitivity;
                this.player.pitch -= e.movementY * this.player.sensitivity;
                
                // Clamp vertical rotation (Minecraft style: can't look straight up/down)
                this.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.pitch));
                
                // Apply rotation to camera
                this.camera.rotation.y = this.player.yaw;
                this.camera.rotation.x = this.player.pitch;
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update player
        this.player.update(delta);
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
