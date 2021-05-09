
import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/jsm/controls/OrbitControls";
import { DragControls } from "/jsm/controls/DragControls";
import { TransformControls } from "/jsm/controls/TransformControls";
import Stats from "/jsm/libs/stats.module";
import { STLLoader } from "/jsm/loaders/STLLoader";
import { GUI } from "/jsm/libs/dat.gui.module";

const scene: THREE.Scene = new THREE.Scene();
var Object = [];
var i = 0;
const index_position = [[0,0], [150,150], [150,-150], [-150,150], [-150,-150]]
var Control = [];
scene.background = new THREE.Color(0xcccccc);
// const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

const gridHelper = new THREE.GridHelper(500, 10, 0x303030, 0x303030);
gridHelper.geometry.rotateX(Math.PI / 2);
scene.add(gridHelper);

const line_material = new THREE.LineBasicMaterial({
  color: 0x0000ff,
  linewidth: 10,
});

const x_axis_points = [new THREE.Vector3(50, 0, 0), new THREE.Vector3(-50, 0, 0)];
const x_axis_geometry = new THREE.BufferGeometry().setFromPoints(x_axis_points);
const x_axis_line = new THREE.Line(x_axis_geometry, line_material);
scene.add(x_axis_line);


const y_axis_points = [new THREE.Vector3(0, 50, 0), new THREE.Vector3(0, -50, 0)];
const y_axis_geometry = new THREE.BufferGeometry().setFromPoints(y_axis_points);
const y_axis_line = new THREE.Line(y_axis_geometry, line_material);
scene.add(y_axis_line);

// const z_axis_points = [new THREE.Vector3( 0, 0, 0), new THREE.Vector3( 0, 0, 5)];
// const z_axis_geometry = new THREE.BufferGeometry().setFromPoints( z_axis_points )
// const z_axis_line = new THREE.Line( z_axis_geometry, line_material )
// scene.add( z_axis_line )

var light = new THREE.DirectionalLight();
light.position.set(10, -10, 10);
scene.add(light);

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  120,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 160;
camera.position.y = -80;
camera.position.x = 0;

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);
//orbitControls.enableDamping = true;
orbitControls.saveState();

// const envTexture = new THREE.CubeTextureLoader().load(["img/px_25.jpg", "img/nx_25.jpg", "img/py_25.jpg", "img/ny_25.jpg", "img/pz_25.jpg", "img/nz_25.jpg"])
// envTexture.mapping = THREE.CubeReflectionMapping

// const material = new THREE.MeshBasicMaterial({
//     color: 0x00ff00,
//     //side: THREE.DoubleSide,
//     wireframe: true,
// });

const material = new THREE.MeshPhysicalMaterial({
  color: 0x00ff00,
  // envMap: envTexture,
  metalness: 0,
  roughness: 0.1,
  transparent: true,
  // transmission: 1.0,
  side: THREE.DoubleSide,
  wireframe: true,
  clearcoat: 1.0,
  clearcoatRoughness: 0.25,
});

const gui = new GUI();
var material_color = {
  color : material.color.getHex(),
};
const materialFolder = gui.addFolder("Material");
materialFolder.addColor(material_color,"color").onChange(() => {
  material.color.setHex(Number(material_color.color.toString().replace('#', '0x')))
});
materialFolder.add(material, 'wireframe');

const loadButton = document.getElementById("loadButton");
loadButton.onchange = function (e) {
  var file = e.target.files[0]
  console.log(file.name)
  const loader = new STLLoader();
  loader.load(
    "models/"+file.name,
    function (geometry) {
      var mesh = new THREE.Mesh(geometry, material);
      
      // mesh.geometry.scale(0.02, 0.02, 0.02);
      Object.push(mesh);
      var index = Object.length - 1;
      i = index;
      Object[index].position.set(index_position[index][0], index_position[index][1], 0)
      scene.add(Object[index])

      var controller = new (function () {
        this.X_Rotation = Object[index].rotation.x / (Math.PI / 180);
        this.Y_Rotation = Object[index].rotation.y / (Math.PI / 180);
        this.Z_Rotation = Object[index].rotation.z / (Math.PI / 180);
      })();

      const rotationFolder = gui.addFolder(file.name.slice(0,-4)+" Rotation");
      rotationFolder.add(controller, "X_Rotation", -180, 180, 1).onChange(function () {
        Object[index].rotation.x = controller.X_Rotation * (Math.PI / 180);
      });
      rotationFolder.add(controller, "Y_Rotation", -180, 180, 1).onChange(function () {
        Object[index].rotation.y = controller.Y_Rotation * (Math.PI / 180);
      });
      rotationFolder.add(controller, "Z_Rotation", -180, 180, 1).onChange(function () {
        Object[index].rotation.z = controller.Z_Rotation * (Math.PI / 180);
      });
      const positionFolder = gui.addFolder(file.name.slice(0,-4)+" Position");
      positionFolder.add(Object[index].position, "x", -200.0, 200.0, 1)
      positionFolder.add(Object[index].position, "y", -200.0, 200.0, 1)
      positionFolder.add(Object[index].position, "z", -200.0, 200.0, 1)
      
      // rotationFolder.open();
      // positionFolder.open();
      
      const dragControls = new DragControls([Object[index]], camera, renderer.domElement)
      dragControls.addEventListener("hoveron", function() {
        orbitControls.enabled = false;
      })
      dragControls.addEventListener("hoveroff", function() {
        orbitControls.enabled = true;
      })
      dragControls.addEventListener("dragstart", function(e) {
        e.object.material.opacity = 0.33
      })
      dragControls.addEventListener("dragend", function(e) {
        e.object.material.opacity = 1
        positionFolder.updateDisplay()
      })

      const transformControls = new TransformControls(camera, renderer.domElement)
      Control.push(transformControls)
      Control[index].attach(Object[index]);
      Control[index].setSize(0.3);
      Control[index].setMode("rotate")
      scene.add(Control[index]);

      transformControls.addEventListener('dragging-changed', function(e){
        orbitControls.enabled = !e.value;
        dragControls.enabled = !e.value;
      })

      transformControls.addEventListener('mouseUp', function(e){
        controller.X_Rotation = Object[index].rotation.x / (Math.PI / 180);
        controller.Y_Rotation = Object[index].rotation.y / (Math.PI / 180);
        controller.Z_Rotation = Object[index].rotation.z / (Math.PI / 180);
        rotationFolder.updateDisplay();
      })

      const Object_Refresh = document.getElementById("objectRefresh")
      if(i>0){
        Object_Refresh.hidden = true;
      }
      Object_Refresh.onclick = function() {
        Object[index].position.x = 0;
        Object[index].position.y = 0;
        Object[index].position.z = 0;
        Object[index].rotation.x = 0;
        Object[index].rotation.y = 0;
        Object[index].rotation.z = 0;
        controller.X_Rotation = Object[index].rotation.x / (Math.PI / 180);
        controller.Y_Rotation = Object[index].rotation.y / (Math.PI / 180);
        controller.Z_Rotation = Object[index].rotation.z / (Math.PI / 180);
        rotationFolder.updateDisplay();
        positionFolder.updateDisplay();
      }
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      console.log(error);
    }
  );
};

const View_Refresh = document.getElementById("viewRefresh")
View_Refresh.onclick = function() {
  orbitControls.reset()
  camera.position.z = 160;
  camera.position.y = -80;
  camera.position.x = 0;
  console.log(orbitControls)
}

window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

const stats = Stats();
document.body.appendChild(stats.dom);

var animate = function () {
  requestAnimationFrame(animate);

  // controls.update();

  render();
  //console.log(camera.position)
  stats.update();
};

function render() {
  renderer.render(scene, camera);
}
animate();
