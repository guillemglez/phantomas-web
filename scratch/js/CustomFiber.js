// colors is a color library for random color generation in representations
colors = [0xFF1E00, 0xFFB300, 0x1533AD, 0x00BF32, 0xBF4030,
          0xBF9430, 0x2C3D82, 0x248F40, 0xA61300, 0xA67400,
          0x071C71, 0x007C21, 0xFF5640, 0xFFC640, 0x4965D6,
          0x38DF64, 0xFF8373, 0xFFD573, 0x6F83D6, 0x64DF85,
          0xFF5600, 0xFF7C00, 0x04859D, 0x00AA72, 0x60D4AE,
          0xBF6030, 0xBF7630, 0x206876, 0x207F60, 0x5FBDCE,
          0xA63800, 0xA65100, 0x015666, 0x006E4A, 0xFFB773,
          0xFF8040, 0xFF9D40, 0x37B6CE, 0x35D4A0, 0xFFA273];

/* FiberSkeleton creates 3D representation of control points and fiber path
  from a given fiber.
  Input: fiber - FiberSource object.

  Main properties:
    .line - the thread representing the path. Ready for scene.add.
    .spheres - the mesh of all the spheres representing the control points.
          ready for scene.add.

  Other properties:
    .fiber - The fiber from which the representation constructed (FiberSource)
    .segments - The amount of length segments in which the fiber is divided
        for representation. By default, 1.5 times the length of the fiber.

  Methods:
    .refresh - Updates meshes after fiber change. No input no output.

*/
function FiberSkeleton(fiber) {
  this.fiber = fiber;
  points = fiber.control_points;
  this.color = new THREE.Color(colors[Math.floor(Math.random()*colors.length)]);
  this.segments = Math.floor(fiber.length*1.5);
  discrete_points = new Float32Array(3*this.segments+3);
  for (var i = 0; i <= this.segments; i++) {
    discrete_points.set([fiber.interpolate(i/this.segments)[0][0],
                         fiber.interpolate(i/this.segments)[0][1],
                         fiber.interpolate(i/this.segments)[0][2]], 3*i);
  }
  var trajectory = new THREE.BufferGeometry();
  trajectory.addAttribute('position',
              new THREE.BufferAttribute(discrete_points, 3));
  var thread = new THREE.LineBasicMaterial(
    { color:this.color, linewidth: 1 } );
  this.line = new THREE.Line(trajectory, thread);

  var sphere = new THREE.SphereGeometry(fiber.radius, 32, 32 );
  var sphereGeometry = new THREE.Geometry();
  var meshes = [];
  for (var i = 0; i < points.length; i++) {
    meshes[i] = new THREE.Mesh(sphere);
    meshes[i].position.set(points[i][0], points[i][1], points[i][2]);
    meshes[i].updateMatrix();
    sphereGeometry.merge(meshes[i].geometry, meshes[i].matrix);
  }
  var surface = new THREE.MeshBasicMaterial( {color: 0xffff00} );
  this.spheres = new THREE.Mesh(sphereGeometry, surface);
}

FiberSkeleton.prototype.refresh = function() {
  var sphere = new THREE.SphereGeometry(this.fiber.radius, 32, 32 );
  var sphereGeometry = new THREE.Geometry();
  var meshes = [];
  for (var i = 0; i < points.length; i++) {
    meshes[i] = new THREE.Mesh(sphere);
    meshes[i].position.set(points[i][0], points[i][1], points[i][2]);
    meshes[i].updateMatrix();
    sphereGeometry.merge(meshes[i].geometry, meshes[i].matrix);
  }
  this.spheres.geometry = sphereGeometry;

  var discrete_points = new Float32Array(3*this.segments+3);
  for (var i = 0; i <= this.segments; i++) {
    discrete_points.set([this.fiber.interpolate(i/this.segments)[0][0],
                         this.fiber.interpolate(i/this.segments)[0][1],
                         this.fiber.interpolate(i/this.segments)[0][2]], 3*i);
  }
  var trajectory = new THREE.BufferGeometry();
  trajectory.addAttribute('position',
                            new THREE.BufferAttribute(discrete_points, 3));
  this.line.geometry = trajectory;
}


/* FiberTube creates a 3D representation of a given fiber in a tubular form
 of given radius.
 Inputs: fiber - FiberSource object.

 Main properties:
   .mesh - the mesh of the fiber Ready for scene.add.

 Other properties:
   .fiber - The fiber from which the representation constructed (FiberSource)
   .curve - THREE.Curve object used for representation
   .axialSegments and .radialSegments: The segments that make up the tube in
      each dimension. Default is 256 and 64.

  Methods:
   .refresh - Updates mesh after fiber change. No input no output.
 */
function FiberTube(fiber) {
  this.fiber = fiber;
  radius = fiber.radius;
  this.curve = Object.create(THREE.Curve.prototype);
  this.curve.getPoint = function(t) {
      var tx = fiber.interpolate(t)[0][0];
      var ty = fiber.interpolate(t)[0][1];
      var tz = fiber.interpolate(t)[0][2];
  return new THREE.Vector3(tx, ty, tz);
  }
  this.axialSegments = 256;
  this.radialSegments = 64;
  this.color = new THREE.Color(colors[Math.floor(Math.random()*colors.length)]);
  if (radius === undefined) {
    radius = .5;
  }
  this.radius = radius;
  var geometry = new THREE.TubeGeometry(this.curve,
                        this.axialSegments , this.radius, this.radialSegments);
  var material = new THREE.MeshPhongMaterial(
    { color:this.color, shading: THREE.FlatShading } );
  material.transparent = true;
  material.side = THREE.DoubleSide;
  this.mesh = new THREE.Mesh(geometry, material);
}
FiberTube.prototype.refresh = function() {
  this.mesh.geometry = new THREE.TubeGeometry(this.curve,
                this.axialSegments , this.fiber.radius, this.radialSegments);
}

function IsotropicRegion(source) {
  this.source = source;
  this.widthSegments = 128;
  this.heightSegments = 128;
  this.color = new THREE.Color(colors[Math.floor(Math.random()*colors.length)]);
  var geometry = new THREE.SphereGeometry( source.radius, this.widthSegments, this.heightSegments );
  var material = new THREE.MeshPhongMaterial(
    { color:this.color, shading: THREE.FlatShading } );
  material.transparent = true;
  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.position.set(source.center[0], source.center[1], source.center[2]);
}
IsotropicRegion.prototype.refresh = function() {
    this.mesh.geometry = new THREE.SphereGeometry( this.source.radius, this.widthSegments, this.heightSegments );
    this.mesh.position.set(this.source.center[0], this.source.center[1], this.source.center[2]);
}
