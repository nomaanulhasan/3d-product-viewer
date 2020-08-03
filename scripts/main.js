import * as THREE from './three.module.js';
import {OrbitControls} from './OrbitControls.js';
import {OBJLoader2} from './OBJLoader2.js';
import {MTLLoader} from './MTLLoader.js';
import {MtlObjBridge} from './MtlObjBridge.js';

function main() {
  const canvas = document.querySelector('#prdViewer');
  const clock   = new THREE.Clock();
  const scene   = new THREE.Scene();
  const fov     = 45;
  const aspect  = window.innerWidth / window.innerHeight;
  const near    = 0.1;
  const far     = 100;
  const camera  = new THREE.PerspectiveCamera(fov, aspect, near, far);
  const renderer = new THREE.WebGLRenderer({ canvas, logarithmicDepthBuffer: true, });
  const asideInfo = document.getElementById("info");
  const btnReset = document.getElementById("btnReset");
  const zoomSlider = document.getElementById("zoomSlider");
  const zoomIn = document.getElementById("zoomIn");
  const zoomOut = document.getElementById("zoomOut");

  scene.background = new THREE.Color('white');
  camera.position.set(0, 10, 0);

  CameraControls.install( { THREE: THREE } );
  const controls = new CameraControls( camera, canvas );
  controls.addEventListener("change", () => console.log(controls.getPosition()) );
  controls.setLookAt( 1.83, 0.92, 1.02, 0, 0.5, 0);

  // initial functionality of product viewer layout
  canvas.addEventListener("mousedown", e => e.target.style.cursor = "grabbing");
  canvas.addEventListener("mouseup", e => e.target.style.cursor = "grab");
  canvas.addEventListener("wheel", () => zoomSlider.value = controls.distance );
  zoomSlider.addEventListener("input", e => { controls.dollyTo( e.target.value, true ); });
  asideInfo.addEventListener("click", e => { e.target.parentNode.classList.toggle("visible"); });
  btnReset.addEventListener("click", () => {
    document.querySelector("li.active").classList.remove("active");
    document.querySelector(".front-view").classList.add("active");
    controls.reset(true);
  });
  zoomOut.addEventListener("click", () => {
    controls.dolly(-0.2, true);
    setTimeout(() => {
      zoomSlider.value = controls.distance;
    },100);
  });
  zoomIn.addEventListener("click", () => {
    controls.dolly(0.2, true);
    setTimeout(() => {
      zoomSlider.value = controls.distance;
    },100);
  });

  // setup lights for the scene
  {
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  {
    const color = 0xFFFFFF;
    const intensity = 0.2;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0); // top 
    scene.add(light);
    scene.add(light.target);
  }
  {
    const color = 0xFFFFFF;
    const intensity = 0.2;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, -10, 0); // bottom 
    scene.add(light);
    scene.add(light.target);
  }
  
  {
    const color = 0xFFFFFF;
    const intensity = 0.3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-20, 0, 0); // left 
    scene.add(light);
    scene.add(light.target);
  }
  {
    const color = 0xFFFFFF;
    const intensity = 0.3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(20, 0, 0); // right 
    scene.add(light);
    scene.add(light.target);
  }
  
  {
    const color = 0xFFFFFF;
    const intensity = 0.3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 0, -20); // front 
    scene.add(light);
    scene.add(light.target);
  }
  {
    const color = 0xFFFFFF;
    const intensity = 0.3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 0, 20); // back 
    scene.add(light);
    scene.add(light.target);
  }

  {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('models/chair/black_leather_chair.mtl', (mtlParseResult) => {
      const objLoader = new OBJLoader2();
      const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
      for (const material of Object.values(materials)) {
        material.side = THREE.DoubleSide;
      }
      objLoader.addMaterials(materials);
      objLoader.load('models/chair/black_leather_chair.obj', (root) => {
        scene.add(root);

        const box = new THREE.Box3().setFromObject(root);

        const boxSize = box.getSize(new THREE.Vector3()).length();
        const boxCenter = box.getCenter(new THREE.Vector3());

        // change object view on view-thumbnail click
        const liView = document.querySelectorAll("nav ul li");
        [...liView].forEach((elm) => {
          elm.addEventListener('click', e => {
            document.querySelector("li.active").classList.remove("active");
            e.stopPropagation();
            setTimeout(() => {
              switch (e.target.className) {
                case "side1-view":
                  controls.reset(true);
                  controls.rotate( -45 * THREE.Math.DEG2RAD, 0, true );
                  e.target.classList.add("active");
                break;
                case "side2-view":
                  controls.reset(true);
                  controls.rotate( 45 * THREE.Math.DEG2RAD, 0, true );
                  e.target.classList.add("active");
                break
                case "back-view":
                  controls.reset(true);
                  controls.rotate( 180 * THREE.Math.DEG2RAD, 0, true );
                  e.target.classList.add("active");
                break;
                default:
                  controls.reset(true);
                  e.target.classList.add("active");
              }
            }, 1);
          });
        });

        // update the Trackball controls to handle the new size
        controls.minDistance = boxSize * 0.5;
        controls.maxDistance = boxSize * 2;
        
        zoomSlider.min = controls.minDistance;
        zoomSlider.max = controls.maxDistance;
        zoomSlider.value = boxSize * 1.2;

        controls.saveState();
        setTimeout(() => {
          document.getElementById("preloader").style.display = "none";
        }, 500);
      });
    });
  }


  // smooth canvas events
  ( function anim () {
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();
    const updated = controls.update( delta );
    // if ( elapsed > 30 ) { return; }
    requestAnimationFrame( anim );
    if ( updated ) { renderer.render( scene, camera ); }
  } )();

  
  // resize canvas to browser window
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
  
  function render() {
    requestAnimationFrame(render);
    camera.updateProjectionMatrix();
    TWEEN.update();

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(render);
}

main();